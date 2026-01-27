export interface BaseCharacter {
  id: string;
  name: string; // "Yoshi", "Mario", "Peach"
  imageUrl: string; // Default image for the character (e.g., "/characters/yoshi/green.png")
  variants: CharacterVariant[];
}

export interface CharacterVariant {
  id: string;
  label: string; // "Red", "Green", "Pink", etc. or "Default" if BaseCharacter has only one variant
  imageUrl: string; // Image for this specific variant (e.g., "/characters/yoshi/red.png")
  baseCharacter: { id: string; name: string; imageUrl?: string };
}

// Extended types with availability status (for onboarding)
export interface CharacterVariantWithAvailability {
  id: string;
  label: string;
  imageUrl: string;
  isAvailable: boolean;
  takenBy?: {
    firstName: string;
    profilePictureUrl?: string;
  };
}

export interface BaseCharacterWithAvailability {
  id: string;
  name: string;
  imageUrl: string;
  variants: CharacterVariantWithAvailability[];
  hasAvailableVariants: boolean;
}
