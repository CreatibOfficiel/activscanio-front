"use client";

import { FC, useState, useMemo } from 'react';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { BetPosition } from '@/app/models/Bet';
import { Input } from '@/app/components/ui';
import { MdSearch, MdClose } from 'react-icons/md';
import PodiumHeader from './PodiumHeader';
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

  const selectedCount = Object.keys(selection).length;
  const isComplete = selectedCount === 3;
  const canBoost = isComplete && !boostedCompetitorId && boostAvailable;

  return (
    <div className="space-y-4">
      {/* PodiumHeader - scrolls away */}
      <PodiumHeader
        selectedCount={selectedCount}
        isComplete={isComplete}
        currentPosition={currentPosition}
        selection={selection}
        disabled={disabled}
        onChangePosition={handleChangePosition}
        onReset={handleReset}
      />

      {/* Full PodiumSummary - scrolls away */}
      <PodiumSummary
        selection={selection}
        competitors={competitors}
        boostedCompetitorId={boostedCompetitorId}
        canBoost={canBoost}
      />

      {/* Sticky header: compact summary + search */}
      <div className="sticky top-0 z-20 bg-neutral-900 -mx-4 px-4 py-3 border-b border-neutral-800">
        {/* Compact summary pills */}
        <PodiumSummary
          selection={selection}
          competitors={competitors}
          boostedCompetitorId={boostedCompetitorId}
          canBoost={canBoost}
          compact
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
