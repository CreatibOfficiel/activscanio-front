"use client";

import { NextPage } from "next";
import { useContext, useState, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import CheckableCompetitorItem from "@/app/components/competitor/CheckableCompetitorItem";
import {
  MdPersonAdd,
  MdSearch,
  MdCameraAlt,
  MdArrowBack,
  MdPhotoLibrary,
  MdInfoOutline,
  MdWarning,
} from "react-icons/md";
import { Button } from "@/app/components/ui";
import Spinner from "@/app/components/ui/Spinner";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

type Step = "CAPTURE_PROMPT" | "ANALYZING" | "PLAYER_SELECTION";

const AddRacePage: NextPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-6 flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <AddRaceContent />
    </Suspense>
  );
};

const AddRaceContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCompetitors, isLoading, analyzeRaceImage } =
    useContext(AppContext);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Competitors eligible for photo analysis (have a characterVariant)
  const eligibleForPhoto = useMemo(
    () => allCompetitors.filter((c) => c.characterVariant != null),
    [allCompetitors]
  );

  // If returning from score-setup with ?ids=..., go straight to PLAYER_SELECTION
  const initialIdsParam = searchParams.get("ids");
  const initialSelectedIds = useMemo(
    () => initialIdsParam?.split(",").filter((id) => id !== "") || [],
    [initialIdsParam]
  );

  const shouldSkipCapture =
    initialSelectedIds.length > 0 || eligibleForPhoto.length < MIN_PLAYERS;

  const [step, setStep] = useState<Step>(
    shouldSkipCapture ? "PLAYER_SELECTION" : "CAPTURE_PROMPT"
  );
  const [selectedCompetitorIds, setSelectedCompetitorIds] =
    useState<string[]>(initialSelectedIds);
  const [detectedCompetitorIds, setDetectedCompetitorIds] = useState<
    string[]
  >([]);
  const [analysisResults, setAnalysisResults] = useState<
    Array<{ competitorId: string; rank12: number; score: number }>
  >([]);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [analysisBanner, setAnalysisBanner] = useState<
    | { type: "success"; count: number }
    | { type: "warning"; message: string }
    | null
  >(null);

  const selectedCompetitors = allCompetitors.filter((c) =>
    selectedCompetitorIds.includes(c.id)
  );

  /* ---------- Sort + Filter ---------- */

  const sortedCompetitors = useMemo(() => {
    const detected = new Set(detectedCompetitorIds);
    return [...allCompetitors].sort((a, b) => {
      // Detected players first
      const aDetected = detected.has(a.id) ? 0 : 1;
      const bDetected = detected.has(b.id) ? 0 : 1;
      if (aDetected !== bDetected) return aDetected - bDetected;

      // Date of last race (most recent first)
      if (a.lastRaceDate && b.lastRaceDate) {
        const dateA = new Date(a.lastRaceDate).getTime();
        const dateB = new Date(b.lastRaceDate).getTime();
        if (dateA !== dateB) return dateB - dateA;
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
  }, [allCompetitors, detectedCompetitorIds]);

  const filteredCompetitors = sortedCompetitors.filter((c) => {
    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const fullName = c.firstName + " " + c.lastName;
    const characterName = c.characterVariant?.baseCharacter?.name || "";
    const searchableText = `${fullName} ${characterName}`;
    return normalizeText(searchableText).includes(normalizeText(searchTerm));
  });

  /* ---------- Selection ---------- */

  const toggleSelection = (competitor: Competitor) => {
    const isSelected = selectedCompetitorIds.includes(competitor.id);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedCompetitorIds.filter(
        (id) => id !== competitor.id
      );
    } else if (selectedCompetitorIds.length < MAX_PLAYERS) {
      newSelection = [...selectedCompetitorIds, competitor.id];
    } else {
      newSelection = selectedCompetitorIds;
    }

    setSelectedCompetitorIds(newSelection);
  };

  /* ---------- Photo handling ---------- */

  const handlePhotoCapture = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files?.length) return;

    const originalFile = files[0];

    // Create preview URL
    const previewUrl = URL.createObjectURL(originalFile);
    setCapturedImageUrl(previewUrl);
    setStep("ANALYZING");

    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(originalFile, options);

      // Convert to base64 for sessionStorage
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const dataUrl = await dataUrlPromise;

      try {
        sessionStorage.setItem("raceImage", dataUrl);
      } catch {
        // sessionStorage may be full — continue without storing
      }

      // Send to API with ALL eligible competitor IDs
      const eligibleIds = eligibleForPhoto.map((c) => c.id);
      const { results } = await analyzeRaceImage(compressedFile, eligibleIds);

      if (results.length === 0) {
        setAnalysisBanner({
          type: "warning",
          message: "Aucun joueur détecté, sélectionnez manuellement",
        });
        setStep("PLAYER_SELECTION");
        return;
      }

      // Pre-select detected competitors
      const detectedIds = results.map((r) => r.competitorId);
      setDetectedCompetitorIds(detectedIds);
      setSelectedCompetitorIds(detectedIds);
      setAnalysisResults(results);
      setAnalysisBanner({ type: "success", count: detectedIds.length });
      setStep("PLAYER_SELECTION");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'analyse. Sélectionnez manuellement.");
      setAnalysisBanner({
        type: "warning",
        message: "Analyse échouée, sélectionnez manuellement",
      });
      setStep("PLAYER_SELECTION");
    } finally {
      // Reset file inputs
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  /* ---------- Navigation ---------- */

  const handleContinue = () => {
    if (
      selectedCompetitors.length < MIN_PLAYERS ||
      selectedCompetitors.length > MAX_PLAYERS
    )
      return;

    const params = new URLSearchParams();
    params.set("ids", selectedCompetitorIds.join(","));

    // If we have analysis results, add scores and ranks
    if (analysisResults.length > 0) {
      params.set("fromAnalysis", "true");
      analysisResults.forEach((r) => {
        if (selectedCompetitorIds.includes(r.competitorId)) {
          params.set(`score_${r.competitorId}`, r.score.toString());
          params.set(`rank_${r.competitorId}`, r.rank12.toString());
        }
      });
    }

    router.push(`/races/score-setup?${params.toString()}`);
  };

  const handleManualEntry = () => {
    // Clear any stored image since we're going manual
    sessionStorage.removeItem("raceImage");
    setStep("PLAYER_SELECTION");
  };

  /* ---------- Render ---------- */

  // Step: CAPTURE_PROMPT
  if (step === "CAPTURE_PROMPT") {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/races")}
                ariaLabel="Retour"
              >
                <MdArrowBack size={26} />
              </Button>
              <h1 className="text-xl font-bold">Ajouter une course</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="max-w-lg w-full flex flex-col items-center gap-6">
            <p className="text-neutral-300 text-center text-sm">
              Prends une photo de l&apos;écran de résultats pour détecter
              automatiquement les joueurs et leurs scores.
            </p>

            {/* Hidden file inputs */}
            <input
              id="camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
              ref={cameraInputRef}
            />
            <input
              id="gallery-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoCapture}
              ref={galleryInputRef}
            />

            {/* Camera button */}
            <label
              htmlFor="camera-input"
              className="w-full max-w-xs flex items-center gap-4 p-4 rounded-xl bg-primary-500 hover:bg-primary-400 active:bg-primary-600 cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <MdCameraAlt size={24} className="text-neutral-900" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">
                  Appareil photo
                </p>
                <p className="text-sm text-neutral-900/70">
                  Prendre une photo des résultats
                </p>
              </div>
            </label>

            {/* Gallery button */}
            <label
              htmlFor="gallery-input"
              className="w-full max-w-xs flex items-center gap-4 p-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 cursor-pointer transition-colors border border-neutral-700"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                <MdPhotoLibrary size={24} className="text-neutral-300" />
              </div>
              <div>
                <p className="font-medium text-neutral-100">Galerie photo</p>
                <p className="text-sm text-neutral-400">
                  Choisir une image existante
                </p>
              </div>
            </label>

            {/* Manual entry link */}
            <button
              className="text-sm text-neutral-400 hover:text-neutral-200 underline underline-offset-2 transition-colors mt-2"
              onClick={handleManualEntry}
            >
              Saisie manuelle &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: ANALYZING
  if (step === "ANALYZING") {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full flex flex-col items-center gap-6">
          {/* Image thumbnail */}
          {capturedImageUrl && (
            <div className="w-48 h-48 rounded-xl overflow-hidden border border-neutral-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImageUrl}
                alt="Photo capturée"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Spinner size="lg" color="primary" />
          <p className="text-neutral-300 text-center">Analyse en cours...</p>
          <p className="text-sm text-neutral-500 text-center">
            Détection des joueurs et des scores
          </p>
        </div>
      </div>
    );
  }

  // Step: PLAYER_SELECTION
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-neutral-900 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          {/* Back button + title */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (
                  detectedCompetitorIds.length > 0 ||
                  eligibleForPhoto.length < MIN_PLAYERS
                ) {
                  // If we came from analysis or can't use photo, go back to races
                  router.push("/races");
                } else {
                  // Go back to capture prompt
                  setStep("CAPTURE_PROMPT");
                  setSelectedCompetitorIds([]);
                  setAnalysisBanner(null);
                }
              }}
              ariaLabel="Retour"
            >
              <MdArrowBack size={26} />
            </Button>
            <h1 className="text-xl font-bold">Sélection des joueurs</h1>
          </div>

          {/* Analysis result banner */}
          {analysisBanner?.type === "success" && (
            <div className="mb-3 rounded-lg bg-primary-500/15 p-3 flex items-center gap-2 ring-1 ring-primary-500/30">
              <MdInfoOutline size={18} className="text-primary-400 shrink-0" />
              <p className="text-sm text-neutral-200">
                {analysisBanner.count} joueur
                {analysisBanner.count > 1 ? "s" : ""} détecté
                {analysisBanner.count > 1 ? "s" : ""} automatiquement
              </p>
            </div>
          )}
          {analysisBanner?.type === "warning" && (
            <div className="mb-3 rounded-lg bg-amber-500/15 p-3 flex items-center gap-2 ring-1 ring-amber-500/30">
              <MdWarning size={18} className="text-amber-400 shrink-0" />
              <p className="text-sm text-neutral-200">
                {analysisBanner.message}
              </p>
            </div>
          )}

          {isLoading ? null : (
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

              {/* Add player button */}
              <button
                className="flex items-center gap-3 py-3 px-2 text-left hover:bg-neutral-800/50 rounded-lg transition-colors"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("ids", selectedCompetitorIds.join(","));
                  router.push(`/competitors/add?${params.toString()}`);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center">
                  <MdPersonAdd size={20} className="text-neutral-400" />
                </div>
                <span className="text-neutral-300 font-medium">
                  Ajouter un joueur
                </span>
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
            onClick={handleContinue}
            disabled={
              selectedCompetitors.length < MIN_PLAYERS ||
              selectedCompetitors.length > MAX_PLAYERS
            }
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddRacePage;
