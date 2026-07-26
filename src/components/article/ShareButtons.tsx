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

function cardRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  let line = "", lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  lines.push(line);
  return lines;
}

async function generateStoryCard(
  title: string,
  coverImageUrl: string | undefined,
  rating: number | null | undefined,
): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Dark neutral background — no green
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, W, H);

  // Subtle top vignette
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 400);
  bgGrad.addColorStop(0, "rgba(20,20,40,0.6)");
  bgGrad.addColorStop(1, "rgba(17,24,39,0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, 400);

  // Card — portrait, centered, like Letterboxd poster
  const CARD_W = 660, CARD_H = 900, CARD_R = 28;
  const cardX = (W - CARD_W) / 2;
  const cardY = 200;

  // Draw image clipped to card
  ctx.save();
  cardRoundRect(ctx, cardX, cardY, CARD_W, CARD_H, CARD_R);
  ctx.clip();

  if (coverImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); img.src = coverImageUrl; });
      if (img.naturalWidth > 0) {
        const scale = Math.max(CARD_W / img.naturalWidth, CARD_H / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, cardX + (CARD_W - dw) / 2, cardY + (CARD_H - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = "#1f2937"; ctx.fillRect(cardX, cardY, CARD_W, CARD_H);
      }
    } catch (_) {
      ctx.fillStyle = "#1f2937"; ctx.fillRect(cardX, cardY, CARD_W, CARD_H);
    }
  } else {
    ctx.fillStyle = "#1f2937"; ctx.fillRect(cardX, cardY, CARD_W, CARD_H);
  }
  ctx.restore();

  // Card border — subtle white
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  cardRoundRect(ctx, cardX, cardY, CARD_W, CARD_H, CARD_R);
  ctx.stroke();

  // Logo badge circle at top-center of card (overlapping top edge)
  const CX = W / 2, CY = cardY;
  const CR = 68;
  ctx.beginPath(); ctx.arc(CX, CY, CR, 0, Math.PI * 2);
  ctx.fillStyle = "#E8A045"; ctx.fill();
  ctx.strokeStyle = "#111827"; ctx.lineWidth = 6; ctx.stroke();
  // "TOP" lettering inside badge
  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  ctx.font = "900 22px Arial, sans-serif";
  ctx.fillText("THE", CX, CY - 10);
  ctx.font = "900 26px Arial, sans-serif";
  ctx.fillText("PULP", CX, CY + 18);

  // ── Below card ──
  const belowY = cardY + CARD_H + 72;

  // Title
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = "700 66px Arial, sans-serif";
  const titleLines = wrapText(ctx, title, 860).slice(0, 2);
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, belowY + i * 84));

  let curY = belowY + titleLines.length * 84 + 36;

  // Stars rating (convert /10 → /5)
  if (rating) {
    const stars5 = rating / 2;
    const full = Math.floor(stars5);
    const half = stars5 - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    const starStr = "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
    ctx.fillStyle = "#4ade80"; // green stars like Letterboxd
    ctx.font = "bold 88px Arial, sans-serif";
    ctx.fillText(starStr, W / 2, curY + 80);
    curY += 110;
  }

  curY += 40;

  // Divider with "ON" label
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 180, curY); ctx.lineTo(W / 2 + 180, curY); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 30px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ON", W / 2, curY + 44);

  curY += 60;

  // Orange dots + brand name (like Letterboxd's dot + name)
  const dotY = curY + 56;
  const dotColors = ["#E8A045", "#d97706", "#f59e0b"];
  const nameStart = W / 2 - 240;
  dotColors.forEach((c, i) => {
    ctx.beginPath(); ctx.arc(nameStart + i * 42, dotY, 18, 0, Math.PI * 2);
    ctx.fillStyle = c; ctx.fill();
  });
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 54px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("The Orange Pulp", nameStart + 150, dotY + 18);

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
      const blob = await generateStoryCard(title, coverImageUrl, rating);
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
