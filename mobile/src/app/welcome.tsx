import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInLeft, SlideInRight, ZoomIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import Avatar from '@/components/Avatar';
import CountryPicker from '@/components/CountryPicker';
import { Button, Field, PressScale, Rings, tap } from '@/components/ui';
import { saveProfile, uploadAvatar } from '@/lib/profile';
import { useStore } from '@/lib/store';
import { isConfigured, supabase } from '@/lib/supabase';
import { C, EASE, F } from '@/lib/theme';

const ROLL = ['Vietnam', 'Germany', 'Brazil', 'Japan', 'Nigeria', 'France', 'Mexico', 'India', 'Korea', 'Italy', 'Canada', 'Kenya'];
const COLUMN = [ROLL[0], ...ROLL.slice(1).reverse(), ROLL[0]];
const N = ROLL.length;
const H = 50; // row height of the rolling word
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

function StepBar({ step }: { step: number }) {
  return (
    <View style={s.bar} accessibilityLabel={`Step ${step} of 3`}>
      {[1, 2, 3].map((n) => (
        <Seg key={n} on={n <= step} />
      ))}
    </View>
  );
}

function Seg({ on }: { on: boolean }) {
  const w = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    w.set(withTiming(on ? 1 : 0, { duration: 450, easing: EASE }));
  }, [on, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={s.seg}>
      <Animated.View style={[s.segFill, a]} />
    </View>
  );
}

/**
 * Sign-up with no email or password, one step at a time:
 * 1. name  2. where you're from / live  3. optional extras (skippable).
 * Finishing creates a guest (anonymous) account that stays on this phone.
 */
