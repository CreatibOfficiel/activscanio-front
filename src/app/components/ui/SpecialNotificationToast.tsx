'use client';

import { FC } from 'react';

export type SpecialType = 'strike' | 'spare' | 'turkey' | 'winstreak';

interface SpecialNotificationToastProps {
  type: SpecialType;
  competitorName: string;
  details: string;
  onClose: () => void;
}

export const SpecialNotificationToast: FC<SpecialNotificationToastProps> = ({
  type,
  competitorName,
  details,
  onClose,
}) => {
  const config = {
    strike: {
      icon: '🎳',
      title: 'STRIKE !',
      color: 'from-yellow-500 to-orange-500',
      emoji: '⚡💥✨',
    },
    spare: {
      icon: '🎯',
      title: 'SPARE !',
      color: 'from-blue-500 to-cyan-500',
      emoji: '🔥💫⭐',
    },
    turkey: {
      icon: '🦃',
      title: 'TURKEY !!!',
      color: 'from-purple-500 to-pink-500',
      emoji: '🔥🔥🔥',
    },
    winstreak: {
      icon: '🏆',
      title: 'WIN STREAK !',
      color: 'from-green-500 to-emerald-500',
      emoji: '🎉🎊✨',
    },
  };

  const { icon, title, color, emoji } = config[type];

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${color} p-[2px]`}>
      <div className="bg-neutral-900 rounded-lg p-6">
        {/* Animation confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="confetti-animation text-4xl">
            {emoji.split('').map((e, i) => (
              <span key={i} className="confetti-piece" style={{ animationDelay: `${i * 0.1}s` }}>
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-6xl animate-bounce">{icon}</span>
            <div>
              <h3 className="text-2xl font-black tracking-wider mb-1">{title}</h3>
              <p className="text-lg font-bold text-neutral-300">{competitorName}</p>
            </div>
          </div>

          <p className="text-neutral-400 mb-4">{details}</p>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
