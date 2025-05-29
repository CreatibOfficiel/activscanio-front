import { Competitor } from "../models/Competitor";
import { RaceResult } from "../models/RaceResult";
import { Glicko2 } from "glicko2";

export class EloCalculator {
  private static readonly TAU = 0.5; // System constant
  private static readonly RATING = 1500; // Default rating
  private static readonly RD = 350; // Default rating deviation
  private static readonly VOL = 0.06; // Default volatility

  /**
   * Compute the expected scores for each player against all others.
   * @param players Array of player ratings
   * @returns Map of player ID to expected score (0-1)
   */
  static computeExpectedScores(players: { id: string; rating: number }[]): Record<string, number> {
    const scores: Record<string, number> = {};
    const n = players.length;

    for (const player of players) {
      let totalScore = 0;
      for (const opponent of players) {
        if (player.id !== opponent.id) {
          const expectedScore = 1 / (1 + Math.pow(10, (opponent.rating - player.rating) / 400));
          totalScore += expectedScore;
        }
      }
      scores[player.id] = totalScore / (n - 1);
    }

    return scores;
  }

  /**
   * Compute the actual scores based on race positions.
   * @param positions Array of player positions
   * @returns Map of player ID to actual score (0-1)
   */
  static computeActualScores(positions: { id: string; position: number }[]): Record<string, number> {
    const scores: Record<string, number> = {};
    const n = positions.length;

    // Sort positions from best to worst
    const sortedPositions = [...positions].sort((a, b) => a.position - b.position);

    // Assign scores based on position
    for (let i = 0; i < n; i++) {
      const position = sortedPositions[i];
      scores[position.id] = (n - i - 1) / (n - 1);
    }

    return scores;
  }

  /**
   * Calculate the updated ratings for all competitors in a race
   */
  public static calculateUpdatedEloForRace(
    competitors: Competitor[],
    results: Record<string, RaceResult>
  ): Record<string, number> {
    // Create a new Glicko2 instance
    const glicko = new Glicko2({
      tau: this.TAU,
      rating: this.RATING,
      rd: this.RD,
      vol: this.VOL
    });

    // Create players with their current ratings
    const players = new Map<string, any>();
    const playerRatings = competitors.map(competitor => ({
      id: competitor.id,
      rating: competitor.conservativeScore
    }));

    // Calculate expected scores
    const expectedScores = this.computeExpectedScores(playerRatings);

    // Calculate actual scores based on race results
    const actualScores = this.computeActualScores(
      competitors.map(competitor => ({
        id: competitor.id,
        position: results[competitor.id]?.rank12 ?? 12
      }))
    );

    // Create players and update their ratings
    competitors.forEach(competitor => {
      const player = glicko.makePlayer(
        competitor.conservativeScore,
        competitor.rd || this.RD,
        competitor.vol || this.VOL
      );
      players.set(competitor.id, player);

      // Calculate rating change based on expected vs actual scores
      const expected = expectedScores[competitor.id];
      const actual = actualScores[competitor.id];
      const ratingChange = (actual - expected) * (competitor.provisional ? 64 : 32);
      
      // Update player's rating
      player.setRating(player.getRating() + ratingChange);
    });

    // Get new ratings
    const updatedRatings: Record<string, number> = {};
    competitors.forEach(competitor => {
      const player = players.get(competitor.id);
      updatedRatings[competitor.id] = player.getRating();
    });

    return updatedRatings;
  }
}
