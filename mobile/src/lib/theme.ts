import { Easing } from 'react-native-reanimated';

export const C = {
  sky: '#0092F5',
  skyBright: '#0099FF',
  skyInk: '#0077D9',
  skySoft: '#7CC8FF',
  red: '#DD2C04',
  redInk: '#C42703',
  white: '#FDFDFE',
  ink: '#0B1B2B',
  ink2: '#46566A',
  ink3: '#5A6878',
  line: '#E3E9F0',
  line2: '#D5DEE8',
  bg: '#F3F6FA',
  land: '#E3E9F0',
  dot: '#C9D3DE',
};

export const F = {
  display: 'Anton_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
};

/** The same ease-out curve the website uses. */
export const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

export const TAG_COLORS: Record<string, string> = {
  Work: C.ink,
  Uni: C.skyInk,
  'Mutual friends': C.red,
  Other: C.ink3,
};

export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? '';
