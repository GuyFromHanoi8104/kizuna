import { Image } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const TONES = [
  { bg: '#0092F5', fg: '#FDFDFE' },
  { bg: '#0B1B2B', fg: '#7CC8FF' },
  { bg: '#DD2C04', fg: '#FDFDFE' },
  { bg: '#0077D9', fg: '#FDFDFE' },
  { bg: '#E6F4FF', fg: '#0092F5' },
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Default avatar: a simple vector person on a brand-colour circle. The colour is picked from `seed`. */
export function DefaultAvatar({ seed, size = 44 }: { seed: string; size?: number }) {
  const t = TONES[hash(seed) % TONES.length];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={32} cy={32} r={32} fill={t.bg} />
      <Circle cx={32} cy={25} r={10.5} fill={t.fg} />
      <Path d="M12.5 54c2.4-9.6 10.4-15.5 19.5-15.5S49.1 44.4 51.5 54A31.8 31.8 0 0 1 32 64a31.8 31.8 0 0 1-19.5-10Z" fill={t.fg} />
    </Svg>
  );
}

export default function Avatar({ url, seed, size = 44 }: { url?: string | null; seed: string; size?: number }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityIgnoresInvertColors />;
  return <DefaultAvatar seed={seed} size={size} />;
}
