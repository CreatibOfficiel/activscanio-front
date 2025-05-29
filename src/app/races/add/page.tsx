"use client";

import { NextPage } from "next";
import { useContext, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import CheckableCompetitorItem from "@/app/components/competitor/CheckableCompetitorItem";
import { MdPersonAdd, MdSearch, MdCameraAlt } from "react-icons/md";
import imageCompression from "browser-image-compression";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

const AddRacePage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { allCompetitors, isLoading, analyzeRaceImage } = useContext(AppContext);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  /* ---------- Tri + filtre ---------- */

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
    const fullName = (c.firstName + " " + c.lastName).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  /* ---------- Sélection ---------- */

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
      // Navigate to the next page with scroll, using the local state
      router.push(`/races/score-setup?ids=${selectedCompetitorIds.join(',')}`);
    }
  };

  /* ---------- Upload & analyse ---------- */

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
  
    if (selectedCompetitors.length < MIN_PLAYERS) {
      alert("Sélectionnez au moins 2 compétiteurs avant l'analyse.");
      return;
    }
  
    setIsUploading(true);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-6 flex flex-col">
      {errorMsg && (
        <div style={{ color: "red", margin: 8, fontSize: 12 }}>
          Erreur : {errorMsg}
        </div>
      )}
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <h1 className="text-2xl font-bold mb-1">Sélection des joueurs</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Qui veut se la coller&nbsp;?
        </p>

        {isLoading ? (
          <p className="text-neutral-300">Chargement…</p>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="relative mb-4">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Recherche..."
                className="w-full h-10 bg-neutral-800 text-neutral-100 rounded pl-9 pr-3 border border-neutral-700 focus:outline-none focus:border-primary-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mb-6">
              {/* Add player */}
              <div
                className="flex-1 flex items-center cursor-pointer bg-neutral-800 hover:bg-neutral-700 transition-colors p-3 rounded"
                onClick={() => {
                  // Mettre à jour l'URL avec les données actuelles avant d'ajouter un joueur
                  const params = new URLSearchParams();
                  params.set('ids', selectedCompetitorIds.join(','));
                  router.push(`/competitors/add?${params.toString()}`);
                }}
              >
                <MdPersonAdd className="text-2xl text-primary-500 mr-2" />
                <span className="text-base font-semibold">
                  Ajouter un joueur
                </span>
              </div>

              {/* Take photo */}
              <div
                className={`flex-1 flex items-center p-3 rounded transition-colors ${
                  canTakePhoto
                    ? "cursor-pointer bg-neutral-800 hover:bg-neutral-700"
                    : "cursor-not-allowed bg-neutral-700 text-neutral-500"
                }`}
                onClick={triggerFileInput}
              >
                <MdCameraAlt
                  className={`text-2xl mr-2 ${
                    canTakePhoto ? "text-primary-500" : "text-neutral-500"
                  }`}
                />
                <span className="text-base font-semibold">
                  {isUploading ? "Analyse en cours…" : "Prendre une photo"}
                </span>

                {/* hidden input */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  ref={fileInputRef}
                />
              </div>
            </div>

            {/* List of players */}
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="flex flex-col">
                {filteredCompetitors.map((c) => (
                  <CheckableCompetitorItem
                    key={c.id}
                    competitor={c}
                    isSelected={selectedCompetitorIds.includes(c.id)}
                    toggleSelection={toggleSelection}
                  />
                ))}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 left-0 right-0 bg-neutral-900 pt-4 pb-16">
              <p className="text-sm text-neutral-400 mb-4 text-center">
                {selectedCompetitors.length} joueur
                {selectedCompetitors.length > 1 ? "s" : ""} sélectionné
                {selectedCompetitors.length > 1 ? "s" : ""}
              </p>

              <button
                onClick={onNext}
                disabled={
                  selectedCompetitors.length < MIN_PLAYERS ||
                  selectedCompetitors.length > MAX_PLAYERS ||
                  isUploading
                }
                className={`w-full h-12 rounded font-semibold ${
                  selectedCompetitors.length >= MIN_PLAYERS &&
                  selectedCompetitors.length <= MAX_PLAYERS &&
                  !isUploading
                    ? "bg-primary-500 text-neutral-900"
                    : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                }`}
              >
                Continuer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddRacePage;
