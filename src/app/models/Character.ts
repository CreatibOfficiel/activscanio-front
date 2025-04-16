export interface BaseCharacter {
  id: string;
  name: string; // "Yoshi", "Mario", "Peach"
  variants: CharacterVariant[];
}

export interface CharacterVariant {
  id: string;
  label: string; // "Red", "Green", "Pink", etc. or "Default" if BaseCharacter has only one variant
  baseCharacterId: string;
}
