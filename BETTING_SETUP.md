# Configuration du Système de Paris 🎲

Ce document explique comment configurer et utiliser le système de paris sportifs dans l'application Activscanio.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration de Clerk (Authentification)](#configuration-de-clerk)
3. [Configuration de l'API Backend](#configuration-de-lapi-backend)
4. [Structure des Pages](#structure-des-pages)
5. [Composants Réutilisables](#composants-réutilisables)
6. [API Endpoints](#api-endpoints)

---

## 🎯 Vue d'ensemble

Le système de paris permet aux utilisateurs de:
- Parier sur le podium hebdomadaire (top 3 compétiteurs)
- Appliquer un boost x2 sur un compétiteur
- Gagner des points basés sur les cotes
- Voir leur historique de paris
- Consulter le classement mensuel des parieurs

### Architecture

```
Frontend (Next.js 15.2.2)
  ├─ Pages de paris (/betting/*)
  ├─ Composants UI réutilisables
  ├─ Repository API
  └─ Modèles TypeScript

Backend (NestJS 11)
  ├─ Betting Module
  ├─ Services (OddsCalculator, WeekManager, Finalizer)
  ├─ Cron Jobs (Lundi 00h, Dimanche 23h59, 1er du mois)
  └─ Entities (BettingWeek, Bet, BetPick, etc.)
```

---

## 🔐 Configuration de Clerk

Clerk gère l'authentification des utilisateurs. Pour activer les fonctionnalités de paris:

### 1. Créer un compte Clerk

1. Allez sur [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Créez un compte et une nouvelle application
3. Récupérez vos clés API dans "API Keys"

### 2. Configurer les variables d'environnement

Mettez à jour le fichier `.env`:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
CLERK_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
```

### 3. Décommenter ClerkProvider

Dans `src/app/layout.tsx`, décommentez les lignes ClerkProvider:

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>  {/* Décommentez cette ligne */}
      <html lang="en">
        <body className="bg-neutral-900 text-neutral-100">
          <AppProvider>
            <div className="pb-20">{children}</div>
            <BottomNav />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>  {/* Décommentez cette ligne */}
  );
}
```

### 4. Configuration du Middleware (Optionnel)

Pour protéger certaines routes, créez `src/middleware.ts`:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

---

## ⚙️ Configuration de l'API Backend

### 1. Variables d'environnement

Le frontend doit pointer vers votre backend NestJS:

```bash
# .env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Endpoints disponibles

Le backend NestJS expose les endpoints suivants:

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/betting/current-week` | GET | Récupère la semaine de paris courante |
| `/betting/weeks/:id/odds` | GET | Récupère les cotes pour une semaine |
| `/betting/bets` | POST | Place un pari |
| `/betting/bets/my-bet?weekId=xxx` | GET | Récupère le pari de l'utilisateur |
| `/betting/bets/history` | GET | Historique des paris |
| `/betting/rankings?month=X&year=Y` | GET | Classement mensuel |

### 3. Authentification

Les endpoints nécessitant l'authentification attendent un header:

```
Authorization: Bearer <clerk_token>
```

---

## 📄 Structure des Pages

### `/betting/place-bet` - Placer un pari

**Fonctionnalités:**
- Affiche la semaine courante
- Liste les compétiteurs éligibles avec leurs cotes
- Sélecteur de podium interactif (1er, 2ème, 3ème)
- Bouton boost x2 (optionnel)
- Calcul des gains potentiels en temps réel
- Validation et confirmation

**État:**
- Vérifie si l'utilisateur a déjà parié cette semaine
- Bloque le pari si la semaine est fermée

### `/betting/history` - Historique

**Fonctionnalités:**
- Liste tous les paris passés
- Affiche les résultats (correct/incorrect)
- Montre les points gagnés
- Statistiques (total paris, paris gagnants, points totaux)
- Badge "Perfect Podium" pour les podiums complets

### `/betting/rankings` - Classements

**Fonctionnalités:**
- Podium visuel des 3 premiers
- Liste complète des classés
- Sélecteur de mois/année
- Affichage des points de chaque parieur

---

## 🎨 Composants Réutilisables

### `<Card>`

Carte moderne avec variantes:

```tsx
<Card variant="primary" hover className="p-4">
  {/* Contenu */}
</Card>
```

**Variantes:** `default`, `primary`, `success`, `error`

### `<Badge>`

Badge coloré pour labels:

```tsx
<Badge variant="gold" size="md">
  🏆 1er
</Badge>
```

**Variantes:** `default`, `primary`, `success`, `error`, `warning`, `gold`, `silver`, `bronze`

### `<CompetitorOddsCard>`

Carte affichant un compétiteur avec ses cotes:

```tsx
<CompetitorOddsCard
  competitorOdds={competitor}
  isSelected={isSelected}
  isBoosted={isBoosted}
  position="first"
  onSelect={() => handleSelect()}
  onBoost={() => handleBoost()}
  showBoostButton={canBoost}
/>
```

### `<PodiumSelector>`

Sélecteur interactif de podium:

```tsx
<PodiumSelector
  competitors={eligibleCompetitors}
  onSelectionChange={(selection, boostedId) => {
    // Gérer la sélection
  }}
/>
```

---

## 🔌 API Endpoints (Détails)

### GET `/betting/current-week`

Récupère la semaine de paris courante.

**Response:**
```json
{
  "id": "uuid",
  "weekNumber": 47,
  "year": 2025,
  "month": 11,
  "startDate": "2025-11-24T00:00:00Z",
  "endDate": "2025-11-30T23:59:59Z",
  "status": "open",
  "podiumFirstId": null,
  "podiumSecondId": null,
  "podiumThirdId": null
}
```

### GET `/betting/weeks/:weekId/odds`

Récupère les cotes pour une semaine.

**Response:**
```json
[
  {
    "competitorId": "uuid",
    "competitorName": "John Doe",
    "odd": 2.5,
    "probability": 0.4,
    "formFactor": 1.1,
    "isEligible": true,
    "metadata": {
      "elo": 1650,
      "rd": 150,
      "recentWins": 2,
      "winStreak": 1,
      "raceCount": 5,
      "avgRank": 3.2,
      "formFactor": 1.1,
      "probability": 0.4
    }
  }
]
```

### POST `/betting/bets`

Place un pari.

**Request:**
```json
{
  "picks": [
    {
      "competitorId": "uuid",
      "position": "first",
      "hasBoost": false
    },
    {
      "competitorId": "uuid",
      "position": "second",
      "hasBoost": true
    },
    {
      "competitorId": "uuid",
      "position": "third",
      "hasBoost": false
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "bettingWeekId": "uuid",
  "placedAt": "2025-11-24T10:30:00Z",
  "isFinalized": false,
  "pointsEarned": null,
  "picks": [/* ... */]
}
```

---

## 🎮 Flux Utilisateur Complet

### 1. Placement d'un pari

```
1. Utilisateur va sur /betting/place-bet
2. Système charge la semaine courante + cotes
3. Utilisateur sélectionne 3 compétiteurs (1er, 2ème, 3ème)
4. Utilisateur choisit un boost x2 (optionnel)
5. Système calcule les gains potentiels
6. Utilisateur valide le pari
7. Système enregistre le pari avec les cotes du moment
8. Redirection vers l'historique
```

### 2. Calcul des résultats (Backend - Dimanche 23h55)

```
1. Cron job détermine le podium (top 3 par conservative score)
2. Pour chaque pari:
   a. Vérifie chaque pick (correct/incorrect)
   b. Calcule points = oddAtBet * (hasBoost ? 2 : 1)
   c. Si 3/3 correct: bonus perfect podium (points * 2)
3. Met à jour les paris avec les points
4. Met à jour le classement mensuel
```

### 3. Consultation du classement

```
1. Utilisateur va sur /betting/rankings
2. Sélectionne mois/année
3. Système affiche le podium + liste complète
4. Classement trié par points décroissants
```

---

## 🔧 Dépannage

### Le build échoue avec "Missing publishableKey"

➡️ Vérifiez que `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` est dans `.env` et qu'il commence par `pk_test_` ou `pk_live_`

### Les pages de paris retournent 401

➡️ Vérifiez que Clerk est correctement configuré et que le token est envoyé dans le header `Authorization`

### Les cotes ne s'affichent pas

➡️ Vérifiez que:
1. Le backend tourne sur le bon port (3001)
2. `NEXT_PUBLIC_API_URL` pointe vers le backend
3. Au moins une course a été créée cette semaine

### "Aucun compétiteur éligible"

➡️ Les compétiteurs doivent avoir participé à au moins 1 course pendant la semaine pour être éligibles au podium.

---

## 📚 Ressources

- [Documentation Clerk](https://clerk.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)

---

## 🎨 Design System

### Couleurs

```css
--color-primary-500: #40e4e4;  /* Cyan */
--color-success-500: #379a57;  /* Vert */
--color-error-500: #e9393f;    /* Rouge */
--color-warning-500: #f59e0b;  /* Orange */
--color-gold-500: #ebaa1e;     /* Or */
--color-silver-500: #ebf2fa;   /* Argent */
--color-bronze-500: #c68c3e;   /* Bronze */
```

### Typographie

```css
.text-title      /* 32px, SF Pro Display, Bold Italic */
.text-heading    /* 20px, SF Pro Display, Bold Italic */
.text-bold       /* 15px, SF Pro Display, Bold */
.text-regular    /* 15px, SF Pro Display, Normal */
.text-sub        /* 12px, SF Pro Display, Normal */
.text-statistic  /* 20px, SF Pro Display, Bold */
```

---

## ✅ Checklist de mise en production

- [ ] Configurer les clés Clerk de production
- [ ] Mettre à jour `NEXT_PUBLIC_API_URL` avec l'URL de production
- [ ] Vérifier que les cron jobs sont activés sur le backend
- [ ] Tester le flow complet sur un environnement de staging
- [ ] Vérifier les permissions des endpoints API
- [ ] Configurer le monitoring des cron jobs
- [ ] Documenter le processus de reset mensuel

---

**Bon courage ! 🚀**
