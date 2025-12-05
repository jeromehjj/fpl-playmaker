export interface FplFixtureTickerFixtureDto {
  event: number;
  kickoffTime: string | null;
  isHome: boolean;
  opponentExternalId: number;
  opponentShortName: string | null;
  difficulty: number; // 1–5 from FPL
}

export interface FplFixtureTickerRowDto {
  clubExternalId: number;
  clubShortName: string;
  fixtures: FplFixtureTickerFixtureDto[];
}

export interface FplFixtureTickerDto {
  events: number[]; // gameweek ids in order
  rows: FplFixtureTickerRowDto[];
}
