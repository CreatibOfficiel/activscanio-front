"use client";

import { NextPage } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { RaceResult } from "@/app/models/RaceResult";
import RaceResultEloSummary from "@/app/components/elo/RaceResultEloSummary";

const RaceSummaryPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRaceEvent, allCompetitors } = useContext(AppContext);

  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    []
  );
  const [results, setResults] = useState<RaceResult[]>([]);

  useEffect(() => {
    const ids = searchParams.get("ids");
    const rankMapStr = searchParams.get("rankMap");
    const scoreMapStr = searchParams.get("scoreMap");

    // Check that we have everything
    if (!ids || !rankMapStr || !scoreMapStr) return;

    const competitorIds = (ids).split(",");
    const found = allCompetitors.filter((c) => competitorIds.includes(c.id));
    setSelectedCompetitors(found);

    const rankObj = JSON.parse(rankMapStr);
    const scoreObj = JSON.parse(scoreMapStr);

    const raceResults: RaceResult[] = found.map((c) => ({
      competitorId: c.id,
      rank12: rankObj[c.id] ?? 12,
      score: scoreObj[c.id] ?? 0,
    }));
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
      <h1 className="text-title mb-4">Ajouter une course</h1>
      <p className="text-neutral-300 text-regular mb-4">
        L&apos;estimation de l&apos;Élo affichée peut différer du calcul final (bonus, malus...).
      </p>

      <RaceResultEloSummary results={results} selectedCompetitors={selectedCompetitors} />

      <div className="mt-6 flex gap-2">
        <button
          className="flex-1 p-3 bg-transparent border-2 border-primary-500 rounded text-primary-500"
          onClick={() => router.back()}
        >
          Précédent
        </button>
        <button
          className="flex-1 p-3 rounded text-bold bg-primary-500 text-neutral-900"
          onClick={handleValidate}
        >
          Valider
        </button>
      </div>
    </div>
  );
};

export default RaceSummaryPage;
