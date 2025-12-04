export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Availability = 'AVAILABLE' | 'RISKY' | 'UNAVAILABLE';

export interface TickerFixture {
  event: number;
  kickoffTime: string | null;
  isHome: boolean;
  opponentExternalId: number;
  opponentShortName: string | null;
  difficulty: number;
}

export interface TickerRow {
  clubExternalId: number;
  clubShortName: string;
  fixtures: TickerFixture[];
}

export interface FixtureTicker {
  events: number[];
  rows: TickerRow[];
}
