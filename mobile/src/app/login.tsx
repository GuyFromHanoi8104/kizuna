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

type Step = 'email' | 'code' | 'password';

export default function Login() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<string | void>) => {
    setError('');
    setBusy(true);
    try {
      const msg = await fn();
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!isConfigured) return 'Supabase keys are missing. See README: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.';
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
      if (error) return error.message;
      setStep('code');
    });

  const verify = () =>
    run(async () => {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (error) return 'That code didn’t work. Check it or send a new one.';
    });

  const withPassword = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return error.message;
    });

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
              <Animated.View key={step} entering={FadeInDown.duration(350)} exiting={FadeOut.duration(120)} style={{ gap: 14 }}>
                {step === 'email' && (
                  <>
                    <Text style={s.cardTitle}>Start your map</Text>
                    <Text style={s.cardText}>Sign in with your email. We’ll send you a code, no password needed.</Text>
                    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" returnKeyType="send" onSubmitEditing={sendCode} />
                    <Button title="Send me a code" onPress={sendCode} busy={busy} />
                    <Pressable onPress={() => setStep('password')} hitSlop={8}>
                      <Text style={s.link}>Sign in with a password instead</Text>
                    </Pressable>
                  </>
                )}
                {step === 'code' && (
                  <>
                    <Text style={s.cardTitle}>Check your inbox</Text>
                    <Text style={s.cardText}>We sent a code to {email.trim()}.</Text>
                    <Field label="Code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, ''))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={10} style={s.codeInput} autoFocus />
                    <Button title="Sign in" onPress={verify} busy={busy} />
                    <Pressable onPress={() => { setStep('email'); setCode(''); }} hitSlop={8}>
                      <Text style={s.link}>Use a different email</Text>
                    </Pressable>
                  </>
                )}
                {step === 'password' && (
                  <>
                    <Text style={s.cardTitle}>Sign in</Text>
                    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
                    <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" onSubmitEditing={withPassword} />
                    <Button title="Sign in" onPress={withPassword} busy={busy} />
                    <Pressable onPress={() => setStep('email')} hitSlop={8}>
                      <Text style={s.link}>Get an email code instead</Text>
                    </Pressable>
                  </>
                )}
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
  codeInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontFamily: F.bold },
  link: { fontFamily: F.semibold, fontSize: 15, color: C.skyInk, textAlign: 'center', paddingVertical: 6 },
  error: { fontFamily: F.semibold, fontSize: 15, color: C.redInk },
});
