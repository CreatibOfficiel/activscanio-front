'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { StreakLossPayload } from '@/app/types/bet-result';

interface StreakLostModalProps {
  losses: StreakLossPayload[];
  onClose: () => void;
}

export default function StreakLostModal({ losses, onClose }: StreakLostModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const bettingLoss = losses.find((l) => l.type === 'betting');
  const playLoss = losses.find((l) => l.type === 'play');
  const isMultiple = losses.length > 1;

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, [mounted]);

  // Sound
  useEffect(() => {
    if (!showContent) return;
    const timer = setTimeout(() => {
      try {
        audioRef.current = new Audio('/sounds/bet-loss.mp3');
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(() => {});
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [showContent]);

  const handleBet = () => {
    onClose();
    router.push('/betting');
  };

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div
        className={`
          relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl
          bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700
          transition-all duration-350 ease-out
          ${showContent ? 'scale-100 opacity-100' : 'scale-[0.85] opacity-0'}
        `}
      >
        <div className="p-6 text-center">
          {/* Flame icon with extinction animation */}
          <div
            className={`
              text-5xl mb-3 inline-block
              ${showContent ? 'animate-flame-out' : 'opacity-0'}
            `}
          >
            🔥
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-neutral-200 mb-1">
            {isMultiple ? 'Tes séries sont brisées' : 'Ta série est brisée'}
          </h2>
          <p className="text-sm text-neutral-400 mb-5">
            {isMultiple
              ? 'Tu as perdu tes flammes de paris et de jeu'
              : bettingLoss
                ? 'Ta flamme de paris s\'est éteinte'
                : 'Ta série de jeu s\'est arrêtée'
            }
          </p>

          {/* Loss cards */}
          <div className="space-y-3 mb-5">
            {bettingLoss && (
              <div className="p-4 rounded-xl bg-neutral-700/30 border border-neutral-700/50 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg opacity-50">🔥</span>
                  <span className="text-sm font-semibold text-neutral-200">Flamme de paris</span>
                </div>
                <p className="text-sm text-neutral-400">
                  Tu étais sur une série de <span className="font-bold text-amber-400">{bettingLoss.lostValue}</span> semaines — impressionnant !
                </p>
              </div>
            )}

            {playLoss && (
              <div className="p-4 rounded-xl bg-neutral-700/30 border border-neutral-700/50 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg opacity-50">🎮</span>
                  <span className="text-sm font-semibold text-neutral-200">Série de jeu</span>
                </div>
                <p className="text-sm text-neutral-400">
                  <span className="font-bold text-amber-400">{playLoss.lostValue}</span> jours consécutifs — tu peux recommencer maintenant !
                </p>
              </div>
            )}
          </div>

          {/* Encouraging message */}
          <p className="text-sm text-neutral-400 mb-6">
            Les plus grandes séries commencent par une seule semaine. Reviens en force !
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleBet}
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-neutral-900 transition-colors"
            >
              Placer mon prono
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-6 rounded-xl font-semibold text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-400 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
