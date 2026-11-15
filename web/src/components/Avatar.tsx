/* eslint-disable @next/next/no-img-element */

const TONES = [
  { bg: "#0092F5", fg: "#FDFDFE" },
  { bg: "#0B1B2B", fg: "#7CC8FF" },
  { bg: "#DD2C04", fg: "#FDFDFE" },
  { bg: "#0077D9", fg: "#FDFDFE" },
  { bg: "#E6F4FF", fg: "#0092F5" },
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
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <circle cx="32" cy="32" r="32" fill={t.bg} />
      <circle cx="32" cy="25" r="10.5" fill={t.fg} />
      <path d="M12.5 54c2.4-9.6 10.4-15.5 19.5-15.5S49.1 44.4 51.5 54A31.8 31.8 0 0 1 32 64a31.8 31.8 0 0 1-19.5-10Z" fill={t.fg} />
    </svg>
  );
}

export default function Avatar({ url, seed, size = 44 }: { url?: string | null; seed: string; size?: number }) {
  if (url) {
    return <img src={url} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none", display: "block" }} />;
  }
  return <DefaultAvatar seed={seed} size={size} />;
}