export default function Welcome() {
  const { session, setProfile } = useStore();
  const [step, setStep] = useState(1);
  const [back, setBack] = useState(false);
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [live, setLive] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; mime: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const go = (n: number) => {
    tap();
    setError('');
    setBack(n < step);
    setStep(n);
  };

  const next = () => {
    if (step === 1) {
      if (!name.trim()) return setError('What should we call you?');
      return go(2);
    }
    if (step === 2) {
      if (!from) return setError('Pick where you’re from.');
      if (!live) return setError('Pick where you live now.');
      return go(3);
    }
    finish(false);
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled && res.assets[0]) setPhoto({ uri: res.assets[0].uri, mime: res.assets[0].mimeType ?? 'image/jpeg' });
  };

  const finish = async (skip: boolean) => {
    setError('');
    if (!isConfigured) return setError('Supabase keys are missing. See README: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
    const ageNum = !skip && age.trim() ? Number(age) : null;
    if (!skip) {
      if (email.trim() && !EMAIL.test(email.trim())) return setError('That email doesn’t look right.');
      if (ageNum !== null && (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120)) return setError('Age should be between 13 and 120.');
    }
    setBusy(true);
    try {
      let userId = session?.user.id;
      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) throw new Error(error?.message ?? 'Couldn’t create your account.');
        userId = data.user.id;
      }
      const avatar_url = !skip && photo ? await uploadAvatar(userId, photo.uri, photo.mime) : null;
      const profile = await saveProfile(userId, {
        name: name.trim(),
        from_country: from,
        lives_in: live,
        age: ageNum,
        email: skip ? null : email.trim() || null,
        phone: skip ? null : phone.trim() || null,
        avatar_url,
      });
      setProfile(profile);
    } catch (e) {
      const msg = (e as Error).message;
      setError(/anonymous/i.test(msg) ? 'Guest accounts are switched off in Supabase. Turn on “Allow anonymous sign-ins”.' : msg);
      setBusy(false);
    }
  };

  const entering = (back ? SlideInLeft : SlideInRight).duration(380).easing(EASE);

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
              <StepBar step={step} />
              <Animated.View key={step} entering={entering} style={{ gap: 14 }}>
                {step === 1 && (
                  <>
                    <Text style={s.kicker}>Step 1 of 3</Text>
                    <Text style={s.title}>Tell Kizuna your name</Text>
                    <Field label="Your name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" textContentType="name" autoCapitalize="words" maxLength={80} returnKeyType="next" onSubmitEditing={next} style={s.bigInput} />
                  </>
                )}
                {step === 2 && (
                  <>
                    <Text style={s.kicker}>Step 2 of 3</Text>
                    <Text style={s.title}>Hi {name.trim().split(' ')[0]}! Where in the world?</Text>
                    <CountryPicker label="Where you’re from" required value={from} onChange={setFrom} placeholder="Choose a country" />
                    <CountryPicker label="Where you live now" required value={live} onChange={setLive} placeholder="Choose a country" />
                  </>
                )}
                {step === 3 && (
                  <>
                    <Text style={s.kicker}>Step 3 of 3 · optional</Text>
                    <Text style={s.title}>A few extras</Text>
                    <Text style={s.text}>All optional. Skip if you like, you can add them later.</Text>
                    <View style={s.photoRow}>
                      <Animated.View entering={ZoomIn.springify().damping(12).delay(150)}>
                        <Avatar url={photo?.uri} seed={name || 'kizuna'} size={72} />
                      </Animated.View>
                      <PressScale onPress={pick} label="Add a photo" style={s.chip}>
                        <Text style={s.chipText}>{photo ? 'Change photo' : 'Add a photo'}</Text>
                      </PressScale>
                    </View>
                    <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
                    <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+49 …" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={40} />
                    <Field label="Age" value={age} onChangeText={(t) => setAge(t.replace(/\D/g, ''))} placeholder="e.g. 22" keyboardType="number-pad" maxLength={3} />
                  </>
                )}
              </Animated.View>

              <Button title={step === 3 ? 'Start my map' : 'Continue'} onPress={next} busy={busy} style={{ marginTop: 18 }} />
              <View style={s.navRow}>
                {step > 1 ? (
                  <Pressable onPress={() => go(step - 1)} hitSlop={8} disabled={busy}>
                    <Text style={s.link}>← Back</Text>
                  </Pressable>
                ) : (
                  <View />
                )}
                {step === 3 ? (
                  <Pressable onPress={() => finish(true)} hitSlop={8} disabled={busy}>
                    <Text style={s.link}>Skip</Text>
                  </Pressable>
                ) : null}
              </View>
              {error ? (
                <Animated.Text key={error} entering={FadeIn} style={s.error} accessibilityRole="alert">
                  {error}
                </Animated.Text>
              ) : null}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 24, paddingBottom: 48, gap: 4 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoText: { fontFamily: F.display, fontSize: 24, color: '#fff', letterSpacing: 1 },
  hook: { fontFamily: F.display, fontSize: 42, lineHeight: 50, color: '#fff', textTransform: 'uppercase' },
  hookRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rollBox: { height: H, width: 190, overflow: 'hidden', backgroundColor: C.white, borderRadius: 8, paddingHorizontal: 10 },
  rollText: { height: H, lineHeight: H, fontFamily: F.display, fontSize: 42, color: C.red, textTransform: 'uppercase' },
  addRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 12 },
  add: { fontFamily: F.display, fontSize: 30, color: '#fff', textTransform: 'uppercase' },
  badge: { backgroundColor: C.red, paddingHorizontal: 10, paddingTop: 2, paddingBottom: 4, borderRadius: 6, transform: [{ rotate: '-3deg' }], shadowColor: C.ink, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 } },
  badgeText: { fontFamily: F.display, fontSize: 30, color: '#fff' },
  card: { marginTop: 28, backgroundColor: C.white, borderRadius: 24, padding: 22, overflow: 'hidden' },
  bar: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  seg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.line, overflow: 'hidden' },
  segFill: { height: 6, backgroundColor: C.red },
  kicker: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, color: C.skyInk, textTransform: 'uppercase' },
  title: { fontFamily: F.display, fontSize: 32, lineHeight: 38, color: C.ink, textTransform: 'uppercase' },
  text: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.ink2 },
  bigInput: { height: 58, fontSize: 20, fontFamily: F.semibold },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chip: { height: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1.5, borderColor: C.line2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  link: { fontFamily: F.semibold, fontSize: 15, color: C.skyInk, paddingVertical: 6 },
  error: { fontFamily: F.semibold, fontSize: 15, color: C.redInk, marginTop: 6 },
});
