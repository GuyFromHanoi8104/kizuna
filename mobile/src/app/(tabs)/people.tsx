import { router, useIsFocused } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DefaultAvatar } from '@/components/Avatar';
import { Segmented, styles as ui } from '@/components/ui';
import { placeOf, type Connection, type View as ViewMode } from '@/lib/connections';
import { useStore } from '@/lib/store';
import { C, EASE, F, TAG_COLORS } from '@/lib/theme';
import { countryName } from '@/lib/world';

/** Every connection in one list, grouped by country (biggest groups first). */
export default function People() {
  const { people, view, setView } = useStore();
  const [q, setQ] = useState('');
  const live = view === 'live';

  const sections = useMemo(() => {
    const t = q.trim().toLowerCase();
    const map = new Map<string, Connection[]>();
    for (const p of people) {
      const c = placeOf(p, view);
      const hay = `${p.name} ${p.contact ?? ''} ${countryName(p.from_country)} ${countryName(p.lives_in)} ${p.how_met}`.toLowerCase();
      if (t && !hay.includes(t)) continue;
      map.set(c, [...(map.get(c) ?? []), p]);
    }
    return [...map.entries()]
      .map(([code, list]) => ({ code, title: countryName(code), data: [...list].sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => b.data.length - a.data.length || a.title.localeCompare(b.title));
  }, [people, view, q]);

  // Tab-switch animation.
  const focused = useIsFocused();
  const t = useSharedValue(0);
  useEffect(() => {
    if (focused) {
      t.set(0);
      t.set(withTiming(1, { duration: 450, easing: EASE }));
    }
  }, [focused, t]);
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateX: (1 - t.value) * 36 }] }));

  const open = (code: string) => router.push({ pathname: '/country/[code]', params: { code } });

  const sub = (p: Connection) =>
    [live ? `From ${countryName(p.from_country)}` : p.lives_in && p.lives_in !== p.from_country ? `Lives in ${countryName(p.lives_in)}` : '', p.contact]
      .filter(Boolean)
      .join(' · ') || 'No details yet';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Animated.View style={[{ flex: 1 }, a]}>
        <SectionList
          sections={sections}
          keyExtractor={(p) => p.id}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          ListHeaderComponent={
            <View style={s.head}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={ui.h1}>People</Text>
                <View style={s.count}>
                  <Text style={s.countText}>{people.length}</Text>
                </View>
              </View>
              <Segmented<ViewMode>
                onWhite
                label="Group people by"
                value={view}
                onChange={setView}
                options={[
                  { v: 'from', label: 'Where they’re from' },
                  { v: 'live', label: 'Where they live' },
                ]}
              />
              <TextInput value={q} onChangeText={setQ} placeholder="Search names, countries, handles" placeholderTextColor={C.ink3} style={ui.input} accessibilityLabel="Search all connections" clearButtonMode="while-editing" />
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Pressable onPress={() => open(section.code)} style={s.secHead} accessibilityRole="button" accessibilityLabel={`${section.title}, ${section.data.length}`}>
              <View style={s.code}>
                <Text style={s.codeText}>{section.code}</Text>
              </View>
              <Text style={s.secTitle}>{section.title}</Text>
              <Text style={s.secN}>{section.data.length}</Text>
            </Pressable>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={index < 10 ? FadeInDown.duration(380).delay(index * 30).easing(EASE) : undefined}>
              <Pressable onPress={() => open(placeOf(item, view))} style={({ pressed }) => [s.person, pressed && { opacity: 0.7 }]} accessibilityRole="button">
                <DefaultAvatar seed={item.id} size={38} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={s.sub} numberOfLines={1}>
                    {sub(item)}
                  </Text>
                </View>
                <View style={[s.tag, { backgroundColor: TAG_COLORS[item.how_met] ?? C.ink3 }]}>
                  <Text style={s.tagText}>{item.how_met}</Text>
                </View>
              </Pressable>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={s.empty}>{people.length === 0 ? 'No connections yet. Open a country to add your first one.' : `No one matches “${q}”.`}</Text>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { paddingTop: 20, paddingBottom: 8, gap: 12 },
  count: { backgroundColor: C.red, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontFamily: F.heavy, fontSize: 14, color: '#fff' },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 4, backgroundColor: C.bg },
  code: { width: 38, height: 28, borderRadius: 8, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center' },
  codeText: { fontFamily: F.heavy, fontSize: 12, color: '#fff', letterSpacing: 0.5 },
  secTitle: { flex: 1, fontFamily: F.heavy, fontSize: 16, color: C.ink },
  secN: { fontFamily: F.heavy, fontSize: 13, color: C.ink2 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 6, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  name: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  sub: { fontFamily: F.regular, fontSize: 13, color: C.ink2, marginTop: 1 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontFamily: F.bold, fontSize: 11, color: '#fff' },
  empty: { fontFamily: F.regular, fontSize: 15, color: C.ink3, padding: 12 },
});
