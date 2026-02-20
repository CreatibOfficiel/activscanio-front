'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { BetResultPayload } from '@/app/types/bet-result';

interface BetResultModalProps {
  data: BetResultPayload;
  onClose: () => void;
}

const POSITION_LABELS: Record<string, string> = {
  first: '1er',
  second: '2e',
  third: '3e',
};

function CountUp({ end, duration = 1200 }: { end: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (end <= 0) return;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end * 100) / 100);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <>{value.toFixed(value % 1 === 0 ? 0 : 1)}</>;
}

export default function BetResultModal({ data, onClose }: BetResultModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [visiblePicks, setVisiblePicks] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isWinner = data.status === 'won';

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Staggered entrance animation
  useEffect(() => {
    if (!mounted) return;
    const t1 = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t1);
  }, [mounted]);

  // Stagger picks
  useEffect(() => {
    if (!showContent) return;
    const timers: NodeJS.Timeout[] = [];
    data.picks.forEach((_, i) => {
      timers.push(setTimeout(() => setVisiblePicks(i + 1), 600 + i * 150));
    });
    timers.push(setTimeout(() => setShowPoints(true), 600 + data.picks.length * 150 + 200));
    timers.push(setTimeout(() => setShowCta(true), 1500));
    return () => timers.forEach(clearTimeout);
  }, [showContent, data.picks]);

  // Sound
  useEffect(() => {
    if (!showContent) return;
    const delay = isWinner ? 300 : 600;
    const soundFile = isWinner ? '/sounds/bet-win.mp3' : '/sounds/bet-loss.mp3';
    const timer = setTimeout(() => {
      try {
        audioRef.current = new Audio(soundFile);
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      } catch {}
    }, delay);
    return () => clearTimeout(timer);
  }, [showContent, isWinner]);

  // Confetti for winners
  const fireConfetti = useCallback(() => {
    if (!isWinner) return;

    const colors = ['#f59e0b', '#22c55e', '#3b82f6', '#fbbf24'];
    const extra = data.isPerfectPodium;

    // Fireworks burst
    confetti({
      particleCount: extra ? 150 : 80,
      spread: extra ? 100 : 70,
      origin: { y: 0.5, x: 0.5 },
      colors,
      startVelocity: 45,
      gravity: 0.8,
    });

    if (extra) {
      // Extra side bursts for perfect podium
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
      }, 400);
    }
  }, [isWinner, data.isPerfectPodium]);

  useEffect(() => {
    if (showContent && isWinner) {
      const t = setTimeout(fireConfetti, 200);
      return () => clearTimeout(t);
    }
  }, [showContent, isWinner, fireConfetti]);

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div
        className={`
          relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl
          transition-all duration-350 ease-out
          ${showContent ? 'scale-100 opacity-100' : 'scale-[0.85] opacity-0'}
          ${isWinner
            ? 'bg-gradient-to-b from-neutral-800 to-neutral-900 border border-amber-500/30'
            : 'bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700'
          }
        `}
      >
        {/* Top accent bar */}
        {isWinner && (
          <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        )}

        <div className="p-6 text-center">
          {/* Icon */}
          <div
            className={`
              text-5xl mb-3
              ${showContent ? 'animate-bounce-once' : 'opacity-0'}
            `}
            style={{ animationDelay: '100ms' }}
          >
            {isWinner ? (data.isPerfectPodium ? '🏆' : '🎯') : '📊'}
          </div>

          {/* Title */}
          <h2
            className={`
              text-xl font-bold mb-1
              ${isWinner ? 'text-amber-400' : 'text-neutral-300'}
            `}
          >
            {isWinner
              ? data.isPerfectPodium
                ? 'Podium Parfait !'
                : 'Bien joué !'
              : 'Résultats du prono'
            }
          </h2>

          <p className="text-sm text-neutral-400 mb-5">
            {isWinner
              ? `${data.correctPicks}/${data.totalPicks} pronostics corrects`
              : 'Aucun pronostic correct cette semaine'
            }
          </p>

          {/* Picks recap */}
          <div className="space-y-2 mb-5">
            {data.picks.map((pick, i) => (
              <div
                key={i}
                className={`
                  flex items-center justify-between p-3 rounded-xl transition-all duration-300
                  ${i < visiblePicks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                  ${pick.isCorrect
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-neutral-700/30 border border-neutral-700/50'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Position + result icon */}
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                    ${pick.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-neutral-600/30 text-neutral-500'}
                  `}>
                    {pick.isCorrect ? '✓' : '✗'}
                  </div>

                  <div className="text-left min-w-0">
                    <p className={`text-sm font-medium truncate ${pick.isCorrect ? 'text-neutral-100' : 'text-neutral-400'}`}>
                      {pick.competitorName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {POSITION_LABELS[pick.position] || pick.position}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Badges */}
                  {pick.hasBoost && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      x2
                    </span>
                  )}
                  {pick.usedBogOdd && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      BOG
                    </span>
                  )}

                  {/* Points */}
                  <span className={`text-sm font-semibold ${pick.isCorrect ? 'text-green-400' : 'text-neutral-500'}`}>
                    {pick.isCorrect ? `+${pick.pointsEarned.toFixed(1)}` : '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Points total */}
          <div className={`
            transition-all duration-500
            ${showPoints ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}>
            {isWinner ? (
              <>
                <p className={`
                  text-3xl font-bold text-amber-400 mb-1
                  ${showPoints ? 'animate-glow' : ''}
                `}>
                  +<CountUp end={data.pointsEarned} /> pts
                </p>
                {data.isPerfectPodium && (
                  <p className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    Bonus podium parfait x2 inclus !
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg text-neutral-500 font-medium mb-1">0 point cette semaine</p>
                <p className="text-sm text-neutral-400">
                  La prochaine sera la bonne !
                </p>
              </>
            )}
          </div>

          {/* CTA */}
          <div className={`
            mt-6 transition-all duration-500
            ${showCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}>
            {isWinner ? (
              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-neutral-900 transition-colors"
              >
                Voir mon classement
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-colors"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
