import { RaceResult } from "./RaceResult";

export interface RaceEvent {
  id: string;
  date: string; // ISO String
  results: RaceResult[];
}
