import { FC } from 'react';
import { BetPosition } from '@/app/models/Bet';

interface PositionMedalProps {
  position: BetPosition;
  isCorrect?: boolean;
  isFinalized: boolean;
}

const medalConfig = {
  [BetPosition.FIRST]: {
    emoji: '\u{1F947}',
    label: '1er',
    bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-600',
    shadowColor: 'shadow-amber-500/30',
  },
  [BetPosition.SECOND]: {
    emoji: '\u{1F948}',
    label: '2\u00e8me',
    bgColor: 'bg-gradient-to-br from-gray-300 to-gray-500',
    shadowColor: 'shadow-gray-400/30',
  },
  [BetPosition.THIRD]: {
    emoji: '\u{1F949}',
    label: '3\u00e8me',
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-700',
    shadowColor: 'shadow-orange-500/30',
  },
};

const PositionMedal: FC<PositionMedalProps> = ({ position, isCorrect, isFinalized }) => {
  const config = medalConfig[position];
  const dimmed = isFinalized && !isCorrect;

  return (
    <div
      className={`
        flex items-center justify-center w-12 h-12 rounded-full
        ${config.bgColor} ${config.shadowColor} shadow-lg
        ${dimmed ? 'opacity-40 grayscale' : ''}
        transition-all duration-200
      `}
    >
      <span className="text-2xl" role="img" aria-label={config.label}>
        {config.emoji}
      </span>
    </div>
  );
};

export default PositionMedal;
