export interface LeagueConfig {
  id: string;
  label: string;
  emoji: string;
  textColor: string;
  lineColor: string;
  badgeBg: string;
  badgeText: string;
  tvTextClass: string;
  minRank: number;
  maxRank: number;
}

export const LEAGUES: LeagueConfig[] = [
  {
    id: 'champions',
    label: 'Ligue des Champions',
    emoji: '🏆',
    textColor: 'text-yellow-400',
    lineColor: 'bg-yellow-500/40',
    badgeBg: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
    badgeText: 'text-neutral-900',
    tvTextClass: 'text-yellow-400',
    minRank: 1,
    maxRank: 3,
  },
  {
    id: 'ligue1',
    label: 'Ligue 1',
    emoji: '⭐',
    textColor: 'text-blue-400',
    lineColor: 'bg-blue-500/40',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-neutral-900',
    tvTextClass: 'text-blue-400',
    minRank: 4,
    maxRank: 7,
  },
  {
    id: 'ligue2',
    label: 'Ligue 2',
    emoji: '🌟',
    textColor: 'text-emerald-400',
    lineColor: 'bg-emerald-500/40',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-neutral-900',
    tvTextClass: 'text-emerald-400',
    minRank: 8,
    maxRank: 11,
  },
  {
    id: 'district',
    label: 'District',
    emoji: '🏟️',
    textColor: 'text-neutral-400',
    lineColor: 'bg-neutral-600/40',
    badgeBg: 'bg-neutral-600',
    badgeText: 'text-neutral-200',
    tvTextClass: 'text-neutral-400',
    minRank: 12,
    maxRank: Infinity,
  },
];

export function getLeagueForRank(rank: number): LeagueConfig {
  return LEAGUES.find((l) => rank >= l.minRank && rank <= l.maxRank) ?? LEAGUES[LEAGUES.length - 1];
}

/**
 * Groups items by league based on their rank.
 *
 * @param items - Array of items to group
 * @param getId - Function to extract unique ID from an item
 * @param rankMap - Map of item ID to rank
 * @param excludeChampions - If true, skip the Champions league (ranks 1-3, i.e. the podium)
 * @returns Array of { league, items } groups (only non-empty groups)
 */
export function groupByLeague<T>(
  items: T[],
  getId: (item: T) => string,
  rankMap: Map<string, number>,
  excludeChampions: boolean = false,
): { league: LeagueConfig; items: T[] }[] {
  const leagues = excludeChampions ? LEAGUES.filter((l) => l.id !== 'champions') : LEAGUES;

  return leagues
    .map((league) => ({
      league,
      items: items.filter((item) => {
        const rank = rankMap.get(getId(item));
        return rank !== undefined && rank >= league.minRank && rank <= league.maxRank;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
