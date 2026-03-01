/**
 * FAQ Content Data
 *
 * Structured content for the help/FAQ page.
 * Each section has a simple explanation and optional technical details.
 */

export interface FAQSection {
  id: string;
  icon: string;
  title: string;
  /** Simple explanation for all users */
  summary: string;
  /** Detailed points explaining the feature */
  points?: string[];
  /** Technical details for advanced users (collapsed by default) */
  technicalDetails?: string;
}

export const faqSections: FAQSection[] = [
  {
    id: 'how-it-works',
    icon: '🎮',
    title: 'Comment ça marche',
    summary:
      'Mushroom Bet est une app de paris entre amis sur Mario Kart. Chaque semaine, pariez sur le podium des courses et gagnez des points !',
    points: [
      'Pariez sur qui sera 1er, 2ème et 3ème de la semaine',
      'Gagnez des points si vos prédictions sont correctes',
      'Montez de niveau et débloquez des succès',
      "Suivez votre progression et comparez-vous à vos amis",
    ],
  },
  {
    id: 'seasons-weeks',
    icon: '📅',
    title: 'Saisons & Semaines',
    summary:
      "Les paris fonctionnent par semaine, du lundi au dimanche. La première semaine de chaque saison est une période de calibration (pas de paris).",
    points: [
      "Nouvelle semaine de paris chaque lundi à minuit",
      "1ère semaine de la saison = Calibration (pas de paris, ELO se stabilise)",
      "2ème semaine et + = Paris ouverts le lundi, de 00h00 à minuit",
      "Mardi au dimanche = Surprise ! Les courses continuent mais les paris sont fermés",
      "Les résultats et points sont calculés le dimanche à 20h",
      "Archive en fin de saison avec soft reset ELO",
    ],
    technicalDetails: `Cycle hebdomadaire automatique :
• Semaines ISO (lundi = jour 1)
• CALIBRATION : 1ère semaine de la saison (pas de paris)
• OPEN : lundi 00:00 → mardi 00:00 UTC (lundi minuit)
• CLOSED : mardi 00:00 → dimanche 20:00 (6 jours d'incertitude)
• FINALIZED : dimanche 20:00+ (résultats disponibles)

Soft reset en début de saison :
• Rating = 0.75 × ancien + 0.25 × 1500
• RD augmente légèrement (+50, max 350)
• L'écart entre joueurs se resserre mais l'ordre reste`,
  },
  {
    id: 'betting-system',
    icon: '🎯',
    title: 'Système de paris',
    summary:
      "Pariez sur le podium (top 3) de la semaine. Plus la cote d'un joueur est élevée, plus vous gagnez de points s'il finit à la position prédite.",
    points: [
      "Choisissez 3 joueurs pour le podium : 1er, 2ème, 3ème",
      "Chaque joueur a une cote qui détermine vos gains potentiels",
      "Utilisez votre boost x2 sur un pick pour doubler ses points (1 boost par saison !)",
      "Podium parfait (3/3 correct) = tous vos points doublés !",
    ],
    technicalDetails: `Calcul des points :
Points par pick = cote × (boost ? 2 : 1) si correct, sinon 0

Bonus podium parfait :
Si 3/3 picks corrects → total × 2.0

Minimum garanti : 0.1 pts par pick correct

Exemple :
• 1er correct (cote 2.5) = 2.5 pts
• 2ème correct (cote 3.0) avec boost = 6.0 pts
• 3ème incorrect (cote 1.8) = 0 pts
Total = 8.5 pts`,
  },
  {
    id: 'boost',
    icon: '🚀',
    title: 'Le Boost x2',
    summary:
      "Le boost est un bonus spécial qui double les points d'un de vos picks. Utilisez-le stratégiquement car vous n'en avez qu'un seul par saison !",
    points: [
      "1 boost disponible par saison de 4 semaines",
      "Applicable sur n'importe lequel de vos 3 picks",
      "Double les points gagnés si le pick est correct",
      "Le boost est réinitialisé au début de chaque saison",
      "Conseil : Utilisez-le sur un pick à cote élevée pour maximiser les gains !",
    ],
    technicalDetails: `Règles du boost :
• Limite : 1 boost par saison de 4 semaines
• Réinitialisation : début de chaque saison
• Multiplicateur : ×2 sur les points du pick boosté
• Cumulable avec le bonus podium parfait

Exemple de calcul optimal :
Pick boosté (cote 5.0) correct = 10 pts
+ Bonus parfait (×2) = 20 pts au total pour ce pick`,
  },
  {
    id: 'live-betting',
    icon: '📸',
    title: 'Paris en direct',
    summary:
      "En plus des paris hebdomadaires, vous pouvez parier sur le gagnant de chaque course en direct ! Prenez une photo de l'écran de sélection des karts comme preuve, et l'IA détecte automatiquement les joueurs présents.",
    points: [
      "Choisissez UN gagnant parmi les compétiteurs (avec leurs cotes)",
      "Prenez en photo l'écran de sélection des karts comme preuve anti-triche",
      "L'IA détecte les joueurs sur la photo (30s pour vérifier/corriger)",
      "Le pari est résolu automatiquement quand la course suivante est ajoutée",
      "Vous devez avoir assez de points pour couvrir la cote (pas de pari à crédit !)",
      "Gagné = +cote en points, Perdu = -cote en points (plancher à 0)",
      "Le pari expire après 15 minutes sans course correspondante",
    ],
    technicalDetails: `Flow complet :
1. Choix du gagnant + cote verrouillée
2. Photo de l'écran kart → statut DETECTING
3. IA analyse la photo (détection des personnages)
4. Timer 30s pour confirmer/corriger les joueurs → statut ACTIVE
5. Attente de la prochaine course avec ≥75% des mêmes joueurs
6. Résolution : WON (+cote) ou LOST (-cote)

Annulation automatique :
• Timeout 15 min sans course correspondante
• Joueurs détectés ne matchent pas (< 75% overlap)
• Détection échouée (aucun personnage reconnu)

Points :
• Mêmes points que le classement saisonnier des parieurs
• Gagné : totalPoints + oddAtBet
• Perdu : totalPoints - oddAtBet (minimum 0)
• Les cotes utilisées sont celles de la semaine en cours (oddFirst)`,
  },
  {
    id: 'best-odds-guaranteed',
    icon: '🎯',
    title: 'Best Odds Guaranteed',
    summary:
      'Tu obtiens toujours la meilleure cote entre le moment de ton pari et la clôture !',
    points: [
      'Si la cote monte après ton pari, tu gagnes au meilleur prix',
      'Si la cote baisse, tu gardes ta cote initiale',
      'Tu ne peux jamais être perdant par rapport au timing',
      'Applicable à tous les paris automatiquement',
    ],
    technicalDetails: `Exemple :
• Tu paries sur Alice 1ère à 2.5
• La cote monte à 3.0 avant la clôture
• Si Alice gagne, tu es payé à 3.0 (meilleure cote)

Autre exemple :
• Tu paries sur Bob 2ème à 4.0
• La cote baisse à 3.2
• Si Bob est 2ème, tu es payé à 4.0 (ta cote initiale)

Le BOG est calculé automatiquement lors de la finalisation des paris.
La cote utilisée est stockée pour chaque pick et visible dans l'historique.`,
  },
  {
    id: 'odds',
    icon: '📊',
    title: 'Calcul des cotes',
    summary:
      "Les cotes sont disponibles dès le lundi matin et évoluent après chaque course. Elles utilisent un modèle statistique (Plackett-Luce) et une simulation Monte Carlo pour estimer la probabilité de chaque joueur à chaque position du podium.",
    points: [
      "Cotes disponibles dès l'ouverture de la semaine (pas besoin d'attendre des courses)",
      "Cote différente pour chaque position : 1er, 2ème, 3ème",
      "Cotes dynamiques : recalculées automatiquement après chaque course",
      "Cote verrouillée : votre pari garde la cote au moment où vous pariez (+ Best Odds Guaranteed)",
      "Les favoris (ELO élevé, RD bas) ont les cotes les plus basses",
      "Les outsiders (ELO bas ou incertitude élevée) ont les cotes les plus hautes",
      "Joueurs en calibration (< 5 courses) ou inactifs (< 2 courses en 30j) non pariables",
    ],
    technicalDetails: `Algorithme Plackett-Luce + Monte Carlo :

1. Force Plackett-Luce :
   • mu = (rating - 1500) / 173.72  (échelle logistique)
   • phi = RD / 173.72
   • g(phi) = 1 / sqrt(1 + 3×phi² / pi²)  (atténuation Glicko-2)
   • alpha = exp(mu × g(phi))
   → Plus le rating est élevé et le RD bas, plus alpha est grand

2. Probabilité de victoire (softmax) :
   • P_win(i) = alpha_i / somme(alpha_j)

3. Simulation Monte Carlo (50 000 runs) :
   • Pour chaque simulation, on tire un podium aléatoire
   • Tirage proportionnel à alpha (sans remise)
   • P(1er), P(2ème), P(3ème) = fréquence observée / 50 000

4. Conversion en cotes décimales :
   • Cote = 1 / probabilité
   • Bornée entre 1.1x et 50x

Quand les cotes changent :
• Lundi 00:05 : cotes initiales (basées sur l'historique ELO)
• Après chaque course : recalcul automatique (ELO mis à jour)
• Dimanche 20:00 : dernier recalcul avant finalisation`,
  },
  {
    id: 'elo-ranking',
    icon: '📈',
    title: 'Classement ELO (Glicko-2)',
    summary:
      "Votre niveau est calculé après chaque course avec l'algorithme Glicko-2. Un soft reset (75/25) est appliqué chaque saison pour garder la compétition intéressante.",
    points: [
      "Rating = votre niveau estimé (démarre à 1500)",
      "RD = incertitude sur votre niveau (diminue avec plus de courses)",
      "Gagner contre des joueurs forts rapporte plus de points",
      "Soft reset saisonnier : 75% ancien rating + 25% de 1500",
      "Le score conservateur (Rating - 2×RD) est utilisé pour le classement",
    ],
    technicalDetails: `Algorithme : Glicko-2 (évolution du système ELO)

Valeurs initiales :
• Rating : 1500
• RD (Rating Deviation) : 350
• Volatilité (σ) : 0.06

Soft reset en début de saison :
• Nouveau rating = 0.75 × ancien + 0.25 × 1500
• RD = min(ancien RD + 50, 350)
• Exemple : 1800 → 1725, 1200 → 1275
• L'écart se resserre (600 → 450) mais l'ordre reste

Calcul après course :
• Chaque course = série de matchs pairés
• 4 joueurs = 6 matchs (chacun contre chacun)
• Mise à jour du rating selon résultats + force adversaires

Score conservateur = Rating - 2×RD
→ Représente le niveau minimum avec 95% de confiance
→ Utilisé pour les classements officiels`,
  },
  {
    id: 'eligibility',
    icon: '✅',
    title: 'Éligibilité des joueurs',
    summary:
      "Pour être pariable, un joueur doit être actif et avoir suffisamment d'historique. Cela évite les « snipers » qui arrivent ponctuellement.",
    points: [
      "Calibration : 5 courses minimum à vie pour être pariable",
      "Activité : 2 courses minimum dans les 30 derniers jours",
      "Badge « En calibration (X/5) » affiché pour nouveaux joueurs",
      "Badge « Inactif » pour joueurs sans activité récente",
      "Pas besoin d'avoir couru cette semaine : les cotes se basent sur tout l'historique",
    ],
    technicalDetails: `Règles d'éligibilité (toutes requises) :

1. Calibration initiale
   • Minimum 5 courses à vie (totalLifetimeRaces)
   • Ce compteur ne reset JAMAIS
   • But : éviter de parier sur des joueurs sans historique

2. Présence récente (fenêtre glissante de 30 jours)
   • Minimum 2 courses dans les 30 derniers jours
   • Fenêtre calculée à partir d'aujourd'hui
   • But : éviter les « snipers » qui débarquent après une longue absence

Ordre de vérification : Calibration → Activité
Premier échec = raison affichée dans l'interface`,
  },
  {
    id: 'form-streaks',
    icon: '🔥',
    title: 'Forme & Séries',
    summary:
      "La forme est calculée pour les parieurs (vos paris) ET pour les pilotes (leurs courses). Enchaînez les victoires pour maintenir une série !",
    points: [
      "Forme du parieur : calculée sur vos 5 derniers paris",
      "Forme du pilote : comparaison à sa propre moyenne historique",
      "Badge « En forme 🔥 » si un pilote joue mieux que d'habitude",
      "Badge « En difficulté 📉 » si un pilote joue moins bien que d'habitude",
      "Les longues séries débloquent des succès spéciaux",
    ],
    technicalDetails: `Forme du parieur :
• Fenêtre : 5 derniers paris
• Victoire = au moins 1 pick correct sur 3
• Parfait = 3/3 picks corrects
• Streak : victoires consécutives

Forme du pilote (logique relative) :
• Comparaison : moyenne des 5 dernières courses vs moyenne historique
• Badge « En forme » si moyenne récente < moyenne historique - 0.5
• Badge « En difficulté » si moyenne récente > moyenne historique + 0.5
• Un joueur peut être en forme même avec des positions moyennes, tant qu'il fait mieux que d'habitude !

Bonus XP associés aux séries :
• 3+ victoires : bonus streak
• 5+ victoires : bonus super streak
• Parfait streak : bonus multiplicateur`,
  },
  {
    id: 'podium-rewards',
    icon: '🏆',
    title: 'Podium & Classement',
    summary:
      "Le classement est basé sur le score conservateur (ELO - 2×RD). Il faut avoir participé à au moins 1 course dans la période pour être classé.",
    points: [
      "Classement par semaine, saison ou depuis le début",
      "Score conservateur = niveau minimum probable",
      "Participation requise : au moins 1 course dans la période",
      "Plus vous jouez, plus votre RD diminue et votre classement devient stable",
    ],
    technicalDetails: `Critères de classement (dans l'ordre) :
1. Score conservateur (rating - 2×RD)
2. Rating brut (en cas d'égalité)
3. RD (plus bas = mieux, en cas d'égalité)
4. Nombre de courses (plus = mieux)

Filtrage par période :
• Semaine : courses des 7 derniers jours
• Saison : courses de la saison en cours
• Tout : toutes les courses

Seuls les joueurs avec raceCount > 0
apparaissent dans le classement.`,
  },
  {
    id: 'xp-levels',
    icon: '✨',
    title: 'XP & Niveaux',
    summary:
      "Gagnez de l'XP en plaçant des paris, en obtenant des résultats corrects et en maintenant des séries. Montez de niveau pour débloquer des récompenses !",
    points: [
      "XP gagné : paris placés, picks corrects, podiums parfaits",
      "Bonus XP pour les séries de victoires",
      "Chaque niveau nécessite plus d'XP que le précédent",
      "Les niveaux débloquent des titres et badges",
    ],
    technicalDetails: `Sources d'XP :
• Pari placé : +10 XP
• Pick correct : +25 XP
• Podium parfait : +100 XP
• Série de 3+ : bonus +50 XP
• Série de 5+ : bonus +100 XP

Formule de niveau :
XP requis(n) = 100 × n × (n + 1) / 2

Soit : Niveau 1 = 100 XP, Niveau 2 = 300 XP cumulés, etc.`,
  },
];

export default faqSections;
