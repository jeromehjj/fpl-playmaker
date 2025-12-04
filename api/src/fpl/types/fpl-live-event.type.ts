export type RawEventLiveElement = {
  id: number;
  stats: { total_points: number };
};

export type RawEventLiveResponse = {
  elements: RawEventLiveElement[];
};
