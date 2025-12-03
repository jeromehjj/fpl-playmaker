export interface RawBootstrapTeam {
  id: number;
  name: string;
  short_name: string;
}

export interface RawBootstrapPlayer {
  id: number;
  team: number; // references team.id
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number; // 1=GK,2=DEF,3=MID,4=FWD
  now_cost: number;
  // Metric values
  total_points: number;
  minutes: number;
  points_per_game: string;

  // availability metrics
  status: string;
  news: string;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;

  // Keep the rest of the payload but we do not type every field here
  [key: string]: unknown;
}

export interface RawBootstrapEvent {
  id: number;
  deadline_time: string; // ISO string
  finished: boolean;
  data_checked: boolean;
}

export interface RawBootstrapStatic {
  teams: RawBootstrapTeam[];
  elements: RawBootstrapPlayer[];
  events: RawBootstrapEvent[];
}
