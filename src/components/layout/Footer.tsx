import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";

const EXPLORE = [
  { href: "/reviews",  label: "Reviews" },
  { href: "/news",     label: "News" },
  { href: "/spotlight",label: "Spotlight" },
  { href: "/lists",    label: "Rankings" },
];

const COMPANY = [
  { href: "/about",   label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms" },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background border-t-[4px] border-foreground">

      {/* Newsletter strip */}
      <div className="border-b-[3px] border-background/15">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12">
          <div className="shrink-0">
            <div className="font-heading text-3xl font-black uppercase text-background leading-tight">
              Stay in the Loop
            </div>
            <div className="text-sm font-bold text-background/50 mt-1 uppercase tracking-widest">
              Weekly film takes. No spam.
            </div>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">

        {/* Brand column */}
        <div className="md:col-span-2">
          <Link href="/" className="inline-flex items-center gap-0 mb-4 group">
            <span className="font-heading text-2xl font-black uppercase tracking-tighter text-background leading-none">
              THE ORANGE
            </span>
            <span className="font-heading text-2xl font-black uppercase tracking-tighter leading-none ml-2 bg-primary text-primary-foreground px-2 py-0.5 border-[2px] border-background/20 group-hover:bg-secondary transition-colors">
              PULP
            </span>
          </Link>
          <p className="text-sm font-medium text-background/55 leading-relaxed max-w-xs mt-2">
            Premium movie reviews, news, and film culture for the modern cinephile.
          </p>

          {/* Social */}
          <div className="flex gap-2 mt-6">
            {["X", "IG", "YT"].map(s => (
              <button
                key={s}
                className="w-9 h-9 border-[2px] border-background/30 text-background/60 text-label font-black uppercase hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors flex items-center justify-center"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-label font-black uppercase tracking-[0.2em] text-background/40 mb-4">Explore</h4>
          <ul className="space-y-3">
            {EXPLORE.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm font-bold text-background/70 uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-label font-black uppercase tracking-[0.2em] text-background/40 mb-4">Company</h4>
          <ul className="space-y-3">
            {COMPANY.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm font-bold text-background/70 uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t-[2px] border-background/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-label font-bold uppercase tracking-widest text-background/35">
            © {new Date().getFullYear()} The Orange Pulp. All rights reserved.
          </p>
          <p className="text-label font-bold uppercase tracking-widest text-background/35">
            Made for film lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}
