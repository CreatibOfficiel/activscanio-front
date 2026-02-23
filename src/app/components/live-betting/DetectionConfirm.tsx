"use client";

import { FC, useState, useEffect, useCallback } from 'react';
import { DetectedCharacter } from '@/app/models/LiveBet';
import { Card, Button, Badge } from '@/app/components/ui';
import { MdCheck, MdClose, MdTimer } from 'react-icons/md';

interface DetectionConfirmProps {
  detectedCharacters: DetectedCharacter[];
  detectionExpiresAt: string;
  onConfirm: (competitorIds: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DetectionConfirm: FC<DetectionConfirmProps> = ({
  detectedCharacters,
  detectionExpiresAt,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    detectedCharacters
      .filter((c) => c.competitorId)
      .map((c) => c.competitorId!),
  );
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(
        0,
        Math.floor(
          (new Date(detectionExpiresAt).getTime() - Date.now()) / 1000,
        ),
      );
      setRemainingSeconds(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [detectionExpiresAt]);

  // Auto-confirm when timer reaches 0
  useEffect(() => {
    if (remainingSeconds === 0 && selectedIds.length >= 2) {
      onConfirm(selectedIds);
    }
  }, [remainingSeconds, selectedIds, onConfirm]);

  const toggleCompetitor = useCallback(
    (competitorId: string) => {
      setSelectedIds((prev) =>
        prev.includes(competitorId)
          ? prev.filter((id) => id !== competitorId)
          : [...prev, competitorId],
      );
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-bold text-white">Joueurs détectés</h3>
        <div className="flex items-center gap-1.5 text-warning-400">
          <MdTimer className="text-lg" />
          <span className="text-sm font-mono font-bold">{remainingSeconds}s</span>
        </div>
      </div>

      <div className="space-y-2">
        {detectedCharacters.map((char, i) => (
          <Card
            key={i}
            className={`p-3 cursor-pointer transition-colors ${
              char.competitorId && selectedIds.includes(char.competitorId)
                ? 'border-primary-500 bg-primary-500/5'
                : 'border-neutral-700'
            } ${!char.competitorId ? 'opacity-50' : ''}`}
            onClick={() => char.competitorId && toggleCompetitor(char.competitorId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {char.characterName}
                </span>
                <Badge
                  variant={char.confidence >= 0.8 ? 'success' : char.confidence >= 0.6 ? 'warning' : 'error'}
                  size="sm"
                >
                  {Math.round(char.confidence * 100)}%
                </Badge>
              </div>
              {char.competitorId && selectedIds.includes(char.competitorId) ? (
                <MdCheck className="text-primary-400 text-lg" />
              ) : (
                <MdClose className="text-neutral-600 text-lg" />
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedIds.length < 2 && (
        <p className="text-xs text-warning-400">
          Au moins 2 joueurs doivent être sélectionnés
        </p>
      )}

      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => onConfirm(selectedIds)}
          disabled={selectedIds.length < 2 || isLoading}
        >
          Confirmer
        </Button>
      </div>
    </div>
  );
};

export default DetectionConfirm;
