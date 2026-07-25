"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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

  return (
    <div className={`flex items-center gap-3 mt-10 pt-6 border-t-[3px] ${accentBorder}`}>
      <span className="font-black uppercase tracking-widest text-xs text-foreground/50 mr-1">Share</span>
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
        onClick={copy}
        className="flex items-center gap-1.5 px-4 py-2 border-[2px] border-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors ml-auto"
      >
        {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
