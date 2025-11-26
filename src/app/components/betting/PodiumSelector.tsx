"use client";

import { FC, useState } from 'react';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { BetPosition } from '@/app/models/Bet';
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

  const handleSelectCompetitor = (competitorId: string) => {
    if (disabled) return;

    // Check if competitor is already selected in another position
    const isAlreadySelected = Object.values(selection).includes(competitorId);
    if (isAlreadySelected) return;

    const newSelection = {
      ...selection,
      [currentPosition]: competitorId,
    };

    setSelection(newSelection);

    // Move to next position
    if (currentPosition === BetPosition.FIRST) {
      setCurrentPosition(BetPosition.SECOND);
    } else if (currentPosition === BetPosition.SECOND) {
      setCurrentPosition(BetPosition.THIRD);
    }

    onSelectionChange(newSelection, boostedCompetitorId);
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
    <div className="space-y-6">
      <PodiumHeader
        selectedCount={selectedCount}
        isComplete={isComplete}
        currentPosition={currentPosition}
        selection={selection}
        disabled={disabled}
        onChangePosition={handleChangePosition}
        onReset={handleReset}
      />

      <PodiumSummary
        selection={selection}
        competitors={competitors}
        boostedCompetitorId={boostedCompetitorId}
        canBoost={canBoost}
      />

      {competitors.length > 0 ? (
        <PodiumCompetitorList
          competitors={competitors}
          selection={selection}
          boostedCompetitorId={boostedCompetitorId}
          canBoost={canBoost}
          disabled={disabled}
          isComplete={isComplete}
          onSelectCompetitor={handleSelectCompetitor}
          onBoost={handleBoost}
        />
      ) : (
        <PodiumEmptyState />
      )}
    </div>
  );
};

export default PodiumSelector;
