import type { CharacterVariant } from '@/app/models/Character';

/**
 * The display label for a character variant: "Mario", or "Maskass rouge".
 *
 * The colour is appended only when the character actually has several
 * variants. A character with a single skin carries the label "Default" in
 * database, and "Mario Default" is noise, so it is dropped.
 *
 * This mirrors `labelForVariant` in the backend's `race-analysis.service.ts`,
 * which builds the whitelist sent to the image recognition. Keeping the two
 * in sync matters: what the player reads in the list is what the model is
 * asked to look for.
 *
 * The variant carries `baseCharacter.name` but not the sibling variants, so
 * "has several variants" cannot be read from the variant alone. A label of
 * "Default" is the reliable marker for a single-skin character; for the rest
 * we trust the label.
 */
export function characterLabel(
  variant?: Pick<CharacterVariant, 'label' | 'baseCharacter'> | null,
): string | null {
  if (!variant) return null;

  const name = variant.baseCharacter?.name?.trim();
  if (!name) return null;

  const label = variant.label?.trim();
  if (!label || label === 'Default') return name;

  return `${name} ${label.toLowerCase()}`;
}
