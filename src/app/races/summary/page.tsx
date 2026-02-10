"use client";

import { NextPage } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { RaceResult } from "@/app/models/RaceResult";
import RaceResultEloSummary from "@/app/components/elo/RaceResultEloSummary";
import { MdArrowBack } from "react-icons/md";

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

const RaceSummaryPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRaceEvent, allCompetitors } = useContext(AppContext);

  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (!ids) return;

    const competitorIds = parseCompetitorIds(ids);
    const found = allCompetitors.filter((c) => competitorIds.includes(c.id));
    setSelectedCompetitors(found);

    const raceResults = buildRaceResults(found, searchParams);
    setResults(raceResults);
  }, [searchParams, allCompetitors]);

  const handleValidate = async () => {
    await addRaceEvent(results);
    sessionStorage.removeItem("raceImage");
    alert("Course ajoutée avec succès !");
    router.push("/");
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
          className="w-full h-12 rounded font-semibold bg-primary-500 text-neutral-900"
          onClick={handleValidate}
        >
          Valider
        </button>
      </div>
    </div>
  );
};

export default RaceSummaryPage;
