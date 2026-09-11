#!/usr/bin/env python3
"""Translate beta question roots + variants into easy English and tag scope.

One Gemini call per question root (all variants included). Use --workers to run
several requests at the same time.

  pip install google-genai pymysql python-dotenv

  python backend/scripts/translate-beta-questions.py --apply
  python backend/scripts/translate-beta-questions.py --apply --workers 12

Re-running resumes from the last unfinished root. Cached Gemini output in the JSONL
is reused; MySQL deadlocks are retried. Use --force to translate again.

Reads GEMINI_API_KEY and DATABASE_URL from backend/.env.
Docs: https://ai.google.dev/gemini-api/docs/
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.parse import unquote, urlparse

import pymysql
from dotenv import load_dotenv
from google import genai
from pymysql.err import OperationalError
from pymysql.cursors import DictCursor

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
REPO_ROOT = BACKEND_DIR.parent
MODEL = "gemini-3.1-flash-lite"

SOCIAL_CATEGORIES = ("SC", "ST", "OBC", "SEBC")
RETRYABLE_MYSQL = {1205, 1213, 2006, 2013}  # lock wait, deadlock, gone away, lost connection
FILE_LOCK = threading.Lock()
PRINT_LOCK = threading.Lock()
GUJARAT_DISTRICTS = (
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Aravalli",
    "Banaskantha",
    "Bharuch",
    "Bhavnagar",
    "Botad",
    "Chhota Udepur",
    "Dahod",
    "Dang",
    "Devbhumi Dwarka",
    "Gandhinagar",
    "Gir Somnath",
    "Jamnagar",
    "Junagadh",
    "Kheda",
    "Kutch",
    "Mahisagar",
    "Mehsana",
    "Morbi",
    "Narmada",
    "Navsari",
    "Panchmahal",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Sabarkantha",
    "Surat",
    "Surendranagar",
    "Tapi",
    "Vadodara",
    "Valsad",
    "Vav-Tharad",
)

SYSTEM_MESSAGE = f"""You work on G3Q (Gujarat Gyan Guru Quiz) beta questions.

Do two things for each root:
1. Translate every Gujarati string into easy, simple English. Keep the same meaning, facts, numbers, blanks, and proper names (schemes, people, places). Do not change answers, ids, option keys, or question type.
2. Tag the root only when the question is specifically eligible:
   - social_category: SC, ST, OBC, or SEBC if it is about that community's scheme, benefit, or eligibility. Else null.
   - district: one official Gujarat district English name if it is about that district (local place, local scheme, local fact). Else null.
Statewide / everyone questions stay null on both tags. Never use GENERAL.

