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
  .superRefine((data, ctx) => {
    // Track which indices already have an error to avoid duplicates
    const flagged = new Set<number>();

    // 1. Check for null scores — target each empty field individually
    data.scores.forEach((s, i) => {
      if (s.score === null) {
        flagged.add(i);
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Le score est requis',
          path: ['scores', i, 'score'],
        });
      }
    });

    // 2. Skip rank/score consistency if any score is missing
    if (flagged.size > 0) return;

    // Build sorted copy keeping original index
    const withIndex = data.scores.map((s, i) => ({ ...s, originalIndex: i }));
    withIndex.sort((a, b) => a.rank - b.rank);

    for (let i = 0; i < withIndex.length - 1; i++) {
      const current = withIndex[i];
      const next = withIndex[i + 1];

      if (current.rank === next.rank) {
        // Same rank => scores must be identical
        if (current.score !== next.score) {
          if (!flagged.has(current.originalIndex)) {
            flagged.add(current.originalIndex);
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Rang ${current.rank} ex-æquo : les scores doivent être identiques`,
              path: ['scores', current.originalIndex, 'score'],
            });
          }
          if (!flagged.has(next.originalIndex)) {
            flagged.add(next.originalIndex);
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Rang ${next.rank} ex-æquo : les scores doivent être identiques`,
              path: ['scores', next.originalIndex, 'score'],
            });
          }
        }
      } else if (current.rank < next.rank) {
        // Better rank (lower number) => score must be strictly higher
        if ((current.score as number) <= (next.score as number)) {
          if (!flagged.has(current.originalIndex)) {
            flagged.add(current.originalIndex);
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Rang ${current.rank} doit avoir un score supérieur au rang ${next.rank}`,
              path: ['scores', current.originalIndex, 'score'],
            });
          }
          if (!flagged.has(next.originalIndex)) {
            flagged.add(next.originalIndex);
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Rang ${next.rank} doit avoir un score inférieur au rang ${current.rank}`,
              path: ['scores', next.originalIndex, 'score'],
            });
          }
        }
      }
    }
  });

export type CompetitorScoreData = z.infer<typeof competitorScoreSchema>;
export type ScoreSetupFormData = z.infer<typeof scoreSetupSchema>;
