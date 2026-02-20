"use client";

import { FC, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Duel, DuelStatus } from "@/app/models/Duel";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import DuelCard from "./DuelCard";
import Spinner from "../ui/Spinner";
import { toast } from "sonner";

interface MyDuelsSectionProps {
  currentUserId?: string;
}

const MyDuelsSection: FC<MyDuelsSectionProps> = ({ currentUserId }) => {
  const { getToken } = useAuth();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDuels = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await DuelRepository.getMyDuels(token);
      setDuels(data);
    } catch (error) {
      console.error("Error loading my duels:", error);
    }
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      await loadDuels();
      if (!cancelled) setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [loadDuels]);

  const handleAccept = async (duelId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await DuelRepository.acceptDuel(duelId, token);
      toast.success("Duel accepte !");
      await loadDuels();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error(message);
    }
  };

  const handleDecline = async (duelId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await DuelRepository.declineDuel(duelId, token);
      toast("Duel refuse");
      await loadDuels();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error(message);
    }
  };

  const handleCancel = async (duelId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await DuelRepository.cancelDuel(duelId, token);
      toast("Duel annule");
      await loadDuels();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  const pendingReceived = duels.filter(
    (d) => d.status === DuelStatus.PENDING && d.challengedUser?.clerkId === currentUserId,
  );
  const pendingSent = duels.filter(
    (d) => d.status === DuelStatus.PENDING && d.challengerUser?.clerkId === currentUserId,
  );
  const accepted = duels.filter((d) => d.status === DuelStatus.ACCEPTED);
  const history = duels.filter(
    (d) =>
      d.status === DuelStatus.RESOLVED ||
      d.status === DuelStatus.CANCELLED ||
      d.status === DuelStatus.DECLINED,
  );

  if (duels.length === 0) {
    return (
      <p className="text-center text-neutral-500 py-8 text-regular">
        Aucun duel pour le moment. Defie quelqu&apos;un depuis le classement !
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pending received - most urgent */}
      {pendingReceived.length > 0 && (
        <div>
          <h3 className="text-bold text-amber-400 mb-2">
            A accepter ({pendingReceived.length})
          </h3>
          <div className="flex flex-col gap-2">
            {pendingReceived.map((duel) => (
              <DuelCard
                key={duel.id}
                duel={duel}
                currentUserId={currentUserId}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <div>
          <h3 className="text-bold text-neutral-300 mb-2">
            En attente ({pendingSent.length})
          </h3>
          <div className="flex flex-col gap-2">
            {pendingSent.map((duel) => (
              <DuelCard
                key={duel.id}
                duel={duel}
                currentUserId={currentUserId}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Accepted - waiting for race */}
      {accepted.length > 0 && (
        <div>
          <h3 className="text-bold text-primary-400 mb-2">
            En cours ({accepted.length})
          </h3>
          <div className="flex flex-col gap-2">
            {accepted.map((duel) => (
              <DuelCard key={duel.id} duel={duel} currentUserId={currentUserId} />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-bold text-neutral-400 mb-2">Historique</h3>
          <div className="flex flex-col gap-2">
            {history.slice(0, 10).map((duel) => (
              <DuelCard key={duel.id} duel={duel} currentUserId={currentUserId} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDuelsSection;
