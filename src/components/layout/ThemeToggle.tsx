"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 border-[2px] border-foreground/20 hover:border-foreground hover:bg-muted transition-colors"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" strokeWidth={2.5} />
      ) : (
        <Moon className="w-4 h-4" strokeWidth={2.5} />
      )}
    </button>
  );
}
