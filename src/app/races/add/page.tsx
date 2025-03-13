"use client";

import { NextPage } from "next";
import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import CheckableCompetitorItem from "@/app/components/competitor/CheckableCompetitorItem";

const AddRacePage: NextPage = () => {
  const router = useRouter();
  const { allCompetitors, isLoading } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    []
  );

  const filteredCompetitors = allCompetitors.filter((c) => {
    const fullName = (c.firstName + " " + c.lastName).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const toggleSelection = (competitor: Competitor) => {
    setSelectedCompetitors((prev) => {
      if (prev.includes(competitor)) {
        return prev.filter((cmp) => cmp.id !== competitor.id);
      } else if (prev.length < 4) {
        return [...prev, competitor];
      }
      return prev;
    });
  };

  const onNext = () => {
    if (selectedCompetitors.length === 4) {
      const ids = selectedCompetitors.map((c) => c.id).join(",");
      router.push(`/races/score-setup?ids=${ids}`);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-6 bg-neutral-900 text-neutral-100">
      <h1 className="text-title">Ajouter une course</h1>
      <p className="text-neutral-300 text-regular mb-4">Qui participe ?</p>

      {isLoading ? (
        <p className="text-neutral-300 text-regular">Chargement...</p>
      ) : (
        <>
          {/* Search field */}
          <div className="mb-4">
            <label className="block text-heading text-neutral-300 mb-2">Recherche</label>
            <input
              type="text"
              placeholder="Entrez un prénom ou un nom"
              className="w-full h-12 bg-neutral-800 text-neutral-300 text-regular rounded px-4 border border-neutral-750"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add competitor button */}
          <div
            className="flex items-center mb-2 p-2 rounded cursor-pointer bg-neutral-800 hover:bg-neutral-700"
            onClick={() => router.push("/competitors/add")}
          >
            <div className="w-12 h-12 flex items-center justify-center border border-neutral-500 rounded text-primary-500 text-xl">
              +
            </div>
            <span className="ml-4 text-neutral-300 text-regular">
              Ajouter un·e compétiteur·trice
            </span>
          </div>

          {/* Competitors list */}
          <div className="mt-4 flex flex-col gap-2">
            {filteredCompetitors.map((competitor) => (
              <CheckableCompetitorItem
                key={competitor.id}
                competitor={competitor}
                isSelected={selectedCompetitors.includes(competitor)}
                toggleSelection={toggleSelection}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-6 mb-20 flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 h-12 border-2 border-primary-500 text-primary-500 rounded text-bold"
        >
          Annuler
        </button>
        <button
          onClick={onNext}
          className={`flex-1 h-12 rounded text-bold ${
            selectedCompetitors.length === 4
              ? "bg-primary-500 text-neutral-900"
              : "bg-neutral-500 text-neutral-600"
          }`}
        >
          {selectedCompetitors.length}/4
        </button>
      </div>
    </div>
  );
};

export default AddRacePage;
