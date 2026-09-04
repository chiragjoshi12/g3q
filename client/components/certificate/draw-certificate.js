import { CERT_LAYOUT, CERT_NATIVE } from "@/lib/domain/certificate";

const BACKGROUND_SRC = "/certificate-bg.png";
const TEXT_COLOR = "#1a1a1a";
const BOLD_COLOR = "#111111";

let backgroundPromise = null;

export function loadCertificateBackground() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Certificate drawing is browser-only."));
  }
  if (!backgroundPromise) {
    backgroundPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        backgroundPromise = null;
        reject(new Error("Certificate background failed to load."));
      };
      img.src = BACKGROUND_SRC;
    });
  }
  return backgroundPromise;
}

function cssFont(varName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function certificateFontFamily() {
  return `${cssFont("--font-gujarati", "Noto Sans Gujarati")}, ${cssFont("--font-noto", "Noto Sans")}, sans-serif`;
}

async function ensureFonts() {
  if (!document.fonts?.ready) return;
  const family = certificateFontFamily();
  await Promise.all([
    document.fonts.ready,
    document.fonts.load(`400 48px ${family}`),
    document.fonts.load(`700 48px ${family}`),
  ]).catch(() => undefined);
}

function applyFont(ctx, { bold = false, size, family }) {
  ctx.font = `${bold ? "700" : "400"} ${size}px ${family}`;
}

function drawAlignedText(ctx, text, { x, y, align, baseline, fontSize, bold, family, color }) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  applyFont(ctx, { bold, size: fontSize, family });
  ctx.fillText(text, x, y);
}

function wrapRichLines(ctx, segments, maxWidth, fontSize, family) {
  const tokens = [];
  for (const segment of segments) {
    const parts = String(segment.text).split(/(\s+)/);
    for (const part of parts) {
      if (part === "") continue;
      tokens.push({ text: part, bold: Boolean(segment.bold) });
    }
  }

  const widthOf = (token) => {
    applyFont(ctx, { bold: token.bold, size: fontSize, family });
    return ctx.measureText(token.text).width;
  };

  const lines = [];
  let current = [];
  let currentWidth = 0;

  for (const token of tokens) {
    const isSpace = token.text.trim() === "";
    const w = widthOf(token);
    if (!current.length && isSpace) continue;
    if (current.length && !isSpace && currentWidth + w > maxWidth) {
      lines.push(current);
      current = [token];
      currentWidth = w;
      continue;
    }
    current.push(token);
    currentWidth += w;
  }
  if (current.length) lines.push(current);
  return lines;
}

function drawCenteredParagraph(ctx, segments, { centerX, topY, maxWidth, fontSize, lineHeight, family }) {
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const lines = wrapRichLines(ctx, segments, maxWidth, fontSize, family);
  let y = topY;

  for (const line of lines) {
    const lineWidth = line.reduce((sum, token) => {
      applyFont(ctx, { bold: token.bold, size: fontSize, family });
      return sum + ctx.measureText(token.text).width;
    }, 0);
    let x = centerX - lineWidth / 2;
    for (const token of line) {
      applyFont(ctx, { bold: token.bold, size: fontSize, family });
      ctx.fillStyle = token.bold ? BOLD_COLOR : TEXT_COLOR;
      ctx.fillText(token.text, x, y);
      x += ctx.measureText(token.text).width;
    }
    y += fontSize * lineHeight;
  }
}

export function paintCertificate(ctx, { width, height, background, payload }) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(background, 0, 0, width, height);

  const family = certificateFontFamily();

  const week = CERT_LAYOUT.week;
  drawAlignedText(ctx, String(payload.week), {
    x: week.x * width,
    y: week.y * height,
    align: week.align,
    baseline: week.baseline,
    fontSize: week.fontSize * width,
    bold: true,
    family,
    color: TEXT_COLOR,
  });

  const g3qId = CERT_LAYOUT.g3qId;
  drawAlignedText(ctx, `G3Q ID: ${payload.g3qId}`, {
    x: g3qId.x * width,
    y: g3qId.y * height,
    align: g3qId.align,
    baseline: g3qId.baseline,
    fontSize: g3qId.fontSize * width,
    bold: true,
    family,
    color: TEXT_COLOR,
  });

  const category = CERT_LAYOUT.category;
  drawAlignedText(ctx, `(${payload.categoryTitle})`, {
    x: category.x * width,
    y: category.y * height,
    align: category.align,
    baseline: category.baseline,
    fontSize: category.fontSize * width,
    bold: false,
    family,
    color: TEXT_COLOR,
  });

  const body = CERT_LAYOUT.body;
  const school = payload.school || payload.place || payload.categoryTitle;
  drawCenteredParagraph(
    ctx,
    [
      { text: "This is to certify that " },
      { text: payload.name || "Participant", bold: true },
      { text: " of " },
      { text: school, bold: true },
      {
        text: ` has participated in the '${payload.categoryInline}' for the online weekly quiz conducted as part of 'Gujarat Gyan Guru Quiz (G3Q) 2.0' organized by the Education Department, Government of Gujarat`,
      },
    ],
    {
      centerX: body.x * width,
      topY: body.y * height,
      maxWidth: body.maxWidth * width,
      fontSize: body.fontSize * width,
      lineHeight: body.lineHeight,
      family,
    }
  );
}

export async function renderCertificateCanvas(canvas, payload, { pixelWidth } = {}) {
  const background = await loadCertificateBackground();
  await ensureFonts();
  const width = Math.max(1, Math.round(pixelWidth || canvas.width || CERT_NATIVE.width));
  const height = Math.round(width * (CERT_NATIVE.height / CERT_NATIVE.width));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  paintCertificate(ctx, { width, height, background, payload });
  return canvas;
}

export async function downloadCertificatePng(payload, fileName) {
  const canvas = document.createElement("canvas");
  const pixelWidth = Math.min(CERT_NATIVE.width, 3200);
  await renderCertificateCanvas(canvas, payload, { pixelWidth });
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((next) => {
      if (next) resolve(next);
      else reject(new Error("Could not create certificate image."));
    }, "image/png");
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