Official districts: {", ".join(GUJARAT_DISTRICTS)}.
Return JSON only. Translate every input path. Do not add extra paths."""

RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "social_category": {
            "anyOf": [
                {"type": "string", "enum": list(SOCIAL_CATEGORIES)},
                {"type": "null"},
            ],
            "description": "SC, ST, OBC, or SEBC if applicable, else null.",
        },
        "district": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "Exact Gujarat district English name if applicable, else null.",
        },
        "translations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "en": {"type": "string"},
                },
                "required": ["path", "en"],
            },
        },
    },
    "required": ["social_category", "district", "translations"],
}


@dataclass
class TranslationItem:
    path: str
    en: str


@dataclass
class TranslateResult:
    social_category: Optional[str]
    district: Optional[str]
    translations: list[TranslationItem]


def load_env() -> None:
    load_dotenv(BACKEND_DIR / ".env")
    load_dotenv(REPO_ROOT / ".env")


def parse_database_url(url: str) -> dict[str, Any]:
    parsed = urlparse(url)
    if parsed.scheme not in {"mysql", "mysql2"}:
        raise SystemExit(f"Unsupported DATABASE_URL scheme: {parsed.scheme}")
    database = unquote(parsed.path.lstrip("/").split("?")[0])
    if not database:
        raise SystemExit("DATABASE_URL is missing a database name.")
    return {
        "host": parsed.hostname or "127.0.0.1",
        "port": parsed.port or 3306,
        "user": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "database": database,
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "autocommit": False,
    }


def log(message: str) -> None:
    with PRINT_LOCK:
        print(message, flush=True)


def log_err(message: str) -> None:
    with PRINT_LOCK:
        print(message, file=sys.stderr, flush=True)


def connect_db() -> pymysql.connections.Connection:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        raise SystemExit("DATABASE_URL is missing. Set it in backend/.env.")
    return pymysql.connect(**parse_database_url(url))


def mysql_errno(error: Exception) -> int | None:
    if isinstance(error, OperationalError) and error.args:
        try:
            return int(error.args[0])
        except (TypeError, ValueError):
            return None
    return None


def reconnect_db(conn: pymysql.connections.Connection) -> pymysql.connections.Connection:
    try:
        conn.ping(reconnect=True)
        return conn
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return connect_db()


def as_json(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf8")
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def has_text(value: Any) -> bool:
    return bool(str(value or "").strip())


def collect_content_labels(variant_id: int, content: dict[str, Any]) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for group in ("left", "right", "items", "bank"):
        for index, row in enumerate(content.get(group) or []):
            if not isinstance(row, dict):
                continue
            label = row.get("label")
            if not has_text(label):
                continue
            ident = row.get("id", index)
            items.append(
                {
                    "path": f"variant.{variant_id}.content.{group}.{ident}",
                    "text": str(label).strip(),
                }
            )
    for index, segment in enumerate(content.get("segments") or []):
        if not isinstance(segment, dict):
            continue
        if segment.get("type") != "text" or not has_text(segment.get("value")):
            continue
        items.append(
            {
                "path": f"variant.{variant_id}.content.segments.{index}",
                "text": str(segment["value"]).strip(),
            }
        )
    return items


def collect_strings(root: dict[str, Any], variants: list[dict[str, Any]]) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    if has_text(root.get("explanationGu")):
        items.append({"path": "explanation", "text": str(root["explanationGu"]).strip()})

    for variant in variants:
        payload = as_json(variant.get("payload"))
        prompt_gu = (payload.get("prompt") or {}).get("gu")
        if has_text(prompt_gu):
            items.append(
                {
                    "path": f"variant.{variant['id']}.prompt",
                    "text": str(prompt_gu).strip(),
                }
            )
        for option in payload.get("options") or []:
            if not isinstance(option, dict) or not option.get("key"):
                continue
            option_gu = (option.get("text") or {}).get("gu")
            if not has_text(option_gu):
                continue
            items.append(
                {
                    "path": f"variant.{variant['id']}.option.{str(option['key']).upper()}",
                    "text": str(option_gu).strip(),
                }
            )
        items.extend(collect_content_labels(variant["id"], as_json(payload.get("content"))))
    return items


def already_translated(root: dict[str, Any], variants: list[dict[str, Any]]) -> bool:
    if not has_text(root.get("explanationEn")) and has_text(root.get("explanationGu")):
        return False
    for variant in variants:
        payload = as_json(variant.get("payload"))
        prompt = payload.get("prompt") or {}
        if has_text(prompt.get("gu")) and not has_text(prompt.get("en")):
            return False
    return True


def fetch_roots(conn, *, limit: int | None, offset: int, root_id: int | None) -> list[dict[str, Any]]:
    sql = """
        SELECT
            id,
            legacy_que_id AS legacyQueId,
            explanation_gu AS explanationGu,
            explanation_en AS explanationEn,
            caste_category AS casteCategory,
            district_id AS districtId
        FROM question_roots
        WHERE UPPER(COALESCE(scope, '')) = 'BETA'
    """
    params: list[Any] = []
    if root_id is not None:
        sql += " AND id = %s"
        params.append(root_id)
    sql += " ORDER BY id ASC"
    if limit is not None:
        sql += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
    with conn.cursor() as cursor:
        cursor.execute(sql, params)
        return list(cursor.fetchall())


def fetch_variants(conn, root_id: int) -> list[dict[str, Any]]:
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, type, payload
            FROM question_variants
            WHERE root_id = %s
            ORDER BY id ASC
            """,
            (root_id,),
        )
        return list(cursor.fetchall())


def fetch_variants_by_root(conn, root_ids: list[int]) -> dict[int, list[dict[str, Any]]]:
    grouped: dict[int, list[dict[str, Any]]] = {root_id: [] for root_id in root_ids}
    chunk_size = 400
    with conn.cursor() as cursor:
        for start in range(0, len(root_ids), chunk_size):
            chunk = root_ids[start : start + chunk_size]
            placeholders = ",".join(["%s"] * len(chunk))
            cursor.execute(
                f"""
                SELECT id, root_id AS rootId, type, payload
                FROM question_variants
                WHERE root_id IN ({placeholders})
                ORDER BY id ASC
                """,
                chunk,
            )
            for row in cursor.fetchall():
                grouped[int(row["rootId"])].append(row)
    return grouped


