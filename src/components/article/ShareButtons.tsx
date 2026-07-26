"use client";

import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";

type Props = {
  title: string;
  accentBorder?: string;
  coverImageUrl?: string;
  rating?: number | null;
  excerpt?: string;
};

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  let line = "", lines: string[] = [];
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawCircleClip(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  const scale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

function drawStarPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    i === 0 ? ctx.moveTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
             : ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }
  ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, rating10: number, cx: number, cy: number) {
  const s5 = rating10 / 2;
  const full = Math.floor(s5);
  const half = (s5 - full) >= 0.5;
  const total = full + (half ? 1 : 0); // stars to draw
  const R = 38, GAP = 18;
  const totalW = total * R * 2 + (total - 1) * GAP;
  let x = cx - totalW / 2 + R;
  ctx.fillStyle = "#4ade80";
  for (let i = 0; i < full; i++) {
    drawStarPath(ctx, x, cy, R);
    ctx.fill();
    x += R * 2 + GAP;
  }
  if (half && x <= cx + totalW / 2) {
    // half star: clip left half
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - R, cy - R, R, R * 2);
    ctx.clip();
    drawStarPath(ctx, x, cy, R);
    ctx.fill();
    ctx.restore();
  }
}

async function generateStoryCard(
  title: string,
  coverImageUrl: string | undefined,
  rating: number | null | undefined,
  excerpt: string | undefined,
): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const siteOrigin = window.location.origin;
  const [coverImg, logoImg] = await Promise.all([
    coverImageUrl ? loadImage(coverImageUrl) : Promise.resolve(null),
    loadImage(`${siteOrigin}/logo.jpg`),
  ]);

  // ── Background: light grey → dark grey gradient ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#3a3a3c");
  bgGrad.addColorStop(1, "#0f0f11");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Card: 640×860 — tighter poster, more content room ──
  const CW = 640, CH = 860, CR = 16;
  const CX = (W - CW) / 2;
  const CY = 240;
  const CB = CY + CH; // 1100

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  rrect(ctx, CX, CY, CW, CH, CR);
  ctx.fillStyle = "#2c2c2e";
  ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Cover clipped to card
  ctx.save();
  rrect(ctx, CX, CY, CW, CH, CR); ctx.clip();
  if (coverImg) {
    const scale = Math.max(CW / coverImg.naturalWidth, CH / coverImg.naturalHeight);
    const dw = coverImg.naturalWidth * scale, dh = coverImg.naturalHeight * scale;
    ctx.drawImage(coverImg, CX + (CW - dw) / 2, CY + (CH - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#2c2c2e";
    ctx.fillRect(CX, CY, CW, CH);
  }
  ctx.restore();

  // Card border
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1.5;
  rrect(ctx, CX, CY, CW, CH, CR);
  ctx.stroke();

  // ── Logo badge — centered on card top edge ──
  const BR = 44;
  const BCX = W / 2, BCY = CY;

  ctx.beginPath(); ctx.arc(BCX, BCY, BR + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#2e2e30"; ctx.fill();

  ctx.beginPath(); ctx.arc(BCX, BCY, BR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "#E8A045"; ctx.lineWidth = 3; ctx.stroke();

  if (logoImg) {
    drawCircleClip(ctx, logoImg, BCX, BCY, BR);
  } else {
    ctx.beginPath(); ctx.arc(BCX, BCY, BR, 0, Math.PI * 2);
    ctx.fillStyle = "#E8A045"; ctx.fill();
    ctx.fillStyle = "#1c1c1e"; ctx.font = "900 28px Arial"; ctx.textAlign = "center";
    ctx.fillText("OP", BCX, BCY + 10);
  }

  // ── Content below card — vertically centered in available space ──
  ctx.textAlign = "center";

  const hasRating = rating != null && Number(rating) > 0;
  const titleFont = title.length > 22 ? 60 : 72;
  const titleLH = titleFont + 10;

  // Pre-measure title lines to know content height upfront
  ctx.font = `800 ${titleFont}px Arial, sans-serif`;
  const titleLines = wrap(ctx, title, 820).slice(0, 2);

  const titleBlockH  = titleLines.length * titleLH + 20;
  const excerptBlockH = excerpt ? 34 + 24 : 0;
  const starsBlockH  = hasRating ? 38 * 2 + 32 : 0;  // R*2 height + gap
  const ruleBlockH   = 44;
  const brandBlockH  = 42 + 28;
  const ctaBlockH    = 40;
  const totalH = titleBlockH + excerptBlockH + starsBlockH + ruleBlockH + brandBlockH + ctaBlockH;

  // Center block vertically between card bottom and canvas bottom (leave 120px bottom padding)
  const available = H - CB - 120;
  let y = CB + Math.max(60, (available - totalH) / 2);

  // Title
  titleLines.forEach((l, i) => {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${titleFont}px Arial, sans-serif`;
    ctx.fillText(l, W / 2, y + titleFont + i * titleLH);
  });
  y += titleLines.length * titleLH + 20;

  // Excerpt — 1 line, small, dimmed
  if (excerpt) {
    ctx.font = "400 italic 34px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.36)";
    ctx.fillText((wrap(ctx, excerpt, 800)[0] ?? ""), W / 2, y + 34);
    y += 34 + 24;
  }

  // Stars — canvas paths
  if (hasRating) {
    drawStars(ctx, Number(rating), W / 2, y + 38);
    y += 38 * 2 + 32;
  }

  // Divider rule
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CX + 60, y); ctx.lineTo(CX + CW - 60, y);
  ctx.stroke();
  y += 36;

  // Brand row: dot + name, centered as unit
  const dotR = 9;
  ctx.font = "700 42px Arial, sans-serif";
  const brandText = "The Orange Pulp";
  const bw = ctx.measureText(brandText).width;
  const unitX = W / 2 - (dotR * 2 + 14 + bw) / 2;
  ctx.beginPath(); ctx.arc(unitX + dotR, y + 30, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "#E8A045"; ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(brandText, unitX + dotR * 2 + 14, y + 42);
  y += 42 + 28;

  // CTA
  ctx.textAlign = "center";
  ctx.font = "700 32px Arial, sans-serif";
  ctx.fillStyle = "rgba(232,160,69,0.80)";
  ctx.fillText("READ FULL REVIEW  ·  LINK IN BIO", W / 2, y + 32);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

export default function ShareButtons({ title, accentBorder = "border-foreground", coverImageUrl, rating, excerpt }: Props) {
  const [copied, setCopied] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);

  function copy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`,
      "_blank", "noopener,noreferrer"
    );
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      "_blank", "noopener,noreferrer"
    );
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title} ${window.location.href}`)}`,
      "_blank", "noopener,noreferrer"
    );
  }

  async function shareStory() {
    setGeneratingStory(true);
    try {
      const blob = await generateStoryCard(title, coverImageUrl, rating, excerpt);
      const file = new File([blob], "orange-pulp-story.png", { type: "image/png" });

      // On mobile with Web Share API file support → opens native sheet (Instagram Stories)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        // Desktop fallback: download the card
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orange-pulp-story.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (_) {}
    setGeneratingStory(false);
  }

  return (
    <div className={`mt-10 pt-6 border-t-[3px] ${accentBorder}`}>
      <span className="font-black uppercase tracking-widest text-xs text-foreground/50 block mb-3">Share</span>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={shareX} className="px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
          𝕏 Post
        </button>
        <button onClick={shareFacebook} className="px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
          FB Share
        </button>
        <button onClick={shareWhatsApp} className="px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
          WhatsApp
        </button>
        <button
          onClick={shareStory}
          disabled={generatingStory}
          className="flex items-center gap-1.5 px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
          title="Share to Instagram Stories"
        >
          <Sparkles size={13} />
          {generatingStory ? "Generating…" : "Story"}
        </button>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors ml-auto"
        >
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
