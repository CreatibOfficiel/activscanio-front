"use client";

import { FC, useContext, useEffect, useState } from 'react';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { Competitor } from '@/app/models/Competitor';
import { AppContext } from '@/app/context/AppContext';
import CompetitorOddsCard from './CompetitorOddsCard';
import CompetitorDetailModal from '../competitor/CompetitorDetailModal';

interface WeekOddsPreviewProps {
  weekId: string;
}

const DEFAULT_VISIBLE = 5;

const WeekOddsPreview: FC<WeekOddsPreviewProps> = ({ weekId }) => {
  const { allCompetitors } = useContext(AppContext);
  const [odds, setOdds] = useState<CompetitorOdds[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

  const openDetail = (co: CompetitorOdds) => {
    const full = allCompetitors.find(c => c.id === co.competitorId);
    if (full) setSelectedCompetitor(full);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchOdds = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const data = await BettingRepository.getWeekOdds(weekId);
        if (!cancelled) {
          // Sort: eligible first (by oddFirst ascending = favorites first), then ineligible
          const sorted = [...data].sort((a, b) => {
            const aEligible = a.isEligible !== false;
            const bEligible = b.isEligible !== false;
            if (aEligible !== bEligible) return aEligible ? -1 : 1;
            return a.oddFirst - b.oddFirst;
          });
          setOdds(sorted);
        }
      } catch (error) {
        console.error('Error fetching week odds:', error);
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchOdds();
    return () => { cancelled = true; };
  }, [weekId]);

  // Don't render section on error
  if (hasError) return null;

  const visibleOdds = showAll ? odds : odds.slice(0, DEFAULT_VISIBLE);
  const hasMore = odds.length > DEFAULT_VISIBLE;

  return (
    <section>
      <h2 className="text-bold text-white mb-1">Cotes de la semaine</h2>
      <p className="text-xs text-neutral-400 mb-3">
        Cotes = points gagnés si le pilote finit à cette position du podium.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && odds.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-4">
          Les cotes ne sont pas encore disponibles
        </p>
      )}

      {!isLoading && odds.length > 0 && (
        <>
          <div className="space-y-4">
            {visibleOdds.map((competitorOdds) => (
              <CompetitorOddsCard
                key={competitorOdds.competitorId}
                competitorOdds={competitorOdds}
                isSelected={false}
                isBoosted={false}
                position={null}
                showBoostButton={false}
                disabled={false}
                showAllOdds={true}
                onSelect={() => openDetail(competitorOdds)}
              />
            ))}
          </div>

          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-3 py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Voir tous les competiteurs ({odds.length})
            </button>
          )}
        </>
      )}

      {selectedCompetitor && (
        <CompetitorDetailModal
          competitor={selectedCompetitor}
          isOpen={true}
          onClose={() => setSelectedCompetitor(null)}
        />
      )}
    </section>
  );
};

export default WeekOddsPreview;
