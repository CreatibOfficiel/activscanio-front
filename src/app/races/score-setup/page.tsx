"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import Image from "next/image";
import { MdArrowBack } from "react-icons/md";

/**
 * Page de configuration des rangs/scores
 */
const ScoreSetupPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCompetitors } = useContext(AppContext);

  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>([]);
  const [rankMap, setRankMap] = useState<Record<string, number | undefined>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, number | undefined>>({});

  // Récupération des concurrents depuis l'URL (query param "ids")
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",");
      const comps = allCompetitors.filter((c) => ids.includes(c.id));
      setSelectedCompetitors(comps);
    }
  }, [searchParams, allCompetitors]);

  // Initialisation rankMap / scoreMap à chaque fois qu'on a de nouveaux concurrents
  useEffect(() => {
    const initRank: Record<string, number | undefined> = {};
    const initScore: Record<string, number | undefined> = {};
    selectedCompetitors.forEach((c) => {
      initRank[c.id] = undefined;
      initScore[c.id] = undefined;
    });
    setRankMap(initRank);
    setScoreMap(initScore);
  }, [selectedCompetitors]);

  // Vérification basique : chaque concurrent a un rang (1..12) et un score (0..60)
  const isAllValid = selectedCompetitors.every((c) => {
    const r = rankMap[c.id];
    const s = scoreMap[c.id];
    if (r == null || s == null) return false;
    if (r < 1 || r > 12) return false;
    if (s < 0 || s > 60) return false;
    return true;
  });

  /**
   * Contrôle la cohérence rang / score :
   * - si deux joueurs ont le même rang, ils doivent avoir le même score
   * - si un joueur A est mieux classé qu’un joueur B, A doit avoir un score > B, etc.
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
    // On trie par rang
    results.sort((a, b) => a.rank12 - b.rank12);

    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i];
      const next = results[i + 1];

      // Même rang => scores doivent être identiques
      if (current.rank12 === next.rank12) {
        if (current.score !== next.score) return false;
      } else {
        // Rang plus élevé => score plus élevé
        if (current.rank12 < next.rank12) {
          if (current.score <= next.score) return false;
        } else {
          // rang non strictement croissant => incohérence
          return false;
        }
      }
    }
    return true;
  }

  // Au clic du bouton "Continuer"
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
    // Envoi vers la page summary
    const competitorIds = selectedCompetitors.map((c) => c.id).join(",");
    const rankJson = JSON.stringify(rankMap);
    const scoreJson = JSON.stringify(scoreMap);
    router.push(
        `/races/summary?ids=${competitorIds}&rankMap=${rankJson}&scoreMap=${scoreJson}`
    );
  };

  // Maj rang
  const handleChangeRank = (competitorId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setRankMap((prev) => ({
      ...prev,
      [competitorId]: isNaN(parsed) ? undefined : parsed,
    }));
  };

  // Maj score
  const handleChangeScore = (competitorId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setScoreMap((prev) => ({
      ...prev,
      [competitorId]: isNaN(parsed) ? undefined : parsed,
    }));
  };

  // On vérifie la cohérence pour activer / désactiver le bouton
  const canContinue = isAllValid && validateLogic(selectedCompetitors, rankMap, scoreMap);

  return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        {/* Flèche retour + Titre */}
        <div className="flex items-center gap-3 mb-6">
          <button
              onClick={() => router.back()}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <MdArrowBack size={26} />
          </button>
          <h1 className="text-xl font-bold">Configuration du score</h1>
        </div>

        {/* Explication */}
        <p className="text-sm text-neutral-300 mb-8">
          Indique le rang (1 à 12) et le score (0 à 60) pour chacun des joueurs sélectionnés.
        </p>

        {/* Liste des joueurs avec rang/score */}
        <div className="space-y-4">
          {selectedCompetitors.map((c) => (
              <div
                  key={c.id}
                  className="flex items-center justify-between px-4 py-3 rounded"
              >
                {/* Avatar + nom */}
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

                {/* Colonnes Rang / Score */}
                <div className="flex items-center gap-6">
                  {/* Rang */}
                  <div className="text-center">
                    <p className="text-xs text-neutral-400 font-semibold mb-1 uppercase">Rang</p>
                    <input
                        type="number"
                        min={1}
                        max={12}
                        className="w-14 h-10 bg-neutral-900 border border-neutral-700 rounded text-center
                             text-neutral-100 focus:outline-none focus:border-primary-500"
                        value={rankMap[c.id] ?? ""}
                        onChange={(e) => handleChangeRank(c.id, e.target.value)}
                    />
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <p className="text-xs text-neutral-400 font-semibold mb-1 uppercase">Score</p>
                    <input
                        type="number"
                        min={0}
                        max={60}
                        className="w-14 h-10 bg-neutral-900 border border-neutral-700 rounded text-center
                             text-neutral-100 focus:outline-none focus:border-primary-500"
                        value={scoreMap[c.id] ?? ""}
                        onChange={(e) => handleChangeScore(c.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
          ))}
        </div>

        {/* Footer : boutons Précédent / Continuer */}
        <div className="mt-8">
          <button
              className={`
            w-full h-12 rounded font-semibold transition-colors
            ${canContinue
                  ? "bg-primary-500 text-neutral-900 hover:bg-primary-400"
                  : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
              }
          `}
              onClick={handleNext}
          >
            Continuer
          </button>
        </div>
      </div>
  );
};

export default ScoreSetupPage;
