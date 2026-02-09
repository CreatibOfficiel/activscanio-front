"use client";

import { NextPage } from "next";
import { useContext, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import CheckableCompetitorItem from "@/app/components/competitor/CheckableCompetitorItem";
import { MdPersonAdd, MdSearch, MdCameraAlt, MdArrowBack, MdEdit } from "react-icons/md";
import { Button } from "@/app/components/ui";
import Spinner from "@/app/components/ui/Spinner";
import imageCompression from "browser-image-compression";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

const AddRacePage: NextPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-6 flex items-center justify-center">Chargement...</div>}>
      <AddRaceContent />
    </Suspense>
  );
};

const AddRaceContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { allCompetitors, isLoading, analyzeRaceImage } = useContext(AppContext);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showInputMethodModal, setShowInputMethodModal] = useState(false);

  // Get the selected competitor IDs from the URL and filter out empty strings
  const initialSelectedIds = searchParams.get('ids')?.split(',').filter(id => id !== '') || [];
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>(initialSelectedIds);
  const selectedCompetitors = allCompetitors.filter(c => selectedCompetitorIds.includes(c.id));

  /* ---------- Helpers ---------- */

  const canTakePhoto = selectedCompetitors.length >= MIN_PLAYERS && !isUploading;

  const triggerFileInput = () => {
    if (!canTakePhoto) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  /* ---------- Sort + Filter ---------- */

  const sortedCompetitors = [...allCompetitors].sort((a, b) => {
    // Date of last race (most recent first)
    if (a.lastRaceDate && b.lastRaceDate) {
      const dateA = new Date(a.lastRaceDate).getTime();
      const dateB = new Date(b.lastRaceDate).getTime();
      if (dateA !== dateB) {
        return dateB - dateA;
      }
    } else if (a.lastRaceDate) {
      return -1;
    } else if (b.lastRaceDate) {
      return 1;
    }

    // Number of races played (most played first)
    if ((b.raceCount ?? 0) !== (a.raceCount ?? 0)) {
      return (b.raceCount ?? 0) - (a.raceCount ?? 0);
    }

    // Alphabetical order (A-Z)
    const nA = (a.firstName + " " + a.lastName).toLowerCase();
    const nB = (b.firstName + " " + b.lastName).toLowerCase();
    return nA.localeCompare(nB);
  });

  const filteredCompetitors = sortedCompetitors.filter((c) => {
    const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fullName = (c.firstName + " " + c.lastName);
    const characterName = c.characterVariant?.baseCharacter?.name || '';
    const searchableText = `${fullName} ${characterName}`;
    return normalizeText(searchableText).includes(normalizeText(searchTerm));
  });

  /* ---------- Selection ---------- */

  const toggleSelection = (competitor: Competitor) => {
    const isSelected = selectedCompetitorIds.includes(competitor.id);
    let newSelection: string[];
    
    if (isSelected) {
      newSelection = selectedCompetitorIds.filter(id => id !== competitor.id);
    } else if (selectedCompetitorIds.length < MAX_PLAYERS) {
      newSelection = [...selectedCompetitorIds, competitor.id];
    } else {
      newSelection = selectedCompetitorIds;
    }
    
    // Update local state only
    setSelectedCompetitorIds(newSelection);
  };

  /* ---------- Navigation ---------- */

  const onNext = () => {
    if (
      selectedCompetitors.length >= MIN_PLAYERS &&
      selectedCompetitors.length <= MAX_PLAYERS
    ) {
      // Show modal to choose input method
      setShowInputMethodModal(true);
    }
  };

  const handlePhotoChoice = () => {
    triggerFileInput();
  };

  const handleManualChoice = () => {
    setShowInputMethodModal(false);
    router.push(`/races/score-setup?ids=${selectedCompetitorIds.join(',')}`);
  };

  const closeModal = () => {
    if (!isUploading) setShowInputMethodModal(false);
  };

  /* ---------- Upload & Analysis ---------- */

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
  
    if (selectedCompetitors.length < MIN_PLAYERS) {
      alert("Sélectionnez au moins 2 compétiteurs avant l'analyse.");
      return;
    }
  
    setIsUploading(true);
    setShowInputMethodModal(true);
    try {
      const originalFile = files[0];

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(originalFile, options);
      const { results } = await analyzeRaceImage(compressedFile, selectedCompetitorIds);

      if (results.length === 0) {
        alert(
          "Aucun résultat trouvé sur la photo, réessayez avec une meilleure image."
        );
        return;
      }

      // Build the parameters for the next page using local state
      const params = new URLSearchParams();
      params.set('ids', selectedCompetitorIds.join(','));
      params.set('fromAnalysis', 'true');

      // Add the scores and ranks
      results.forEach((r) => {
        params.set(`score_${r.competitorId}`, r.score.toString());
        params.set(`rank_${r.competitorId}`, r.rank12.toString());
      });

      // Navigate to the next page with scroll
      router.push(`/races/score-setup?${params.toString()}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      alert("Une erreur est survenue pendant l'analyse. Merci de réessayer.");
    } finally {
      setIsUploading(false);
      setShowInputMethodModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      {errorMsg && (
        <div style={{ color: "red", margin: 8, fontSize: 12 }}>
          Erreur : {errorMsg}
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-neutral-900 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          {/* Back button + title */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/races')}
              ariaLabel="Retour"
            >
              <MdArrowBack size={26} />
            </Button>
            <h1 className="text-xl font-bold">Sélection des joueurs</h1>
          </div>

          {isLoading ? null : (
            /* Search only - buttons moved to list bottom */
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Recherche..."
                className="w-full h-10 bg-neutral-800 text-neutral-100 rounded pl-9 pr-3 border border-neutral-700 focus:outline-none focus:border-primary-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {/* Hidden file input for photo upload */}
          <input
            id="race-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            ref={fileInputRef}
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <p className="text-neutral-300">Chargement…</p>
          ) : (
            <div className="flex flex-col">
              {/* Players list */}
              {filteredCompetitors.map((c) => (
                <CheckableCompetitorItem
                  key={c.id}
                  competitor={c}
                  isSelected={selectedCompetitorIds.includes(c.id)}
                  toggleSelection={toggleSelection}
                />
              ))}

              {/* Empty state message */}
              {filteredCompetitors.length === 0 && searchTerm && (
                <p className="text-neutral-400 text-sm py-4 text-center">
                  Aucun joueur trouvé pour &quot;{searchTerm}&quot;
                </p>
              )}

              {/* Add player button - styled as a list item */}
              <button
                className="flex items-center gap-3 py-3 px-2 text-left hover:bg-neutral-800/50 rounded-lg transition-colors"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('ids', selectedCompetitorIds.join(','));
                  router.push(`/competitors/add?${params.toString()}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center">
                  <MdPersonAdd size={20} className="text-neutral-400" />
                </div>
                <span className="text-neutral-300 font-medium">Ajouter un joueur</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 px-4 pt-3 pb-4">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-neutral-400 mb-3 text-center">
            {selectedCompetitors.length} joueur
            {selectedCompetitors.length > 1 ? "s" : ""} sélectionné
            {selectedCompetitors.length > 1 ? "s" : ""}
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onNext}
            disabled={
              selectedCompetitors.length < MIN_PLAYERS ||
              selectedCompetitors.length > MAX_PLAYERS ||
              isUploading
            }
          >
            Continuer
          </Button>
        </div>
      </div>

      {/* Input method selection modal */}
      {showInputMethodModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 animate-fadeIn"
            onClick={closeModal}
          />

          {/* Bottom Sheet */}
          <div className="relative w-full max-w-lg bg-neutral-800 rounded-t-2xl p-6 pb-8 animate-slideUp">
            <h2 className="text-lg font-bold text-neutral-100 mb-2">
              Comment entrer les scores ?
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Choisis ta méthode préférée
            </p>

            <div className="flex flex-col gap-3">
              {/* Photo option - uses <label> to directly trigger file input for proper mobile behavior */}
              <label
                htmlFor={isUploading ? undefined : "race-photo-input"}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors text-left ${
                  isUploading
                    ? 'bg-neutral-700/50 cursor-not-allowed'
                    : 'bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-650 cursor-pointer'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  {isUploading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <MdCameraAlt size={24} className="text-primary-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-100">
                    {isUploading ? 'Analyse en cours…' : 'Prendre une photo'}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {isUploading ? 'Cela peut prendre quelques secondes' : 'Analyse automatique des résultats'}
                  </p>
                </div>
              </label>

              {/* Manual entry option */}
              <button
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors text-left ${
                  isUploading
                    ? 'bg-neutral-700/50 cursor-not-allowed'
                    : 'bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-650'
                }`}
                onClick={handleManualChoice}
                disabled={isUploading}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-600 flex items-center justify-center flex-shrink-0">
                  <MdEdit size={24} className="text-neutral-300" />
                </div>
                <div>
                  <p className="font-medium text-neutral-100">Saisie manuelle</p>
                  <p className="text-sm text-neutral-400">Entrer les scores à la main</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRacePage;
