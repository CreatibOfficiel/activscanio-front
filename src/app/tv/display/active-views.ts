import { Competitor } from "@/app/models/Competitor";
import { PingpongPlayer } from "@/app/models/Pingpong";
import { SeasonArchive } from "@/app/repositories/SeasonsRepository";
import { RaceEvent } from "@/app/models/RaceEvent";

export enum DisplayView {
  ALUMNI_ANNIVERSARY = "alumni-anniversary",
  LATEST_RACES = "latest-races",
  MOVEMENTS = "movements",
  COMPETITOR_RANKINGS = "competitors",
  PINGPONG_RANKINGS = "pingpong",
  ARCHIVED_SEASONS = "seasons",
}

export interface TVDisplayData {
  alumniAnniversaries?: AlumniAnniversary[];
  competitorRankings: Competitor[];
  pingpongPlayers: PingpongPlayer[];
  archivedSeasons: SeasonArchive[];
  latestRaces?: RaceEvent[];
}

export interface AlumniAnniversary { id: string; firstName: string; years: number; profilePictureUrl: string; totalGames: number; characterName: string | null; characterImageUrl: string | null; contactUrl: string | null; }

/**
 * Every view the wall screen knows how to render.
 *
 * `ARCHIVED_SEASONS` sat out of this list for a long time — it had a
 * component, a title and a data guard, and none of it ever ran, because the
 * filter below only ever walks `ALL_VIEWS`. That was a deliberate hold: the
 * view arrived alongside ping-pong and turning it on was a product call, not
 * a side effect. The call has since been made, so it rotates now.
 *
 * It still only takes a slot when there is something archived to show. That
 * rule lives in `computeActiveViews`, where it has always been written.
 */
export const ALL_VIEWS = [
  DisplayView.ALUMNI_ANNIVERSARY,
  DisplayView.COMPETITOR_RANKINGS,
  DisplayView.LATEST_RACES,
  DisplayView.MOVEMENTS,
  DisplayView.PINGPONG_RANKINGS,
  DisplayView.ARCHIVED_SEASONS,
];

/**
 * Which views currently have something worth showing.
 *
 * A view with no data must not take its turn: the screen is always on and
 * unattended, so an empty board holds the room for a full rotation slot with
 * nobody there to skip it.
 *
 * Extracted from `page.tsx` as a pure function purely so it can be tested.
 * The page needs Suspense, `useSearchParams`, two repositories and a timer,
 * none of which have anything to say about this rule.
 */
export function computeActiveViews(data: TVDisplayData): DisplayView[] {
  return ALL_VIEWS.filter((view) => {
    switch (view) {
      case DisplayView.ALUMNI_ANNIVERSARY:
        return (data.alumniAnniversaries?.length ?? 0) > 0;
      case DisplayView.LATEST_RACES:
        return (data.latestRaces?.length ?? 0) > 0;
      case DisplayView.MOVEMENTS:
        return data.competitorRankings.some((player) => player.previousDayRank != null);
      case DisplayView.COMPETITOR_RANKINGS:
        return (
          data.competitorRankings.length > 0 &&
          data.competitorRankings.some((c) => c.raceCount && c.raceCount > 0)
        );

      case DisplayView.PINGPONG_RANKINGS:
        /**
         * Counts VISIBLE players, not ranked ones.
         *
         * This is the whole cold-start question. Production has zero
         * ping-pong players today, so the view correctly drops out. But a
         * rank is withheld until eight weighted matches, so for the first
         * weeks of the sport every single player carries `rank: null` —
         * and gating on ranked players would hide the board for exactly the
         * weeks it is new and people are checking it.
         *
         * Archived players are excluded because the view itself filters
         * them out. Counting them would rotate to a board that renders
         * nothing, which is the failure this predicate exists to prevent.
         */
        return data.pingpongPlayers.some((p) => !p.archived);

      case DisplayView.ARCHIVED_SEASONS:
        return data.archivedSeasons.length > 0;

      default:
        return true;
    }
  });
}

export const viewLabels: Record<DisplayView, string> = {
  [DisplayView.ALUMNI_ANNIVERSARY]: "Aujourd’hui",
  [DisplayView.LATEST_RACES]: "Résultats",
  [DisplayView.MOVEMENTS]: "Mouvements",
  [DisplayView.COMPETITOR_RANKINGS]: "MK8",
  [DisplayView.PINGPONG_RANKINGS]: "Ping-pong",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons",
};

export const viewTitles: Record<DisplayView, string> = {
  [DisplayView.ALUMNI_ANNIVERSARY]: "Ça se fête aujourd’hui !",
  [DisplayView.LATEST_RACES]: "Les 5 dernières courses",
  [DisplayView.MOVEMENTS]: "Ça bouge au classement",
  [DisplayView.COMPETITOR_RANKINGS]: "Classement des pilotes",
  [DisplayView.PINGPONG_RANKINGS]: "Classement des pongistes",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons archivées",
};
