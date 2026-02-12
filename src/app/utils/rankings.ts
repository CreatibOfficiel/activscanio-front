export function computeRanksWithTies<T>(
  items: T[],
  getScore: (item: T) => number,
  getId: (item: T) => string,
  startOffset: number = 0,
): Map<string, number> {
  const ranks = new Map<string, number>();
  let currentRank = startOffset + 1;
  for (let i = 0; i < items.length; i++) {
    if (i > 0 && getScore(items[i]) < getScore(items[i - 1])) {
      currentRank = startOffset + i + 1;
    }
    ranks.set(getId(items[i]), currentRank);
  }
  return ranks;
}
