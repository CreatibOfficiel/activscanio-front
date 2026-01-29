"use client";

import { FC, useState, useMemo } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { Input } from '@/app/components/ui';
import { MdSearch, MdClose } from 'react-icons/md';
import CompetitorOddsCard from './CompetitorOddsCard';

interface PodiumCompetitorListProps {
  competitors: CompetitorOdds[];
  selection: Partial<Record<BetPosition, string>>;
  boostedCompetitorId?: string;
  canBoost: boolean;
  disabled: boolean;
  onSelectCompetitor: (competitorId: string) => void;
  onBoost: (competitorId: string) => void;
}

const PodiumCompetitorList: FC<PodiumCompetitorListProps> = ({
  competitors,
  selection,
  boostedCompetitorId,
  canBoost,
  disabled,
  onSelectCompetitor,
  onBoost,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompetitors = useMemo(() => {
    if (!searchQuery.trim()) {
      return competitors;
    }
    const query = searchQuery.toLowerCase().trim();
    return competitors.filter((c) => {
      const name = c.competitorName?.toLowerCase() || '';
      const firstName = c.competitor?.firstName?.toLowerCase() || '';
      const lastName = c.competitor?.lastName?.toLowerCase() || '';
      return name.includes(query) || firstName.includes(query) || lastName.includes(query);
    });
  }, [competitors, searchQuery]);
  const isCompetitorSelected = (competitorId: string): boolean => {
    return Object.values(selection).includes(competitorId);
  };

  const getCompetitorPosition = (
    competitorId: string
  ): BetPosition | null => {
    for (const [position, id] of Object.entries(selection)) {
      if (id === competitorId) {
        return position as BetPosition;
      }
    }
    return null;
  };

  if (competitors.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-bold text-white mb-3">
        Compétiteurs éligibles ({competitors.length})
      </h3>

      {/* Search bar */}
      <div className="sticky top-0 bg-neutral-900 pb-3 z-10">
        <div className="relative">
          <Input
            type="search"
            placeholder="Rechercher un compétiteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<MdSearch className="text-lg" />}
            rightIcon={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-white transition-colors pointer-events-auto"
                  aria-label="Effacer la recherche"
                >
                  <MdClose className="text-lg" />
                </button>
              ) : undefined
            }
            ariaLabel="Rechercher un compétiteur"
          />
        </div>
        {searchQuery && (
          <p className="text-sub text-neutral-400 mt-2">
            {filteredCompetitors.length} résultat{filteredCompetitors.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {filteredCompetitors.map((competitor) => {
          const isSelected = isCompetitorSelected(competitor.competitorId);
          const position = getCompetitorPosition(competitor.competitorId);
          const isBoosted = boostedCompetitorId === competitor.competitorId;

          return (
            <CompetitorOddsCard
              key={competitor.competitorId}
              competitorOdds={competitor}
              isSelected={isSelected}
              isBoosted={isBoosted}
              position={position}
              onSelect={() => onSelectCompetitor(competitor.competitorId)}
              onBoost={() => onBoost(competitor.competitorId)}
              showBoostButton={canBoost}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PodiumCompetitorList;
