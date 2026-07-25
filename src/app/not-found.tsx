import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <h2 className="font-heading text-6xl md:text-9xl font-black uppercase tracking-tighter mb-4 text-foreground/10">
        404
      </h2>
      <h3 className="font-heading text-3xl md:text-5xl font-black uppercase tracking-widest mb-6">
        PAGE NOT FOUND
      </h3>
      <p className="text-xl font-bold mb-10 max-w-lg text-foreground/70">
        The content you are looking for has been archived, deleted, or never existed in this dimension.
      </p>
      <Link href="/" className="brutal-button px-8 py-4 font-black uppercase tracking-widest text-sm">
        Return to Homepage
      </Link>
    </div>
  );
}
