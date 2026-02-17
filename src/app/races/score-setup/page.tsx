"use client";

import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppContext } from "@/app/context/AppContext";
import Image from "next/image";
import { MdArrowBack, MdOutlineCheckCircle, MdImage, MdExpandMore } from "react-icons/md";
import { get as idbGet } from "idb-keyval";
import { toast } from "sonner";
import { scoreSetupSchema, ScoreSetupFormData } from "@/app/schemas";
import { Button } from "@/app/components/ui";

const ScoreSetupPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCompetitors } = useContext(AppContext);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ScoreSetupFormData>({
    resolver: zodResolver(scoreSetupSchema),
    mode: "onChange",
    defaultValues: {
      scores: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "scores",
  });

  useEffect(() => {
    const ids = searchParams.get("ids");

    if (!ids) return;

    const competitorIds = ids.split(",").filter(id => id !== '');
    const found = allCompetitors.filter((c) => competitorIds.includes(c.id));

    // Initialize form with competitors
    const initialScores = found.map((competitor) => {
      const rank = searchParams.get(`rank_${competitor.id}`);
      const score = searchParams.get(`score_${competitor.id}`);

      return {
        competitorId: competitor.id,
        rank: rank ? parseInt(rank, 10) : 1,
        score: score ? parseInt(score, 10) : null,
      };
    });

    setValue("scores", initialScores);
  }, [searchParams, allCompetitors, setValue]);

  const onSubmit = async (data: ScoreSetupFormData) => {
    try {
      // Construire les paramètres pour la page suivante
      const params = new URLSearchParams();
      const competitorIds = data.scores.map(s => s.competitorId);
      params.set('ids', competitorIds.join(','));

      // Ajouter les scores et rangs
      data.scores.forEach(s => {
        params.set(`rank_${s.competitorId}`, s.rank.toString());
        params.set(`score_${s.competitorId}`, (s.score as number).toString());
      });

      router.push(`/races/summary?${params.toString()}`);
    } catch (error) {
      toast.error("Erreur lors de la validation");
      console.error(error);
    }
  };

  const isFromAnalysis = searchParams.get("fromAnalysis") === "true";
  const selectedCompetitors = allCompetitors.filter((c) =>
    fields.some(f => f.competitorId === c.id)
  );

  // Race image from sessionStorage
  const [raceImageUrl, setRaceImageUrl] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState(isFromAnalysis);

  useEffect(() => {
    idbGet<string>("raceImage").then((stored) => {
      if (stored) setRaceImageUrl(stored);
    });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      {/* Back button + title */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams();
            params.set('ids', selectedCompetitors.map(c => c.id).join(','));
            router.push(`/races/add?${params.toString()}`);
          }}
          ariaLabel="Retour"
        >
          <MdArrowBack size={26} />
        </Button>
        <h1 className="text-xl font-bold">Configuration du score</h1>
      </div>

      {/* Notification for auto-detected results */}
      {isFromAnalysis && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-primary-500/15 to-primary-400/10 p-4 flex items-start gap-3 ring-1 ring-primary-500/30">
          <MdOutlineCheckCircle size={24} className="shrink-0 text-primary-400 mt-0.5" />
          <p className="text-sm text-neutral-100 leading-relaxed">
            Les résultats des joueurs ont été&nbsp;pré-remplis grâce à
            l&apos;analyse&nbsp;d&apos;image. Vérifie-les et ajuste si nécessaire !
          </p>
        </div>
      )}

      {/* Collapsible race image */}
      {raceImageUrl && (
        <div className="mb-6">
          <button
            type="button"
            className="w-full flex items-center gap-2 p-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 transition-colors"
            onClick={() => setImageExpanded(!imageExpanded)}
          >
            <MdImage size={20} className="text-neutral-400" />
            <span className="text-sm font-medium text-neutral-200 flex-1 text-left">
              Photo de référence
            </span>
            <MdExpandMore
              size={20}
              className={`text-neutral-400 transition-transform ${
                imageExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {imageExpanded && (
            <div className="mt-2 rounded-lg overflow-hidden border border-neutral-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={raceImageUrl}
                alt="Photo de la course"
                className="w-full max-h-[300px] object-contain bg-neutral-950"
              />
            </div>
          )}
        </div>
      )}

      {/* Explication */}
      <p className="text-sm text-neutral-300 mb-8">
        Indique le rang (1 à 12) et le score (0 à 60) pour chacun des joueurs
        sélectionnés.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, () => toast.error('Corrige les erreurs avant de continuer'))} className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const competitor = allCompetitors.find(c => c.id === field.competitorId);
          if (!competitor) return null;

          return (
            <div key={field.id} className={`p-4 rounded ${
              errors.scores?.[index]?.rank || errors.scores?.[index]?.score
                ? 'bg-error-500/5 ring-1 ring-error-500/40'
                : 'bg-neutral-800'
            }`}>
              {/* Labels row */}
              <div className="flex justify-end gap-6 mb-1">
                <p className="w-14 text-xs text-neutral-400 font-semibold uppercase text-center">
                  Rang
                </p>
                <p className="w-14 text-xs text-neutral-400 font-semibold uppercase text-center">
                  Score
                </p>
              </div>

              {/* Content row: Avatar + name aligned with inputs */}
              <div className="flex items-center justify-between">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={competitor.profilePictureUrl}
                      alt={competitor.firstName}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="text-base font-medium text-neutral-100 truncate max-w-[140px]">
                    {competitor.firstName} {competitor.lastName.slice(0, 3)}.
                  </span>
                </div>

                {/* Inputs */}
                <div className="flex items-center gap-6">
                  {/* Rank input */}
                  <div className="text-center">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className={`w-14 h-10 bg-neutral-900 border rounded text-center
                                 text-neutral-100 focus:outline-none transition-colors
                                 ${errors.scores?.[index]?.rank
                                   ? 'border-error-500 focus:border-error-500'
                                   : 'border-neutral-700 focus:border-primary-500'}`}
                      defaultValue={field.rank}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : 1;
                        setValue(`scores.${index}.rank`, value, { shouldValidate: true });
                      }}
                    />
                    {errors.scores?.[index]?.rank && (
                      <p className="text-error-500 text-xs mt-1">
                        {errors.scores[index]?.rank?.message}
                      </p>
                    )}
                  </div>

                  {/* Score input */}
                  <div className="text-center">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      className={`w-14 h-10 bg-neutral-900 border rounded text-center
                                 text-neutral-100 focus:outline-none transition-colors
                                 ${errors.scores?.[index]?.score
                                   ? 'border-error-500 focus:border-error-500'
                                   : 'border-neutral-700 focus:border-primary-500'}`}
                      defaultValue={field.score ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
                        setValue(`scores.${index}.score`, value, { shouldValidate: true });
                      }}
                    />
                    {errors.scores?.[index]?.score && (
                      <p className="text-error-500 text-xs mt-1">
                        {errors.scores[index]?.score?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer : continue button */}
        <div className="mt-8">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            Continuer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ScoreSetupPage;
