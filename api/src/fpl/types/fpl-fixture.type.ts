export interface RawFplFixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  finished: boolean;
  started: boolean;
  minutes: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}
