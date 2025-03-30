"use client";

import {NextPage} from "next";
import {useContext, useState} from "react";
import {useRouter} from "next/navigation";
import {AppContext} from "@/app/context/AppContext";
import {Competitor} from "@/app/models/Competitor";
import CheckableCompetitorItem from "@/app/components/competitor/CheckableCompetitorItem";
import { MdPersonAdd } from "react-icons/md";

const MAX_PLAYERS = 4;

const AddRacePage: NextPage = () => {
    const router = useRouter();
    const {allCompetitors, isLoading} = useContext(AppContext);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>([]);

    const filteredCompetitors = allCompetitors.filter((c) => {
        const fullName = (c.firstName + " " + c.lastName).toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    const toggleSelection = (competitor: Competitor) => {
        setSelectedCompetitors((prev) => {
            if (prev.includes(competitor)) {
                return prev.filter((cmp) => cmp.id !== competitor.id);
            } else if (prev.length < MAX_PLAYERS) {
                return [...prev, competitor];
            }
            return prev;
        });
    };

    const onNext = () => {
        if (selectedCompetitors.length === MAX_PLAYERS) {
            const ids = selectedCompetitors.map((c) => c.id).join(",");
            router.push(`/races/score-setup?ids=${ids}`);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-6">
            <div className="max-w-lg mx-auto">
                {/* Titre et sous-titre */}
                <h1 className="text-2xl font-bold mb-1">Ajouter des joueurs</h1>
                <p className="text-sm text-neutral-400 mb-6">
                    Sélectionnez qui va participer…
                </p>

                {isLoading ? (
                    <p className="text-neutral-300">Chargement...</p>
                ) : (
                    <>
                        {/* Barre de recherche */}
                        <div className="relative mb-4">
                            {/* Icône loupe */}
                            <svg
                                className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-4.35-4.35m0 0a7.5 7.5 0 1 0-10.61-10.61 7.5 7.5 0 0 0 10.61 10.61z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Recherche..."
                                className="w-full h-10 bg-neutral-800 text-neutral-100 rounded pl-9 pr-3
                           border border-neutral-700
                           focus:outline-none focus:border-primary-500 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Bouton "Ajouter un joueur" */}
                        <div
                            className="flex items-center mb-6 cursor-pointer bg-neutral-800 hover:bg-neutral-700 transition-colors p-3 rounded"
                            onClick={() => router.push("/competitors/add")}
                        >
                            <MdPersonAdd className="text-2xl text-primary-500 mr-2"/>
                            <span className="text-base text-neutral-100 font-semibold">
                                Ajouter un joueur
                            </span>
                        </div>

                        {/* Liste des joueurs filtrés */}
                        <div className="flex flex-col">
                            {filteredCompetitors.map((competitor) => (
                                <CheckableCompetitorItem
                                    key={competitor.id}
                                    competitor={competitor}
                                    isSelected={selectedCompetitors.includes(competitor)}
                                    toggleSelection={toggleSelection}
                                />
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-neutral-400 mb-4">
                                {selectedCompetitors.length} joueur
                                {selectedCompetitors.length > 1 ? "s" : ""} sélectionné
                                {selectedCompetitors.length > 1 ? "s" : ""}
                            </p>

                            <button
                                onClick={onNext}
                                disabled={selectedCompetitors.length !== MAX_PLAYERS}
                                className={`
                  w-full h-12 rounded font-semibold
                  ${
                                    selectedCompetitors.length === MAX_PLAYERS
                                        ? "bg-primary-500 text-neutral-900"
                                        : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                                }
                `}
                            >
                                Lancer la partie
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddRacePage;
