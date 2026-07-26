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

async function generateStoryCard(
  title: string,
  coverImageUrl: string | undefined,
  rating: number | null | undefined,
  excerpt: string | undefined,
): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#0d2318";
  ctx.fillRect(0, 0, W, H);

  // Try to draw cover image (top 55%)
  if (coverImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = coverImageUrl;
      });
      if (img.naturalWidth > 0) {
        const imgH = H * 0.58;
        // cover-fit
        const scale = Math.max(W / img.naturalWidth, imgH / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        const dx = (W - dw) / 2, dy = 0;
        ctx.drawImage(img, dx, dy, dw, dh);
        // gradient fade from image to bg
        const grad = ctx.createLinearGradient(0, imgH * 0.5, 0, imgH);
        grad.addColorStop(0, "rgba(13,35,24,0)");
        grad.addColorStop(1, "rgba(13,35,24,1)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, imgH);
      }
    } catch (_) {}
  }

  const textY = H * 0.62;

  // Type pill
  ctx.fillStyle = "#E8A045";
  ctx.beginPath();
  ctx.roundRect(80, textY, 160, 52, 4);
  ctx.fill();
  ctx.fillStyle = "#0d2318";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("REVIEW", 160, textY + 35);

  // Title — wrap text
  ctx.fillStyle = "#F5F0E8";
  ctx.textAlign = "left";
  const titleSize = title.length > 30 ? 72 : 88;
  ctx.font = `900 ${titleSize}px Arial, sans-serif`;
  const words = title.toUpperCase().split(" ");
  let line = "", lines: string[] = [], maxW = W - 160;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  lines.slice(0, 3).forEach((l, i) => {
    ctx.fillText(l, 80, textY + 120 + i * (titleSize + 16));
  });

  const afterTitle = textY + 120 + Math.min(lines.length, 3) * (titleSize + 16) + 40;

  // Excerpt
  if (excerpt) {
    ctx.fillStyle = "rgba(245,240,232,0.55)";
    ctx.font = "400 38px Arial, sans-serif";
    const exWords = excerpt.split(" ");
    let exLine = "", exLines: string[] = [];
    for (const w of exWords) {
      const test = exLine ? `${exLine} ${w}` : w;
      if (ctx.measureText(test).width > maxW && exLine) { exLines.push(exLine); exLine = w; }
      else exLine = test;
      if (exLines.length === 2) break;
    }
    exLines.push(exLine);
    exLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 80, afterTitle + i * 54));
  }

  // Rating
  if (rating) {
    const ratingY = H * 0.88;
    ctx.fillStyle = "#E8A045";
    ctx.font = "900 130px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${rating}`, 80, ratingY);
    ctx.fillStyle = "rgba(232,160,69,0.6)";
    ctx.font = "bold 60px Arial, sans-serif";
    ctx.fillText(`/10`, 80 + ctx.measureText(`${rating}`).width + 8, ratingY - 10);
    ctx.fillStyle = "rgba(245,240,232,0.4)";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText("RATING", 80, ratingY + 36);
  }

  // Bottom branding bar
  ctx.fillStyle = "#E8A045";
  ctx.fillRect(0, H - 140, W, 4);
  ctx.fillStyle = "#F5F0E8";
  ctx.font = "900 52px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("THE ORANGE PULP", 80, H - 68);
  ctx.fillStyle = "rgba(245,240,232,0.45)";
  ctx.font = "400 34px Arial, sans-serif";
  ctx.fillText("theorangepulp.blog", 80, H - 24);

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
