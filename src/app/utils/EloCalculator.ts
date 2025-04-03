// import { Competitor } from "../models/Competitor";
// import { RaceResult } from "../models/RaceResult";

// // We define a small interface for convenience
// interface CompetitorEloInput {
//   id: string;
//   rating: number;
//   rank: number; // rank12
// }

// export class EloCalculator {
//   static kFactor = 32;

//   static expectedScore(ratingA: number, ratingB: number): number {
//     return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
//   }

//   // We replicate the same logic from your Flutter code:
//   static calculateUpdatedEloForRace(
//     competitors: Competitor[],
//     raceResults: Record<string, RaceResult>
//   ): Record<string, number> {
//     const inputs: CompetitorEloInput[] = competitors.map((comp) => {
//       const result = raceResults[comp.id];
//       const rank = result?.rank12 ?? 12;
//       return {
//         id: comp.id,
//         rating: comp.elo,
//         rank,
//       };
//     });

//     const n = inputs.length;
//     const ratingChanges: Record<string, number> = {};
//     inputs.forEach((input) => {
//       ratingChanges[input.id] = 0;
//     });

//     // Round-robin pairwise
//     for (let i = 0; i < n; i++) {
//       for (let j = i + 1; j < n; j++) {
//         const a = inputs[i];
//         const b = inputs[j];
//         const resultA = raceResults[a.id];
//         const resultB = raceResults[b.id];
//         const scoreA = resultA?.score ?? 0;
//         const scoreB = resultB?.score ?? 0;

//         let performanceA = 0.5;
//         let performanceB = 0.5;
//         if (scoreA + scoreB > 0) {
//           performanceA = scoreA / (scoreA + scoreB);
//           performanceB = scoreB / (scoreA + scoreB);
//         }

//         const expA = EloCalculator.expectedScore(a.rating, b.rating);
//         const expB = EloCalculator.expectedScore(b.rating, a.rating);

//         const deltaA = EloCalculator.kFactor * (performanceA - expA);
//         const deltaB = EloCalculator.kFactor * (performanceB - expB);

//         ratingChanges[a.id] += deltaA;
//         ratingChanges[b.id] += deltaB;
//       }
//     }

//     // Average changes
//     const baseRatings: Record<string, number> = {};
//     for (const input of inputs) {
//       const newRating = input.rating + ratingChanges[input.id] / (n - 1);
//       baseRatings[input.id] = Math.floor(newRating);
//     }

//     // Apply bonus
//     const finalRatings: Record<string, number> = {};
//     for (const input of inputs) {
//       const res = raceResults[input.id];
//       let bonus = 0;
//       if (res) {
//         if (res.rank12 > 4) {
//           bonus -= (res.rank12 - 4) * 5;
//         }
//         if (res.score === 60) {
//           bonus += 10;
//         }
//       }
//       finalRatings[input.id] = baseRatings[input.id] + bonus;
//     }

//     return finalRatings;
//   }
// }
