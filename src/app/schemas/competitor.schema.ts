import { z } from 'zod';

const profilePictureUrlSchema = z
  .string()
  .url("L'URL de la photo n'est pas valide")
  .refine(
    (url) => {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return validExtensions.some((ext) => url.toLowerCase().endsWith(ext));
    },
    {
      message: "L'URL doit pointer vers une image valide (jpg, jpeg, png, gif, webp)",
    }
  );

const nameFields = {
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom contient des caractères invalides'),
  lastName: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
};

/**
 * Validation schema for adding a competitor (image optional)
 */
export const addCompetitorSchema = z.object({
  ...nameFields,
  profilePictureUrl: z
    .union([z.literal(''), profilePictureUrlSchema])
    .optional()
    .transform((val) => val || undefined),
});

export type AddCompetitorFormData = z.infer<typeof addCompetitorSchema>;

/**
 * Validation schema for editing a competitor (image required)
 */
export const editCompetitorSchema = z.object({
  ...nameFields,
  profilePictureUrl: z
    .string()
    .min(1, "L'URL de la photo est requise")
    .pipe(profilePictureUrlSchema),
});

export type EditCompetitorFormData = z.infer<typeof editCompetitorSchema>;
