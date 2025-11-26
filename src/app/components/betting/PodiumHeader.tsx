"use client";

import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';
import { Card, Badge } from '@/app/components/ui';

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
  const positionLabels = {
    [BetPosition.FIRST]: 'Sélectionnez le 1er',
    [BetPosition.SECOND]: 'Sélectionnez le 2ème',
    [BetPosition.THIRD]: 'Sélectionnez le 3ème',
  };

  return (
    <Card variant="primary" className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-white">Composez votre podium</h2>
          <p className="text-sub text-neutral-300 mt-1">
            {isComplete
              ? 'Podium complet ! Choisissez un boost x2 (optionnel)'
              : positionLabels[currentPosition]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="lg">
            {selectedCount}/3
          </Badge>
          {isComplete && (
            <Badge variant="success" size="lg">
              ✓ Complet
            </Badge>
          )}
        </div>
      </div>

      {/* Position selectors */}
      {selectedCount > 0 && (
        <div className="flex gap-2 mt-4">
          {[BetPosition.FIRST, BetPosition.SECOND, BetPosition.THIRD].map((pos) => (
            <button
              key={pos}
              onClick={() => onChangePosition(pos)}
              disabled={disabled || !selection[pos]}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                currentPosition === pos
                  ? 'bg-primary-500 text-neutral-900'
                  : selection[pos]
                    ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {pos === BetPosition.FIRST
                ? '1er'
                : pos === BetPosition.SECOND
                  ? '2ème'
                  : '3ème'}
            </button>
          ))}
        </div>
      )}

      {/* Reset button */}
      {selectedCount > 0 && (
        <button
          onClick={onReset}
          disabled={disabled}
          className="w-full mt-4 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </Card>
  );
};

export default PodiumHeader;
