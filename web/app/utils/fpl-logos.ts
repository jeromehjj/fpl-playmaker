// Map club short names (as from FPL: ARS, MCI, etc.) to logo URLs.
// You can point these to local assets (e.g. /clubs/ars.svg) or a CDN.
// For any club not in the map, the UI will fall back to showing the short name.

const CLUB_LOGOS: Record<string, string> = {
  ARS: '/clubs/ars.svg',
  AVL: '/clubs/avl.svg',
  BHA: '/clubs/bha.svg',
  BRE: '/clubs/bre.svg',
  BOU: '/clubs/bou.svg',
  BUR: '/clubs/bur.svg',
  CHE: '/clubs/che.svg',
  CRY: '/clubs/cry.svg',
  EVE: '/clubs/eve.svg',
  FUL: '/clubs/ful.svg',
  LEE: '/clubs/lee.svg',
  LIV: '/clubs/liv.svg',
  MCI: '/clubs/mci.svg',
  MUN: '/clubs/mun.svg',
  NEW: '/clubs/new.svg',
  NFO: '/clubs/nfo.svg',
  SUN: '/clubs/sun.svg',
  TOT: '/clubs/tot.svg',
  WHU: '/clubs/whu.svg',
  WOL: '/clubs/wol.svg',
};

// Optional separate mapping for outfield shirt/jersey graphics. Follow the same
// short-name convention and place the assets under /jerseys.
const CLUB_JERSEYS: Record<string, string> = {
  ARS: '/jerseys/ars.svg',
  AVL: '/jerseys/avl.svg',
  BHA: '/jerseys/bha.svg',
  BRE: '/jerseys/bre.svg',
  BOU: '/jerseys/bou.svg',
  BUR: '/jerseys/bur.svg',
  CHE: '/jerseys/che.svg',
  CRY: '/jerseys/cry.svg',
  EVE: '/jerseys/eve.svg',
  FUL: '/jerseys/ful.svg',
  LEE: '/jerseys/lee.svg',
  LIV: '/jerseys/liv.svg',
  MCI: '/jerseys/mci.svg',
  MUN: '/jerseys/mun.svg',
  NEW: '/jerseys/new.svg',
  NFO: '/jerseys/nfo.svg',
  SUN: '/jerseys/sun.svg',
  TOT: '/jerseys/tot.svg',
  WHU: '/jerseys/whu.svg',
  WOL: '/jerseys/wol.svg',
};

// Optional separate mapping for goalkeeper shirts. Point these to a different
// set of assets (for example /jerseys/gk/ars.svg) so keepers can have their
// own colourway like in the official FPL UI.
const CLUB_GK_JERSEYS: Record<string, string> = {
  ARS: '/jerseys/gk/ars.svg',
  AVL: '/jerseys/gk/avl.svg',
  BHA: '/jerseys/gk/bha.svg',
  BRE: '/jerseys/gk/bre.svg',
  BOU: '/jerseys/gk/bou.svg',
  BUR: '/jerseys/gk/bur.svg',
  CHE: '/jerseys/gk/che.svg',
  CRY: '/jerseys/gk/cry.svg',
  EVE: '/jerseys/gk/eve.svg',
  FUL: '/jerseys/gk/ful.svg',
  LEE: '/jerseys/gk/lee.svg',
  LIV: '/jerseys/gk/liv.svg',
  MCI: '/jerseys/gk/mci.svg',
  MUN: '/jerseys/gk/mun.svg',
  NEW: '/jerseys/gk/new.svg',
  NFO: '/jerseys/gk/nfo.svg',
  SUN: '/jerseys/gk/sun.svg',
  TOT: '/jerseys/gk/tot.svg',
  WHU: '/jerseys/gk/whu.svg',
  WOL: '/jerseys/gk/wol.svg',
};

export const getClubLogoUrl = (shortName: string): string | undefined => {
  return CLUB_LOGOS[shortName.toUpperCase()] ?? undefined;
};

export const getClubJerseyUrl = (shortName: string): string | undefined => {
  return CLUB_JERSEYS[shortName.toUpperCase()] ?? undefined;
};

export const getClubGoalkeeperJerseyUrl = (
  shortName: string,
): string | undefined => {
  return CLUB_GK_JERSEYS[shortName.toUpperCase()] ?? undefined;
};
