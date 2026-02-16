"use client";

import { FC, useState, useMemo } from 'react';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { BetPosition } from '@/app/models/Bet';
import { Input } from '@/app/components/ui';
import { MdSearch, MdClose } from 'react-icons/md';
import PodiumSummary from './PodiumSummary';
import PodiumCompetitorList from './PodiumCompetitorList';
import PodiumEmptyState from './PodiumEmptyState';

interface PodiumSelection {
  [BetPosition.FIRST]?: string;
  [BetPosition.SECOND]?: string;
  [BetPosition.THIRD]?: string;
}

interface PodiumSelectorProps {
  competitors: CompetitorOdds[];
  onSelectionChange: (selection: PodiumSelection, boostedCompetitorId?: string) => void;
  disabled?: boolean;
  boostAvailable?: boolean;
}

const PodiumSelector: FC<PodiumSelectorProps> = ({
  competitors,
  onSelectionChange,
  disabled = false,
  boostAvailable = true,
}) => {
  const [selection, setSelection] = useState<PodiumSelection>({});
  const [boostedCompetitorId, setBoostedCompetitorId] = useState<string | undefined>();
  const [currentPosition, setCurrentPosition] = useState<BetPosition>(BetPosition.FIRST);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter competitors based on search
  // Sort by odds ascending (favorites first), then filter by search
  const sortedCompetitors = useMemo(() => {
    return [...competitors].sort((a, b) => (a.oddFirst ?? a.odd) - (b.oddFirst ?? b.odd));
  }, [competitors]);

  const filteredCompetitors = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedCompetitors;
    }
    const query = searchQuery.toLowerCase().trim();
    return sortedCompetitors.filter((c) => {
      const name = c.competitorName?.toLowerCase() || '';
      const firstName = c.competitor?.firstName?.toLowerCase() || '';
      const lastName = c.competitor?.lastName?.toLowerCase() || '';
      return name.includes(query) || firstName.includes(query) || lastName.includes(query);
    });
  }, [sortedCompetitors, searchQuery]);

  const handleSelectCompetitor = (competitorId: string) => {
    if (disabled) return;

    // Check if competitor is already selected in another position
    const existingPosition = Object.entries(selection).find(
      ([, id]) => id === competitorId
    )?.[0] as BetPosition | undefined;

    // If already selected in the same position, do nothing
    if (existingPosition === currentPosition) return;

    // If already selected in another position, remove from that position first
    const newSelection = { ...selection };
    if (existingPosition) {
      delete newSelection[existingPosition];
    }

    // Check if we're replacing a competitor that had the boost
    const replacedCompetitorId = selection[currentPosition];
    let newBoostedId = boostedCompetitorId;
    if (replacedCompetitorId && boostedCompetitorId === replacedCompetitorId) {
      // The boosted competitor is being replaced, remove the boost
      newBoostedId = undefined;
      setBoostedCompetitorId(undefined);
    }

    // Set the new selection
    newSelection[currentPosition] = competitorId;
    setSelection(newSelection);

    // Move to next empty position (or stay if all filled)
    const positions = [BetPosition.FIRST, BetPosition.SECOND, BetPosition.THIRD];
    const nextEmptyPosition = positions.find((pos) => !newSelection[pos]);
    if (nextEmptyPosition) {
      setCurrentPosition(nextEmptyPosition);
    }

    onSelectionChange(newSelection, newBoostedId);
  };

  const handleBoost = (competitorId: string) => {
    if (disabled) return;
    setBoostedCompetitorId(competitorId);
    onSelectionChange(selection, competitorId);
  };

  const handleReset = () => {
    if (disabled) return;
    setSelection({});
    setBoostedCompetitorId(undefined);
    setCurrentPosition(BetPosition.FIRST);
    onSelectionChange({}, undefined);
  };

  const handleChangePosition = (position: BetPosition) => {
    if (disabled) return;
    setCurrentPosition(position);
  };

  const selectedCount = Object.values(selection).filter(Boolean).length;
  const isComplete = selectedCount === 3;
  const canBoost = isComplete && !boostedCompetitorId && boostAvailable;

  // Dynamic status text
  const getStatusText = (): string => {
    if (selectedCount === 0) return 'Choisissez le 1er du podium';
    if (selectedCount === 1) return '1/3 — Choisissez le 2ème';
    if (selectedCount === 2) return '2/3 — Choisissez le 3ème';
    if (isComplete && canBoost) return 'Podium complet ! Boost x2 disponible';
    return 'Podium complet !';
  };

  return (
    <div className="space-y-4">
      {/* Sticky header: context line + pills + search */}
      <div className="sticky top-0 z-20 backdrop-blur-sm bg-neutral-900/95 -mx-4 px-4 py-3 border-b border-neutral-800">
        {/* Context line */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sub text-neutral-400" role="status" aria-live="polite">
            {getStatusText()}
          </span>
          {selectedCount > 0 && (
            <button
              onClick={handleReset}
              disabled={disabled}
              className="text-sub text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Compact summary pills */}
        <PodiumSummary
          selection={selection}
          competitors={competitors}
          boostedCompetitorId={boostedCompetitorId}
          currentPosition={currentPosition}
          onChangePosition={handleChangePosition}
        />

        {/* Search bar */}
        <div className="mt-3">
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
      </div>

      {/* Competitor list */}
      {competitors.length > 0 ? (
        <PodiumCompetitorList
          competitors={competitors}
          filteredCompetitors={filteredCompetitors}
          selection={selection}
          boostedCompetitorId={boostedCompetitorId}
          canBoost={canBoost}
          disabled={disabled}
          onSelectCompetitor={handleSelectCompetitor}
          onBoost={handleBoost}
          searchQuery={searchQuery}
        />
      ) : (
        <PodiumEmptyState />
      )}
    </div>
  );
};

export default PodiumSelector;
