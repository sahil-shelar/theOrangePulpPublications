import Link from "next/link";
import { Twitter, Instagram, Youtube, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="font-serif text-3xl font-bold tracking-tight text-primary mb-6 block">
              ORANGE<span className="text-foreground">PULP</span>
            </Link>
            <p className="text-foreground/70 text-sm max-w-sm leading-relaxed">
              Your premium destination for cinematic storytelling, editorial reviews, and deep-dive features into the world of entertainment.
            </p>
            <div className="flex gap-4 mt-8">
              <Link href="#" className="text-foreground/60 hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></Link>
              <Link href="#" className="text-foreground/60 hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></Link>
              <Link href="#" className="text-foreground/60 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-foreground mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-foreground/70">
              <li><Link href="/reviews" className="hover:text-primary transition-colors">Movie Reviews</Link></li>
              <li><Link href="/news" className="hover:text-primary transition-colors">Latest News</Link></li>
              <li><Link href="/spotlight" className="hover:text-primary transition-colors">Spotlights</Link></li>
              <li><Link href="/recommendations" className="hover:text-primary transition-colors">Recommendations</Link></li>
              <li><Link href="/lists" className="hover:text-primary transition-colors">Rankings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-foreground mb-6">Newsletter</h4>
            <p className="text-sm text-foreground/70 mb-4">
              Get the best of OrangePulp delivered to your inbox weekly.
            </p>
            <form className="flex">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-transparent border-b border-border py-2 px-0 text-sm w-full focus:outline-none focus:border-primary transition-colors"
                required
              />
              <button type="submit" className="ml-4 text-primary hover:text-foreground transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-foreground/50 font-medium">
          <p>&copy; {new Date().getFullYear()} OrangePulp Media. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
