"use client";

import { FC, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { OnboardingRepository } from '@/app/repositories/OnboardingRepository';
import { CompetitorWithAvailability } from '@/app/models/Competitor';
import { BaseCharacterWithAvailability, CharacterVariantWithAvailability } from '@/app/models/Character';
import { Card, Button, Input } from '@/app/components/ui';
import { toast } from 'sonner';
import { MdSearch, MdPerson, MdPersonAdd, MdArrowBack, MdCheck, MdSportsEsports, MdColorLens, MdLock } from 'react-icons/md';
import Image from 'next/image';
import { useDebounce } from '@/app/hooks/useDebounce';

enum OnboardingStep {
  ROLE_SELECTION = 'role',
  COMPETITOR_SEARCH = 'search',
  CHARACTER_SELECT = 'character',
  VARIANT_SELECT = 'variant',
  CREATE_COMPETITOR = 'create',
}

const OnboardingPage: FC = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.ROLE_SELECTION);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wantsToPlay, setWantsToPlay] = useState(false);
  const [wantsToBet, setWantsToBet] = useState(false);
  const isBettorOnly = wantsToBet && !wantsToPlay;

  // Search state for competitors
  const [searchQuery, setSearchQuery] = useState('');
  const [allCompetitors, setAllCompetitors] = useState<CompetitorWithAvailability[]>([]);
  const [filteredCompetitors, setFilteredCompetitors] = useState<CompetitorWithAvailability[]>([]);
  const [suggestedCompetitor, setSuggestedCompetitor] = useState<CompetitorWithAvailability | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorWithAvailability | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Create competitor state
  const [newCompetitorFirstName, setNewCompetitorFirstName] = useState('');
  const [newCompetitorLastName, setNewCompetitorLastName] = useState('');

  // Character selection state
  const [baseCharacters, setBaseCharacters] = useState<BaseCharacterWithAvailability[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<BaseCharacterWithAvailability[]>([]);
  const [characterSearchQuery, setCharacterSearchQuery] = useState('');
  const [selectedBaseCharacter, setSelectedBaseCharacter] = useState<BaseCharacterWithAvailability | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const debouncedCharacterSearch = useDebounce(characterSearchQuery, 300);

  // Ref to preserve scroll position when navigating between character and variant selection
  const characterListRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);

  // Load base characters with availability status on mount
  useEffect(() => {
    const loadBaseCharacters = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const characters = await OnboardingRepository.getAllBaseCharactersWithStatus(token);
        setBaseCharacters(characters);
        setFilteredCharacters(characters);
      } catch (error) {
        console.error('Error loading base characters:', error);
        toast.error('Erreur lors du chargement des personnages');
      }
    };

    loadBaseCharacters();
  }, [getToken]);

  // Load all competitors when entering search step
  useEffect(() => {
    const loadAllCompetitors = async () => {
      if (step !== OnboardingStep.COMPETITOR_SEARCH) return;
      if (allCompetitors.length > 0) return;

      try {
        setIsLoading(true);
        const token = await getToken();
        if (!token) return;

        const results = await OnboardingRepository.searchCompetitors('', token);
        setAllCompetitors(results);
        setFilteredCompetitors(results);

        // Pre-select competitor matching user's first name (only if available)
        if (user?.firstName) {
          const match = results.find(
            (c) => c.firstName.toLowerCase() === user.firstName?.toLowerCase() && c.isAvailable
          );
          if (match) {
            setSuggestedCompetitor(match);
            setSelectedCompetitor(match);
            toast.success(`${match.firstName} ${match.lastName} pré-sélectionné !`);
          }
        }
      } catch (error) {
        console.error('Error loading competitors:', error);
        toast.error('Erreur lors du chargement des compétiteurs');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllCompetitors();
  }, [step, getToken, user?.firstName, allCompetitors.length]);

  // Filter competitors locally based on search query
  useEffect(() => {
    if (debouncedSearchQuery.length === 0) {
      setFilteredCompetitors(allCompetitors);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const filtered = allCompetitors.filter(
      (c) =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query)
    );
    setFilteredCompetitors(filtered);
  }, [debouncedSearchQuery, allCompetitors]);

  // Filter characters locally based on search query
  useEffect(() => {
    if (debouncedCharacterSearch.length === 0) {
      setFilteredCharacters(baseCharacters);
      return;
    }

    const query = debouncedCharacterSearch.toLowerCase();
    const filtered = baseCharacters.filter((c) =>
      c.name.toLowerCase().includes(query)
    );
    setFilteredCharacters(filtered);
  }, [debouncedCharacterSearch, baseCharacters]);

  // Check if a variant is selectable (available OR belongs to the selected competitor)
  const isVariantSelectable = useCallback((variant: CharacterVariantWithAvailability) => {
    if (variant.isAvailable) return true;
    if (selectedCompetitor && variant.takenBy?.competitorId === selectedCompetitor.id) return true;
    return false;
  }, [selectedCompetitor]);

  // Select base character and handle variants
  const handleSelectBaseCharacter = useCallback((character: BaseCharacterWithAvailability) => {
    // Get variants selectable by this user (available + own)
    const selectableVariants = character.variants.filter(isVariantSelectable);

    // Don't allow selection if no variants are selectable
    if (selectableVariants.length === 0) {
      return;
    }

    setSelectedBaseCharacter(character);

    // If only one selectable variant, select it automatically and skip variant step
    if (selectableVariants.length === 1) {
      setSelectedVariantId(selectableVariants[0].id);
      // Don't change step, just show confirmation
    } else if (selectableVariants.length > 1) {
      // Save scroll position before navigating to variant selection
      if (characterListRef.current) {
        savedScrollPosition.current = characterListRef.current.scrollTop;
      }
      // Multiple variants, go to variant selection
      setSelectedVariantId(null);
      setStep(OnboardingStep.VARIANT_SELECT);
    }
  }, [isVariantSelectable]);

  // Select variant
  const handleSelectVariant = useCallback((variant: CharacterVariantWithAvailability) => {
    // Don't allow selection if variant is taken by someone else
    if (!isVariantSelectable(variant)) {
      return;
    }
    setSelectedVariantId(variant.id);
  }, [isVariantSelectable]);

  // Select existing competitor and move to next step
  const handleSelectCompetitor = async (competitor: CompetitorWithAvailability) => {
    // Don't allow selection if competitor is already linked to another user
    if (!competitor.isAvailable) {
      return;
    }
    setSelectedCompetitor(competitor);

    if (isBettorOnly) {
      // Bettor path: complete onboarding directly with competitor link
      try {
        setIsSubmitting(true);
        const token = await getToken();
        if (!token) throw new Error('Token non disponible');

        await OnboardingRepository.completeOnboarding(
          { isSpectator: true, existingCompetitorId: competitor.id },
          token
        );
        toast.success('Bienvenue ! Vous pouvez maintenant parier sur les courses !');
        router.push('/');
      } catch (error) {
        console.error('Error completing onboarding as bettor:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du profil';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // If competitor already has a character variant, pre-select it
      if (competitor.characterVariant) {
        const baseChar = baseCharacters.find(
          (bc) => bc.id === competitor.characterVariant!.baseCharacter.id
        );
        if (baseChar) {
          setSelectedBaseCharacter(baseChar);
        }
        setSelectedVariantId(competitor.characterVariant.id);
      }
      setStep(OnboardingStep.CHARACTER_SELECT);
    }
  };

  // Move to create competitor step
  const handleCreateNewCompetitor = () => {
    setStep(OnboardingStep.CREATE_COMPETITOR);
  };

  // Go back handlers
  const handleBackToSearch = () => {
    setStep(OnboardingStep.COMPETITOR_SEARCH);
    setSelectedCompetitor(null);
    setNewCompetitorFirstName('');
    setNewCompetitorLastName('');
  };

  const handleBackToRoleSelection = () => {
    setStep(OnboardingStep.ROLE_SELECTION);
    setWantsToPlay(false);
    setWantsToBet(false);
    setSelectedCompetitor(null);
    setNewCompetitorFirstName('');
    setNewCompetitorLastName('');
    setSelectedVariantId(null);
    setSelectedBaseCharacter(null);
  };

  const handleBackToCharacterSelect = useCallback(() => {
    setStep(OnboardingStep.CHARACTER_SELECT);
    setSelectedVariantId(null);
    // Restore scroll position after render
    requestAnimationFrame(() => {
      if (characterListRef.current) {
        characterListRef.current.scrollTop = savedScrollPosition.current;
      }
    });
  }, []);

  // Validate name format
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  // Move from create form to character selection (or complete for bettors)
  const handleProceedToCharacterSelect = async () => {
    const firstName = newCompetitorFirstName.trim();
    const lastName = newCompetitorLastName.trim();

    if (!firstName || !lastName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!validateName(firstName)) {
      toast.error('Le prénom doit contenir 2-50 caractères (lettres, espaces, tirets et apostrophes uniquement)');
      return;
    }

    if (!validateName(lastName)) {
      toast.error('Le nom doit contenir 2-50 caractères (lettres, espaces, tirets et apostrophes uniquement)');
      return;
    }

    if (isBettorOnly) {
      // Bettor path: complete onboarding directly with new competitor
      try {
        setIsSubmitting(true);
        const token = await getToken();
        if (!token) throw new Error('Token non disponible');

        await OnboardingRepository.completeOnboarding(
          {
            isSpectator: true,
            newCompetitor: {
              firstName,
              lastName,
              profilePictureUrl: user?.imageUrl || '',
            },
          },
          token
        );
        toast.success('Bienvenue ! Vous pouvez maintenant parier sur les courses !');
        router.push('/');
      } catch (error) {
        console.error('Error completing onboarding as bettor:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du profil';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep(OnboardingStep.CHARACTER_SELECT);
    }
  };

  // Complete onboarding
  const handleComplete = async () => {
    if (!selectedVariantId) {
      toast.error('Veuillez sélectionner un personnage');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Token non disponible');
      }

      const dto = {
        characterVariantId: selectedVariantId,
        ...(selectedCompetitor
          ? { existingCompetitorId: selectedCompetitor.id }
          : {
              newCompetitor: {
                firstName: newCompetitorFirstName.trim(),
                lastName: newCompetitorLastName.trim(),
                profilePictureUrl: user?.imageUrl || '',
              },
            }),
      };

      await OnboardingRepository.completeOnboarding(dto, token);
      toast.success('Profil créé avec succès ! Bienvenue dans la compétition ! 🎉');
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du profil';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current step number for progress indicator
  const stepNumber = useMemo(() => {
    if (isBettorOnly) {
      switch (step) {
        case OnboardingStep.ROLE_SELECTION: return 1;
        case OnboardingStep.COMPETITOR_SEARCH:
        case OnboardingStep.CREATE_COMPETITOR: return 2;
        default: return 1;
      }
    }
    switch (step) {
      case OnboardingStep.ROLE_SELECTION: return 1;
      case OnboardingStep.COMPETITOR_SEARCH:
      case OnboardingStep.CREATE_COMPETITOR: return 2;
      case OnboardingStep.CHARACTER_SELECT: return 3;
      case OnboardingStep.VARIANT_SELECT: return 4;
      default: return 1;
    }
  }, [step, isBettorOnly]);

  const selectableVariantsCount = selectedBaseCharacter?.variants.filter(isVariantSelectable).length ?? 0;
  const totalSteps = isBettorOnly ? 2 : (selectedBaseCharacter && selectableVariantsCount > 1 ? 4 : 3);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-title mb-2">Bienvenue {user?.firstName} !</h1>
          <p className="text-regular text-neutral-300">
            {isBettorOnly
              ? 'Identifiez-vous pour commencer à parier'
              : 'Créez votre profil de compétiteur pour participer aux courses'}
          </p>

          {/* Progress indicator */}
          {step !== OnboardingStep.ROLE_SELECTION && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-12 rounded-full transition-all duration-300 ${
                    i + 1 <= stepNumber ? 'bg-primary-500' : 'bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Step: Role Selection */}
        {step === OnboardingStep.ROLE_SELECTION && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-6">
              <h2 className="text-heading text-white mb-4">Comment voulez-vous participer ?</h2>
              <p className="text-sub text-neutral-300 mb-6">
                Sélectionnez une ou plusieurs options
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* Option Joueur */}
                <Card
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    wantsToPlay
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'hover:border-neutral-600 hover:bg-neutral-800'
                  }`}
                  onClick={() => setWantsToPlay(!wantsToPlay)}
                  role="checkbox"
                  aria-checked={wantsToPlay}
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && setWantsToPlay(!wantsToPlay)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl shrink-0">🎮</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-bold text-white">Je joue</h3>
                      <p className="text-sub text-neutral-400">
                        Participer aux courses
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                      wantsToPlay
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-neutral-600'
                    }`}>
                      {wantsToPlay && <MdCheck className="text-white text-sm" />}
                    </div>
                  </div>
                </Card>

                {/* Option Parieur */}
                <Card
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    wantsToBet
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'hover:border-neutral-600 hover:bg-neutral-800'
                  }`}
                  onClick={() => setWantsToBet(!wantsToBet)}
                  role="checkbox"
                  aria-checked={wantsToBet}
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && setWantsToBet(!wantsToBet)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl shrink-0">🎲</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-bold text-white">Je parie</h3>
                      <p className="text-sub text-neutral-400">
                        Miser sur les résultats
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                      wantsToBet
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-neutral-600'
                    }`}>
                      {wantsToBet && <MdCheck className="text-white text-sm" />}
                    </div>
                  </div>
                </Card>
              </div>

              <Button
                variant="primary"
                fullWidth
                className="mt-6"
                disabled={!wantsToPlay && !wantsToBet}
                onClick={() => setStep(OnboardingStep.COMPETITOR_SEARCH)}
              >
                Continuer
              </Button>
            </Card>
          </div>
        )}

        {/* Step: Competitor Search */}
        {step === OnboardingStep.COMPETITOR_SEARCH && (
          <div className="space-y-6 animate-slideUp">
            <Card className="p-6">
              <h2 className="text-heading text-white mb-4">
                {isBettorOnly ? 'Qui êtes-vous ?' : 'Trouver votre profil'}
              </h2>
              <p className="text-sub text-neutral-300 mb-4">
                {isBettorOnly
                  ? 'Sélectionnez votre profil pour que les autres sachent qui parie'
                  : 'Sélectionnez votre profil dans la liste ci-dessous'}
              </p>

              {/* Search filter */}
              <div className="relative mb-4">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Filtrer les compétiteurs par nom"
                />
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              )}

              {/* Competitors list */}
              {!isLoading && filteredCompetitors.length > 0 && (
                <div
                  className="space-y-2 mb-4 max-h-80 overflow-y-auto scrollbar-hide pr-1"
                  role="list"
                  aria-label="Liste des compétiteurs"
                >
                  {/* Suggested competitor at top (based on first name match) */}
                  {suggestedCompetitor && (
                    <>
                      <p className="text-sub text-primary-400 mb-2 flex items-center gap-1">
                        <MdCheck className="text-sm" />
                        Suggestion basée sur votre prénom
                      </p>
                      <Card
                        key={`suggested-${suggestedCompetitor.id}`}
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          selectedCompetitor?.id === suggestedCompetitor.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'hover:border-primary-500 hover:bg-primary-500/5'
                        }`}
                        onClick={() => setSelectedCompetitor(suggestedCompetitor)}
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Suggestion: ${suggestedCompetitor.firstName} ${suggestedCompetitor.lastName}`}
                        aria-selected={selectedCompetitor?.id === suggestedCompetitor.id}
                      >
                        <div className="flex items-center gap-3">
                          {suggestedCompetitor.profilePictureUrl ? (
                            <img
                              src={suggestedCompetitor.profilePictureUrl}
                              alt={`${suggestedCompetitor.firstName} ${suggestedCompetitor.lastName}`}
                              className={`w-12 h-12 rounded-full object-cover ${
                                selectedCompetitor?.id === suggestedCompetitor.id ? 'ring-2 ring-primary-500' : ''
                              }`}
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              selectedCompetitor?.id === suggestedCompetitor.id
                                ? 'bg-primary-500/20 ring-2 ring-primary-500'
                                : 'bg-neutral-700'
                            }`}>
                              <MdPerson className={`text-2xl ${
                                selectedCompetitor?.id === suggestedCompetitor.id ? 'text-primary-400' : 'text-neutral-400'
                              }`} aria-hidden="true" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-bold text-white">
                              {suggestedCompetitor.firstName} {suggestedCompetitor.lastName}
                            </p>
                            {suggestedCompetitor.characterVariant && (
                              <p className="text-sub text-neutral-400">
                                {suggestedCompetitor.characterVariant.baseCharacter.name} - {suggestedCompetitor.characterVariant.label}
                              </p>
                            )}
                          </div>
                          {selectedCompetitor?.id === suggestedCompetitor.id && (
                            <div className="text-primary-500 text-xl">
                              <MdCheck />
                            </div>
                          )}
                        </div>
                      </Card>
                      <div className="border-t border-neutral-700 my-3 pt-2">
                        <p className="text-sub text-neutral-500">Autres compétiteurs</p>
                      </div>
                    </>
                  )}

                  {/* Other competitors */}
                  {filteredCompetitors
                    .filter((c) => c.id !== suggestedCompetitor?.id)
                    .map((competitor) => {
                      const isSelected = selectedCompetitor?.id === competitor.id;
                      const isAvailable = competitor.isAvailable;
                      return (
                        <Card
                          key={competitor.id}
                          className={`p-4 transition-all duration-200 ${
                            !isAvailable
                              ? 'opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'border-primary-500 bg-primary-500/10 cursor-pointer'
                                : 'hover:border-primary-500 hover:bg-primary-500/5 cursor-pointer'
                          }`}
                          onClick={() => isAvailable && setSelectedCompetitor(competitor)}
                          role="listitem"
                          tabIndex={isAvailable ? 0 : -1}
                          onKeyPress={(e) => e.key === 'Enter' && isAvailable && setSelectedCompetitor(competitor)}
                          aria-label={`${competitor.firstName} ${competitor.lastName}${!isAvailable ? ' (déjà lié à un compte)' : ''}`}
                          aria-selected={isSelected}
                          aria-disabled={!isAvailable}
                        >
                          <div className="flex items-center gap-3">
                            {competitor.profilePictureUrl ? (
                              <img
                                src={competitor.profilePictureUrl}
                                alt={`${competitor.firstName} ${competitor.lastName}`}
                                className={`w-12 h-12 rounded-full object-cover ${
                                  !isAvailable ? 'grayscale' : isSelected ? 'ring-2 ring-primary-500' : ''
                                }`}
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                !isAvailable
                                  ? 'bg-neutral-700'
                                  : isSelected
                                    ? 'bg-primary-500/20 ring-2 ring-primary-500'
                                    : 'bg-neutral-700'
                              }`}>
                                <MdPerson className={`text-2xl ${
                                  !isAvailable ? 'text-neutral-500' : isSelected ? 'text-primary-400' : 'text-neutral-400'
                                }`} aria-hidden="true" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-bold truncate ${!isAvailable ? 'text-neutral-500' : 'text-white'}`}>
                                {competitor.firstName} {competitor.lastName}
                              </p>
                              {!isAvailable ? (
                                <p className="text-sub text-neutral-500">
                                  Déjà lié à un compte
                                </p>
                              ) : competitor.characterVariant ? (
                                <p className="text-sub text-neutral-400">
                                  {competitor.characterVariant.baseCharacter.name} - {competitor.characterVariant.label}
                                </p>
                              ) : null}
                            </div>
                            {!isAvailable ? (
                              <div className="text-neutral-500 text-lg">
                                <MdLock />
                              </div>
                            ) : isSelected ? (
                              <div className="text-primary-500 text-xl">
                                <MdCheck />
                              </div>
                            ) : null}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}

              {/* No results */}
              {!isLoading && filteredCompetitors.length === 0 && allCompetitors.length > 0 && (
                <p className="text-center text-neutral-400 py-4">
                  Aucun compétiteur trouvé pour &quot;{searchQuery}&quot;
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 border-t border-neutral-700 pt-4">
                {selectedCompetitor && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleSelectCompetitor(selectedCompetitor)}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isBettorOnly ? 'Terminer' : 'Continuer'} avec {selectedCompetitor.firstName}
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleBackToRoleSelection}
                    className="flex items-center gap-1"
                  >
                    <MdArrowBack />
                    Retour
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="secondary"
                    onClick={handleCreateNewCompetitor}
                    className="flex items-center gap-1"
                  >
                    <MdPersonAdd className="text-xl" />
                    Créer un profil
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step: Create Competitor */}
        {step === OnboardingStep.CREATE_COMPETITOR && (
          <div className="space-y-6 animate-slideUp">
            <Card className="p-6">
              <h2 className="text-heading text-white mb-4 flex items-center gap-2">
                <MdPersonAdd className="text-xl text-primary-500" />
                Nouveau profil
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sub text-neutral-300 mb-2">
                    Prénom
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Mario"
                    value={newCompetitorFirstName}
                    onChange={(e) => setNewCompetitorFirstName(e.target.value)}
                    aria-label="Prénom du compétiteur"
                    aria-required="true"
                    minLength={2}
                    maxLength={50}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sub text-neutral-300 mb-2">
                    Nom
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Bros"
                    value={newCompetitorLastName}
                    onChange={(e) => setNewCompetitorLastName(e.target.value)}
                    aria-label="Nom du compétiteur"
                    aria-required="true"
                    minLength={2}
                    maxLength={50}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={handleBackToSearch} className="flex items-center gap-1">
                    <MdArrowBack />
                    Retour
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="primary"
                    onClick={handleProceedToCharacterSelect}
                    loading={isSubmitting}
                    disabled={!newCompetitorFirstName.trim() || !newCompetitorLastName.trim() || isSubmitting}
                  >
                    {isBettorOnly ? 'Terminer' : 'Continuer'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step: Character Selection */}
        {step === OnboardingStep.CHARACTER_SELECT && (
          <div className="space-y-6 animate-slideUp">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-heading text-white flex items-center gap-2">
                    <MdSportsEsports className="text-xl text-primary-500" />
                    Choisir votre personnage
                  </h2>
                  <p className="text-sub text-neutral-400 mt-1">
                    {selectedCompetitor
                      ? `Profil: ${selectedCompetitor.firstName} ${selectedCompetitor.lastName}`
                      : `Nouveau profil: ${newCompetitorFirstName} ${newCompetitorLastName}`}
                  </p>
                </div>
              </div>

              {/* Info banner when competitor already has a character */}
              {selectedCompetitor?.characterVariant && selectedVariantId && (
                <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                  <p className="text-sub text-primary-300">
                    Personnage actuel pré-sélectionné : <span className="text-bold text-primary-400">{selectedCompetitor.characterVariant.baseCharacter.name} - {selectedCompetitor.characterVariant.label}</span>. Vous pouvez le garder ou en choisir un autre.
                  </p>
                </div>
              )}

              {/* Search filter for characters */}
              <div className="relative mb-4">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un personnage..."
                  value={characterSearchQuery}
                  onChange={(e) => setCharacterSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Rechercher un personnage"
                />
              </div>

              {/* Character grid */}
              <div
                ref={characterListRef}
                className="max-h-96 overflow-y-auto scrollbar-hide pr-1"
                role="listbox"
                aria-label="Liste des personnages"
              >
                {filteredCharacters.length === 0 ? (
                  <p className="text-center text-neutral-400 py-8">
                    {characterSearchQuery
                      ? `Aucun personnage trouvé pour "${characterSearchQuery}"`
                      : 'Aucun personnage disponible'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredCharacters.map((character) => {
                      const isSelected = selectedBaseCharacter?.id === character.id;
                      const selectableVariants = character.variants.filter(isVariantSelectable);
                      const hasAvailable = selectableVariants.length > 0;
                      const hasMultipleAvailableVariants = selectableVariants.length > 1;

                      // Find first person who took a variant (for display when all taken)
                      const takenVariant = character.variants.find(v => !v.isAvailable && v.takenBy);

                      return (
                        <Card
                          key={character.id}
                          className={`p-3 transition-all duration-200 ${
                            !hasAvailable
                              ? 'opacity-60 cursor-not-allowed'
                              : 'cursor-pointer hover:border-primary-500 hover:bg-primary-500/5'
                          } ${
                            isSelected ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500' : ''
                          }`}
                          onClick={() => hasAvailable && handleSelectBaseCharacter(character)}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={!hasAvailable}
                          tabIndex={hasAvailable ? 0 : -1}
                          onKeyPress={(e) => e.key === 'Enter' && hasAvailable && handleSelectBaseCharacter(character)}
                          aria-label={`${character.name}${!hasAvailable ? ' (indisponible)' : hasMultipleAvailableVariants ? ` (${selectableVariants.length} couleurs disponibles)` : ''}`}
                        >
                          <div className="text-center">
                            {/* Character image with taken badge */}
                            <div className={`relative w-16 h-16 mx-auto mb-2`}>
                              <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${
                                isSelected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-800' : 'bg-neutral-700'
                              } ${!hasAvailable ? 'grayscale' : ''}`}>
                                {character.imageUrl ? (
                                  <Image
                                    src={character.imageUrl}
                                    alt={character.name}
                                    width={64}
                                    height={64}
                                    className={`w-full h-full object-contain ${!hasAvailable ? 'opacity-50' : ''}`}
                                  />
                                ) : (
                                  <span className="text-3xl">🎮</span>
                                )}
                              </div>
                              {/* Badge showing who took it (when all variants are taken) */}
                              {!hasAvailable && takenVariant?.takenBy && (
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-neutral-800 overflow-hidden bg-neutral-700">
                                  {takenVariant.takenBy.profilePictureUrl ? (
                                    <img
                                      src={takenVariant.takenBy.profilePictureUrl}
                                      alt={takenVariant.takenBy.firstName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <MdPerson className="text-neutral-400 text-sm" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className={`text-bold text-sm mb-0.5 truncate ${
                              !hasAvailable ? 'text-neutral-500' : isSelected ? 'text-primary-400' : 'text-white'
                            }`}>
                              {character.name}
                            </p>
                            {/* Show "Taken by [Name]" when all variants are taken */}
                            {!hasAvailable && takenVariant?.takenBy && (
                              <p className="text-sub text-xs text-neutral-500">
                                Pris par {takenVariant.takenBy.firstName}
                              </p>
                            )}
                            {/* Show available variants count */}
                            {hasAvailable && hasMultipleAvailableVariants && (
                              <p className="text-sub text-xs text-neutral-500 flex items-center justify-center gap-1">
                                <MdColorLens className="text-xs" />
                                {selectableVariants.length} couleurs
                              </p>
                            )}
                            {isSelected && !hasMultipleAvailableVariants && (
                              <div className="mt-1 flex items-center justify-center text-primary-400 text-sub text-xs gap-1">
                                <MdCheck className="text-xs" />
                                Sélectionné
                              </div>
                            )}
                            {isSelected && hasMultipleAvailableVariants && (
                              <div className="mt-1 text-primary-400 text-sub text-xs">
                                Choisir couleur →
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-neutral-700 pt-4 mt-4">
                <Button
                  variant="ghost"
                  onClick={selectedCompetitor ? handleBackToSearch : handleBackToSearch}
                  className="flex items-center gap-1"
                >
                  <MdArrowBack />
                  Retour
                </Button>
                <div className="flex-1" />
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  loading={isSubmitting}
                  disabled={!selectedVariantId || isSubmitting}
                >
                  Terminer
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Step: Variant Selection */}
        {step === OnboardingStep.VARIANT_SELECT && selectedBaseCharacter && (
          <div className="space-y-6 animate-slideUp">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-heading text-white flex items-center gap-2">
                    <MdColorLens className="text-xl text-primary-500" />
                    Choisir votre variante
                  </h2>
                  <p className="text-sub text-neutral-400 mt-1">
                    Personnage: <span className="text-primary-400">{selectedBaseCharacter.name}</span>
                  </p>
                </div>
              </div>

              {/* Variants grid */}
              <div
                className="max-h-80 overflow-y-auto scrollbar-hide pr-1"
                role="listbox"
                aria-label="Liste des variantes"
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {selectedBaseCharacter.variants.map((variant) => {
                    const isSelected = selectedVariantId === variant.id;
                    const selectable = isVariantSelectable(variant);
                    const isOwnVariant = !variant.isAvailable && selectedCompetitor && variant.takenBy?.competitorId === selectedCompetitor.id;

                    return (
                      <Card
                        key={variant.id}
                        className={`p-3 transition-all duration-200 ${
                          !selectable
                            ? 'opacity-60 cursor-not-allowed'
                            : 'cursor-pointer hover:border-primary-500 hover:bg-primary-500/5'
                        } ${
                          isSelected ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500' : ''
                        }`}
                        onClick={() => selectable && handleSelectVariant(variant)}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={!selectable}
                        tabIndex={selectable ? 0 : -1}
                        onKeyPress={(e) => e.key === 'Enter' && selectable && handleSelectVariant(variant)}
                        aria-label={`${selectedBaseCharacter.name} - ${variant.label}${!selectable ? ' (indisponible)' : ''}${isOwnVariant ? ' (votre personnage actuel)' : ''}`}
                      >
                        <div className="text-center">
                          {/* Variant image with taken badge */}
                          <div className="relative w-14 h-14 mx-auto mb-2">
                            <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${
                              isSelected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-800' : 'bg-neutral-700'
                            } ${!selectable ? 'grayscale' : ''}`}>
                              {variant.imageUrl ? (
                                <Image
                                  src={variant.imageUrl}
                                  alt={`${selectedBaseCharacter.name} ${variant.label}`}
                                  width={56}
                                  height={56}
                                  className={`w-full h-full object-contain ${!selectable ? 'opacity-50' : ''}`}
                                />
                              ) : (
                                <span className="text-2xl">🎨</span>
                              )}
                            </div>
                            {/* Badge showing who took it (only for variants taken by others) */}
                            {!selectable && variant.takenBy && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-neutral-800 overflow-hidden bg-neutral-700">
                                {variant.takenBy.profilePictureUrl ? (
                                  <img
                                    src={variant.takenBy.profilePictureUrl}
                                    alt={variant.takenBy.firstName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <MdPerson className="text-neutral-400 text-xs" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <p className={`text-bold text-sm ${
                            !selectable ? 'text-neutral-500' : isSelected ? 'text-primary-400' : 'text-white'
                          }`}>
                            {variant.label}
                          </p>
                          {/* Show "Votre perso" for own variant */}
                          {isOwnVariant && (
                            <p className="text-sub text-xs text-primary-400 truncate">
                              Votre perso
                            </p>
                          )}
                          {/* Show who took it (only for variants taken by others) */}
                          {!selectable && variant.takenBy && (
                            <p className="text-sub text-xs text-neutral-500 truncate">
                              {variant.takenBy.firstName}
                            </p>
                          )}
                          {isSelected && selectable && (
                            <div className="mt-1 flex items-center justify-center text-primary-400 text-sub text-xs gap-1">
                              <MdCheck className="text-xs" />
                              Choisi
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-neutral-700 pt-4 mt-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToCharacterSelect}
                  className="flex items-center gap-1"
                >
                  <MdArrowBack />
                  Retour
                </Button>
                <div className="flex-1" />
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  loading={isSubmitting}
                  disabled={!selectedVariantId || isSubmitting}
                >
                  Terminer
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
