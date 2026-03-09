"use client";

import { NextPage } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { RaceResult } from "@/app/models/RaceResult";
import RaceResultEloSummary from "@/app/components/elo/RaceResultEloSummary";
import Modal from "@/app/components/ui/Modal";
import { MdArrowBack, MdWarning } from "react-icons/md";
import { toast } from "sonner";
import { get as idbGet, del as idbDel } from "idb-keyval";
import { RacesRepository } from "@/app/repositories/RacesRepository";
import { useAuth } from "@clerk/nextjs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const racesRepo = new RacesRepository(API_BASE_URL);

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

const parseCompetitorIds = (idsParam: string | null): string[] => {
  return idsParam ? idsParam.split(",") : [];
};

const buildRaceResults = (
  competitors: Competitor[],
  searchParams: URLSearchParams
): RaceResult[] => {
  const results = competitors.map((c) => {
    const rank = searchParams.get(`rank_${c.id}`);
    const score = searchParams.get(`score_${c.id}`);
    return {
      competitorId: c.id,
      rank12: rank ? parseInt(rank, 10) : 12,
      score: score ? parseInt(score, 10) : 0,
    };
  });

  return results.sort((a, b) => a.rank12 - b.rank12);
};

const buildScoreSetupUrl = (
  competitors: Competitor[],
  results: RaceResult[]
): string => {
  const params = new URLSearchParams();
  params.set("ids", competitors.map((c) => c.id).join(","));
  results.forEach((r) => {
    params.set(`rank_${r.competitorId}`, r.rank12.toString());
    params.set(`score_${r.competitorId}`, r.score.toString());
  });
  return `/races/score-setup?${params.toString()}`;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RaceSummaryPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRaceEvent, allCompetitors } = useContext(AppContext);
  const { getToken } = useAuth();

  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStaleWarning, setShowStaleWarning] = useState(false);
  const [staleMessage, setStaleMessage] = useState("");

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (!ids) return;

    const competitorIds = parseCompetitorIds(ids);
    const found = allCompetitors.filter((c) => competitorIds.includes(c.id));
    setSelectedCompetitors(found);

    const raceResults = buildRaceResults(found, searchParams);
    setResults(raceResults);
  }, [searchParams, allCompetitors]);

  const checkStaleRace = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getToken();
      const latest = await racesRepo.fetchLatestToday(token ?? undefined);
      if (!latest) return false; // No race today — no warning

      const lastRaceDate = new Date(latest.date);

      // Try EXIF timestamp first
      const photoTimestamp = await idbGet<string>("racePhotoTimestamp");
      if (photoTimestamp) {
        const photoDate = new Date(photoTimestamp);
        if (!isNaN(photoDate.getTime()) && photoDate < lastRaceDate) {
          setStaleMessage(
            `Cette photo a été prise à ${formatTime(photoDate)}, mais une course a été ajoutée à ${formatTime(lastRaceDate)}. L'ELO sera calculé dans l'ordre d'ajout, pas dans l'ordre réel.`
          );
          return true;
        }
        return false;
      }

      // No EXIF — fallback: warn if last race was > 1h ago
      const elapsed = Date.now() - lastRaceDate.getTime();
      if (elapsed > STALE_THRESHOLD_MS) {
        const hours = Math.floor(elapsed / (60 * 60 * 1000));
        const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));
        const timeAgo =
          hours > 0
            ? `${hours}h${minutes > 0 ? `${String(minutes).padStart(2, "0")}` : ""}`
            : `${minutes} min`;
        setStaleMessage(
          `La dernière course a été ajoutée il y a ${timeAgo} (à ${formatTime(lastRaceDate)}). Si d'autres courses ont eu lieu entre-temps, l'ELO sera faussé.`
        );
        return true;
      }

      return false;
    } catch {
      // Don't block race creation on network errors
      return false;
    }
  }, [getToken]);

  const submitRace = async () => {
    setIsSubmitting(true);
    try {
      await addRaceEvent(results);
      sessionStorage.removeItem("raceImage");
      idbDel("racePhotoTimestamp");
      toast.success("Course ajoutée avec succès !");
      router.push("/");
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleValidate = async () => {
    if (isSubmitting) return;

    const isStale = await checkStaleRace();
    if (isStale) {
      setShowStaleWarning(true);
      return;
    }

    await submitRace();
  };

  const handleConfirmStale = async () => {
    setShowStaleWarning(false);
    await submitRace();
  };

  const handleBack = () => {
    const url = buildScoreSetupUrl(selectedCompetitors, results);
    router.push(url);
  };

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <MdArrowBack size={26} />
        </button>
        <h1 className="text-xl font-bold">Ajouter une course</h1>
      </div>

      <RaceResultEloSummary
        results={results}
        selectedCompetitors={selectedCompetitors}
      />

      <div className="mt-8">
        <button
          className="w-full h-12 rounded font-semibold bg-primary-500 text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleValidate}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Envoi..." : "Valider"}
        </button>
      </div>

      {/* Stale race warning modal */}
      <Modal
        isOpen={showStaleWarning}
        onClose={() => setShowStaleWarning(false)}
        title="Course en retard ?"
        size="sm"
        showCloseButton={false}
      >
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <MdWarning className="text-amber-400 text-2xl shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-300">{staleMessage}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStaleWarning(false)}
              className="flex-1 h-10 rounded font-semibold bg-neutral-700 text-neutral-200 hover:bg-neutral-600 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmStale}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded font-semibold bg-amber-500 text-neutral-900 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Envoi..." : "Valider quand même"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RaceSummaryPage;
