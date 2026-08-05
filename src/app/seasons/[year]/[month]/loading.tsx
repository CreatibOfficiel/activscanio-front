import { FC } from 'react';

/**
 * Streamed shell for a single season.
 *
 * The parent /seasons/loading.tsx would otherwise be reused for this segment,
 * and it renders the archive grid — visibly wrong for a detail page. This one
 * mirrors the header, the 4 stat tiles and the ranking rows instead.
 */
const SeasonDetailLoading: FC = () => (
  <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-neutral-700 rounded" />
          <div className="h-3 w-32 bg-neutral-700/60 rounded" />
        </div>
        <div className="h-8 w-32 bg-neutral-700 rounded" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border bg-neutral-800 border-neutral-700"
          >
            <div className="h-3 w-16 bg-neutral-700/60 rounded mb-2" />
            <div className="h-7 w-12 bg-neutral-700 rounded" />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <div className="h-10 w-52 bg-neutral-700 rounded-lg" />
        <div className="h-10 w-52 bg-neutral-800 rounded-lg" />
      </div>

      <div className="p-6 rounded-lg border bg-neutral-800 border-neutral-700">
        <div className="h-5 w-48 bg-neutral-700 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[76px] bg-neutral-750 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SeasonDetailLoading;
