import { z } from 'zod';

/**
 * Schema for a single competitor's score entry
 */
export const competitorScoreSchema = z.object({
  competitorId: z.string(),
  rank: z
    .number()
    .int('Le rang doit être un nombre entier')
    .min(1, 'Le rang minimum est 1')
    .max(12, 'Le rang maximum est 12'),
  score: z
    .number()
    .int('Le score doit être un nombre entier')
    .min(0, 'Le score minimum est 0')
    .max(60, 'Le score maximum est 60')
    .nullable(),
});

/**
 * Validation schema for score setup
 * Validates an array of competitor scores with cross-validation logic:
 * - Same rank => same score
 * - Higher rank (lower number) => higher score
 */
export const scoreSetupSchema = z
  .object({
    scores: z.array(competitorScoreSchema).min(2, 'Au moins 2 pilotes requis'),
  })
  .refine(
    (data) => data.scores.every((s) => s.score !== null),
    {
      message: 'Tous les scores doivent être remplis',
    }
  )
  .refine(
    (data) => {
      // Skip rank/score check if any score is null (caught by previous refine)
      if (data.scores.some((s) => s.score === null)) return true;

      // Sort by rank
      const sorted = [...data.scores].sort((a, b) => a.rank - b.rank);

      // Check consistency between ranks and scores
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // Same rank => scores must be identical
        if (current.rank === next.rank) {
          if (current.score !== next.score) {
            return false;
          }
        } else if (current.rank < next.rank) {
          // Better rank (lower number) => score must be higher
          if ((current.score as number) <= (next.score as number)) {
            return false;
          }
        }
      }

      return true;
    },
    {
      message:
        'Incohérence rang/score détectée : un meilleur classement doit avoir un score supérieur',
    }
  );

export type CompetitorScoreData = z.infer<typeof competitorScoreSchema>;
export type ScoreSetupFormData = z.infer<typeof scoreSetupSchema>;
