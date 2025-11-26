import { z } from 'zod';

/**
 * Validation schema for placing a bet
 */
export const placeBetSchema = z.object({
  competitorId: z
    .string()
    .min(1, 'Veuillez sélectionner un compétiteur'),
  amount: z
    .number()
    .positive('Le montant doit être supérieur à 0')
    .int('Le montant doit être un nombre entier')
    .max(10000, 'Le montant ne peut pas dépasser 10 000'),
});

export type PlaceBetFormData = z.infer<typeof placeBetSchema>;
