"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import Image from "next/image";
import { MdArrowBack, MdOutlineCheckCircle } from "react-icons/md";

const ScoreSetupPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCompetitors } = useContext(AppContext);

  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    []
  );
  const [rankMap, setRankMap] = useState<Record<string, number | undefined>>(
    {}
  );
  const [scoreMap, setScoreMap] = useState<Record<string, number | undefined>>(
    {}
  );
  const [isFromAnalysis, setIsFromAnalysis] = useState(false);

  // Retrieve competitors and data from the URL
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    const rankMapParam = searchParams.get("rankMap");
    const scoreMapParam = searchParams.get("scoreMap");
    const fromAnalysisParam = searchParams.get("fromAnalysis");

    if (idsParam) {
      const ids = idsParam.split(",");
      const comps = allCompetitors.filter((c) => ids.includes(c.id));
      setSelectedCompetitors(comps);
    }

    // Set ranks and scores if present in the URL
    if (rankMapParam) {
      try {
        const parsedRankMap = JSON.parse(rankMapParam);
        setRankMap(parsedRankMap);
      } catch (e) {
        console.error("Error parsing rankMap:", e);
      }
    }

    if (scoreMapParam) {
      try {
        const parsedScoreMap = JSON.parse(scoreMapParam);
        setScoreMap(parsedScoreMap);
      } catch (e) {
        console.error("Error parsing scoreMap:", e);
      }
    }

    // Check if coming from analysis
    setIsFromAnalysis(fromAnalysisParam === "true");
  }, [searchParams, allCompetitors]);

  // Initialize rankMap / scoreMap if not already set
  useEffect(() => {
    const ids = selectedCompetitors.map((c) => c.id);
  
    // s’assurer que chaque id existe au moins comme clef
    setRankMap((prev) => {
      const copy = { ...prev };
      ids.forEach((id) => {
        if (!(id in copy)) copy[id] = undefined;
      });
      return copy;
    });
  
    setScoreMap((prev) => {
      const copy = { ...prev };
      ids.forEach((id) => {
        if (!(id in copy)) copy[id] = undefined;
      });
      return copy;
    });
  }, [selectedCompetitors]);

  // Basic check: each competitor has a rank (1..12) and a score (0..60)
  const isAllValid = selectedCompetitors.every((c) => {
    const r = rankMap[c.id];
    const s = scoreMap[c.id];
    if (r == null || s == null) return false;
    if (r < 1 || r > 12) return false;
    if (s < 0 || s > 60) return false;
    return true;
  });

  /**
   * Control rank/score consistency:
   * - if two players have the same rank, they must have the same score
   *  if player A is ranked higher than player B, A must have a score > B, etc.
   */
  function validateLogic(
    selected: Competitor[],
    rankMap: Record<string, number | undefined>,
    scoreMap: Record<string, number | undefined>
  ): boolean {
    const results = selected.map((c) => ({
      id: c.id,
      rank12: rankMap[c.id] ?? 12,
      score: scoreMap[c.id] ?? 0,
    }));
    // Sort by rank
    results.sort((a, b) => a.rank12 - b.rank12);

    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i];
      const next = results[i + 1];

      // Same rank => scores must be identical
      if (current.rank12 === next.rank12) {
        if (current.score !== next.score) return false;
      } else {
        // Rank more important => score more important
        if (current.rank12 < next.rank12) {
          if (current.score <= next.score) return false;
        } else {
          // rank not strictly increasing => inconsistency
          return false;
        }
      }
    }
    return true;
  }

  // On "Continue" button click
  const handleNext = () => {
    if (!isAllValid) {
      alert("Les résultats sont en dehors des limites autorisées.");
      return;
    }
    const logicOk = validateLogic(selectedCompetitors, rankMap, scoreMap);
    if (!logicOk) {
      alert("Logique rang/score incorrecte (ex: un 2e a un score >= au 1er).");
      return;
    }
    const competitorIds = selectedCompetitors.map((c) => c.id).join(",");
    const rankJson = JSON.stringify(rankMap);
    const scoreJson = JSON.stringify(scoreMap);
    router.push(
      `/races/summary?ids=${competitorIds}&rankMap=${rankJson}&scoreMap=${scoreJson}`
    );
  };

  // Update rank
  const handleChangeRank = (competitorId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setRankMap((prev) => ({
      ...prev,
      [competitorId]: isNaN(parsed) ? undefined : parsed,
    }));
  };

  // Update score
  const handleChangeScore = (competitorId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setScoreMap((prev) => ({
      ...prev,
      [competitorId]: isNaN(parsed) ? undefined : parsed,
    }));
  };

  const canContinue =
    isAllValid && validateLogic(selectedCompetitors, rankMap, scoreMap);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      {/* Back button + title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <MdArrowBack size={26} />
        </button>
        <h1 className="text-xl font-bold">Configuration du score</h1>
      </div>

      {/* Notification for auto-detected results */}
      {isFromAnalysis && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-primary-500/15 to-primary-400/10 p-4 flex items-start gap-3 ring-1 ring-primary-500/30">
          <MdOutlineCheckCircle size={24} className="shrink-0 text-primary-400 mt-0.5" />
          <p className="text-sm text-neutral-100 leading-relaxed">
            Les résultats des joueurs ont été&nbsp;pré-remplis grâce à
            l’analyse&nbsp;d’image. Vérifie-les et ajuste si nécessaire !
          </p>
        </div>
      )}

      {/* Explication */}
      <p className="text-sm text-neutral-300 mb-8">
        Indique le rang (1 à 12) et le score (0 à 60) pour chacun des joueurs
        sélectionnés.
      </p>

      {/* List of competitors */}
      <div className="space-y-4">
        {selectedCompetitors.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between px-4 py-3 rounded"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={c.profilePictureUrl}
                  alt={c.firstName}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-base font-medium text-neutral-100">
                {c.firstName} {c.lastName}
              </span>
            </div>

            {/* Rank + Score */}
            <div className="flex items-center gap-6">
              {/* Rank */}
              <div className="text-center">
                <p className="text-xs text-neutral-400 font-semibold mb-1 uppercase">
                  Rang
                </p>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="w-14 h-10 bg-neutral-900 border border-neutral-700 rounded text-center
                             text-neutral-100 focus:outline-none focus:border-primary-500"
                  value={rankMap[c.id] !== undefined ? String(rankMap[c.id]) : ""}
                  onChange={(e) => handleChangeRank(c.id, e.target.value)}
                />
              </div>

              {/* Score */}
              <div className="text-center">
                <p className="text-xs text-neutral-400 font-semibold mb-1 uppercase">
                  Score
                </p>
                <input
                  type="number"
                  min={0}
                  max={60}
                  className="w-14 h-10 bg-neutral-900 border border-neutral-700 rounded text-center
                             text-neutral-100 focus:outline-none focus:border-primary-500"
                  value={scoreMap[c.id] !== undefined ? String(scoreMap[c.id]) : ""}
                  onChange={(e) => handleChangeScore(c.id, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer : back button + continue button */}
      <div className="mt-8">
        <button
          className={`
            w-full h-12 rounded font-semibold transition-colors
            ${
              canContinue
                ? "bg-primary-500 text-neutral-900 hover:bg-primary-400"
                : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
            }
          `}
          onClick={handleNext}
          disabled={!canContinue}
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default ScoreSetupPage;
