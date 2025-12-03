export interface RawFplPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface RawFplPicksEntryHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number | null;
  overall_rank: number | null;
  bank: number; // in tenths of a million
  value: number; // in tenths of a million
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface RawFplPicksResponse {
  entry_history: RawFplPicksEntryHistory;
  picks: RawFplPick[];
}
