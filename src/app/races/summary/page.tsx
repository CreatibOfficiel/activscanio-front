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

  useEffect(() => {
    const ids = searchParams.get("ids");
    const rankMapStr = searchParams.get("rankMap");
    const scoreMapStr = searchParams.get("scoreMap");

    // Check that we have everything
    if (!ids || !rankMapStr || !scoreMapStr) return;

    const competitorIds = ids.split(",");
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
        {/* Flèche de retour en haut à gauche */}
        <div className="flex items-center gap-3 mb-6">
          <button
              onClick={() => router.back()}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <MdArrowBack size={26} />
          </button>
          {/* Titre principal */}
          <h1 className="text-xl font-bold">Ajouter une course</h1>
        </div>

        {/* Texte explicatif */}
        <p className="text-neutral-300 text-sm mb-6">
          L&apos;estimation de l&apos;Élo affichée peut différer du calcul final (bonus, malus...).
        </p>

        <RaceResultEloSummary results={results} selectedCompetitors={selectedCompetitors} />

        {/* Un seul bouton "Valider" sur toute la largeur */}
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
