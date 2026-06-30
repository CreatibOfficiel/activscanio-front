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
  { type: DuelConditionType.MARGIN_GREATER, label: "Écart en ma faveur", needsValue: true },
  { type: DuelConditionType.MARGIN_BETWEEN, label: "Écart minimum", needsValue: true },
  { type: DuelConditionType.EXACT_TIE, label: "Égalité", needsValue: false },
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
    <div className="flex flex-col gap-5">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="self-start flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <span>&larr;</span>
        <span>Retour</span>
      </button>

      {/* Opponent */}
      <div className="flex flex-col items-center gap-2">
        <UserAvatar
          src={competitorAvatar}
          name={competitorName}
          size="xl"
          className="border-2 border-neutral-600"
        />
        <p className="text-bold text-white">{competitorName}</p>
      </div>

      {/* Stake selection — 2-col grid of cards */}
      <div>
        <p className="text-sub text-neutral-400 mb-2">Qu&apos;est-ce qu&apos;on parie ?</p>
        <div role="radiogroup" aria-label="Enjeu" className="grid grid-cols-2 gap-2">
          {STAKE_OPTIONS.map((option) => (
            <label
              key={option.type}
              className="flex items-center gap-2.5 min-h-[52px] px-3 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/60 cursor-pointer transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-500/10 has-[:checked]:ring-1 has-[:checked]:ring-primary-500 active:scale-[0.98]"
            >
              <input
                type="radio"
                name="stake"
                value={option.type}
                checked={stakeType === option.type}
                onChange={() => setStakeType(option.type)}
                className="sr-only"
              />
              <span className="text-xl leading-none">{option.emoji}</span>
              <span className="text-sm font-medium text-neutral-200 truncate">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        {isCustom && (
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            maxLength={40}
            placeholder="Un café, un kebab, le ménage…"
            className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
          />
        )}
      </div>

      {/* Optional condition — styled toggle */}
      <div>
        <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer select-none">
          <span className="text-sm font-medium text-neutral-200">
            Ajouter une condition (prono)
          </span>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              role="switch"
              checked={conditionOn}
              onChange={(e) => setConditionOn(e.target.checked)}
              className="sr-only peer"
            />
            <span className="block w-11 h-6 rounded-full bg-neutral-700 transition-colors duration-200 peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5" />
          </span>
        </label>

        {conditionOn && (
          <div className="mt-3 flex flex-col gap-3">
            {/* Segmented control — condition type */}
            <div
              role="radiogroup"
              aria-label="Type de condition"
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-800"
            >
              {CONDITION_OPTIONS.map((c) => (
                <label
                  key={c.type}
                  className="relative flex items-center justify-center min-h-[44px] px-1 text-center rounded-lg text-xs font-medium text-neutral-400 cursor-pointer transition-colors has-[:checked]:bg-neutral-700 has-[:checked]:text-white has-[:checked]:shadow-sm hover:text-neutral-200"
                >
                  <input
                    type="radio"
                    name="conditionType"
                    value={c.type}
                    checked={conditionType === c.type}
                    onChange={() => setConditionType(c.type)}
                    className="sr-only"
                  />
                  {c.label}
                </label>
              ))}
            </div>

            {needsValue && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={conditionValue}
                  onChange={(e) => setConditionValue(Number(e.target.value))}
                  className="w-24 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500"
                />
                <span className="text-sm text-neutral-400">points d&apos;écart</span>
              </div>
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
