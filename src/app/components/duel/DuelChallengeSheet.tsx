"use client";

import { FC, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Button from "../ui/Button";
import UserAvatar from "../ui/UserAvatar";
import { DuelRepository } from "@/app/repositories/DuelRepository";
import {
  StakeType,
  DuelConditionType,
  STAKE_OPTIONS,
  CreateDuelParams,
} from "@/app/models/Duel";
import { toast } from "sonner";

interface DuelChallengeFormProps {
  competitorId: string;
  competitorName: string;
  competitorAvatar?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CONDITION_OPTIONS: {
  type: DuelConditionType;
  label: string;
  needsValue: boolean;
}[] = [
  { type: DuelConditionType.MARGIN_GREATER, label: "Je gagne avec + de X pts d'écart", needsValue: true },
  { type: DuelConditionType.MARGIN_BETWEEN, label: "Il y a au moins X pts d'écart entre nous", needsValue: true },
  { type: DuelConditionType.EXACT_TIE, label: "On finit à égalité", needsValue: false },
];

const conditionPreview = (
  type: DuelConditionType,
  value: number,
): string => {
  switch (type) {
    case DuelConditionType.MARGIN_GREATER:
      return `Tu gagnes seulement si : tu finis devant ET écart > ${value} pts`;
    case DuelConditionType.MARGIN_BETWEEN:
      return `Tu gagnes seulement si : écart entre vous ≥ ${value} pts`;
    case DuelConditionType.EXACT_TIE:
      return `Tu gagnes seulement si : vous finissez à égalité`;
    default:
      return "";
  }
};

const DuelChallengeForm: FC<DuelChallengeFormProps> = ({
  competitorId,
  competitorName,
  competitorAvatar,
  onSuccess,
  onCancel,
}) => {
  const { getToken } = useAuth();
  const [stakeType, setStakeType] = useState<StakeType>(StakeType.BEER);
  const [customLabel, setCustomLabel] = useState("");
  const [conditionOn, setConditionOn] = useState(false);
  const [conditionType, setConditionType] = useState<DuelConditionType>(
    DuelConditionType.MARGIN_GREATER,
  );
  const [conditionValue, setConditionValue] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCondition = CONDITION_OPTIONS.find((c) => c.type === conditionType);
  const needsValue = conditionOn && selectedCondition?.needsValue;
  const isCustom = stakeType === StakeType.CUSTOM;

  const canSubmit =
    (!isCustom || customLabel.trim().length > 0) &&
    (!needsValue || conditionValue >= 1);

  const handleChallenge = async () => {
    if (!canSubmit) return;
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const params: CreateDuelParams = { stakeType };
      if (isCustom) params.stakeLabel = customLabel.trim();
      if (conditionOn) {
        params.conditionType = conditionType;
        if (selectedCondition?.needsValue) params.conditionValue = conditionValue;
      }

      await DuelRepository.createDuel(competitorId, params, token);
      toast.success(`Défi envoyé à ${competitorName} !`);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création du défi";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onCancel}
        className="self-start flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <span>&larr;</span>
        <span>Retour</span>
      </button>

      <div className="flex flex-col items-center gap-2">
        <UserAvatar
          src={competitorAvatar}
          name={competitorName}
          size="xl"
          className="border-2 border-neutral-600"
        />
        <p className="text-bold text-white">{competitorName}</p>
      </div>

      {/* Stake selection — real-world items */}
      <div className="w-full">
        <p className="text-sub text-neutral-400 mb-2 text-center">Qu&apos;est-ce qu&apos;on parie ?</p>
        <div className="grid grid-cols-5 gap-2">
          {STAKE_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => setStakeType(option.type)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                stakeType === option.type
                  ? "bg-primary-500 text-neutral-900 ring-2 ring-primary-400"
                  : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              }`}
            >
              <span className="text-xl">{option.emoji}</span>
              <span className="text-[10px] leading-tight text-center">
                {option.label}
              </span>
            </button>
          ))}
        </div>
        {isCustom && (
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            maxLength={40}
            placeholder="Un café, un kebab, le ménage…"
            className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
          />
        )}
      </div>

      {/* Optional condition / prono */}
      <div className="w-full">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={conditionOn}
            onChange={(e) => setConditionOn(e.target.checked)}
            className="accent-primary-500"
          />
          <span className="text-sub text-neutral-300">Ajouter une condition (prono)</span>
        </label>

        {conditionOn && (
          <div className="mt-2 flex flex-col gap-2">
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as DuelConditionType)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c.type} value={c.type}>
                  {c.label}
                </option>
              ))}
            </select>
            {needsValue && (
              <input
                type="number"
                min={1}
                value={conditionValue}
                onChange={(e) => setConditionValue(Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            )}
            <p className="text-xs text-primary-300 bg-primary-500/10 rounded-lg px-3 py-2">
              {conditionPreview(conditionType, conditionValue)}
            </p>
          </div>
        )}
      </div>

      <p className="text-sub text-neutral-500 text-center">
        L&apos;adversaire a 7 jours pour accepter. La course de la semaine tranche.
      </p>

      <Button
        variant="primary"
        fullWidth
        loading={isLoading}
        onClick={handleChallenge}
        disabled={!canSubmit}
      >
        Défier {competitorName}
      </Button>
    </div>
  );
};

export default DuelChallengeForm;
