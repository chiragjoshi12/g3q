# Question Bank Redesign — Problem, Approach, Scale

**Product:** G3Q (Gujarat Gyan Guru Quiz)  
**Purpose of this doc:** Independent review of whether a root + variant + JSON-payload model is sound for our question bank and quiz play at expected scale.  
**Status:** Live cutover complete — `question_roots` + `question_variants` are the only bank tables. `bank_questions` has been dropped. Admin/session APIs still expose string `que_id` (= `question_variants.legacy_que_id`). Scope, district, and caste live on the root.

---

## 1. Overall problem

### What we need to support

1. **Five question types** (same concept, different interaction):
   - MCQ (single choice)
   - True / False
   - Fill in the blanks
   - Sequence (order items)
   - Match the pairs

2. **Three languages** for every question text:
   - Gujarati = original / source of truth
   - Hindi + English = translations of the same content

3. **Content workflow:**
   - Authors create a **root** concept (and one shared explanation/solution)
   - Root can start as **any one** of the five types
   - AI generates the **other four type variants** of that same concept
   - AI translates Gu → En / Hi
   - **Admins review** questions; only **accepted** ones are served to users

4. **Play workflow:**
   - Users take timed quizzes
   - Questions must not change mid-play if the bank is edited later
   - Prefer not showing the **same concept** twice in one session as different types
   - Results / certificates / leaderboards continue as today

### What is wrong with a wide flat table (current style)

A single `bank_questions`-style table with many columns (option_a_gu, option_b_en, …) becomes:

- Hard to extend for 5 types (each type needs different fields)
- Hard to keep Gu / En / Hi in sync
- Hard for AI generation (root → 4 variants) without duplicating schema mess
- Over-fitted to MCQ; other types get stuffed into nullable columns or ad-hoc JSON anyway

We need a model that is:

- Easy for **admin + AI authoring**
- Cheap for **quiz allocation and play**
- Clear for **review accept/reject**

---

## 2. Proposed solution

### Core idea

Split **authoring** from **serving/play**:

| Layer | Responsibility |
| --- | --- |
| Authoring tables | Store concepts, variants, multilingual content, review status |
| Session snapshot | At quiz start, copy chosen questions into session rows and play only from that snapshot |

JSON is used **only for type-specific content shape**, not as a substitute for relational keys, filters, or review status.

### Tables (conceptual)

#### A. `question_roots`

One row = one **concept** + one **shared explanation** (same meaning across all five type variants).

Suggested columns:

| Column | Purpose |
| --- | --- |
| `id` | PK |
| `department_id` / scope / tags | Metadata for filtering |
| `explanation_gu` / `explanation_en` / `explanation_hi` | Shared solution text |
| `created_at` / `updated_at` | Audit |

#### B. `question_variants`

One row = one **type version** of a root (max 5 per root).

Suggested columns:

| Column | Purpose |
| --- | --- |
| `id` | PK |
| `root_id` | FK → `question_roots` |
| `type` | `mcq` \| `true_false` \| `fill_blanks` \| `sequence` \| `match_pairs` |
| `review_status` | `PENDING` \| `ACCEPTED` \| `REJECTED` |
| `reviewed_by` / `reviewed_at` | Admin audit |
| `payload` | **JSON** — type-specific content including Gu/En/Hi strings |
| Unique `(root_id, type)` | At most one variant per type per concept |

#### C. Session tables (unchanged pattern)

- `quiz_sessions` — one play attempt  
- `quiz_session_questions` — **frozen copy** of each served question (prompt/options/answer/type for that play)  
- `user_question_exposures` — track what the user has already seen (by `variant_id` and/or `root_id`)

### Why JSON inside `payload`

Different types need different structures:

- MCQ → prompt + options A–D + correct key  
- True/False → prompt + boolean  
- Fill blanks → prompt with blanks + accepted answers  
- Sequence → items + correct order  
- Match pairs → left/right lists + mapping  

Putting those shapes in **one JSON column per variant** avoids dozens of nullable SQL columns while keeping:

- Relational filters on `type`, `review_status`, `root_id` (indexed)
- One place for multilingual text for that variant

Example MCQ payload:

```json
{
  "prompt": {
    "gu": "ગુજરાતની રાજધાની કઈ છે?",
    "en": "What is the capital of Gujarat?",
    "hi": "गुजरात की राजधानी क्या है?"
  },
  "options": [
    { "key": "A", "text": { "gu": "અમદાવાદ", "en": "Ahmedabad", "hi": "अहमदाबाद" } },
    { "key": "B", "text": { "gu": "ગાંધીનગર", "en": "Gandhinagar", "hi": "गांधीनगर" } }
  ],
  "correct": "B"
}
```

