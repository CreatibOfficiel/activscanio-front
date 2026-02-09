"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { MdClose, MdFilterList, MdKeyboardArrowDown } from "react-icons/md";
import { Competitor } from "@/app/models/Competitor";
import { formatCompetitorName } from "@/app/utils/formatters";

export type PeriodFilter = "all" | "today" | "week" | "month";

export interface FilterState {
  period: PeriodFilter;
  competitorId: string | null;
}

interface Props {
  competitors: Competitor[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
];

const RaceFilters: FC<Props> = ({ competitors, filters, onFilterChange }) => {
  const [showCompetitorDropdown, setShowCompetitorDropdown] = useState(false);
  const [competitorSearch, setCompetitorSearch] = useState("");

  const handlePeriodChange = (period: PeriodFilter) => {
    onFilterChange({ ...filters, period });
  };

  const handleCompetitorChange = (competitorId: string | null) => {
    onFilterChange({ ...filters, competitorId });
    setShowCompetitorDropdown(false);
    setCompetitorSearch("");
  };

  const filteredCompetitors = competitors.filter((c) => {
    if (!competitorSearch) return true;
    const search = competitorSearch.toLowerCase();
    return (
      c.firstName?.toLowerCase().includes(search) ||
      c.lastName?.toLowerCase().includes(search)
    );
  });

  const selectedCompetitor = filters.competitorId
    ? competitors.find((c) => c.id === filters.competitorId)
    : null;

  const hasActiveFilters = filters.period !== "all" || filters.competitorId !== null;

  const resetFilters = () => {
    onFilterChange({ period: "all", competitorId: null });
  };

  return (
    <div className="px-4 pb-4">
      {/* Period chips - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePeriodChange(option.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sub font-medium transition-all duration-200 ${
              filters.period === option.value
                ? "bg-primary-500 text-neutral-900"
                : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:border-neutral-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Competitor filter and reset */}
      <div className="flex items-center gap-2">
        {/* Competitor dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowCompetitorDropdown(!showCompetitorDropdown)}
            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sub transition-all duration-200 ${
              selectedCompetitor
                ? "bg-primary-500/10 text-primary-500 border border-primary-500/30"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MdFilterList className="flex-shrink-0" />
              {selectedCompetitor ? (
                <>
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedCompetitor.profilePictureUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="truncate">
                    {formatCompetitorName(selectedCompetitor.firstName, selectedCompetitor.lastName)}
                  </span>
                </>
              ) : (
                <span>Filtrer par joueur</span>
              )}
            </div>
            <MdKeyboardArrowDown
              className={`flex-shrink-0 transition-transform duration-200 ${
                showCompetitorDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown menu */}
          {showCompetitorDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-neutral-800 rounded-xl border border-neutral-700 shadow-xl max-h-64 overflow-y-auto">
              {/* Search input */}
              <div className="sticky top-0 bg-neutral-800 p-2 border-b border-neutral-700">
                <input
                  type="text"
                  value={competitorSearch}
                  onChange={(e) => setCompetitorSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 bg-neutral-900 text-neutral-200 text-sub rounded-lg border border-neutral-700 focus:border-primary-500 focus:outline-none placeholder:text-neutral-500"
                  autoFocus
                />
              </div>

              {/* All option */}
              {!competitorSearch && (
                <button
                  onClick={() => handleCompetitorChange(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-regular hover:bg-neutral-700/50 transition-colors ${
                    !filters.competitorId ? "text-primary-500" : "text-neutral-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                    <MdFilterList className="text-neutral-400" />
                  </div>
                  <span>Tous les joueurs</span>
                </button>
              )}

              {/* Competitors list */}
              {filteredCompetitors.map((competitor) => (
                <button
                  key={competitor.id}
                  onClick={() => handleCompetitorChange(competitor.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-regular hover:bg-neutral-700/50 transition-colors ${
                    filters.competitorId === competitor.id
                      ? "text-primary-500 bg-primary-500/10"
                      : "text-neutral-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={competitor.profilePictureUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="truncate">
                    {formatCompetitorName(competitor.firstName, competitor.lastName)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex-shrink-0 p-2.5 rounded-xl bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-neutral-300 hover:border-neutral-600 transition-all duration-200"
            aria-label="Réinitialiser les filtres"
          >
            <MdClose className="text-lg" />
          </button>
        )}
      </div>

      {/* Backdrop to close dropdown */}
      {showCompetitorDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowCompetitorDropdown(false); setCompetitorSearch(""); }}
        />
      )}
    </div>
  );
};

export default RaceFilters;
