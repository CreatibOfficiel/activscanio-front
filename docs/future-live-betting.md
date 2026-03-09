# Feature Future : Paris Live (Course Imminente)

> Idée stockée pour implémentation ultérieure. Ne fait pas partie du sprint actuel.

## Concept

Avant une course MK, un organisateur annonce la course dans l'app. Les utilisateurs peuvent parier sur le gagnant. Les paris sont verrouillés quand l'organisateur lance la course. Après la course, les résultats sont entrés et les paris résolus.

Non ce serait mieux de faire comme ca : en gros tu créées un paris en live, donc tu dis qui sera le gagnant ou bien que quelqu'un finira une position précise ou bien un nombre de point précis et derrière tu dois prendre en photo l'écran avec écrit "première courses" pour valider que tu as bien fait le Paris avant que la course commence maïs c'est un écran qui dure vrm pas longtemps donc faut pas se louper. Et derrière ça prend les résultats de la prochaine course qui est ajoutée.
Ou bien il faut un temps minimum et maximum entre l'ajout d'un paris en live et l'ajout d'une course qui correspond à ce paris.

## Flow anti-triche (2 étapes)

1. **Étape 1 - Annoncer** : l'organisateur (admin/PLAYER) va sur `/races/add` → nouveau bouton "Annoncer une course" → crée un `RaceEvent` en statut `ANNOUNCED`
2. **Fenêtre de paris** : tous les utilisateurs voient une bannière "Course imminente !" → peuvent choisir leur gagnant prédit
3. **Étape 2 - Verrouiller** : l'organisateur clique "Lancer la course" → `RaceEvent` passe en `LOCKED` → plus aucun pari accepté
4. **Course IRL** : les joueurs jouent à Mario Kart
5. **Résultats** : l'organisateur entre les résultats normalement → `RaceEvent` passe en `COMPLETED` → paris résolus
6. **Payout** : prédiction correcte du gagnant = points gagnés (système simple, pas de cotes)

## Garde-fou temps

- Un minimum de **3 minutes** entre la création du RaceEvent (ANNOUNCED) et le passage en LOCKED
- Cela garantit que les paris ont été placés avant que quiconque connaisse le résultat

## Points live

Système simple pour v1 :

- Prédiction correcte du 1er = **+3 points** (betting points, ajoutés au `BettorRanking.totalPoints`)
- Prédiction incorrecte = 0 points (pas de perte)
- Pas de mise, pas de risque → encourage la participation sans friction

## Backend

### Modifier `RaceEvent` (`activscanio-api/src/races/race-event.entity.ts`)

Ajouter :

```typescript
@Column({ type: 'enum', enum: RacePhase, default: RacePhase.COMPLETED })
phase: RacePhase; // ANNOUNCED | LOCKED | COMPLETED

@Column({ nullable: true, type: 'timestamptz' })
announcedAt: Date;

@Column({ nullable: true, type: 'timestamptz' })
lockedAt: Date;
```

```typescript
enum RacePhase {
  ANNOUNCED = "announced",
  LOCKED = "locked",
  COMPLETED = "completed",
}
```

**Migration** : ajouter les colonnes avec default `COMPLETED` pour ne pas casser les courses existantes.

### Nouvelle entité : `LiveBet`

```typescript
@Entity("live_bets")
@Index(["userId", "raceEventId"], { unique: true })
export class LiveBet {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() userId: string;
  @Column() raceEventId: string;
  @Column() predictedWinnerId: string;
  @Column({ type: "boolean", nullable: true }) isCorrect: boolean;
  @Column({ type: "float", nullable: true }) pointsEarned: number;
  @CreateDateColumn() placedAt: Date;
}
```

### Endpoints

```
POST   /races/announce          → Créer un RaceEvent ANNOUNCED (admin/PLAYER only)
POST   /races/:id/lock          → Passer en LOCKED (vérifie délai min 3min)
POST   /races/:id/results       → Entrer résultats + résoudre live bets
POST   /races/:id/live-bets     → Placer un pari live (refuse si phase != ANNOUNCED)
GET    /races/:id/live-bets     → Liste des paris live pour une course
GET    /races/announced         → Courses en attente de résultats (ANNOUNCED ou LOCKED)
```

## Frontend

### Nouveaux composants

| Composant           | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `LiveRaceBanner`    | Bannière en haut de la page Paris quand une course est ANNOUNCED |
| `LiveBetPicker`     | Grille de competitors clickable pour choisir son gagnant         |
| `LiveBetResultCard` | Résultat du pari live après résolution                           |

### Modifications

1. **`betting/page.tsx`** : Ajouter `LiveRaceBanner` en haut de la page
2. **`races/add/page.tsx`** : Ajouter le flow 2 étapes (Annoncer → Verrouiller → Résultats)
3. **WebSocket** : Écouter `race:announced`, `race:locked`, `liveBet:resolved`