def fetch_district_map(conn) -> dict[str, int]:
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, name_en AS nameEn FROM districts")
        rows = cursor.fetchall()
    mapping: dict[str, int] = {}
    for row in rows:
        mapping[str(row["nameEn"]).strip().casefold()] = int(row["id"])
    for index, name in enumerate(GUJARAT_DISTRICTS, start=1):
        mapping.setdefault(name.casefold(), index)
    return mapping


def normalize_social_category(value: Any) -> Optional[str]:
    if value is None:
        return None
    token = str(value).strip().upper()
    if token in {"", "NULL", "NONE", "GENERAL", "N/A"}:
        return None
    return token if token in SOCIAL_CATEGORIES else None


def normalize_district(value: Any, district_ids: dict[str, int]) -> tuple[Optional[str], Optional[int]]:
    if value is None:
        return None, None
    token = str(value).strip()
    if token.casefold() in {"", "null", "none", "n/a", "general"}:
        return None, None
    district_id = district_ids.get(token.casefold())
    if district_id is None:
        return None, None
    canonical = next((name for name in GUJARAT_DISTRICTS if name.casefold() == token.casefold()), token)
    return canonical, district_id


def parse_model_json(text: str) -> TranslateResult:
    raw = (text or "").strip()
    fenced = raw.startswith("```")
    if fenced:
        raw = raw.split("```", 2)[1]
        raw = raw.removeprefix("json").strip()
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("Gemini response was not a JSON object.")
    translations = []
    for item in data.get("translations") or []:
        if not isinstance(item, dict) or not item.get("path") or item.get("en") is None:
            continue
        translations.append(TranslationItem(path=str(item["path"]), en=str(item["en"])))
    return TranslateResult(
        social_category=data.get("social_category"),
        district=data.get("district"),
        translations=translations,
    )


def call_gemini(client: genai.Client, source_items: list[dict[str, str]]) -> TranslateResult:
    interaction = client.interactions.create(
        model=MODEL,
        system_instruction=SYSTEM_MESSAGE,
        input=json.dumps({"strings": source_items}, ensure_ascii=False),
        generation_config={"temperature": 0.2},
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": RESPONSE_SCHEMA,
        },
    )
    return parse_model_json(interaction.output_text or "")


def call_gemini_with_retry(client: genai.Client, source_items: list[dict[str, str]], retries: int) -> TranslateResult:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return call_gemini(client, source_items)
        except Exception as error:  # noqa: BLE001 — retry API / parse failures
            last_error = error
            wait_s = min(30, 2 ** attempt)
            print(f"  gemini retry {attempt}/{retries} after {wait_s}s: {error}", file=sys.stderr)
            time.sleep(wait_s)
    raise RuntimeError(f"Gemini failed after {retries} retries: {last_error}") from last_error


