"use client";

import { FC } from 'react';
import { CompetitorOdds } from '@/app/models/CompetitorOdds';
import { Card } from '@/app/components/ui';
import { formatOdds, formatCompetitorName } from '@/app/utils/formatters';
import { MdEmojiEvents } from 'react-icons/md';

interface LiveCompetitorPickerProps {
  competitors: CompetitorOdds[];
  selectedId: string | null;
  onSelect: (competitorId: string) => void;
}

const LiveCompetitorPicker: FC<LiveCompetitorPickerProps> = ({
  competitors,
  selectedId,
  onSelect,
}) => {
  // Sort by oddFirst ascending (favorites first)
  const sorted = [...competitors]
    .filter((c) => c.isEligible !== false)
    .sort((a, b) => a.oddFirst - b.oddFirst);

  return (
    <div className="space-y-2">
      <h3 className="text-bold text-white mb-2">Qui va gagner ?</h3>
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((comp) => {
          const isSelected = selectedId === comp.competitorId;
          const name = comp.competitor
            ? formatCompetitorName(comp.competitor.firstName, comp.competitor.lastName)
            : comp.competitorName ?? `#${comp.competitorId.slice(0, 8)}`;

          return (
            <Card
              key={comp.competitorId}
              className={`p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500'
                  : 'border-neutral-700 hover:border-neutral-600'
              }`}
              onClick={() => onSelect(comp.competitorId)}
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                  isSelected ? 'bg-primary-500 text-white' : 'bg-neutral-700 text-neutral-300'
                }`}>
                  {name.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <span className="text-sm font-medium text-white truncate w-full">
                  {name}
                </span>

                {/* Odd */}
                <div className="flex items-center gap-1">
                  <MdEmojiEvents className="text-xs text-yellow-400" />
                  <span className={`text-sm font-bold ${
                    isSelected ? 'text-primary-400' : 'text-yellow-400'
                  }`}>
                    {formatOdds(comp.oddFirst)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LiveCompetitorPicker;
