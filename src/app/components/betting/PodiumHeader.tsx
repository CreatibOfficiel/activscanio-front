"use client";

import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { Card } from '@/app/components/ui';

interface PodiumHeaderProps {
  selectedCount: number;
  isComplete: boolean;
  currentPosition: BetPosition;
  selection: Partial<Record<BetPosition, string>>;
  disabled: boolean;
  onChangePosition: (position: BetPosition) => void;
  onReset: () => void;
}

const PodiumHeader: FC<PodiumHeaderProps> = ({
  selectedCount,
  isComplete,
  currentPosition,
  selection,
  disabled,
  onChangePosition,
  onReset,
}) => {
  const positions = [BetPosition.FIRST, BetPosition.SECOND, BetPosition.THIRD];

  const getPositionIcon = (pos: BetPosition) => {
    switch (pos) {
      case BetPosition.FIRST:
        return '🥇';
      case BetPosition.SECOND:
        return '🥈';
      case BetPosition.THIRD:
        return '🥉';
    }
  };

  const getPositionLabel = (pos: BetPosition) => {
    switch (pos) {
      case BetPosition.FIRST:
        return '1er';
      case BetPosition.SECOND:
        return '2ème';
      case BetPosition.THIRD:
        return '3ème';
    }
  };

  return (
    <Card className="p-4">
      {/* Title and progress */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-bold text-white text-lg">Sélectionnez votre podium</h2>

        {/* Progress indicator */}
        <div className="flex items-center gap-1.5">
          {positions.map((pos) => (
            <div
              key={pos}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                selection[pos] ? 'bg-primary-500' : 'bg-neutral-700'
              }`}
              aria-label={selection[pos] ? `Position ${getPositionLabel(pos)} sélectionnée` : `Position ${getPositionLabel(pos)} non sélectionnée`}
            />
          ))}
        </div>
      </div>

      {/* Status message */}
      <p className="text-regular text-neutral-300 mb-4">
        {isComplete
          ? 'Podium complet ! Appliquez un boost x2 (optionnel)'
          : `Choisissez le ${getPositionLabel(currentPosition)} du podium`}
      </p>

      {/* Position tabs */}
      <div className="flex gap-2">
        {positions.map((pos) => {
          const isSelected = selection[pos] !== undefined;
          const isCurrent = currentPosition === pos;

          return (
            <button
              key={pos}
              onClick={() => onChangePosition(pos)}
              disabled={disabled}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg
                text-sm font-semibold transition-all
                ${isCurrent
                  ? 'bg-primary-500 text-neutral-900 ring-2 ring-primary-400 ring-offset-2 ring-offset-neutral-800'
                  : isSelected
                    ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-750 hover:text-neutral-300'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-pressed={isCurrent}
              aria-label={`Sélectionner position ${getPositionLabel(pos)}${isSelected ? ' (déjà choisi)' : ''}`}
            >
              <span>{getPositionIcon(pos)}</span>
              <span>{getPositionLabel(pos)}</span>
            </button>
          );
        })}
      </div>

      {/* Reset button */}
      {selectedCount > 0 && (
        <button
          onClick={onReset}
          disabled={disabled}
          className="w-full mt-4 px-4 py-2 text-neutral-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          Réinitialiser la sélection
        </button>
      )}
    </Card>
  );
};

export default PodiumHeader;
