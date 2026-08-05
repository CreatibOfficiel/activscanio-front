import { FC } from 'react';

/**
 * Streamed shell for /seasons.
 *
 * Mirrors the real page's header and 3-column grid so the swap to content does
 * not move anything — the placeholder cards carry the same padding and row
 * count as a loaded card, which keeps CLS at zero.
 */
const SeasonsLoading: FC = () => (
  <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-title mb-2">Historique des Saisons</h1>
        <p className="text-regular text-neutral-300">
          Consultez les archives des saisons précédentes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-lg border bg-neutral-800 border-neutral-700 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-neutral-700 rounded" />
                <div className="h-3 w-28 bg-neutral-700/60 rounded" />
              </div>
              <div className="h-6 w-12 bg-neutral-700 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-32 bg-neutral-700/60 rounded" />
              <div className="h-4 w-28 bg-neutral-700/60 rounded" />
              <div className="h-4 w-36 bg-neutral-700/60 rounded" />
              <div className="border-t border-neutral-700 pt-3">
                <div className="h-4 w-full bg-neutral-700/60 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SeasonsLoading;
