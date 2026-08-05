"use client";

import { FC, RefObject } from 'react';
import { Card } from '@/app/components/ui';
import { SeasonArchive } from '@/app/repositories/SeasonsRepository';

interface Props {
  seasons: SeasonArchive[];
  scrollRef?: RefObject<HTMLDivElement | null>;
}

export const ArchivedSeasonsView: FC<Props> = ({ seasons, scrollRef }) => {
  if (!seasons || seasons.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-heading text-neutral-400">Aucune saison archivée</p>
      </div>
    );
  }

  // Trier par année et mois décroissants (plus récent en premier)
  const sortedSeasons = [...seasons].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Afficher les 12 dernières saisons pour la TV
  const recentSeasons = sortedSeasons.slice(0, 12);

  return (
    <div ref={scrollRef} className="overflow-y-auto scrollbar-hide h-full">
      <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {recentSeasons.map((season) => (
          <Card key={season.id} className="p-3 hover:border-primary-500 transition-colors">
            <div className="mb-2">
              <h3 className="text-base font-bold text-white mb-0.5">
                {monthNames[season.month - 1]} {season.year}
              </h3>
              <p className="text-[10px] text-neutral-400 truncate">{season.seasonName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] text-neutral-400">
                  {season.totalCompetitors === 1 ? "Pilote" : "Pilotes"}
                </p>
                <p className="text-xs font-bold text-primary-500">{season.totalCompetitors}</p>
              </div>
              {/* Ping-pong replaces the bettors/bets tiles. Those read the
                  archive's totalBettors/totalBets, which the API has written
                  as 0 on every season since the betting system was deleted —
                  two of the four numbers on the card were permanently wrong.

                  Rendered only when the archive carries the fields at all.
                  They are optional because seasons archived before ping-pong
                  existed have neither column, and `?? 0` would print a
                  confident "0 joueurs" for a season where the sport did not
                  exist yet. A present zero is a fact worth showing (the sport
                  was there, nobody played); an absent one is not a zero. */}
              {season.totalPingpongPlayers !== undefined && (
                <div>
                  <p className="text-[9px] text-neutral-400">
                    {season.totalPingpongPlayers === 1 ? "Joueur ping-pong" : "Joueurs ping-pong"}
                  </p>
                  <p className="text-xs font-bold text-primary-500">{season.totalPingpongPlayers}</p>
                </div>
              )}
              <div>
                <p className="text-[9px] text-neutral-400">
                  Course{season.totalRaces > 1 ? 's' : ''}
                </p>
                <p className="text-xs font-bold text-white">{season.totalRaces}</p>
              </div>
              {season.totalPingpongMatches !== undefined && (
                <div>
                  <p className="text-[9px] text-neutral-400">
                    {season.totalPingpongMatches === 1 ? "Match ping-pong" : "Matchs ping-pong"}
                  </p>
                  <p className="text-xs font-bold text-white">{season.totalPingpongMatches}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {seasons.length > 12 && (
        <p className="text-center text-sub text-neutral-400 mt-6">
          Et {seasons.length - 12} autre{seasons.length - 12 > 1 ? 's' : ''} saison{seasons.length - 12 > 1 ? 's' : ''}...
        </p>
      )}
      </div>
    </div>
  );
};
