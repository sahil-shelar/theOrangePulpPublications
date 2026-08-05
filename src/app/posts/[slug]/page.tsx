import fs from 'fs';
import path from 'path';
import dynamic from 'next/dynamic';
import { ArrowLeft, Clock, Calendar, Share2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

// Helper to get all post slugs
export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  if (!fs.existsSync(postsDirectory)) return [];
  const filenames = fs.readdirSync(postsDirectory);
  
  return filenames.map((filename) => ({
    slug: filename.replace(/\.mdx$/, ''),
  }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Dynamically import the MDX file
  // In a real app with frontmatter, you'd parse the file content using gray-matter and next-mdx-remote
  let Post;
  try {
    Post = dynamic(() => import(`../../../content/posts/${slug}.mdx`));
  } catch (e) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Post Not Found</h1>
        <Link href="/" className="text-primary font-bold uppercase tracking-widest text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <article className="w-full bg-background pb-20">
      {/* Hero Banner */}
      <div className="w-full aspect-[21/9] min-h-[400px] max-h-[600px] relative bg-muted">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-32 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-background transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-card p-8 md:p-12 rounded-xl border border-border shadow-2xl mb-12 text-card-foreground">
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-card-foreground/50 mb-6">
            <span className="text-primary bg-primary/10 px-3 py-1 rounded-sm">Editorial</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Oct 12, 2026</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 8 min read</span>
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-6">
            The Golden Era of Indie Cinema Returns
          </h1>
          
          <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop')" }} />
              </div>
              <div>
                <div className="font-bold text-sm text-card-foreground">Sarah Jenkins</div>
                <div className="text-xs text-card-foreground/50">Senior Editor</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-card-foreground/50">
              <button className="p-2 hover:text-primary transition-colors rounded-full hover:bg-muted"><Share2 className="w-4 h-4" /></button>
              <button className="p-2 hover:text-primary transition-colors rounded-full hover:bg-muted"><MessageCircle className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Colours come from the .prose token block in globals.css, which is
            already theme-aware — dark:prose-invert would override it with
            Tailwind's own greys. */}
        <div className="prose prose-lg prose-headings:font-heading prose-headings:font-black max-w-none">
          <Post />
        </div>

        {/* Article Ad Placeholder */}
        <div className="my-12 w-full py-10 bg-muted border border-border flex flex-col items-center justify-center rounded-lg text-muted-foreground font-mono text-sm">
          <span>[ In-Article Advertisement ]</span>
          <span className="text-xs mt-2">Support Independent Journalism</span>
        </div>
      </div>
    </article>
  );
}
