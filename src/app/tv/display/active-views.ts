import { Competitor } from "@/app/models/Competitor";
import { PingpongPlayer } from "@/app/models/Pingpong";
import { SeasonArchive } from "@/app/repositories/SeasonsRepository";

export enum DisplayView {
  COMPETITOR_RANKINGS = "competitors",
  PINGPONG_RANKINGS = "pingpong",
  ARCHIVED_SEASONS = "seasons",
}

export interface TVDisplayData {
  competitorRankings: Competitor[];
  pingpongPlayers: PingpongPlayer[];
  archivedSeasons: SeasonArchive[];
}

/**
 * Every view the wall screen knows how to render.
 *
 * `ARCHIVED_SEASONS` is deliberately absent: it has a component and a title
 * but has never been in the rotation, and turning it on is a product
 * decision rather than a side effect of adding ping-pong.
 */
export const ALL_VIEWS = [
  DisplayView.COMPETITOR_RANKINGS,
  DisplayView.PINGPONG_RANKINGS,
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
  [DisplayView.COMPETITOR_RANKINGS]: "Pilotes",
  [DisplayView.PINGPONG_RANKINGS]: "Ping-pong",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons",
};

export const viewTitles: Record<DisplayView, string> = {
  [DisplayView.COMPETITOR_RANKINGS]: "Classement des pilotes",
  [DisplayView.PINGPONG_RANKINGS]: "Classement ping-pong",
  [DisplayView.ARCHIVED_SEASONS]: "Saisons archivées",
};
