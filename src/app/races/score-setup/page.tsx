"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";

const ScoreSetupPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCompetitors } = useContext(AppContext);

  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    []
  );
  const [rankMap, setRankMap] = useState<Record<string, number | undefined>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, number | undefined>>(
    {}
  );

  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",");
      const comps = allCompetitors.filter((c) => ids.includes(c.id));
      setSelectedCompetitors(comps);
    }
  }, [searchParams, allCompetitors]);

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

  const isAllValid = selectedCompetitors.every((c) => {
    const r = rankMap[c.id];
    const s = scoreMap[c.id];
    if (r == null || s == null) return false;
    if (r < 1 || r > 12) return false;
    if (s < 0 || s > 60) return false;
    return true;
  });

  function validateLogic(
    selectedCompetitors: Competitor[],
    rankMap: Record<string, number | undefined>,
    scoreMap: Record<string, number | undefined>
  ): boolean {
    const results = selectedCompetitors.map((c) => ({
      id: c.id,
      rank12: rankMap[c.id] ?? 12,
      score: scoreMap[c.id] ?? 0,
    }));
  
    results.sort((a, b) => a.rank12 - b.rank12);
  
    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i];
      const next = results[i + 1];
      if (current.rank12 === next.rank12) {
        if (current.score !== next.score) {
          return false;
        }
      } else {
        if (current.rank12 < next.rank12) {
          if (current.score <= next.score) return false;
        } else {
          // Rank not strictly increasing => false
          return false;
        }
      }
    }
    return true;
  }  

  const handleNext = () => {
    if (!isAllValid) {
      alert("Les résultats sont en dehors des limites.");
      return;
    }
    const logicOk = validateLogic(selectedCompetitors, rankMap, scoreMap);
    if (!logicOk) {
      alert("Logique rang/score incorrecte (ex: 2e a un score supérieur ou égale au 1er).");
      return;
    }
    const competitorIds = selectedCompetitors.map((c) => c.id).join(",");
    const rankJson = JSON.stringify(rankMap);
    const scoreJson = JSON.stringify(scoreMap);
    router.push(
      `/races/summary?ids=${competitorIds}&rankMap=${rankJson}&scoreMap=${scoreJson}`
    );
  };

  const handleChangeRank = (competitorId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setRankMap((prev) => ({
      ...prev,
      [competitorId]: isNaN(parsed) ? undefined : parsed,
    }));
  };

  const handleChangeScore = (competitorId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setScoreMap((prev) => ({
      ...prev,
      [competitorId]: isNaN(parsed) ? undefined : parsed,
    }));
  };

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
      <h1 className="text-title">Ajouter une course</h1>
      <p className="text-neutral-300 text-regular mb-4">
        Donne le classement (1..12) et le score (0..60) de chacun
      </p>
      <div className="space-y-6">
        {selectedCompetitors.map((c) => (
          <div key={c.id}>
            <p className="text-heading mb-2">
              {c.firstName} {c.lastName}
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-neutral-300 text-regular">
                  Rang (1..12)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="w-full p-2 bg-neutral-800 text-neutral-300 text-regular rounded border border-neutral-750"
                  value={rankMap[c.id] ?? ""}
                  onChange={(e) => handleChangeRank(c.id, e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-neutral-300 text-regular">Score (0..60)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  className="w-full p-2 bg-neutral-800 text-neutral-300 text-regular rounded border border-neutral-750"
                  value={scoreMap[c.id] ?? ""}
                  onChange={(e) => handleChangeScore(c.id, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <button
          className="flex-1 p-3 bg-transparent border-2 border-primary-500 rounded text-primary-500"
          onClick={() => router.back()}
        >
          Précédent
        </button>
        <button
          className={`flex-1 p-3 rounded text-bold ${
            isAllValid && validateLogic(selectedCompetitors, rankMap, scoreMap)
              ? "bg-primary-500 text-neutral-900"
              : "bg-neutral-500 text-neutral-600"
          }`}
          onClick={handleNext}
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default ScoreSetupPage;
