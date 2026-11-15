import { router, useIsFocused } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented, styles as ui } from '@/components/ui';
import { countsBy } from '@/lib/connections';
import { useStore } from '@/lib/store';
import { C, EASE, F } from '@/lib/theme';
import { COUNTRIES, type Country } from '@/lib/world';

export default function Countries() {
  const { people, view } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'known'>('all');
  const counts = useMemo(() => countsBy(people, view), [people, view]);
  const known = Object.keys(counts).length;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    let list = COUNTRIES.filter((c) => !t || c.name.toLowerCase().includes(t) || c.code.toLowerCase() === t);
    if (filter === 'known') list = list.filter((c) => counts[c.code]);
    return list;
  }, [q, filter, counts]);

  // Tab-switch animation (FlatList manages its own scroll, so this screen doesn't use <Screen>).
  const focused = useIsFocused();
  const t = useSharedValue(0);
  useEffect(() => {
    if (focused) {
      t.set(0);
      t.set(withTiming(1, { duration: 450, easing: EASE }));
    }
  }, [focused, t]);
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateX: (1 - t.value) * 36 }] }));

  const renderItem = ({ item, index }: { item: Country; index: number }) => {
    const n = counts[item.code] || 0;
    return (
      <Animated.View entering={index < 14 ? FadeInDown.duration(400).delay(index * 30).easing(EASE) : undefined}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.name}${n ? `, ${n} ${n === 1 ? 'person' : 'people'}` : ''}`}
          onPress={() => router.push({ pathname: '/country/[code]', params: { code: item.code } })}
          style={({ pressed }) => [s.row, pressed && { backgroundColor: '#EEF6FF' }]}>
          <View style={[s.code, n ? { backgroundColor: C.sky } : null]}>
            <Text style={[s.codeText, n ? { color: '#fff' } : null]}>{item.code}</Text>
          </View>
          <Text style={s.name} numberOfLines={1}>
            {item.name}
          </Text>
          {n ? (
            <View style={s.count}>
              <Text style={s.countText}>{n}</Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Animated.View style={[{ flex: 1 }, a]}>
        <View style={s.head}>
          <Text style={ui.h1}>Countries</Text>
          <TextInput value={q} onChangeText={setQ} placeholder="Search countries" placeholderTextColor={C.ink3} style={ui.input} accessibilityLabel="Search countries" clearButtonMode="while-editing" />
          <Segmented
            label="Filter"
            value={filter}
            onChange={setFilter}
            options={[
              { v: 'all', label: `All · ${COUNTRIES.length}` },
              { v: 'known', label: `Known · ${known}` },
            ]}
          />
        </View>
        <FlatList
          data={rows}
          keyExtractor={(c) => c.code}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
          ListEmptyComponent={<Text style={s.empty}>{filter === 'known' && !q ? 'No connections yet. Pick a country under All.' : `No countries match “${q}”.`}</Text>}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { padding: 20, paddingBottom: 10, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 10, borderRadius: 12 },
  code: { width: 38, height: 30, borderRadius: 8, backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center' },
  codeText: { fontFamily: F.heavy, fontSize: 12, color: C.ink2, letterSpacing: 0.5 },
  name: { flex: 1, fontFamily: F.medium, fontSize: 16, color: C.ink },
  count: { minWidth: 26, height: 26, paddingHorizontal: 8, borderRadius: 13, backgroundColor: C.skyInk, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: F.heavy, fontSize: 13, color: '#fff' },
  empty: { fontFamily: F.regular, fontSize: 15, color: C.ink3, padding: 16 },
});
