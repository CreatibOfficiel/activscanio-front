/**
 * Validation utility functions
 */

/**
 * Check if a URL is valid (starts with http(s) and ends with an image format).
 */
export const validateImageUrl = (urlStr: string): boolean => {
  const lower = urlStr.trim().toLowerCase();

  if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
    return false;
  }

  const validExtensions = [".png", ".jpg", ".jpeg", ".webp"];
  return validExtensions.some(ext => lower.endsWith(ext));
};

/**
 * Validate rank (position) - must be a positive integer
 */
export const validateRank = (rank: number): boolean => {
  return Number.isInteger(rank) && rank > 0;
};

/**
 * Validate score - must be a non-negative number
 */
export const validateScore = (score: number): boolean => {
  return typeof score === 'number' && score >= 0 && !isNaN(score);
};

/**
 * Validate that competitor first/last name is not empty
 */
export const validateCompetitorName = (name: string): boolean => {
  return name.trim().length > 0;
};
