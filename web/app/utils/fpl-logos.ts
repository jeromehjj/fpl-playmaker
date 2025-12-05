// Map club short names (as from FPL: ARS, MCI, etc.) to logo URLs.
// You can point these to local assets (e.g. /clubs/ars.svg) or a CDN.
// For any club not in the map, the UI will fall back to showing the short name.

const CLUB_LOGOS: Record<string, string> = {
  // Example local paths; adjust to where you store crests
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

export const getClubLogoUrl = (shortName: string): string | null => {
  return CLUB_LOGOS[shortName.toUpperCase()] ?? null;
};

