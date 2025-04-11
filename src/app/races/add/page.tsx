"use client";

import { NextPage } from "next";
import { useContext, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import CheckableCompetitorItem from "@/app/components/competitor/CheckableCompetitorItem";
import { MdPersonAdd, MdSearch, MdCameraAlt } from "react-icons/md";
import { RaceResult } from "@/app/models/RaceResult";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

const AddRacePage: NextPage = () => {
  const router = useRouter();
  const { allCompetitors, isLoading, analyzeRaceImage } =
    useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);

  const sortedCompetitors = [...allCompetitors].sort((a, b) => {
    // Sort first by raceCount descending
    if ((b.raceCount ?? 0) !== (a.raceCount ?? 0)) {
      return (b.raceCount ?? 0) - (a.raceCount ?? 0);
    }
    // In case of a tie, sort alphabetically
    const fullNameA = (a.firstName + " " + a.lastName).toLowerCase();
    const fullNameB = (b.firstName + " " + b.lastName).toLowerCase();
    return fullNameA.localeCompare(fullNameB);
  });

  const filteredCompetitors = sortedCompetitors.filter((c) => {
    const fullName = (c.firstName + " " + c.lastName).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const toggleSelection = (competitor: Competitor) => {
    setSelectedCompetitors((prev) => {
      if (prev.includes(competitor)) {
        return prev.filter((cmp) => cmp.id !== competitor.id);
      } else if (prev.length < MAX_PLAYERS) {
        return [...prev, competitor];
      }
      return prev;
    });
  };

  const onNext = () => {
    if (
      selectedCompetitors.length >= MIN_PLAYERS &&
      selectedCompetitors.length <= MAX_PLAYERS
    ) {
      // Redirect to the score setup page with selected competitors' IDs
      const ids = selectedCompetitors.map((c) => c.id).join(",");
      router.push(`/races/score-setup?ids=${ids}`);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Ensure at least one competitor is selected
    if (selectedCompetitors.length === 0) {
      alert(
        "Veuillez sélectionner au moins un compétiteur avant d'analyser une photo."
      );
      return;
    }

    setIsUploading(true);

    try {
      // Image
      const image = files[0];

      // Include the selected competitor IDs in the request : string[]
      const competitorIds = selectedCompetitors.map((c) => c.id);

      // Send and extract the results from the analysis
      // Format expected: { results: [{ competitorId, rank12, score }] }
      const { results } = await analyzeRaceImage(image, competitorIds);

      if (results && results.length > 0) {
        // Prepare URL with rank and score data
        const ids = results.map((r: RaceResult) => r.competitorId).join(",");

        // Create rank and score maps
        const rankMap: Record<string, number> = {};
        const scoreMap: Record<string, number> = {};

        results.forEach((result: RaceResult) => {
          rankMap[result.competitorId] = result.rank12;
          scoreMap[result.competitorId] = result.score;
        });

        // Navigate to score setup with pre-filled data
        router.push(
          `/races/score-setup?ids=${ids}&rankMap=${JSON.stringify(
            rankMap
          )}&scoreMap=${JSON.stringify(scoreMap)}&fromAnalysis=true`
        );
      } else {
        alert(
          "L'analyse n'a pas pu détecter de résultats valides. Veuillez essayer avec une autre image ou saisir les scores manuellement."
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse de la photo:", error);
      alert(
        "Une erreur s'est produite lors de l'analyse de la photo. Veuillez réessayer."
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Title and subtitle */}
        <h1 className="text-2xl font-bold mb-1">Sélection des joueurs</h1>
        <p className="text-sm text-neutral-400 mb-6">Qui veut se la coller ?</p>

        {isLoading ? (
          <p className="text-neutral-300">Chargement...</p>
        ) : (
          <>
            {/* Search bar */}
            <div className="relative mb-4">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Recherche..."
                className="w-full h-10 bg-neutral-800 text-neutral-100 rounded pl-9 pr-3
                           border border-neutral-700
                           focus:outline-none focus:border-primary-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Buttons row */}
            <div className="flex gap-2 mb-6">
              {/* "Add a player" button */}
              <div
                className="flex-1 flex items-center cursor-pointer bg-neutral-800 hover:bg-neutral-700 transition-colors p-3 rounded"
                onClick={() => router.push("/competitors/add")}
              >
                <MdPersonAdd className="text-2xl text-primary-500 mr-2" />
                <span className="text-base text-neutral-100 font-semibold">
                  Ajouter un joueur
                </span>
              </div>

              {/* "Take photo" button */}
              <div
                className="flex-1 flex items-center cursor-pointer bg-neutral-800 hover:bg-neutral-700 transition-colors p-3 rounded"
                onClick={triggerFileInput}
              >
                <MdCameraAlt className="text-2xl text-primary-500 mr-2" />
                <span className="text-base text-neutral-100 font-semibold">
                  {isUploading ? "Analyse en cours..." : "Prendre une photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* List of filtered players */}
            <div className="flex flex-col">
              {filteredCompetitors.map((competitor) => (
                <CheckableCompetitorItem
                  key={competitor.id}
                  competitor={competitor}
                  isSelected={selectedCompetitors.includes(competitor)}
                  toggleSelection={toggleSelection}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-400 mb-4">
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
                className={`
                  w-full h-12 rounded font-semibold
                  ${
                    selectedCompetitors.length >= MIN_PLAYERS &&
                    selectedCompetitors.length <= MAX_PLAYERS &&
                    !isUploading
                      ? "bg-primary-500 text-neutral-900"
                      : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                  }
                `}
              >
                Continuer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddRacePage;
