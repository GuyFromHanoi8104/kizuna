import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutRight, LinearTransition, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import CountryPicker from '@/components/CountryPicker';
import { Button, Field, PressScale, Segmented, styles as ui } from '@/components/ui';
import { HOW_MET, initials, placeOf, type Connection, type HowMet, type View as ViewMode } from '@/lib/connections';
import { useStore } from '@/lib/store';
import { C, EASE, F, TAG_COLORS } from '@/lib/theme';
import { BY_CODE, CONTINENTS, countryName } from '@/lib/world';

function PersonRow({ p, live, onRemove }: { p: Connection; live: boolean; onRemove: (p: Connection) => void }) {
  const sub =
    [live ? `From ${countryName(p.from_country)}` : p.lives_in && p.lives_in !== p.from_country ? `Lives in ${countryName(p.lives_in)}` : '', p.contact]
      .filter(Boolean)
      .join(' · ') || 'No details yet';
  return (
    <Animated.View entering={ZoomIn.springify().damping(14)} exiting={FadeOutRight.duration(220)} layout={LinearTransition.duration(250)} style={s.person}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials(p.name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.personName}>{p.name}</Text>
        <Text style={s.personSub}>{sub}</Text>
      </View>
      <View style={[s.tag, { backgroundColor: TAG_COLORS[p.how_met] ?? C.ink3 }]}>
        <Text style={s.tagText}>{p.how_met}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.name}`} hitSlop={8} onPress={() => onRemove(p)} style={s.trash}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth={2} strokeLinecap="round">
          <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

export default function CountryScreen() {
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const code = String(raw || '').toUpperCase();
  const country = BY_CODE[code] ?? { code, name: code, cont: '' };
  const { people, view, setView, add, remove } = useStore();
  const live = view === 'live';

  const [name, setName] = useState('');
  const [other, setOther] = useState('');
  const [contact, setContact] = useState('');
  const [how, setHow] = useState<HowMet>('Uni');
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<{ text: string; ok: boolean } | null>(null);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const here = people.filter((p) => placeOf(p, view) === code);
  const n = here.length;

  const switchView = (v: ViewMode) => {
    setView(v);
    setOther('');
    setHint(null);
  };

  const save = async () => {
    const nm = name.trim();
    if (!nm) {
      shake.set(withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 70 }), withTiming(-5, { duration: 60 }), withTiming(0, { duration: 50 })));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return setHint({ text: 'Add a name first.', ok: false });
    }
    if (live && !other) return setHint({ text: 'Pick where they are from.', ok: false });
    setSaving(true);
    try {
      const row = await add({
        name: nm,
        from_country: live ? other : code,
        lives_in: (live ? code : other) || null,
        contact: contact.trim() || null,
        how_met: how,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setName('');
      setOther('');
      setContact('');
      setHint({ text: `Saved ${row.name}.`, ok: true });
    } catch (e) {
      setHint({ text: `Couldn’t save: ${(e as Error).message}`, ok: false });
    } finally {
      setSaving(false);
    }
  };

  const onRemove = (p: Connection) =>
    Alert.alert(`Remove ${p.name}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => remove(p.id).catch((e) => Alert.alert('Couldn’t remove', (e as Error).message)),
      },
    ]);

  const enter = (i: number) => FadeInDown.duration(550).delay(60 + i * 80).easing(EASE);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} keyboardShouldPersistTaps="handled">
          <PressScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} label="Back" style={s.back}>
            <Text style={s.backText}>‹ Back</Text>
          </PressScale>

          <Animated.View entering={enter(0)} style={s.headRow}>
            <Animated.View entering={ZoomIn.springify().damping(12).delay(150)} style={s.bigCode}>
              <Text style={s.bigCodeText}>{country.code}</Text>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={2}>
                {country.name}
              </Text>
              <Text style={ui.sub}>
                {CONTINENTS[country.cont] ?? ''} · {n === 1 ? '1 person' : `${n} people`} {live ? 'living here' : 'from here'}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={enter(1)}>
            <Segmented<ViewMode>
              onWhite
              label="Count people by"
              value={view}
              onChange={switchView}
              options={[
                { v: 'from', label: 'From here' },
                { v: 'live', label: 'Living here' },
              ]}
            />
          </Animated.View>

          <Animated.View entering={enter(2)} style={{ gap: 10 }} key={view}>
            {here.map((p) => (
              <PersonRow key={p.id} p={p} live={live} onRemove={onRemove} />
            ))}
            {n === 0 ? (
              <Animated.View entering={FadeIn} style={s.empty}>
                <Text style={s.emptyText}>
                  No one {live ? 'living in' : 'from'} {country.name} yet. Add your first connection below.
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>

          <Animated.View entering={enter(3)} layout={LinearTransition.duration(250)} style={[ui.card, { gap: 16 }]}>
            <View>
              <Text style={s.formTitle}>{live ? `Add someone who lives in ${country.name}` : `Add someone from ${country.name}`}</Text>
              <Text style={[ui.sub, { fontSize: 14 }]}>{live ? 'Name and where they are from are required.' : 'Only name and country are required.'}</Text>
            </View>
            <Animated.View style={shakeStyle}>
              <Field label="Name" required value={name} onChangeText={(t) => { setName(t); setHint(null); }} placeholder="Their name" maxLength={120} autoCapitalize="words" />
            </Animated.View>
            <CountryPicker
              label={live ? 'From' : 'Lives in'}
              required={live}
              hint={live ? undefined : '(optional)'}
              value={other}
              onChange={(c) => { setOther(c); setHint(null); }}
              placeholder={live ? 'Choose a country' : 'Same as home / not sure'}
            />
            <Field label="Phone or social" hint="(optional)" value={contact} onChangeText={setContact} placeholder="+49 … or @handle" maxLength={200} autoCapitalize="none" />
            <View style={{ gap: 8 }}>
              <Text style={ui.label}>How did you meet?</Text>
              <View style={s.chips}>
                {HOW_MET.map((h) => {
                  const on = how === h;
                  return (
                    <PressScale key={h} onPress={() => setHow(h)} label={h} style={[s.chip, on && s.chipOn]}>
                      <Text style={[s.chipText, on && { color: '#fff' }]}>{h}</Text>
                    </PressScale>
                  );
                })}
              </View>
            </View>
            <Button title="Save connection" onPress={save} busy={saving} />
            {hint ? (
              <Animated.Text key={hint.text} entering={FadeInDown.duration(300)} style={[s.hint, { color: hint.ok ? C.skyInk : C.redInk }]} accessibilityLiveRegion="polite">
                {hint.text}
              </Animated.Text>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12 },
  backText: { fontFamily: F.bold, fontSize: 17, color: C.skyInk },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bigCode: { width: 64, height: 64, borderRadius: 16, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  bigCodeText: { fontFamily: F.display, fontSize: 26, color: '#fff' },
  title: { fontFamily: F.display, fontSize: 36, lineHeight: 42, color: C.ink, textTransform: 'uppercase' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: F.heavy, fontSize: 14, color: '#fff' },
  personName: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  personSub: { fontFamily: F.regular, fontSize: 14, color: C.ink2, marginTop: 2 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontFamily: F.bold, fontSize: 12, color: '#fff' },
  trash: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 24, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line2 },
  emptyText: { fontFamily: F.regular, fontSize: 15, color: C.ink2, textAlign: 'center', lineHeight: 22 },
  formTitle: { fontFamily: F.heavy, fontSize: 19, color: C.ink, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: C.line2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  hint: { fontFamily: F.semibold, fontSize: 15, textAlign: 'center' },
});
