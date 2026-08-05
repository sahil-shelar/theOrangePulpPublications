"use client";

import { useState } from "react";

export default function SidebarNewsletter() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="brutal-card bg-primary p-6">
        <p className="font-heading text-lg font-black uppercase text-foreground">You're in!</p>
        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">Check your inbox.</p>
      </div>
    );
  }

  return (
    <div className="brutal-card bg-primary p-6">
      <h3 className="font-heading text-xl font-black uppercase text-foreground mb-1 leading-tight">Newsletter</h3>
      <p className="text-xs font-medium text-foreground/70 mb-4 leading-relaxed">
        Weekly film takes. No spam.
      </p>
      <form
        className="space-y-0"
        onSubmit={e => { e.preventDefault(); setDone(true); }}
      >
        <input
          type="email"
          placeholder="your@email.com"
          required
          className="w-full bg-background border-[3px] border-foreground border-b-0 px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="w-full bg-foreground text-background border-[3px] border-foreground px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
