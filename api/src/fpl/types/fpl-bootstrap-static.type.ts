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
  // Keep the rest of the payload but we do not type every field here
  [key: string]: unknown;
}

export interface RawBootstrapStatic {
  teams: RawBootstrapTeam[];
  elements: RawBootstrapPlayer[];
}
