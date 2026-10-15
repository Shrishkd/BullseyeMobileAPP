/**
 * Design tokens ported from the web app (Frontend/src/index.css): a black/white
 * base with a green brand accent. The web defines them as HSL; these are the
 * hex equivalents so the two clients match.
 */
export const palette = {
  dark: {
    background: '#0A0A0A',
    card: '#121212',
    cardElevated: '#171717',
    muted: '#1F1F1F',
    border: '#2E2E2E',
    text: '#FAFAFA',
    textMuted: '#A6A6A6',
    primary: '#22C365',
    primaryText: '#FAFAFA',
    primarySoft: 'rgba(34,195,101,0.14)',
    up: '#22C365',
    upSoft: 'rgba(34,195,101,0.14)',
    down: '#F04242',
    downSoft: 'rgba(240,66,66,0.14)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245,158,11,0.14)',
    info: '#60A5FA',
    infoSoft: 'rgba(96,165,250,0.14)',
  },
  light: {
    background: '#FAFAFA',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    muted: '#EBEBEB',
    border: '#D9D9D9',
    text: '#1A1A1A',
    textMuted: '#737373',
    primary: '#1FAD5A',
    primaryText: '#FFFFFF',
    primarySoft: 'rgba(31,173,90,0.12)',
    up: '#1FAD5A',
    upSoft: 'rgba(31,173,90,0.12)',
    down: '#E03535',
    downSoft: 'rgba(224,53,53,0.10)',
    warning: '#D97706',
    warningSoft: 'rgba(217,119,6,0.12)',
    info: '#2563EB',
    infoSoft: 'rgba(37,99,235,0.10)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = { [K in keyof (typeof palette)['dark']]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const font = {
  caption: 12,
  small: 13,
  body: 15,
  title: 17,
  heading: 22,
  display: 30,
} as const;
