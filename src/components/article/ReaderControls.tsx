"use client";

import { Printer, Type, Moon, Sun, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/layout/ThemeProvider";

export default function ReaderControls() {
  const [copied, setCopied] = useState(false);
  const { theme, toggle } = useTheme();

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function cycleTextSize() {
    const el = document.querySelector("article");
    if (!el) return;
    if (el.classList.contains("prose-lg")) {
      el.classList.replace("prose-lg", "prose-xl");
    } else if (el.classList.contains("prose-xl")) {
      el.classList.replace("prose-xl", "prose-base");
    } else {
      el.classList.replace("prose-base", "prose-lg");
    }
  }

  const buttons = [
    { Icon: Type,                             fn: cycleTextSize,       title: "Text size"     },
    { Icon: theme === "dark" ? Sun : Moon,    fn: toggle,              title: "Theme"         },
    { Icon: Printer,                          fn: () => window.print(), title: "Print"        },
    { Icon: copied ? Check : Copy,            fn: handleCopy,          title: copied ? "Copied!" : "Copy link" },
  ];

  return (
    <div className="fixed bottom-6 left-4 sm:left-6 z-40 flex flex-col gap-1 bg-background border-[3px] border-foreground shadow-[4px_4px_0_0_var(--foreground)]">
      {buttons.map(({ Icon, fn, title }) => (
        <button
          key={title}
          onClick={fn}
          title={title}
          className={`p-3 hover:bg-foreground hover:text-background transition-colors ${
            title === "Copied!" ? "text-green-600" : ""
          }`}
        >
          <Icon size={16} strokeWidth={2.5} />
        </button>
      ))}
    </div>
  );
}
