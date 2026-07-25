'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
          <h1 className="font-heading text-6xl font-black uppercase tracking-tighter mb-4">CRITICAL SYSTEM FAILURE</h1>
          <p className="text-xl font-bold mb-8 opacity-80">Something went terribly wrong at the root level.</p>
          <div className="flex gap-4">
            <button onClick={() => reset()} className="brutal-button px-6 py-3 font-bold uppercase tracking-widest text-sm">
              Reboot System
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
