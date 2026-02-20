"use client";

import { FC, useEffect, useState, useCallback } from "react";
import { Duel } from "@/app/models/Duel";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import DuelCard from "./DuelCard";
import Spinner from "../ui/Spinner";

interface DuelFeedSectionProps {
  currentUserId?: string;
}

const DuelFeedSection: FC<DuelFeedSectionProps> = ({ currentUserId }) => {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadFeed = useCallback(async (offset = 0) => {
    try {
      const result = await DuelRepository.getDuelFeed(10, offset);
      if (offset === 0) {
        setDuels(result.data);
      } else {
        setDuels((prev) => [...prev, ...result.data]);
      }
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading duel feed:", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      await loadFeed(0);
      if (!cancelled) setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [loadFeed]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadFeed(duels.length);
    setIsLoadingMore(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (duels.length === 0) {
    return (
      <p className="text-center text-neutral-500 py-8 text-regular">
        Aucun duel termine pour le moment
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {duels.map((duel) => (
        <DuelCard key={duel.id} duel={duel} currentUserId={currentUserId} compact />
      ))}

      {duels.length < total && (
        <button
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="mt-2 py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors text-center"
        >
          {isLoadingMore ? <Spinner size="sm" /> : "Voir plus"}
        </button>
      )}
    </div>
  );
};

export default DuelFeedSection;
