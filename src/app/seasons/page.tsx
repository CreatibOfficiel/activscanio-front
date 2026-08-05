import { FC } from 'react';
import {
  SeasonsRepository,
  type SeasonArchive,
} from '@/app/repositories/SeasonsRepository';
import { Card } from '@/app/components/ui';
import { MdErrorOutline } from 'react-icons/md';
import SeasonsList from './SeasonsList';

/**
 * Archived seasons are immutable once written: the cron archives a season on
 * the 1st of the month and never touches it again. The only thing that ever
 * changes here is a new row appearing, once a month.
 *
 * An hour is therefore already conservative — it bounds the staleness of "a
 * new season showed up" to well under a day, while letting every visit inside
 * the window serve prerendered HTML with no call to the API at all.
 */
export const revalidate = 3600;

export const metadata = {
  title: 'Historique des Saisons | MushroomBet',
  description: 'Consultez les archives des saisons précédentes',
};

/**
 * Server component: fetches the archive list at render time so the HTML ships
 * filled. `getAllSeasons()` hits a public endpoint and needs no Clerk token,
 * which is what makes this route SSR-able at all — the middleware still gates
 * access to the page itself.
 */
const SeasonsPage: FC = async () => {
  let seasons: SeasonArchive[] = [];
  let failed = false;

  try {
    seasons = await SeasonsRepository.getAllSeasons();
  } catch (error) {
    // A dead API must not 500 the page. Archives are cosmetic history; a
    // readable "try again" beats the global error boundary swallowing the
    // whole route, and beats a cached error page being served for an hour.
    console.error('SSR: failed to load seasons', error);
    failed = true;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-title mb-2">Historique des Saisons</h1>
          <p className="text-regular text-neutral-300">
            Consultez les archives des saisons précédentes
          </p>
        </div>

        {failed ? (
          <Card className="p-8 text-center">
            <MdErrorOutline className="text-6xl text-neutral-600 mx-auto mb-4" />
            <p className="text-regular text-neutral-400">
              Impossible de charger les saisons pour le moment.
            </p>
            <p className="text-sub text-neutral-500 mt-2">
              Réessayez dans quelques instants.
            </p>
          </Card>
        ) : (
          <SeasonsList seasons={seasons} />
        )}
      </div>
    </div>
  );
};

export default SeasonsPage;
