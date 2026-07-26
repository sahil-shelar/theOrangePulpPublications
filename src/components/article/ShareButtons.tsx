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

  // Load images in parallel
  const siteOrigin = window.location.origin;
  const [coverImg, logoImg] = await Promise.all([
    coverImageUrl ? loadImage(coverImageUrl) : Promise.resolve(null),
    loadImage(`${siteOrigin}/logo.jpg`),
  ]);

  // ── Background: charcoal, like Letterboxd ──
  ctx.fillStyle = "#1c1c1e";
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow behind card
  const glow = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, 560);
  glow.addColorStop(0, "rgba(232,160,69,0.08)");
  glow.addColorStop(1, "rgba(28,28,30,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Card — portrait centered (Letterboxd style) ──
  const CW = 640, CH = 860, CR = 32;
  const CX = (W - CW) / 2, CY = 230;

  // Card shadow
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#2c2c2e";
  rrect(ctx, CX, CY, CW, CH, CR);
  ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Cover image clipped to card
  ctx.save();
  rrect(ctx, CX, CY, CW, CH, CR); ctx.clip();
  if (coverImg) {
    const scale = Math.max(CW / coverImg.naturalWidth, CH / coverImg.naturalHeight);
    const dw = coverImg.naturalWidth * scale, dh = coverImg.naturalHeight * scale;
    ctx.drawImage(coverImg, CX + (CW - dw) / 2, CY + (CH - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#2c2c2e"; ctx.fillRect(CX, CY, CW, CH);
  }
  ctx.restore();

  // Card border
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  rrect(ctx, CX, CY, CW, CH, CR);
  ctx.stroke();

  // ── Logo badge — sits on top edge of card ──
  const BADGE_R = 72;
  const BCX = W / 2, BCY = CY;

  // Badge white ring (background)
  ctx.beginPath(); ctx.arc(BCX, BCY, BADGE_R + 5, 0, Math.PI * 2);
  ctx.fillStyle = "#1c1c1e"; ctx.fill();

  // Badge orange ring
  ctx.beginPath(); ctx.arc(BCX, BCY, BADGE_R + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#E8A045"; ctx.lineWidth = 4; ctx.stroke();

  // Badge logo image
  if (logoImg) {
    drawCircleClip(ctx, logoImg, BCX, BCY, BADGE_R);
  } else {
    ctx.beginPath(); ctx.arc(BCX, BCY, BADGE_R, 0, Math.PI * 2);
    ctx.fillStyle = "#E8A045"; ctx.fill();
    ctx.fillStyle = "#1c1c1e"; ctx.font = "900 40px Arial"; ctx.textAlign = "center";
    ctx.fillText("TOP", BCX, BCY + 14);
  }

  // ── Content below card ──
  let y = CY + CH + 70;

  // Title
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  const titleSz = title.length > 28 ? 62 : 72;
  ctx.font = `700 ${titleSz}px Arial, sans-serif`;
  const titleLines = wrap(ctx, title, 840).slice(0, 2);
  titleLines.forEach((l, i) => { ctx.fillText(l, W / 2, y + i * (titleSz + 14)); });
  y += titleLines.length * (titleSz + 14) + 28;

  // Excerpt
  if (excerpt) {
    ctx.font = "400 italic 36px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    const excerptLines = wrap(ctx, `"${excerpt}"`, 820).slice(0, 2);
    excerptLines.forEach((l, i) => { ctx.fillText(l, W / 2, y + i * 50); });
    y += excerptLines.length * 50 + 28;
  }

  // Stars (convert /10 → /5)
  if (rating) {
    const s5 = rating / 2;
    const full = Math.floor(s5), half = (s5 - full) >= 0.5;
    const starStr = "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
    ctx.font = "bold 80px Arial, sans-serif";
    ctx.fillStyle = "#4ade80";
    ctx.fillText(starStr, W / 2, y + 74);
    y += 110;
  }

  y += 36;

  // Divider + ON
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 160, y); ctx.lineTo(W / 2 - 40, y); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 40, y); ctx.lineTo(W / 2 + 160, y); ctx.stroke();
  ctx.font = "500 28px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("ON", W / 2, y + 10);
  y += 36;

  // Brand row: orange dot • The Orange Pulp
  const dotR = 16;
  ctx.font = "700 50px Arial, sans-serif";
  const bw = ctx.measureText("The Orange Pulp").width;
  const rowX = W / 2 - (dotR * 2 + 20 + bw) / 2;
  ctx.beginPath(); ctx.arc(rowX + dotR, y + 36, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "#E8A045"; ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText("The Orange Pulp", rowX + dotR * 2 + 20, y + 52);
  y += 84;

  // CTA: "Read full review — link in bio"
  ctx.textAlign = "center";
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillStyle = "#E8A045";
  ctx.letterSpacing = "2px";
  ctx.fillText("READ FULL REVIEW — LINK IN BIO", W / 2, y + 20);

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
