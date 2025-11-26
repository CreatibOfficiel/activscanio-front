/**
 * Formatting utility functions
 */

/**
 * Format a date string to display "Aujourd'hui" for today or DD/MM/YYYY otherwise
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return "Aujourd'hui";
  }

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

/**
 * Format a date to localized French format
 */
export const formatDateLocale = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
};

/**
 * Format points with optional decimal places
 */
export const formatPoints = (points: number, decimals: number = 0): string => {
  return points.toFixed(decimals);
};

/**
 * Format odds as multiplier (e.g., 2.5x)
 */
export const formatOdds = (odds: number): string => {
  return `${odds.toFixed(2)}x`;
};

/**
 * Normalize text by trimming whitespace
 */
export const normalizeText = (text: string): string => {
  return text.trim();
};
