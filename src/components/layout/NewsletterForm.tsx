"use client";

export function NewsletterForm() {
  return (
    <form
      className="flex gap-0 w-full max-w-md"
      onSubmit={e => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="your@email.com"
        required
        className="flex-1 bg-background/10 border-[3px] border-background/30 text-background placeholder:text-background/40 px-4 py-3 text-sm font-bold focus:border-primary"
      />
      <button
        type="submit"
        className="bg-primary text-foreground border-[3px] border-primary px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors shrink-0"
      >
        Subscribe
      </button>
    </form>
  );
}
