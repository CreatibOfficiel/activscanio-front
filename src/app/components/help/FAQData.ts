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
      "Deux sports, deux classements séparés. Mario Kart en courses, ping-pong en matchs 1 contre 1. Vous choisissez ce que vous suivez.",
    points: [
      'Enregistrez vos courses Mario Kart et vos matchs de ping-pong',
      'Chaque sport a son propre classement et son propre ELO',
      'Montez de niveau et débloquez des succès dans les deux',
      'Les saisons durent 4 semaines et se terminent par un récap',
    ],
    technicalDetails: `Les deux classements sont indépendants.

Un très bon pilote Mario Kart peut être dernier au ping-pong, et
l'inverse. Les ratings ne sont ni comparables ni additionnés : ils
mesurent deux choses différentes sur deux échelles différentes.

Vous pouvez suivre un seul sport ou les deux. Le choix se fait à
l'inscription et se modifie à tout moment depuis votre compte.`,
  },
  {
    id: 'seasons',
    icon: '📅',
    title: 'Saisons',
    summary:
      'Une saison dure 4 semaines. À la fin, tout est archivé et un soft reset resserre les écarts pour que la saison suivante reste ouverte.',
    points: [
      'Nouvelle saison toutes les 4 semaines',
      'Classements des deux sports archivés en fin de saison',
      'Soft reset ELO : les écarts se resserrent, l’ordre reste',
      'Vos saisons passées restent consultables depuis votre profil',
    ],
    technicalDetails: `Archivage de fin de saison :
• Classement des pilotes et classement des pongistes archivés ensemble
• Les joueurs non classés sont archivés aussi, sans rang
• Rien n'est perdu : l'historique complet reste consultable

Soft reset en début de saison :
• Rating = 0.75 × ancien + 0.25 × 1500
• RD augmente légèrement (+50, plafonné à 350)
• Exemple : 1800 → 1725, 1200 → 1275
• L'écart se resserre (600 → 450) mais l'ordre reste`,
  },
  {
    id: 'pingpong-rules',
    icon: '🏓',
    title: 'Règles du ping-pong',
    summary:
      'Un match se joue au meilleur des 3 sets. Un set se gagne à 11 points, avec 2 points d’écart au-delà de 10-10.',
    points: [
      'Match au meilleur des 3 sets : le premier à 2 sets gagne',
      'Un set se gagne à 11 points',
      'À 10-10, il faut 2 points d’écart : 12-10, 13-11, etc.',
      'Si chacun gagne un set, on joue le troisième',
      'Les scores sont vérifiés à la saisie : un score impossible est refusé',
    ],
    technicalDetails: `Scores de set acceptés :
• 11-0 à 11-9 : victoire nette
• Au-delà de 11, exactement 2 points d'écart : 12-10, 13-11, 14-12…
• Un score comme 12-9 ou 11-11 est refusé

Structure du match :
• Minimum 2 sets, maximum 3
• Le match s'arrête dès qu'un joueur a 2 sets
• Un troisième set saisi après un 2-0 est refusé

Ces règles suivent le règlement ITTF, sauf la longueur du match :
en compétition officielle on joue au meilleur des 5 ou 7 sets, ce qui
serait trop long pour une pause déjeuner.`,
  },
  {
    id: 'pingpong-elo',
    icon: '📊',
    title: 'Classement des pongistes',
    summary:
      'Le niveau est calculé avec Glicko-2 après chaque match. Battre plus fort que soi rapporte plus, et le classement tient compte de l’incertitude.',
    points: [
      'Rating = votre niveau estimé (démarre à 1500)',
      'RD = incertitude sur ce niveau (démarre à 350, baisse en jouant)',
      'Le classement utilise le score conservateur : Rating − 2×RD',
      'Le score des sets ne change rien : seul le vainqueur compte',
      'Sans match pendant une semaine, l’incertitude remonte doucement',
    ],
    technicalDetails: `Algorithme : Glicko-2, réglé différemment de Mario Kart.

Valeurs initiales :
• Rating : 1500
• RD (incertitude) : 350
• Volatilité : 0.06

Deux réglages diffèrent de Mario Kart :
• TAU 0.35 au lieu de 0.5 — le ping-pong est plus prévisible qu'une
  course, où une carapace bleue peut renverser un classement
• RD minimum 50 au lieu de 30 — au bureau on progresse vite, le
  système doit rester capable de suivre

Pourquoi le score des sets ne compte pas :
Aucune fédération n'en tient compte, ni l'USATT, ni le classement
allemand TTR, ni l'ITTF. Gagner 11-9 ou 11-2 prouve la même chose :
que vous avez gagné.

Score conservateur = Rating − 2×RD
→ le niveau minimum dont on est raisonnablement sûr
→ un joueur peu testé ne double pas un joueur confirmé sur un coup
  de chance

Inactivité :
Après 7 jours sans match, l'incertitude repart à la hausse chaque
semaine. Un rating qu'on n'a pas vérifié depuis trois mois mérite
moins de confiance.`,
  },
  {
    id: 'pingpong-ranking-rules',
    icon: '✅',
    title: 'Apparaître au classement',
    summary:
      'Tout le monde est classé dès le premier match. Avant 5 matchs, votre niveau est affiché comme une estimation, avec un « ? ».',
    points: [
      'Vous êtes classé dès votre premier match, comme tout le monde',
      'Avant 5 matchs, le niveau affiché est une estimation marquée d’un « ? »',
      'Après 5 matchs, le niveau est confirmé et le « ? » disparaît',
      'Jouer toujours contre les mêmes ne vous exclut pas',
      'Après 14 jours sans jouer, votre rang reste mais la ligne est grisée',
      'Le nombre d’adversaires différents est affiché comme information',
    ],
    technicalDetails: `Personne n'est exclu du classement. La calibration décide
seulement si le niveau est affiché comme confirmé ou comme estimation :
• 5 matchs pondérés, et un RD retombé sous 200
• En dessous, le rating porte un « ? » et la ligne est atténuée

Pourquoi « pondérés » :
Rejouer la même personne compte de moins en moins. Sur une semaine,
les 3 premiers matchs contre quelqu'un comptent plein, les 3 suivants
pour moitié, au-delà pour rien. On ne peut donc pas sortir de
calibration en enchaînant les matchs contre un seul adversaire.

Ce qui ne bloque PAS l'accès au classement :
Le nombre d'adversaires différents. Une version précédente cachait les
joueurs qui n'avaient pas affronté 4 personnes différentes en 3
semaines. Cette règle a été retirée : dans un bureau, jouer trois
parties le midi avec les deux mêmes collègues fait neuf matchs sans
jamais apparaître. Elle punissait les plus assidus.

Aucun système sérieux ne filtre là-dessus : la FIDE demande 5 parties
contre des joueurs classés sans exiger qu'ils soient différents,
l'USATT n'a aucun minimum, Lichess filtre sur 30 parties et
l'incertitude. Le farming est déjà traité par la pondération.

Inactivité :
• 14 jours sans match : rang en pause, joueur toujours visible
• 180 jours : le joueur passe en archive`,
  },
  {
    id: 'elo-ranking',
    icon: '📈',
    title: 'Classement Mario Kart (Glicko-2)',
    summary:
      'Votre niveau est calculé après chaque course avec Glicko-2. Un soft reset (75/25) est appliqué chaque saison pour garder la compétition ouverte.',
    points: [
      'Rating = votre niveau estimé (démarre à 1500)',
      'RD = incertitude sur votre niveau (diminue avec plus de courses)',
      'Gagner contre des joueurs forts rapporte plus de points',
      'Soft reset saisonnier : 75% ancien rating + 25% de 1500',
      'Le score conservateur (Rating − 2×RD) est utilisé pour le classement',
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

Score conservateur = Rating − 2×RD
→ Représente le niveau minimum avec 95% de confiance
→ Utilisé pour les classements officiels`,
  },
  {
    id: 'form-streaks',
    icon: '🔥',
    title: 'Forme & Séries',
    summary:
      'Enchaînez les victoires pour maintenir une série. La forme se mesure par rapport à votre propre moyenne, pas à celle des autres.',
    points: [
      'Série de victoires : victoires consécutives, dans chaque sport',
      'Badge « En forme 🔥 » si vous jouez mieux que d’habitude',
      'Badge « En difficulté 📉 » si vous jouez moins bien que d’habitude',
      'Les longues séries débloquent des succès spéciaux',
    ],
    technicalDetails: `Forme du pilote (logique relative) :
• Comparaison : moyenne des 5 dernières courses vs moyenne historique
• « En forme » si moyenne récente < moyenne historique − 0.5
• « En difficulté » si moyenne récente > moyenne historique + 0.5
• Un joueur peut être en forme avec des positions moyennes, tant
  qu'il fait mieux que d'habitude

Séries de ping-pong :
• Série en cours : victoires consécutives
• Meilleure série : le record, jamais remis à zéro`,
  },
  {
    id: 'achievements',
    icon: '🏅',
    title: 'Succès',
    summary:
      'Des succès pour chaque sport. Certains se déclenchent sur des compteurs, d’autres sur la forme d’un match précis.',
    points: [
      'Succès de volume : nombre de courses, de matchs, de victoires',
      'Succès de série : enchaîner les victoires',
      'Succès de match : gagner un set 11-0, remonter après un set perdu',
      'Les plus rares peuvent rester des mois sans être décrochés',
    ],
    technicalDetails: `Deux familles de succès.

Les succès de compteur se calculent sur vos totaux : nombre de matchs,
victoires, meilleure série, niveau atteint.

Les succès de match se lisent dans le déroulé d'une partie précise.
On peut avoir trois cents victoires sans jamais avoir gagné un set
11-0. Ils sont rejoués depuis l'historique des matchs, donc un succès
ajouté plus tard se débloque rétroactivement sur vos anciens matchs.

Quelques-uns au ping-pong :
• La Bulle : gagner un set 11-0
• Crème Fraîche : en encaisser un 0-11
• Retour des Enfers : perdre le premier set et gagner le match
• Le Tombeur : battre quelqu'un classé 150 points au-dessus
• Le Casse : premier set perdu, puis deux sets arrachés au-delà de
  10-10 — le plus rare de tous`,
  },
  {
    id: 'podium-rewards',
    icon: '🏆',
    title: 'Podium & Classement',
    summary:
      'Le classement est basé sur le score conservateur (ELO − 2×RD), dans les deux sports.',
    points: [
      'Classement par semaine, saison ou depuis le début',
      'Score conservateur = niveau minimum probable',
      'Plus vous jouez, plus votre RD diminue et votre classement se stabilise',
      'Les deux sports ont leur podium, jamais mélangés',
    ],
    technicalDetails: `Critères de classement (dans l'ordre) :
1. Score conservateur (rating − 2×RD)
2. Rating brut (en cas d'égalité)
3. RD (plus bas = mieux, en cas d'égalité)
4. Nombre de parties (plus = mieux)

Filtrage par période :
• Semaine : parties des 7 derniers jours
• Saison : parties de la saison en cours
• Tout : toutes les parties`,
  },
  {
    id: 'xp-levels',
    icon: '✨',
    title: 'XP & Niveaux',
    summary:
      'Gagnez de l’XP en jouant et en débloquant des succès. Montez de niveau pour débloquer des titres et des badges.',
    points: [
      'XP gagné à chaque succès débloqué',
      'Plus le succès est rare, plus il rapporte',
      'Chaque niveau nécessite plus d’XP que le précédent',
      'Les niveaux débloquent des titres et badges',
    ],
    technicalDetails: `XP par rareté de succès :
• Commun : le plus courant, gain modeste
• Rare : demande de la régularité
• Épique : demande un vrai niveau
• Légendaire : peut rester des mois sans être décroché

Formule de niveau :
XP requis(n) = 100 × n × (n + 1) / 2

Soit : Niveau 1 = 100 XP, Niveau 2 = 300 XP cumulés, etc.`,
  },
];

export default faqSections;
