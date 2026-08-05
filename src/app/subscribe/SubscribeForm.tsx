"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="border-[3px] border-foreground bg-muted px-6 py-8">
        <p className="font-heading text-2xl font-black uppercase text-foreground">You're subscribed!</p>
        <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">Check your inbox for a confirmation.</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-0 text-left"
      onSubmit={e => { e.preventDefault(); setDone(true); }}
    >
      {[
        { id: "name",  label: "Full Name",     type: "text",  placeholder: "Christopher Nolan" },
        { id: "email", label: "Email Address", type: "email", placeholder: "chris@example.com" },
      ].map(({ id, label, type, placeholder }) => (
        <div key={id} className="border-[3px] border-foreground border-b-0">
          <label htmlFor={id} className="block text-label font-black uppercase tracking-[0.2em] text-muted-foreground px-5 pt-4 pb-1">
            {label}
          </label>
          <input
            id={id}
            name={id}
            type={type}
            placeholder={placeholder}
            required
            className="w-full bg-transparent px-5 pb-4 text-base font-bold text-foreground placeholder:text-muted-foreground"
          />
        </div>
      ))}
      <div className="border-[3px] border-foreground p-4">
        <button
          type="submit"
          className="w-full bg-foreground text-background border-[3px] border-foreground px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Subscribe Now
        </button>
      </div>
    </form>
  );
}
