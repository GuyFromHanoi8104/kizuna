import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field, Rings } from '@/components/ui';
import { isConfigured, supabase } from '@/lib/supabase';
import { C, EASE, F } from '@/lib/theme';

const ROLL = ['Vietnam', 'Germany', 'Brazil', 'Japan', 'Nigeria', 'France', 'Mexico', 'India', 'Korea', 'Italy', 'Canada', 'Kenya'];
const COLUMN = [ROLL[0], ...ROLL.slice(1).reverse(), ROLL[0]];
const N = ROLL.length;
const H = 62; // row height of the rolling word

/** "Know someone from [country]?" — country names drop into the box one by one. */
function Roller() {
  const y = useSharedValue(-N * H);
  useEffect(() => {
    let k = 0;
    const id = setInterval(() => {
      k += 1;
      const last = k >= N;
      y.set(
        withSpring(-(N - k) * H, { damping: 13, stiffness: 140 }, (done) => {
          'worklet';
          if (done && last) y.set(-N * H);
        }),
      );
      if (k >= N) k = 0;
    }, 2100);
    return () => clearInterval(id);
  }, [y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={s.rollBox}>
      <Animated.View style={a}>
        {COLUMN.map((c, i) => (
          <Text key={i} style={s.rollText}>
            {c}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

type Mode = 'signup' | 'signin';

export default function Login() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signup = mode === 'signup';

  const submit = async () => {
    setError('');
    if (!isConfigured) return setError('Supabase keys are missing. See README: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Your password needs at least 6 characters.');
    setBusy(true);
    const { data, error } = signup
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      if (/already registered/i.test(error.message)) {
        setMode('signin');
        return setError('You already have an account. Sign in instead.');
      }
      if (/invalid login/i.test(error.message)) return setError('Wrong email or password.');
      return setError(error.message);
    }
    if (signup && !data.session) setError('Account created, but Supabase is asking for email confirmation. Turn off “Confirm email” in Supabase, then sign in.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.sky }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeIn.duration(500)} style={s.logo}>
              <Rings />
              <Text style={s.logoText}>KIZUNA</Text>
            </Animated.View>

            <Animated.Text entering={FadeInDown.duration(700).delay(150).easing(EASE)} style={s.hook}>
              Know someone from
            </Animated.Text>
            <Animated.View entering={FadeInDown.duration(700).delay(280).easing(EASE)} style={s.hookRow}>
              <Roller />
              <Text style={s.hook}>?</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(700).delay(420).easing(EASE)} style={s.addRow}>
              <Text style={s.add}>Add them to </Text>
              <Animated.View entering={ZoomIn.springify().damping(11).delay(700)} style={s.badge}>
                <Text style={s.badgeText}>KIZUNA</Text>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(700).delay(600).easing(EASE)} style={s.card}>
              <Animated.View key={mode} entering={FadeInDown.duration(350)} exiting={FadeOut.duration(120)} style={{ gap: 14 }}>
                <Text style={s.cardTitle}>{signup ? 'Start your map' : 'Welcome back'}</Text>
                <Text style={s.cardText}>{signup ? 'Create an account to save your connections. They’re private to you.' : 'Sign in to see your map.'}</Text>
                <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" />
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  textContentType={signup ? 'newPassword' : 'password'}
                  placeholder={signup ? 'At least 6 characters' : ''}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
                <Button title={signup ? 'Create account' : 'Sign in'} onPress={submit} busy={busy} />
                <Pressable onPress={() => { setMode(signup ? 'signin' : 'signup'); setError(''); }} hitSlop={8}>
                  <Text style={s.link}>{signup ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
                </Pressable>
                {error ? (
                  <Animated.Text entering={FadeIn} style={s.error} accessibilityRole="alert">
                    {error}
                  </Animated.Text>
                ) : null}
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 24, paddingBottom: 48, gap: 6 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  logoText: { fontFamily: F.display, fontSize: 24, color: '#fff', letterSpacing: 1 },
  hook: { fontFamily: F.display, fontSize: 52, lineHeight: 62, color: '#fff', textTransform: 'uppercase' },
  hookRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rollBox: { height: H, width: 230, overflow: 'hidden', backgroundColor: C.white, borderRadius: 8, paddingHorizontal: 12 },
  rollText: { height: H, lineHeight: H, fontFamily: F.display, fontSize: 52, color: C.red, textTransform: 'uppercase' },
  addRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 14 },
  add: { fontFamily: F.display, fontSize: 34, color: '#fff', textTransform: 'uppercase' },
  badge: { backgroundColor: C.red, paddingHorizontal: 10, paddingTop: 2, paddingBottom: 4, borderRadius: 6, transform: [{ rotate: '-3deg' }], shadowColor: C.ink, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 } },
  badgeText: { fontFamily: F.display, fontSize: 34, color: '#fff' },
  card: { marginTop: 32, backgroundColor: C.white, borderRadius: 24, padding: 22 },
  cardTitle: { fontFamily: F.display, fontSize: 32, color: C.ink, textTransform: 'uppercase' },
  cardText: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.ink2 },
  link: { fontFamily: F.semibold, fontSize: 15, color: C.skyInk, textAlign: 'center', paddingVertical: 6 },
  error: { fontFamily: F.semibold, fontSize: 15, color: C.redInk },
});
