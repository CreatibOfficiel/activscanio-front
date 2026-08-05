"use client";

import { FC, RefObject, useMemo } from "react";
import Image from "next/image";
import TVHeroPodium from "./TVHeroPodium";
import TVLeaderboardRow from "./TVLeaderboardRow";
import TVHeroCountdown from "./TVHeroCountdown";
import { Competitor } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";
import { LeagueDivider } from "@/app/components/leaderboard";
import { useLeaderboardSegmentation } from "@/app/hooks/useLeaderboardSegmentation";
import { getRaceSeasonEndDate } from "../utils/deadlines";
import { useViewEntry } from "../utils/useViewEntry";

const SEGMENTATION_OPTIONS = { excludePodiumFromLeagues: true };

interface Props {
  rankings: Competitor[];
  scrollRef?: RefObject<HTMLDivElement | null>;
  /**
   * The page's rotation counter. Changes only when this board comes on
   * screen, which is the one moment the entry animation belongs to. Omit
   * it to animate on every mount, as before.
   */
  viewEntryKey?: number;
}

export const CompetitorRankingsView: FC<Props> = ({ rankings, scrollRef, viewEntryKey }) => {
  const raceSeasonEndDate = useMemo(() => getRaceSeasonEndDate(), []);
  const isViewEntry = useViewEntry(viewEntryKey);

  const {
    confirmed, inactive, calibrating, maxScore,
    confirmedRanks, inactiveRanks, calibratingRanks,
    topThree: top3, leagueGroups,
  } = useLeaderboardSegmentation(rankings, SEGMENTATION_OPTIONS);

  // Display formatting for the hero podium: names, subtitles and score labels
  // are presentation concerns, so they stay out of the shared segmentation.
  const podiumItems = useMemo(
    () =>
      top3.map((competitor) => {
        const avgRank = competitor.avgRank12
          ? `Pos. moy. ${competitor.avgRank12.toFixed(1)}`
          : null;
        const races = `${competitor.raceCount || 0} course${(competitor.raceCount || 0) !== 1 ? "s" : ""}`;

        return {
          id: competitor.id,
          name: formatCompetitorName(competitor.firstName, competitor.lastName),
          imageUrl: competitor.profilePictureUrl,
          characterImageUrl: competitor.characterVariant?.imageUrl,
          score: Math.round(competitor.conservativeScore ?? 0),
          scoreLabel: "ELO",
          subtitle: avgRank ? `${avgRank} · ${races}` : races,
          rank: confirmedRanks.get(competitor.id) ?? 1,
        };
      }),
    [top3, confirmedRanks],
  );

  // Real trend based on previousDayRank snapshot
  const getTrend = (
    competitor: Competitor,
    currentRank: number
  ): { direction: "up" | "down" | "stable" | undefined; value?: number } => {
    if (competitor.previousDayRank == null) return { direction: undefined };
    const change = competitor.previousDayRank - currentRank;
    if (change > 0) return { direction: "up", value: change };
    if (change < 0) return { direction: "down", value: Math.abs(change) };
    return { direction: "stable" };
  };

  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-tv-heading text-neutral-400">
          Aucun pilote trouvé
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-8 max-w-[1800px] mx-auto w-full h-full overflow-hidden">
      {/* LEFT COLUMN: Hero Zone (Fixed, centered) */}
      <div className="w-[45%] flex flex-col items-center justify-center shrink-0">

        {/* Countdown */}
        <div className="mb-4 w-full max-w-[90%]">
          <TVHeroCountdown
            targetDate={raceSeasonEndDate}
          />
        </div>

        {/* Confirmed: Podium Top 3 (Always visible or self-animating) */}
        {top3.length >= 3 ? (
          <div className="w-full">
            <TVHeroPodium items={podiumItems} />
          </div>
        ) : top3.length > 0 && (
          <div className="space-y-3 w-full max-w-md mt-6">
            {top3.map((competitor, index) => {
              const rank = confirmedRanks.get(competitor.id) ?? index + 1;
              const trend = getTrend(competitor, rank);
              return (
                <TVLeaderboardRow
                  key={competitor.id}
                  item={{
                    id: competitor.id,
                    rank,
                    name: formatCompetitorName(competitor.firstName, competitor.lastName),
                    imageUrl: competitor.profilePictureUrl,
                    characterImageUrl: competitor.characterVariant?.imageUrl,
                    score: Math.round(competitor.conservativeScore ?? 0),
                    scoreLabel: "ELO",
                    subtitle: competitor.characterVariant
                      ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                      : `${competitor.raceCount || 0} courses`,
                    trend: trend.direction,
                    trendValue: trend.value,
                    maxScore,
                  }}
                  animationDelay={index * 80}
                  disableEntryAnimation={!isViewEntry}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Peloton Zone (Independent scroll, centered when short) */}
      <div ref={scrollRef} className="w-[55%] overflow-y-auto scrollbar-hide flex flex-col">
        <div className="my-auto">
        <h2 className="text-3xl font-black italic text-cyan-400 mb-6 text-center drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          Peloton
        </h2>

        <div className="space-y-8">
          {/* Confirmed: league sections after podium */}
          {leagueGroups.map((group) => (
            <div key={group.league.id} className="space-y-3 w-full">
              <LeagueDivider league={group.league} variant="tv" />
              {group.items.map((competitor, index) => {
                const rank = confirmedRanks.get(competitor.id) ?? index + 4;
                const trend = getTrend(competitor, rank);
                return (
                  <TVLeaderboardRow
                    key={competitor.id}
                    item={{
                      id: competitor.id,
                      rank,
                      name: formatCompetitorName(competitor.firstName, competitor.lastName),
                      imageUrl: competitor.profilePictureUrl,
                      characterImageUrl: competitor.characterVariant?.imageUrl,
                      score: Math.round(competitor.conservativeScore ?? 0),
                      scoreLabel: "ELO",
                      subtitle: competitor.characterVariant
                        ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                        : `${competitor.raceCount || 0} courses`,
                      trend: trend.direction,
                      trendValue: trend.value,
                      maxScore,
                    }}
                    animationDelay={index * 80}
                    disableEntryAnimation={!isViewEntry}
                  />
                );
              })}
            </div>
          ))}

          {/* Inactive confirmed section */}
          {inactive.length > 0 && (
            <div className="space-y-4 w-full pt-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <Image
                      src="/mk-icons/bob-omb.webp"
                      alt="Inactive"
                      fill
                      className="object-contain"
                    />
                  </div>
                  Inactifs
                </h3>
                <div className="h-px flex-1 bg-neutral-700" />
              </div>
              {/* Desaturated, not dimmed: `opacity-50` here put the row
                  subtitle at 2.50:1, under the 4.5:1 floor. See
                  `.tv-row-muted` in globals.css. */}
              <div className="space-y-3 tv-row-muted">
                {inactive.map((competitor, index) => {
                  const rank = inactiveRanks.get(competitor.id) ?? confirmed.length + index + 1;
                  const trend = getTrend(competitor, rank);
                  return (
                    <TVLeaderboardRow
                      key={competitor.id}
                      item={{
                        id: competitor.id,
                        rank,
                        name: formatCompetitorName(competitor.firstName, competitor.lastName),
                        imageUrl: competitor.profilePictureUrl,
                        characterImageUrl: competitor.characterVariant?.imageUrl,
                        score: Math.round(competitor.conservativeScore ?? 0),
                        scoreLabel: "ELO",
                        subtitle: competitor.characterVariant
                          ? `${competitor.characterVariant.baseCharacter.name} - ${competitor.characterVariant.label}`
                          : `${competitor.raceCount || 0} courses`,
                        trend: trend.direction,
                        trendValue: trend.value,
                        maxScore,
                      }}
                      animationDelay={index * 80}
                      disableEntryAnimation={!isViewEntry}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* No confirmed players message */}
          {confirmed.length === 0 && (
            <div className="text-center py-8">
              <p className="text-tv-body text-neutral-400">
                Aucun pilote confirmé pour le moment
              </p>
            </div>
          )}

          {/* Calibrating section */}
          {calibrating.length > 0 && (
            <div className="space-y-4 w-full pt-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-500 uppercase tracking-wider">
                  En calibrage
                </h3>
                <div className="h-px flex-1 bg-neutral-700" />
              </div>
              <div className="space-y-3">
                {calibrating.map((competitor, index) => {
                  const rank = calibratingRanks.get(competitor.id) ?? confirmed.length + index + 1;
                  const trend = getTrend(competitor, rank);
                  return (
                    <TVLeaderboardRow
                      key={competitor.id}
                      item={{
                        id: competitor.id,
                        rank,
                        name: formatCompetitorName(competitor.firstName, competitor.lastName),
                        imageUrl: competitor.profilePictureUrl,
                        characterImageUrl: competitor.characterVariant?.imageUrl,
                        score: Math.round(competitor.conservativeScore ?? 0),
                        scoreLabel: "ELO",
                        subtitle: `${competitor.raceCount || 0}/5 courses`,
                        trend: trend.direction,
                        trendValue: trend.value,
                        maxScore,
                      }}
                      animationDelay={index * 80}
                      disableEntryAnimation={!isViewEntry}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
