"use client";

import { FC, useState } from "react";
import { useUser } from "@clerk/nextjs";
import MyDuelsSection from "@/app/components/duel/MyDuelsSection";
import DuelFeedSection from "@/app/components/duel/DuelFeedSection";

const DuelsPage: FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"my" | "feed">("my");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-title text-white">Duels</h1>

      {/* Tabs */}
      <div className="flex bg-neutral-800 rounded-lg p-1 gap-1">
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
            activeTab === "my"
              ? "bg-primary-500 text-neutral-900"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Mes duels
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
            activeTab === "feed"
              ? "bg-primary-500 text-neutral-900"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Feed
        </button>
      </div>

      {/* Content */}
      {activeTab === "my" ? (
        <MyDuelsSection currentUserId={user?.id} />
      ) : (
        <DuelFeedSection currentUserId={user?.id} />
      )}
    </div>
  );
};

export default DuelsPage;
