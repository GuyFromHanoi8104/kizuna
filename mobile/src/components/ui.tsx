import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { C, EASE, F } from '@/lib/theme';
import { useCountUp } from '@/lib/useCountUp';

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/** Pressable that shrinks slightly while pressed. */
export function PressScale({ onPress, style, children, disabled, label, haptic = true }: { onPress?: () => void; style?: StyleProp<ViewStyle>; children: React.ReactNode; disabled?: boolean; label?: string; haptic?: boolean }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={() => s.set(withTiming(0.96, { duration: 90 }))}
      onPressOut={() => s.set(withSpring(1, { damping: 14, stiffness: 260 }))}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}>
      <Animated.View style={[style, a, disabled && { opacity: 0.6 }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Button({ title, onPress, busy, tone = 'red', style }: { title: string; onPress: () => void; busy?: boolean; tone?: 'red' | 'white' | 'ghost'; style?: StyleProp<ViewStyle> }) {
  const bg = tone === 'red' ? C.red : tone === 'white' ? '#fff' : 'transparent';
  const fg = tone === 'red' ? '#fff' : tone === 'white' ? C.ink : '#fff';
  return (
    <PressScale onPress={onPress} disabled={busy} label={title} style={[styles.btn, { backgroundColor: bg }, tone === 'ghost' && styles.ghost, style]}>
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnText, { color: fg }]}>{title}</Text>}
    </PressScale>
  );
}

/** Two-option switch with a sliding white indicator. */
export function Segmented<T extends string>({ options, value, onChange, label, onWhite }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; onWhite?: boolean }) {
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.v === value));
  const x = useSharedValue(0);
  useEffect(() => {
    x.set(withTiming(idx * (w / options.length), { duration: 300, easing: EASE }));
  }, [idx, w, options.length, x]);
  const ind = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.seg, onWhite && styles.segWhite]}
      onLayout={(e) => setW(e.nativeEvent.layout.width - 8)}>
      {w > 0 && <Animated.View style={[styles.segInd, onWhite && { backgroundColor: C.bg }, { width: w / options.length }, ind]} />}
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable
            key={o.v}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={styles.segBtn}
            onPress={() => {
              if (!on) {
                tap();
                onChange(o.v);
              }
            }}>
            <Text style={[styles.segText, on && { color: C.ink }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Stat card: counts up on load and bumps when the number changes. */
export function Stat({ value, label, bg, delay = 0, small }: { value: number; label: string; bg: string; delay?: number; small?: boolean }) {
  const shown = useCountUp(value, delay, 1100);
  const s = useSharedValue(1);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    s.set(withSequence(withTiming(1.12, { duration: 160 }), withTiming(1, { duration: 260 })));
  }, [value, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <View style={[styles.stat, { backgroundColor: bg }, small && { minHeight: 0, padding: 14, borderRadius: 16 }]} accessible accessibilityLabel={`${value} ${label}`}>
      <Animated.Text style={[styles.statN, small && { fontSize: 26 }, { transformOrigin: 'left bottom' }, a]}>{shown}</Animated.Text>
      <Text style={[styles.statL, small && { fontSize: 13, marginTop: 8 }, bg === C.ink && { color: '#C9D3DE' }]}>{label}</Text>
    </View>
  );
}

export function Field({ label, hint, required, style, ...props }: TextInputProps & { label: string; hint?: string; required?: boolean }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: C.red }}> *</Text> : null}
        {hint ? <Text style={{ color: C.ink3, fontFamily: F.medium }}> {hint}</Text> : null}
      </Text>
      <TextInput placeholderTextColor={C.ink3} style={[styles.input, style]} {...props} />
    </View>
  );
}

/** The Kizuna logo: two rings that slide together on mount. */
export function Rings({ size = 34 }: { size?: number }) {
  const t = useSharedValue(7);
  useEffect(() => {
    t.set(withTiming(0, { duration: 900, easing: EASE }));
  }, [t]);
  const l = useAnimatedStyle(() => ({ transform: [{ translateX: -t.value }] }));
  const r = useAnimatedStyle(() => ({ transform: [{ translateX: t.value }] }));
  const h = (size * 22) / 34;
  return (
    <View style={{ width: size, height: h }}>
      <Animated.View style={[StyleSheet.absoluteFill, l]}>
        <Svg width={size} height={h} viewBox="0 0 34 22">
          <Circle cx={11} cy={11} r={8.5} fill="none" stroke="#fff" strokeWidth={3} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, r]}>
        <Svg width={size} height={h} viewBox="0 0 34 22">
          <Circle cx={23} cy={11} r={8.5} fill="none" stroke={C.red} strokeWidth={3} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: { height: 54, paddingHorizontal: 26, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 2, borderColor: '#fff' },
  btnText: { fontFamily: F.bold, fontSize: 17 },
  seg: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 4 },
  segWhite: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 14 },
  segInd: { position: 'absolute', top: 4, left: 4, height: 44, borderRadius: 9, backgroundColor: '#fff', shadowColor: C.ink, shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  segText: { fontFamily: F.bold, fontSize: 15, color: C.ink2 },
  stat: { flex: 1, borderRadius: 20, padding: 18, minHeight: 110, justifyContent: 'space-between' },
  statN: { fontFamily: F.heavy, fontSize: 40, color: '#fff', fontVariant: ['tabular-nums'] },
  statL: { fontFamily: F.bold, fontSize: 16, color: '#fff', marginTop: 12 },
  label: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  input: { height: 50, paddingHorizontal: 14, fontSize: 16, fontFamily: F.regular, borderWidth: 1.5, borderColor: C.line2, borderRadius: 12, backgroundColor: '#fff', color: C.ink },
  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 22, padding: 20 },
  h1: { fontFamily: F.display, fontSize: 44, lineHeight: 50, color: C.ink, textTransform: 'uppercase' },
  sub: { fontFamily: F.regular, fontSize: 16, color: C.ink2, marginTop: 6, lineHeight: 22 },
  caps: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, color: C.ink2, textTransform: 'uppercase' },
});
