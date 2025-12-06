import { RawBootstrapPlayer } from '../types/fpl-bootstrap-static.type';
import { FplAvailability } from '../types/fpl-availability.type';

export function getAvailabilityFromRaw(
  raw: RawBootstrapPlayer | null,
): FplAvailability {
  if (!raw) return 'AVAILABLE';

  const status = raw.status as string | undefined;
  const chance =
    raw.chance_of_playing_next_round ??
    raw.chance_of_playing_this_round ??
    null;

  if (status === 'i' || status === 's' || status === 'n' || status === 'u') {
    return 'UNAVAILABLE';
  }

  if (typeof chance === 'number') {
    if (chance <= 25) return 'UNAVAILABLE';
    if (chance < 75) return 'RISKY';
  }

  if (status === 'd') {
    return 'RISKY';
  }

  return 'AVAILABLE';
}
