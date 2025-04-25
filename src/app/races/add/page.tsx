"use client";

import { NextPage } from "next";
import { useContext, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import CheckableCompetitorItem from "@/app/components/competitor/CheckableCompetitorItem";
import { MdPersonAdd, MdSearch, MdCameraAlt } from "react-icons/md";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

const AddRacePage: NextPage = () => {
  const router = useRouter();
  const { allCompetitors, isLoading, analyzeRaceImage } =
    useContext(AppContext);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    [],
  );
  const [isUploading, setIsUploading] = useState(false);

  /* ---------- Helpers ---------- */

  const canTakePhoto =
    selectedCompetitors.length >= MIN_PLAYERS && !isUploading;

  const triggerFileInput = () => {
    if (!canTakePhoto) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  /* ---------- Tri + filtre ---------- */

  const sortedCompetitors = [...allCompetitors].sort((a, b) => {
    if ((b.raceCount ?? 0) !== (a.raceCount ?? 0)) {
      return (b.raceCount ?? 0) - (a.raceCount ?? 0);
    }
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
    setSelectedCompetitors((prev) => {
      if (prev.includes(competitor)) {
        return prev.filter((c) => c.id !== competitor.id);
      }
      if (prev.length < MAX_PLAYERS) {
        return [...prev, competitor];
      }
      return prev;
    });
  };

  /* ---------- Navigation ---------- */

  const onNext = () => {
    if (
      selectedCompetitors.length >= MIN_PLAYERS &&
      selectedCompetitors.length <= MAX_PLAYERS
    ) {
      const ids = selectedCompetitors.map((c) => c.id).join(",");
      router.push(`/races/score-setup?ids=${ids}`);
    }
  };

  /* ---------- Upload & analyse ---------- */

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (selectedCompetitors.length < MIN_PLAYERS) {
      alert("Sélectionnez au moins 2 compétiteurs avant l’analyse.");
      return;
    }

    setIsUploading(true);

    try {
      const image = files[0];
      const competitorIds = selectedCompetitors.map((c) => c.id);

      /** { results: [...] } */
      const { results } = await analyzeRaceImage(image, competitorIds);

      if (results.length === 0) {
        alert("Aucun résultat trouvé sur la photo, réessayez avec une meilleure image.");
        return;
      }

      /* ----- maps init ----- */
      const rankMap: Record<string, number | undefined> = {};
      const scoreMap: Record<string, number | undefined> = {};

      results.forEach((r) => {
        rankMap[r.competitorId] = r.rank12;
        scoreMap[r.competitorId] = r.score;
      });

      /* ----- URL params ----- */
      const ids = selectedCompetitors.map((c) => c.id).join(",");
      const params = new URLSearchParams({
        ids,
        rankMap: JSON.stringify(rankMap),
        scoreMap: JSON.stringify(scoreMap),
        fromAnalysis: "true",
      });

      router.push(`/races/score-setup?${params.toString()}`);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue pendant l'analyse. Merci de réessayer.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Sélection des joueurs</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Qui veut se la coller&nbsp;?
        </p>

        {isLoading ? (
          <p className="text-neutral-300">Chargement…</p>
        ) : (
          <>
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
                onClick={() => router.push("/competitors/add")}
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
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>

            {/* Liste joueurs */}
            <div className="flex flex-col">
              {filteredCompetitors.map((c) => (
                <CheckableCompetitorItem
                  key={c.id}
                  competitor={c}
                  isSelected={selectedCompetitors.includes(c)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default AddRacePage;
