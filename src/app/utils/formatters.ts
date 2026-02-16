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

/**
 * Format a competitor name as "Prénom I." (first name + first initial of last name)
 * Example: "Pierre Dupont" → "Pierre D."
 */
export const formatCompetitorName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string
): string => {
  if (firstName && lastName) {
    const initial = lastName.charAt(0).toUpperCase();
    return `${firstName} ${initial}.`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  return fallback || 'Pilote';
};

/**
 * Format a date string to a relative time format in French
 * Examples: "À l'instant", "Il y a 5 min", "Il y a 2h", "Hier", "Il y a 3 jours"
 */
export const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return formatDate(dateStr);
};

/**
 * Get a date label for grouping races (Aujourd'hui, Hier, Cette semaine, or date)
 */
export const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();

  // Reset time to compare dates only
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.floor((nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return "Cette semaine";
  return formatDate(dateStr);
};
