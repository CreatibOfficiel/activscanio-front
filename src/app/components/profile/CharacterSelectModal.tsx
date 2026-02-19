'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { MdClose, MdCheck, MdColorLens, MdPerson, MdArrowBack } from 'react-icons/md';
import { BaseCharacterWithAvailability, CharacterVariantWithAvailability } from '../../models/Character';
import { OnboardingRepository } from '../../repositories/OnboardingRepository';
import { Button } from '../ui';
import { toast } from 'sonner';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (variantId: string) => Promise<void>;
  currentVariantId?: string;
  authToken: string;
}

type Step = 'character' | 'variant';

const CharacterSelectModal: FC<CharacterSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentVariantId,
  authToken,
}) => {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('character');
  const [characters, setCharacters] = useState<BaseCharacterWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<BaseCharacterWithAvailability | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Mount for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load characters
  useEffect(() => {
    if (!isOpen) return;

    const loadCharacters = async () => {
      try {
        setLoading(true);
        const data = await OnboardingRepository.getAllBaseCharactersWithStatus(authToken);
        setCharacters(data);
      } catch (error) {
        console.error('Error loading characters:', error);
        toast.error('Erreur lors du chargement des personnages');
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, [isOpen, authToken]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('character');
      setSelectedCharacter(null);
      setSelectedVariantId(null);
    }
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSelectCharacter = useCallback((character: BaseCharacterWithAvailability) => {
    if (!character.hasAvailableVariants) return;

    setSelectedCharacter(character);

    const availableVariants = character.variants.filter(v => v.isAvailable);

    if (availableVariants.length === 1) {
      // Only one available variant, select it directly
      setSelectedVariantId(availableVariants[0].id);
    } else {
      // Multiple variants, go to variant selection
      setSelectedVariantId(null);
      setStep('variant');
    }
  }, []);

  const handleSelectVariant = useCallback((variant: CharacterVariantWithAvailability) => {
    if (!variant.isAvailable) return;
    setSelectedVariantId(variant.id);
  }, []);

  const handleBack = useCallback(() => {
    setStep('character');
    setSelectedVariantId(null);
  }, []);

  const handleConfirm = async () => {
    if (!selectedVariantId) return;

    // Don't allow selecting the same variant
    if (selectedVariantId === currentVariantId) {
      toast.info('C\'est déjà votre personnage actuel');
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      await onSelect(selectedVariantId);
      onClose();
    } catch (error) {
      console.error('Error selecting character:', error);
      // Error toast is handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 bg-neutral-900 sm:bg-black/50 sm:flex sm:items-center sm:justify-center animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Mobile: Full screen / Desktop: Centered modal */}
      <div className="h-full w-full sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl bg-neutral-900 sm:bg-neutral-800 sm:border sm:border-neutral-700 flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
          {step === 'variant' ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              aria-label="Retour"
            >
              <MdArrowBack className="text-xl" />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <h2 className="text-heading text-white">
            {step === 'character' ? 'Changer de personnage' : selectedCharacter?.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
            aria-label="Fermer"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
            </div>
          ) : step === 'character' ? (
            /* Character Grid */
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {characters.map((character) => {
                const availableVariants = character.variants.filter(v => v.isAvailable);
                const hasAvailable = character.hasAvailableVariants;
                const isSelected = selectedCharacter?.id === character.id;
                const hasMultipleAvailableVariants = availableVariants.length > 1;
                const takenVariant = character.variants.find(v => !v.isAvailable && v.takenBy);
                // Check if this character contains the current variant
                const isCurrent = currentVariantId && character.variants.some(v => v.id === currentVariantId);

                return (
                  <button
                    key={character.id}
                    type="button"
                    disabled={!hasAvailable}
                    onClick={() => handleSelectCharacter(character)}
                    className={`
                      p-3 rounded-xl border transition-all duration-200 text-center relative
                      ${!hasAvailable
                        ? 'opacity-50 cursor-not-allowed border-neutral-700 bg-neutral-800/50'
                        : isCurrent
                          ? 'border-primary-500/50 bg-primary-500/5'
                          : isSelected
                            ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500'
                            : 'border-neutral-700 bg-neutral-800 hover:border-primary-500 hover:bg-primary-500/5'
                      }
                    `}
                  >
                    {/* Current badge */}
                    {isCurrent && (
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary-500 rounded text-[10px] font-medium text-white">
                        Actuel
                      </div>
                    )}
                    {/* Character image */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2">
                      <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-neutral-700 ${!hasAvailable ? 'grayscale' : ''}`}>
                        {character.imageUrl ? (
                          <Image
                            src={character.imageUrl}
                            alt={character.name}
                            width={64}
                            height={64}
                            className={`w-full h-full object-contain ${!hasAvailable ? 'opacity-50' : ''}`}
                          />
                        ) : (
                          <span className="text-2xl">🎮</span>
                        )}
                      </div>
                      {/* Badge for taken character */}
                      {!hasAvailable && takenVariant?.takenBy && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-neutral-800 overflow-hidden bg-neutral-700">
                          {takenVariant.takenBy.profilePictureUrl ? (
                            <Image
                              src={takenVariant.takenBy.profilePictureUrl}
                              alt={takenVariant.takenBy.firstName}
                              className="w-full h-full object-cover"
                              width={24}
                              height={24}
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MdPerson className="text-neutral-400 text-xs" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className={`text-sm font-medium truncate ${!hasAvailable ? 'text-neutral-500' : 'text-white'}`}>
                      {character.name}
                    </p>

                    {!hasAvailable && takenVariant?.takenBy ? (
                      <p className="text-xs text-neutral-500 truncate">
                        {takenVariant.takenBy.firstName}
                      </p>
                    ) : hasAvailable && hasMultipleAvailableVariants ? (
                      <p className="text-xs text-neutral-400 flex items-center justify-center gap-1">
                        <MdColorLens className="text-xs" />
                        {availableVariants.length}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Variant Grid */
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {selectedCharacter?.variants.map((variant) => {
                const isAvailable = variant.isAvailable;
                const isSelected = selectedVariantId === variant.id;
                const isCurrent = variant.id === currentVariantId;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectVariant(variant)}
                    className={`
                      p-3 rounded-xl border transition-all duration-200 text-center relative
                      ${!isAvailable
                        ? 'opacity-50 cursor-not-allowed border-neutral-700 bg-neutral-800/50'
                        : isSelected
                          ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500'
                          : 'border-neutral-700 bg-neutral-800 hover:border-primary-500 hover:bg-primary-500/5'
                      }
                    `}
                  >
                    {/* Current badge */}
                    {isCurrent && (
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary-500 rounded text-[10px] font-medium text-white">
                        Actuel
                      </div>
                    )}

                    {/* Variant image */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                      <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-neutral-700 ${!isAvailable ? 'grayscale' : ''}`}>
                        {variant.imageUrl ? (
                          <Image
                            src={variant.imageUrl}
                            alt={`${selectedCharacter.name} ${variant.label}`}
                            width={56}
                            height={56}
                            className={`w-full h-full object-contain ${!isAvailable ? 'opacity-50' : ''}`}
                          />
                        ) : (
                          <span className="text-xl">🎨</span>
                        )}
                      </div>
                      {/* Badge for taken variant */}
                      {!isAvailable && variant.takenBy && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-neutral-800 overflow-hidden bg-neutral-700">
                          {variant.takenBy.profilePictureUrl ? (
                            <Image
                              src={variant.takenBy.profilePictureUrl}
                              alt={variant.takenBy.firstName}
                              className="w-full h-full object-cover"
                              width={20}
                              height={20}
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MdPerson className="text-neutral-400 text-[10px]" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className={`text-sm font-medium ${!isAvailable ? 'text-neutral-500' : 'text-white'}`}>
                      {variant.label}
                    </p>

                    {!isAvailable && variant.takenBy && (
                      <p className="text-xs text-neutral-500 truncate">
                        {variant.takenBy.firstName}
                      </p>
                    )}

                    {isSelected && isAvailable && (
                      <div className="mt-1 flex items-center justify-center text-primary-400 text-xs gap-0.5">
                        <MdCheck className="text-xs" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with confirm button */}
        {selectedVariantId && (
          <div className="p-4 border-t border-neutral-700 flex-shrink-0">
            <Button
              variant="primary"
              onClick={handleConfirm}
              loading={submitting}
              disabled={submitting}
              className="w-full"
            >
              Confirmer
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default CharacterSelectModal;
