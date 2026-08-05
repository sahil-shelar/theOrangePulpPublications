"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";
import { typeToRoute } from "@/lib/utils";

type Result = {
  id: string;
  title: string;
  type: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  categories?: { name: string };
  authors?: { name: string };
};

type Props = { onClose: () => void };

export default function SearchModal({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data);
      setActive(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 300);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, -1));
    } else if (e.key === "Enter" && active >= 0 && results[active]) {
      window.location.href = resultHref(results[active]);
      onClose();
    }
  }

  const TYPE_COLOR: Record<string, string> = {
    review:   "bg-primary text-foreground",
    news:     "bg-secondary text-foreground",
    spotlight:"bg-muted text-foreground",
    list:     "bg-foreground text-background",
    movie:    "bg-accent text-foreground",
  };

  function resultHref(r: Result) {
    if (r.type === 'movie') return `/movie/${r.slug}`
    return `/${typeToRoute(r.type)}/${r.slug}`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/60 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[70] w-full max-w-2xl px-4">
        <div className="bg-background border-[3px] border-foreground shadow-[8px_8px_0_0_var(--foreground)]">

          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-4 border-b-[3px] border-foreground">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={2.5} />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search reviews, news, spotlights…"
              className="flex-1 bg-transparent text-foreground text-base font-bold placeholder:text-muted-foreground"
            />
            {loading && (
              <span className="text-label font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                Searching…
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 border-[2px] border-foreground/20 hover:border-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="divide-y-[2px] divide-foreground/10 max-h-[60vh] overflow-y-auto">
              {results.map((r, i) => (
                <Link
                  key={r.id}
                  href={resultHref(r)}
                  onClick={onClose}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors group ${
                    active === i ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  {r.cover_image_url ? (
                    <div className="w-14 h-10 shrink-0 border-[2px] border-foreground overflow-hidden">
                      <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-10 shrink-0 border-[2px] border-foreground bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-label font-black uppercase tracking-widest px-1.5 py-0.5 ${TYPE_COLOR[r.type] ?? "bg-muted text-foreground"}`}>
                        {r.type}
                      </span>
                      {r.categories && (
                        <span className="text-label font-bold uppercase tracking-widest text-muted-foreground">
                          {r.categories.name}
                        </span>
                      )}
                    </div>
                    <p className="font-heading text-sm font-black uppercase text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {r.title}
                    </p>
                    {r.authors && (
                      <p className="text-label font-bold text-muted-foreground mt-0.5">{r.authors.name}</p>
                    )}
                  </div>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="font-heading text-sm font-black uppercase text-muted-foreground tracking-widest">
                No results for "{query}"
              </p>
            </div>
          )}

          {/* Hint */}
          {query.length === 0 && (
            <div className="px-4 py-3 flex items-center gap-4">
              <span className="text-label font-bold uppercase tracking-widest text-muted-foreground">
                Type to search · ESC to close · ↑↓ navigate · Enter to open
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