def ensure_lang_map(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def apply_payload_translation(payload: dict[str, Any], variant_id: int, by_path: dict[str, str]) -> dict[str, Any]:
    prompt = ensure_lang_map(payload.get("prompt"))
    prompt_en = by_path.get(f"variant.{variant_id}.prompt")
    if prompt_en:
        payload["prompt"] = {**prompt, "en": prompt_en}

    options = payload.get("options")
    if isinstance(options, list):
        updated_options = []
        for option in options:
            if not isinstance(option, dict):
                updated_options.append(option)
                continue
            key = str(option.get("key") or "").upper()
            option_en = by_path.get(f"variant.{variant_id}.option.{key}")
            if not option_en:
                updated_options.append(option)
                continue
            text = ensure_lang_map(option.get("text"))
            updated_options.append({**option, "text": {**text, "en": option_en}})
        payload["options"] = updated_options

    content = as_json(payload.get("content"))
    if content:
        payload["content"] = apply_content_translation(content, variant_id, by_path)
    return payload


def apply_content_translation(content: dict[str, Any], variant_id: int, by_path: dict[str, str]) -> dict[str, Any]:
    for group in ("left", "right", "items", "bank"):
        rows = content.get(group)
        if not isinstance(rows, list):
            continue
        updated = []
        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                updated.append(row)
                continue
            ident = row.get("id", index)
            english = by_path.get(f"variant.{variant_id}.content.{group}.{ident}")
            updated.append({**row, "labelEn": english} if english else row)
        content[group] = updated

    segments = content.get("segments")
    if isinstance(segments, list):
        updated_segments = []
        for index, segment in enumerate(segments):
            if not isinstance(segment, dict):
                updated_segments.append(segment)
                continue
            english = by_path.get(f"variant.{variant_id}.content.segments.{index}")
            updated_segments.append({**segment, "valueEn": english} if english else segment)
        content["segments"] = updated_segments
    return content


def update_root(
    conn,
    root_id: int,
    *,
    explanation_en: Optional[str],
    caste_category: str,
    district_id: Optional[int],
) -> None:
    with conn.cursor() as cursor:
        cursor.execute(
            """
            UPDATE question_roots
            SET
                explanation_en = COALESCE(%s, explanation_en),
                caste_category = %s,
                district_id = %s
            WHERE id = %s
            """,
            (explanation_en, caste_category, district_id, root_id),
        )


def update_variant(conn, variant_id: int, payload: dict[str, Any]) -> None:
    with conn.cursor() as cursor:
        cursor.execute(
            "UPDATE question_variants SET payload = %s WHERE id = %s",
            (json.dumps(payload, ensure_ascii=False), variant_id),
        )


def apply_updates_with_retry(
    conn: pymysql.connections.Connection,
    *,
    root_id: int,
    explanation_en: Optional[str],
    caste_category: str,
    district_id: Optional[int],
    payloads: dict[int, dict[str, Any]],
    retries: int,
) -> pymysql.connections.Connection:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            conn = reconnect_db(conn)
            update_root(
                conn,
                root_id,
                explanation_en=explanation_en,
                caste_category=caste_category,
                district_id=district_id,
            )
            for variant_id in sorted(payloads):
                update_variant(conn, variant_id, payloads[variant_id])
            conn.commit()
            return conn
        except Exception as error:  # noqa: BLE001
            last_error = error
            try:
                conn.rollback()
            except Exception:
                pass
            errno = mysql_errno(error)
            if errno not in RETRYABLE_MYSQL or attempt >= retries:
                break
            wait_s = min(8, 0.4 * (2 ** (attempt - 1)))
            print(f"  mysql retry {attempt}/{retries} (errno={errno}) after {wait_s:.1f}s", file=sys.stderr)
            time.sleep(wait_s)
            conn = reconnect_db(conn)
    raise RuntimeError(f"MySQL write failed after {retries} retries: {last_error}") from last_error


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(row, ensure_ascii=False) + "\n"
    with FILE_LOCK:
        with path.open("a", encoding="utf8") as handle:
            handle.write(line)


def load_checkpoints(path: Path) -> dict[int, dict[str, Any]]:
    checkpoints: dict[int, dict[str, Any]] = {}
    if not path.exists():
        return checkpoints
    for line in path.read_text(encoding="utf8").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if row.get("root_id") is None:
            continue
        checkpoints[int(row["root_id"])] = row
    return checkpoints


def translations_from_checkpoint(row: dict[str, Any] | None) -> dict[str, str] | None:
    if not row or not row.get("ok"):
        return None
    items = row.get("translations") or []
    by_path = {
        str(item["path"]): str(item["en"]).strip()
        for item in items
        if isinstance(item, dict) and item.get("path") and item.get("en")
    }
    return by_path or None


def process_one_root(
    *,
    root: dict[str, Any],
    variants: list[dict[str, Any]],
    source_items: list[dict[str, str]],
    cached: dict[str, str] | None,
    checkpoint: dict[str, Any] | None,
    apply: bool,
    retries: int,
    out: Path,
    district_ids: dict[str, int],
    client,
) -> None:
    root_id = int(root["id"])
    label = f"root {root_id} ({root.get('legacyQueId')})"
    log(f"{label}: {len(variants)} variants, {len(source_items)} strings")

    if cached:
        by_path = cached
        cached_row = checkpoint or {}
        social_category = normalize_social_category(cached_row.get("social_category"))
        district_name, district_id = normalize_district(cached_row.get("district"), district_ids)
        log(f"  {label}: resume from cache (no new API call)")
    else:
        result = call_gemini_with_retry(client, source_items, retries)
        by_path = {item.path: item.en.strip() for item in result.translations if item.path and item.en}
        social_category = normalize_social_category(result.social_category)
        district_name, district_id = normalize_district(result.district, district_ids)

    updated_payloads = {
        int(variant["id"]): apply_payload_translation(
            as_json(variant.get("payload")), int(variant["id"]), by_path
        )
        for variant in variants
    }
    applied = False

    if apply:
        conn = connect_db()
        try:
            apply_updates_with_retry(
                conn,
                root_id=root_id,
                explanation_en=by_path.get("explanation"),
                caste_category=social_category or "GENERAL",
                district_id=district_id,
                payloads=updated_payloads,
                retries=max(retries, 4),
            )
            applied = True
            log(f"  {label}: wrote tags social={social_category} district={district_name}")
        except Exception as error:  # noqa: BLE001
            append_jsonl(
                out,
                {
                    "ok": True,
                    "applied": False,
                    "root_id": root_id,
                    "legacy_que_id": root.get("legacyQueId"),
                    "social_category": social_category,
                    "district": district_name,
                    "district_id": district_id,
                    "explanation_en": by_path.get("explanation"),
                    "translations": [{"path": path, "en": text} for path, text in by_path.items()],
                    "error": str(error),
                    "at": datetime.now(timezone.utc).isoformat(),
                },
            )
            raise RuntimeError(f"{label}: DB write failed, translation cached: {error}") from error
        finally:
            try:
                conn.close()
            except Exception:
                pass
    else:
        log(f"  {label}: dry-run tags social={social_category} district={district_name}")

    append_jsonl(
        out,
        {
            "ok": True,
            "applied": applied,
            "root_id": root_id,
            "legacy_que_id": root.get("legacyQueId"),
            "social_category": social_category,
            "district": district_name,
            "district_id": district_id,
            "explanation_en": by_path.get("explanation"),
            "translations": [{"path": path, "en": text} for path, text in by_path.items()],
            "at": datetime.now(timezone.utc).isoformat(),
        },
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Translate beta question roots/variants into simple English and tag social-category / district scope."
    )
    parser.add_argument("--limit", type=int, default=None, help="Max roots to process.")
    parser.add_argument("--offset", type=int, default=0, help="Skip this many roots.")
    parser.add_argument("--root-id", type=int, default=None, help="Process one question_roots.id.")
    parser.add_argument("--apply", action="store_true", help="Write translations and tags to MySQL.")
    parser.add_argument("--force", action="store_true", help="Re-translate roots that already have English.")
    parser.add_argument("--sleep", type=float, default=0.0, help="Pause between Gemini calls when workers=1.")
    parser.add_argument("--retries", type=int, default=4, help="Gemini retries per root.")
    parser.add_argument("--workers", type=int, default=1, help="How many Gemini requests to run at once.")
    parser.add_argument(
        "--out",
        type=Path,
        default=SCRIPT_DIR / "output" / "beta-translate.jsonl",
        help="JSONL checkpoint path.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.workers < 1:
        raise SystemExit("--workers must be at least 1")

    load_env()
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("GEMINI_API_KEY is missing. Set it in backend/.env.")

    client = genai.Client(api_key=api_key)
    conn = connect_db()
    checkpoints = load_checkpoints(args.out)

    try:
        district_ids = fetch_district_map(conn)
        roots = fetch_roots(conn, limit=args.limit, offset=args.offset, root_id=args.root_id)
        variants_by_root = fetch_variants_by_root(conn, [int(root["id"]) for root in roots])
    finally:
        conn.close()

    jobs: list[dict[str, Any]] = []
    skipped = 0
    for root in roots:
        root_id = int(root["id"])
        variants = variants_by_root.get(root_id, [])
        source_items = collect_strings(root, variants)
        checkpoint = checkpoints.get(root_id)
        cached = None if args.force else translations_from_checkpoint(checkpoint)

        if already_translated(root, variants) and not args.force:
            skipped += 1
            continue
        if not args.apply and cached:
            skipped += 1
            continue
        if not source_items:
            skipped += 1
            continue

        jobs.append(
            {
                "root": root,
                "variants": variants,
                "source_items": source_items,
                "cached": cached,
                "checkpoint": checkpoint,
            }
        )

    log(
        json.dumps(
            {
                "model": MODEL,
                "roots": len(roots),
                "queued": len(jobs),
                "skipped": skipped,
                "apply": args.apply,
                "workers": args.workers,
                "out": str(args.out),
            },
            indent=2,
        )
    )

    processed = 0
    failed = 0
    if not jobs:
        log(json.dumps({"processed": 0, "skipped": skipped, "failed": 0}, indent=2))
        return 0

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [
            pool.submit(
                process_one_root,
                root=job["root"],
                variants=job["variants"],
                source_items=job["source_items"],
                cached=job["cached"],
                checkpoint=job["checkpoint"],
                apply=args.apply,
                retries=args.retries,
                out=args.out,
                district_ids=district_ids,
                client=client,
            )
            for job in jobs
        ]
        for future in as_completed(futures):
            try:
                future.result()
                processed += 1
                if args.workers == 1 and args.sleep > 0:
                    time.sleep(args.sleep)
            except Exception as error:  # noqa: BLE001
                failed += 1
                log_err(f"  failed: {error}")

    log(json.dumps({"processed": processed, "skipped": skipped, "failed": failed}, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
