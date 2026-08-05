"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import SearchModal from "./SearchModal";

const NAV_LINKS = [
  { href: "/reviews",   label: "Reviews" },
  { href: "/news",      label: "News" },
  { href: "/spotlight", label: "Spotlight" },
  { href: "/lists",     label: "Rankings" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
    {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    <nav className="w-full bg-background border-b-[3px] border-foreground sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="shrink-0 group flex items-center gap-0">
          <span className="font-heading text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase leading-none">
            THE ORANGE
          </span>
          <span className="font-heading text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none ml-1.5 bg-primary text-foreground px-1.5 py-0.5 border-[2px] border-foreground group-hover:bg-foreground group-hover:text-primary transition-colors">
            PULP
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative px-4 py-2 text-[11px] font-black tracking-[0.18em] uppercase text-foreground/70 hover:text-foreground hover:bg-muted transition-colors border-[2px] border-transparent hover:border-foreground"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="p-2 border-[2px] border-foreground/20 hover:border-foreground hover:bg-muted transition-colors"
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <ThemeToggle />
          <Link
            href="/subscribe"
            className="bg-foreground text-background border-[3px] border-foreground px-5 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-colors"
          >
            Subscribe
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-1.5 border-[2px] border-foreground hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-5 h-5" strokeWidth={2.5} /> : <Menu className="w-5 h-5" strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-t-[3px] border-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-0 divide-y-[2px] divide-foreground/10">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="py-4 text-base font-black uppercase tracking-widest text-foreground hover:text-primary hover:pl-2 transition-all"
              >
                {label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => { setIsOpen(false); setSearchOpen(true); }}
                className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors"
              >
                <Search className="w-4 h-4" strokeWidth={2.5} /> Search
              </button>
              <Link
                href="/subscribe"
                onClick={() => setIsOpen(false)}
                className="block w-full bg-foreground text-background border-[3px] border-foreground px-4 py-3 text-center text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-colors"
              >
                Subscribe to Newsletter
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
