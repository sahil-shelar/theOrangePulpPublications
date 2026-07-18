"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
          ORANGE<span className="text-foreground">PULP</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase text-foreground/70">
          <Link href="/reviews" className="hover:text-primary transition-colors">Reviews</Link>
          <Link href="/news" className="hover:text-primary transition-colors">News</Link>
          <Link href="/spotlight" className="hover:text-primary transition-colors">Spotlight</Link>
          <Link href="/lists" className="hover:text-primary transition-colors">Rankings</Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          <button className="text-foreground/70 hover:text-primary transition-colors" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/subscribe" className="bg-foreground text-background px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
            Subscribe
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-foreground/80" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-background"
          >
            <div className="px-6 py-6 flex flex-col gap-6 text-sm font-medium tracking-widest uppercase text-foreground/70">
              <Link href="/reviews" onClick={() => setIsOpen(false)}>Reviews</Link>
              <Link href="/news" onClick={() => setIsOpen(false)}>News</Link>
              <Link href="/spotlight" onClick={() => setIsOpen(false)}>Spotlight</Link>
              <Link href="/lists" onClick={() => setIsOpen(false)}>Rankings</Link>
              <div className="h-px bg-border my-2" />
              <Link href="/subscribe" className="text-primary" onClick={() => setIsOpen(false)}>Subscribe to Newsletter</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