### Authoring / AI / review flow

```text
1. Create root (+ Gu explanation)
2. Create first variant (any type, Gu content in payload)
3. AI generates other 4 types (same root_id)
4. AI fills en/hi translations inside each payload
5. Admin reviews each variant independently
6. Only ACCEPTED variants enter the serve pool
```

### Play / allocation flow (compute-light)

```text
1. SELECT variant ids
     FROM question_variants
    WHERE review_status = 'ACCEPTED'
      AND … (scope/department filters on root via join if needed)
   — filters use indexed columns, NOT JSON path queries

2. Prefer uniqueness by root_id
   (pick at most one accepted variant per concept per session)

3. Snapshot chosen variants into quiz_session_questions
   — optionally store only the user's language (gu|en|hi)
   — include grading material needed for submit

4. During answering / submit / result:
   read/write ONLY session tables
   do not re-join the live bank on every answer
```

### What we explicitly will NOT do on the hot path

- `WHERE payload->>'$.prompt.gu' LIKE …` for allocation  
- Re-fetching bank JSON on every answer  
- Storing large media blobs inside question payload  
- Requiring multi-table joins during submit grading beyond the session snapshot  

---

## 3. Our user / load scale (assumptions for review)

These are product/infra planning numbers for G3Q; use them when judging whether the design holds.

### G3Q scale at a glance

| Dimension | Expected scale |
| --- | --- |
| Weekly users | **10 lakh+ / week** (~1 million people interacting every week) |
| Average session length | **~3 minutes** (Register → Home → Quiz → Result → Certificate) |
| API traffic | Up to **~10 API calls/user** → potentially **10M+ API requests/week** |
| Quiz cadence | **8-week recurring system**, **1 quiz/week/user** |
| Questions per quiz session | Typically on the order of **15** (exact N configurable) |
| Bank size | Tens of thousands of concepts possible; up to **×5 variants** per root |
| Languages | Always **3** (Gu / Hi / En) on authored content |
| Admin review | Human review before serve; accepted set is the live pool |
| Write pattern during play | Heavy on `quiz_sessions` / `quiz_session_questions` / exposures / leaderboard aggregates |
| Read pattern during play | Session snapshot after start; bank read mainly at **session start** |

**In one line:** a Gujarat-wide, government-scale quiz platform handling ~1M users/week, with hierarchical analytics from the whole state down to individual schools and colleges.

### What this implies for the question JSON design

At **~1M users/week** and **1 quiz/user/week**, expect on the order of **~1M session starts/week**. Bank JSON is touched mainly at those starts (snapshot ~10 questions), not on every answer click.

Rough storage intuition (not a hard estimate):

- Variant payload: typically **~1–5 KB** of text JSON  
- Session snapshot: ~10 questions × few KB each  
- ~1M sessions/week × ~10 question rows is large; retain/archive policy for old sessions matters more than JSON vs columns  

Primary scale risks are **API/session write throughput, indexing, leaderboard/analytics aggregates, and asset CDN/S3 delivery** — not parsing a few KB of question JSON at session start.

---

## 4. Claims we want verified

Please challenge or confirm:

1. **JSON payload for type-specific multilingual content is appropriate** for authoring + serve snapshot, versus fully columnar or fully separate tables per type.  
2. **Indexed relational columns** (`review_status`, `type`, `root_id`) plus **JSON only for body** is the right split for ~1M users/week and ~1M quiz starts/week.  
3. **Session snapshot** is the correct way to keep play cheap and consistent.  
4. **Review at variant level** (not only root level) is correct when AI generates 4 extra types with uneven quality.  
5. **Allocate by root, serve one variant** prevents same-concept duplicates without expensive runtime logic.  
6. Any **must-fix risks** (MySQL JSON size, Prisma mapping, admin editing UX, grading complexity for non-MCQ, migration from old bank).

---

## 5. Open decisions (feedback welcome)

1. Store **all 3 languages** in session snapshot, or **only the user’s selected language**?  
2. Track exposure by `variant_id`, `root_id`, or both?  
3. Can a root be “partially live” (only MCQ + True/False accepted) — **yes in this design**; confirm that is desired.  
4. Should explanation live only on root (shared) even when variant wording differs slightly?

---

## 6. One-line summary

**Problem:** Five types × three languages × AI variants × admin review does not fit a wide MCQ-centric SQL table.  
**Approach:** `question_roots` + `question_variants(payload JSON)` for authoring; indexed status/type for selection; freeze into session rows for play.  
**Scale:** Designed for ~1M users/week (~1 quiz/user/week), assuming bank JSON is read mainly at session start and play traffic hits session tables.
