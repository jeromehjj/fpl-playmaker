export interface RawFplFixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  finished: boolean;
  started: boolean;
  minutes: number | null;
}
