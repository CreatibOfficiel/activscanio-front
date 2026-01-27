# Plan : Amélioration UX de la sélection de personnages

## Objectif
Afficher **tous les personnages** (disponibles ET pris) dans la même grille, avec un état visuel distinct pour les personnages déjà pris par un autre joueur.

## Design visuel

### Personnage disponible
```
┌─────────────────┐
│     [image]     │
│                 │
│     Mario       │
│   4 couleurs    │
│                 │
│  hover: border  │
└─────────────────┘
```

### Personnage pris (indisponible)
```
┌─────────────────┐
│  [image 50%     │
│   opacity]      │
│   👤 avatar     │  ← petit avatar du joueur (coin bas-droite)
│     Mario       │
│   Pris par      │
│   Thibaud       │
│  cursor: not-   │
│  allowed        │
└─────────────────┘
```

## Indicateurs visuels pour état "pris"

- [x] **Opacité réduite** : image à 50-60%
- [x] **Badge avatar** : petit avatar du joueur qui l'a pris (coin bas-droite de l'image)
- [x] **Texte** : "Pris par [Prénom]" sous le nom du personnage
- [x] **Pas de hover effect** : pas de changement au survol
- [x] **Curseur** : `cursor-not-allowed`
- [x] **Bordure** : bordure neutre (pas de highlight possible)

---

## Étapes de réalisation

### 1. Backend - Modifier l'endpoint `/base-characters/available`

**Fichier** : `mushroom-bet-api/src/base-characters/base-characters.service.ts`

**Changement** : Créer un nouvel endpoint ou modifier l'existant pour retourner TOUS les personnages avec l'info de disponibilité.

**Nouvelle structure de réponse** :
```typescript
interface BaseCharacterWithAvailability {
  id: string;
  name: string;
  imageUrl: string;
  variants: CharacterVariantWithAvailability[];
}

interface CharacterVariantWithAvailability {
  id: string;
  label: string;
  imageUrl: string;
  isAvailable: boolean;
  takenBy?: {
    firstName: string;
    profilePictureUrl?: string;
  };
}
```

**Actions** :
- [x] Modifier `findAllWithAvailableVariants()` → `findAllWithAvailabilityStatus()`
- [x] Ne plus filtrer les variantes prises, mais ajouter `isAvailable` et `takenBy`
- [x] Charger la relation `variants.competitor` pour récupérer les infos du joueur

---

### 2. Backend - Mettre à jour le controller

**Fichier** : `mushroom-bet-api/src/base-characters/base-characters.controller.ts`

**Actions** :
- [x] Renommer ou ajouter endpoint `/base-characters/all-with-status`
- [x] Garder `/base-characters/available` pour rétro-compatibilité si nécessaire

---

### 3. Frontend - Mettre à jour le modèle TypeScript

**Fichier** : `mushroom-bet-app/src/app/models/Character.ts`

**Actions** :
- [x] Ajouter les nouveaux types :
```typescript
export interface CharacterVariantWithAvailability extends CharacterVariant {
  isAvailable: boolean;
  takenBy?: {
    firstName: string;
    profilePictureUrl?: string;
  };
}

export interface BaseCharacterWithAvailability extends Omit<BaseCharacter, 'variants'> {
  variants: CharacterVariantWithAvailability[];
}
```

---

### 4. Frontend - Mettre à jour le Repository

**Fichier** : `mushroom-bet-app/src/app/repositories/OnboardingRepository.ts`

**Actions** :
- [x] Ajouter `getAllBaseCharactersWithStatus()` pour appeler le nouvel endpoint
- [x] Mettre à jour le type de retour

---

### 5. Frontend - Mettre à jour la page d'onboarding

**Fichier** : `mushroom-bet-app/src/app/onboarding/page.tsx`

**Actions** :
- [x] Mettre à jour les types utilisés (`BaseCharacterWithAvailability`)
- [x] Modifier le rendu de la grille de personnages :
  - Ajouter les classes conditionnelles pour l'état "pris"
  - Ajouter le badge avatar
  - Ajouter le texte "Pris par [Prénom]"
  - Désactiver le clic sur les personnages pris
  - Changer le curseur

**Classes CSS conditionnelles** :
```tsx
<Card
  className={`
    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-500'}
  `}
  onClick={isAvailable ? () => handleSelect(character) : undefined}
>
```

---

### 6. Frontend - Même logique pour la sélection de variantes

**Actions** :
- [x] Appliquer le même design aux variantes dans l'étape `VARIANT_SELECT`
- [x] Afficher quelle variante est prise et par qui

---

## Cas particuliers à gérer

1. **Personnage avec toutes les variantes prises** : Afficher le personnage grisé avec texte "Toutes les couleurs prises"

2. **Personnage avec certaines variantes disponibles** : Afficher normalement, les variantes prises seront grisées à l'étape suivante

3. **Hover sur personnage pris** : Optionnel - afficher un tooltip "Ce personnage est pris par [Prénom]"

---

## Tests à effectuer

- [ ] Vérifier que tous les personnages s'affichent (disponibles + pris)
- [ ] Vérifier que le clic ne fonctionne pas sur les personnages pris
- [ ] Vérifier l'affichage du badge avatar
- [ ] Vérifier l'affichage sur mobile (responsive)
- [ ] Vérifier que l'onboarding fonctionne toujours correctement
- [ ] Tester avec un personnage qui a plusieurs variantes (certaines prises, d'autres non)

---

## Estimation

| Étape | Complexité |
|-------|------------|
| 1. Backend service | Faible |
| 2. Backend controller | Faible |
| 3. Frontend modèle | Faible |
| 4. Frontend repository | Faible |
| 5. Frontend page onboarding | Moyenne |
| 6. Variantes | Faible |
| **Total** | ~30-45 min |
