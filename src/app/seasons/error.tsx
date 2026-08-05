'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Segment boundary for /seasons and its children.
 *
 * The server components already catch API failures and render an inline
 * fallback, so this only fires on something unplanned — a render-time throw in
 * the client half, say. It exists so that case degrades to a scoped retry
 * instead of blowing up to the app-wide error page.
 */
export default function SeasonsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Seasons route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-7xl mb-6">🏁</div>

      <h1 className="text-2xl font-bold text-error-500 mb-2">
        Les archives sont indisponibles
      </h1>

      <p className="text-neutral-400 mb-6 max-w-md">
        Impossible d&apos;afficher l&apos;historique des saisons pour le moment.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700 max-w-lg text-left">
          <p className="text-sm text-error-400 font-mono break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-500 mt-2">Digest: {error.digest}</p>
          )}
        </div>
      )}

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
    </div>
  );
}
