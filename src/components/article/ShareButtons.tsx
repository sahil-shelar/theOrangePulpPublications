"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

export default function ShareButtons({ title, accentBorder = "border-foreground" }: { title: string; accentBorder?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title} ${window.location.href}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // Native share sheet (includes Instagram, Stories, etc on mobile)
  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch (_) {}
    } else {
      copy();
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className={`mt-10 pt-6 border-t-[3px] ${accentBorder}`}>
      <span className="font-black uppercase tracking-widest text-xs text-foreground/50 block mb-3">Share</span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={shareX}
          className="px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          𝕏 Post
        </button>
        <button
          onClick={shareFacebook}
          className="px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          FB Share
        </button>
        <button
          onClick={shareWhatsApp}
          className="px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          WhatsApp
        </button>
        {canShare && (
          <button
            onClick={shareNative}
            className="flex items-center gap-1.5 px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            title="Share to Instagram, Stories & more"
          >
            <Share2 size={13} /> More
          </button>
        )}
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
