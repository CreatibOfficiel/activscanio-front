"use client";

import { FC, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { OnboardingRepository } from '@/app/repositories/OnboardingRepository';
import { Competitor } from '@/app/models/Competitor';
import { CharacterVariant } from '@/app/models/Character';
import { Card, Button, Input } from '@/app/components/ui';
import { toast } from 'sonner';
import { MdSearch, MdPerson, MdPersonAdd } from 'react-icons/md';
import { useDebounce } from '@/app/hooks/useDebounce';

enum OnboardingStep {
  ROLE_SELECTION = 'role',
  COMPETITOR_SEARCH = 'search',
  CHARACTER_SELECT = 'character',
  CREATE_COMPETITOR = 'create',
}

const OnboardingPage: FC = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.ROLE_SELECTION);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Competitor[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Create competitor state
  const [newCompetitorFirstName, setNewCompetitorFirstName] = useState('');
  const [newCompetitorLastName, setNewCompetitorLastName] = useState('');

  // Character selection state
  const [characterVariants, setCharacterVariants] = useState<CharacterVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Load character variants on mount
  useEffect(() => {
    const loadCharacterVariants = async () => {
      try {
        const variants = await OnboardingRepository.getAllCharacterVariants();
        setCharacterVariants(variants);
      } catch (error) {
        console.error('Error loading character variants:', error);
        toast.error('Erreur lors du chargement des personnages');
      }
    };

    loadCharacterVariants();
  }, []);

  // Auto-search with debounce
  useEffect(() => {
    const autoSearch = async () => {
      if (debouncedSearchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setIsLoading(true);
        const token = await getToken();
        if (!token) return;

        const results = await OnboardingRepository.searchCompetitors(debouncedSearchQuery, token);
        setSearchResults(results);

        if (results.length === 0) {
          toast.info('Aucun compétiteur trouvé');
        }
      } catch (error) {
        console.error('Error searching:', error);
        toast.error('Erreur lors de la recherche');
      } finally {
        setIsLoading(false);
      }
    };

    autoSearch();
  }, [debouncedSearchQuery, getToken]);

  // Search competitors
  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 2) {
      toast.error('Veuillez saisir au moins 2 caractères');
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Token non disponible');
      }

      const results = await OnboardingRepository.searchCompetitors(searchQuery, token);
      setSearchResults(results);

      if (results.length === 0) {
        toast.info('Aucun compétiteur trouvé. Vous pouvez en créer un nouveau !');
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, getToken]);

  // Select existing competitor and move to character selection
  const handleSelectCompetitor = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setStep(OnboardingStep.CHARACTER_SELECT);
  };

  // Move to create competitor step
  const handleCreateNewCompetitor = () => {
    setStep(OnboardingStep.CREATE_COMPETITOR);
  };

  // Go back to previous step
  const handleBackToSearch = () => {
    setStep(OnboardingStep.COMPETITOR_SEARCH);
    setSelectedCompetitor(null);
    setNewCompetitorFirstName('');
    setNewCompetitorLastName('');
  };

  // Go back to role selection
  const handleBackToRoleSelection = () => {
    setStep(OnboardingStep.ROLE_SELECTION);
    setSelectedCompetitor(null);
    setNewCompetitorFirstName('');
    setNewCompetitorLastName('');
    setSelectedVariantId(null);
  };

  // Validate name format
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  // Move from create form to character selection
  const handleProceedToCharacterSelect = () => {
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

    setStep(OnboardingStep.CHARACTER_SELECT);
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

  // Handle spectator selection (no competitor/character needed)
  const handleSpectatorSelection = async () => {
    try {
      setIsSubmitting(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Token non disponible');
      }

      await OnboardingRepository.completeOnboarding(
        { isSpectator: true },
        token
      );

      toast.success('Bienvenue ! Vous pouvez maintenant parier sur les courses ! 🎉');
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding as spectator:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du profil';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-title mb-2">Bienvenue {user?.firstName}!</h1>
          <p className="text-regular text-neutral-300">
            Créez votre profil de compétiteur pour participer aux courses
          </p>
        </div>

        {/* Step: Role Selection */}
        {step === OnboardingStep.ROLE_SELECTION && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-heading text-white mb-4">Choisissez votre rôle</h2>
              <p className="text-sub text-neutral-300 mb-6">
                Voulez-vous participer aux courses ou seulement parier sur les résultats ?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option Compétiteur */}
                <Card
                  className="p-6 cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={() => {
                    setStep(OnboardingStep.COMPETITOR_SEARCH);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setStep(OnboardingStep.COMPETITOR_SEARCH);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">🏁</div>
                    <h3 className="text-bold text-white mb-2">Je suis un coureur</h3>
                    <p className="text-sub text-neutral-400">
                      Participez aux courses Mario Kart et pariez sur les résultats
                    </p>
                  </div>
                </Card>

                {/* Option Spectateur */}
                <Card
                  className="p-6 cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={handleSpectatorSelection}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSpectatorSelection();
                    }
                  }}
                  aria-disabled={isSubmitting}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎲</div>
                    <h3 className="text-bold text-white mb-2">Je suis un spectateur</h3>
                    <p className="text-sub text-neutral-400">
                      Pariez sur les courses et grimpez dans le classement
                    </p>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        )}

        {/* Step: Competitor Search */}
        {step === OnboardingStep.COMPETITOR_SEARCH && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-heading text-white mb-4 flex items-center gap-2">
                <MdSearch className="text-xl" />
                Trouver votre profil
              </h2>
              <p className="text-sub text-neutral-300 mb-4">
                Recherchez votre nom pour lier votre compte à un profil de compétiteur existant
              </p>

              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Rechercher un nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  aria-label="Rechercher un compétiteur par nom"
                  aria-describedby="search-help"
                />
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  loading={isLoading}
                  disabled={isLoading || searchQuery.length < 2}
                  aria-label="Lancer la recherche"
                >
                  <MdSearch className="text-xl" />
                </Button>
              </div>
              <p id="search-help" className="sr-only">
                Entrez au moins 2 caractères pour rechercher un compétiteur
              </p>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 mb-4" role="list" aria-label="Résultats de recherche">
                  {searchResults.map((competitor) => (
                    <Card
                      key={competitor.id}
                      className="p-4 cursor-pointer hover:border-primary-500 transition-colors"
                      onClick={() => handleSelectCompetitor(competitor)}
                      role="listitem"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && handleSelectCompetitor(competitor)}
                      aria-label={`Sélectionner ${competitor.firstName} ${competitor.lastName}`}
                    >
                      <div className="flex items-center gap-3">
                        <MdPerson className="text-2xl text-primary-500" aria-hidden="true" />
                        <div>
                          <p className="text-bold text-white">
                            {competitor.firstName} {competitor.lastName}
                          </p>
                          {competitor.characterVariant && (
                            <p className="text-sub text-neutral-400">
                              {competitor.characterVariant.baseCharacter.name} - {competitor.characterVariant.label}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="border-t border-neutral-700 pt-4">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleCreateNewCompetitor}
                >
                  <MdPersonAdd className="text-xl mr-2" />
                  Créer un nouveau profil
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Step: Create Competitor */}
        {step === OnboardingStep.CREATE_COMPETITOR && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-heading text-white mb-4 flex items-center gap-2">
                <MdPersonAdd className="text-xl" />
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

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleBackToSearch} fullWidth>
                    Retour
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleProceedToCharacterSelect}
                    fullWidth
                    disabled={!newCompetitorFirstName.trim() || !newCompetitorLastName.trim()}
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step: Character Selection */}
        {step === OnboardingStep.CHARACTER_SELECT && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-heading text-white mb-4">Choisir votre personnage</h2>
              <p className="text-sub text-neutral-300 mb-4">
                {selectedCompetitor
                  ? `Profil: ${selectedCompetitor.firstName} ${selectedCompetitor.lastName}`
                  : `Nouveau profil: ${newCompetitorFirstName} ${newCompetitorLastName}`}
              </p>

              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4"
                role="radiogroup"
                aria-label="Sélection du personnage"
              >
                {characterVariants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <Card
                      key={variant.id}
                      className={`p-4 cursor-pointer hover:border-primary-500 transition-colors ${
                        isSelected ? 'border-primary-500 bg-primary-500/10' : ''
                      }`}
                      onClick={() => setSelectedVariantId(variant.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && setSelectedVariantId(variant.id)}
                      aria-label={`${variant.baseCharacter.name} - ${variant.label}`}
                    >
                      <div className="text-center">
                        <p className="text-bold text-white mb-1">
                          {variant.baseCharacter.name}
                        </p>
                        <p className="text-sub text-neutral-400">{variant.label}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleBackToRoleSelection} fullWidth>
                  Retour
                </Button>
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  fullWidth
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
