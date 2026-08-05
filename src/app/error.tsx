'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <h2 className="font-heading text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 border-[4px] border-foreground p-4 bg-primary text-primary-foreground shadow-hard-lg">
        SYSTEM ERROR 500
      </h2>
      <p className="text-xl font-bold mb-8 max-w-lg text-foreground/80">
        Our servers encountered an unexpected issue while processing your request. We've logged this incident.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="brutal-button px-6 py-3 font-bold uppercase tracking-widest text-sm"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="brutal-button bg-background text-foreground px-6 py-3 font-bold uppercase tracking-widest text-sm"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
