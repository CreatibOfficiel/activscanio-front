"use client";

import { NextPage } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { RaceResult } from "@/app/models/RaceResult";
import RaceResultEloSummary from "@/app/components/elo/RaceResultEloSummary";
import { MdArrowBack } from "react-icons/md";

const RaceSummaryPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRaceEvent, allCompetitors } = useContext(AppContext);

  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);

  // Update selected competitors and results when the search params change
  useEffect(() => {
    const ids = searchParams.get("ids");
    if (!ids) return;

    const competitorIds = ids.split(",");
    const found = allCompetitors.filter((c) => competitorIds.includes(c.id));
    setSelectedCompetitors(found);

    // Construire les résultats à partir des paramètres d'URL
    const raceResults: RaceResult[] = found.map((c) => {
      const rank = searchParams.get(`rank_${c.id}`);
      const score = searchParams.get(`score_${c.id}`);
      return {
        competitorId: c.id,
        rank12: rank ? parseInt(rank, 10) : 12,
        score: score ? parseInt(score, 10) : 0,
      };
    });

    // Trier par rang
    raceResults.sort((a, b) => a.rank12 - b.rank12);
    setResults(raceResults);
  }, [searchParams, allCompetitors]);

  const handleValidate = async () => {
    await addRaceEvent(results);
    alert("Course ajoutée avec succès !");
    router.push("/");
  };

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
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
