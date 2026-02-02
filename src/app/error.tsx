'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console (could be sent to monitoring service like Sentry)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-center">
      {/* Error Icon */}
      <div className="text-8xl mb-6">
        💥
      </div>

      {/* Error Title */}
      <h1 className="text-3xl font-bold text-error-500 mb-2">
        Oups ! Une erreur est survenue
      </h1>

      {/* Error Message */}
      <p className="text-neutral-400 mb-6 max-w-md">
        Un problème inattendu s&apos;est produit. L&apos;équipe technique a été informée.
      </p>

      {/* Error Details (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700 max-w-lg text-left">
          <p className="text-sm text-error-400 font-mono break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-500 mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold rounded-lg transition-colors duration-200"
        >
          <span>🔄</span>
          Réessayer
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-lg transition-colors duration-200"
        >
          <span>🏠</span>
          Retour au classement
        </Link>
      </div>

      {/* Decorative Mushroom */}
      <div className="mt-12 text-6xl opacity-30">
        🍄
      </div>
    </div>
  );
}
