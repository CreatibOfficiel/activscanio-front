import { FC } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  SeasonsRepository,
  type SeasonArchive,
  type ArchivedCompetitorRanking,
  type ArchivedPingpongRanking,
} from '@/app/repositories/SeasonsRepository';
import { Card } from '@/app/components/ui';
import SeasonDetailView from './SeasonDetailView';

/**
 * A closed season's rankings never change again — the archive cron writes them
 * once. The generous window is safe because the URL itself is the cache key:
 * a brand new season gets a brand new path, so nothing stale can be served for
 * it. Matches the list page's hour for consistency.
 */
export const revalidate = 3600;

interface SeasonDetailPageProps {
  /** Next 15 hands route params as a promise. */
  params: Promise<{ year: string; month: string }>;
}

/**
 * Server component for a single archived season.
 *
 * All three endpoints are public, so everything is fetched here and the client
 * half receives it as props. Ping-pong is allowed to fail: seasons archived
 * before the sport existed have no standings, and that must not take the Mario
 * Kart half of the page down with it.
 */
const SeasonDetailPage: FC<SeasonDetailPageProps> = async ({ params }) => {
  const { year: yearParam, month: monthParam } = await params;
  const year = Number.parseInt(yearParam, 10);
  const month = Number.parseInt(monthParam, 10);

  // Previously unguarded: a junk URL sent `NaN` straight to the API.
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    notFound();
  }

  let season: SeasonArchive | null = null;
  let competitorRankings: ArchivedCompetitorRanking[] = [];
  let pingpongRankings: ArchivedPingpongRanking[] = [];
  let failed = false;

  try {
    season = await SeasonsRepository.getSeason(year, month);

    if (season) {
      const [competitors, pingpong] = await Promise.all([
        SeasonsRepository.getCompetitorRankings(year, month),
        SeasonsRepository.getPingpongRankings(year, month).catch(() => []),
      ]);
      competitorRankings = competitors;
      pingpongRankings = pingpong;
    }
  } catch (error) {
    // A dead API renders a readable fallback rather than a 500. Distinguished
    // from "season not found" below so the message tells the truth.
    console.error(`SSR: failed to load season ${year}/${month}`, error);
    failed = true;
  }

  if (failed || !season) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-regular text-neutral-400">
            {failed
              ? 'Impossible de charger cette saison pour le moment.'
              : 'Saison introuvable'}
          </p>
          <Link
            href="/seasons"
            className="inline-flex items-center justify-center mt-4 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold rounded-lg transition-colors duration-200"
          >
            Retour aux saisons
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <SeasonDetailView
      year={year}
      month={month}
      season={season}
      competitorRankings={competitorRankings}
      pingpongRankings={pingpongRankings}
    />
  );
};

export default SeasonDetailPage;
