import { FC, useEffect, useState, useCallback } from 'react';
import { Achievement, AchievementRarity } from '@/app/models/Achievement';

interface AchievementToastProps {
  achievement: Achievement;
  onClose?: () => void;
  autoCloseDuration?: number;
}

/**
 * AchievementToast Component
 *
 * Displays a celebration toast when an achievement is unlocked
 * - Animated entrance/exit
 * - Confetti animation
 * - Rarity-based styling
 * - Auto-closes after duration
 */
const AchievementToast: FC<AchievementToastProps> = ({
  achievement,
  onClose,
  autoCloseDuration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const { icon, name, description, rarity, xpReward, unlocksTitle } =
    achievement;

  // Get rarity-based colors
  const getRarityColors = () => {
    switch (rarity) {
      case AchievementRarity.LEGENDARY:
        return {
          bg: 'from-purple-900/95 to-pink-900/95',
          border: 'border-purple-500',
          glow: 'shadow-2xl shadow-purple-500/50',
          text: 'text-purple-300',
          confetti: ['#a855f7', '#ec4899', '#f472b6'],
        };
      case AchievementRarity.EPIC:
        return {
          bg: 'from-orange-900/95 to-red-900/95',
          border: 'border-orange-500',
          glow: 'shadow-2xl shadow-orange-500/50',
          text: 'text-orange-300',
          confetti: ['#f97316', '#ef4444', '#fbbf24'],
        };
      case AchievementRarity.RARE:
        return {
          bg: 'from-blue-900/95 to-cyan-900/95',
          border: 'border-blue-500',
          glow: 'shadow-2xl shadow-blue-500/50',
          text: 'text-blue-300',
          confetti: ['#3b82f6', '#06b6d4', '#60a5fa'],
        };
      case AchievementRarity.COMMON:
      default:
        return {
          bg: 'from-neutral-800/95 to-neutral-900/95',
          border: 'border-neutral-600',
          glow: 'shadow-xl shadow-neutral-500/30',
          text: 'text-neutral-300',
          confetti: ['#9ca3af', '#6b7280', '#d1d5db'],
        };
    }
  };

  const colors = getRarityColors();

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  }, [onClose]);

  // Handle auto-close
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoCloseDuration, handleClose]);

  return (
    <>
      {/* Confetti Canvas */}
      <ConfettiEffect colors={colors.confetti} />

      {/* Toast */}
      <div
        className={`fixed top-20 right-6 z-50 max-w-md transition-all duration-300 ${
          isVisible && !isExiting
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }`}
      >
        <div
          className={`p-4 rounded-xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} ${colors.glow} backdrop-blur-sm`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl animate-bounce">{icon}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-success-400 mb-1">
                ✨ ACHIEVEMENT DÉBLOQUÉ !
              </div>
              <h3 className={`text-lg font-bold ${colors.text}`}>{name}</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-300 mb-3">{description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-700">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Récompense:</span>
              <span className="text-sm font-bold text-primary-400">
                +{xpReward} XP
              </span>
            </div>
            {unlocksTitle && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-neutral-400">🏆</span>
                <span className="text-warning-500 font-medium">
                  &quot;{unlocksTitle}&quot;
                </span>
              </div>
            )}
          </div>

          {/* Progress bar for auto-close */}
          <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-success-500 animate-shrink"
              style={{ animationDuration: `${autoCloseDuration}ms` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * ConfettiEffect Component
 *
 * Renders animated confetti particles
 */
const ConfettiEffect: FC<{ colors: string[] }> = ({ colors }) => {
  const [confetti, setConfetti] = useState<
    Array<{
      id: number;
      left: number;
      delay: number;
      duration: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 300,
      duration: 2000 + Math.random() * 1000,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setConfetti(particles);
  }, [colors]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute -top-10 w-2 h-2 rounded-full animate-confetti-fall"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default AchievementToast;
