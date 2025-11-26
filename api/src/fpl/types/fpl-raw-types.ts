export interface RawFplLeague {
  id: number;
  name: string;
  short_name: string | null;
  scoring: 'c' | 'h';
  league_type: string;
  closed: boolean;
  entry_can_admin: boolean;
  entry_can_leave: boolean;
  entry_rank: number | null;
  entry_last_rank: number | null;
  rank_count: number | null;
  entry_percentile_rank: number | null;
}

export interface RawFplLeagues {
  classic: RawFplLeague[];
  h2h: RawFplLeague[];
}

export interface RawFplEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  player_region_name: string;
  player_region_iso_code_short: string;

  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;

  current_event: number;

  leagues: RawFplLeagues;
}
