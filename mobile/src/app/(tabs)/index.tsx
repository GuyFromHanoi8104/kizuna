import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Screen from '@/components/Screen';
import { Segmented, Stat, styles as ui } from '@/components/ui';
import WorldMap from '@/components/WorldMap';
import { countsBy, statsOf, type View as ViewMode } from '@/lib/connections';
import { useStore } from '@/lib/store';
import { C, EASE, F } from '@/lib/theme';

export default function World() {
  const { people, loaded, view, setView, error } = useStore();
  const { width } = useWindowDimensions();
  const counts = useMemo(() => countsBy(people, view), [people, view]);
  const stats = statsOf(people, view);

  const fillOf = useCallback((code: string) => (counts[code] >= 2 ? C.skyInk : counts[code] ? C.skySoft : C.land), [counts]);
  const showDot = useCallback((code: string) => Boolean(counts[code]), [counts]);
  const open = useCallback((code: string) => router.push({ pathname: '/country/[code]', params: { code } }), []);

  const enter = (i: number) => FadeInDown.duration(600).delay(80 + i * 90).easing(EASE);

  return (
    <Screen from="left">
      <Animated.View entering={enter(0)}>
        <Text style={ui.h1}>Your world</Text>
        <Text style={ui.sub}>Tap a country to see who you know there.</Text>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ gap: 6 }}>
        <Text style={ui.caps}>Show people by</Text>
        <Segmented<ViewMode>
          onWhite
          label="Count people by"
          value={view}
          onChange={setView}
          options={[
            { v: 'from', label: 'Where they’re from' },
            { v: 'live', label: 'Where they live' },
          ]}
        />
      </Animated.View>

      {error ? <Text style={s.error}>Couldn’t load your connections: {error}</Text> : null}

      <View style={s.stats}>
        <Animated.View entering={enter(2)} style={{ flex: 1 }}>
          <Stat value={loaded ? stats.countries : 0} label="Countries" bg={C.sky} delay={300} />
        </Animated.View>
        <Animated.View entering={enter(3)} style={{ flex: 1 }}>
          <Stat value={loaded ? stats.people : 0} label="People" bg={C.ink} delay={380} />
        </Animated.View>
        <Animated.View entering={enter(4)} style={{ flex: 1 }}>
          <Stat value={loaded ? stats.continents : 0} label="Continents" bg={C.red} delay={460} />
        </Animated.View>
      </View>

      <Animated.View entering={enter(5)} style={[ui.card, { padding: 14, gap: 12 }]}>
        <View style={s.mapTop}>
          <Text style={s.mapTitle}>Map</Text>
          <View style={s.legend}>
            <View style={s.legendItem}><View style={[s.sw, { backgroundColor: C.skySoft }]} /><Text style={s.legendText}>1</Text></View>
            <View style={s.legendItem}><View style={[s.sw, { backgroundColor: C.skyInk }]} /><Text style={s.legendText}>2+</Text></View>
          </View>
        </View>
        <WorldMap width={width - 70} fillOf={fillOf} showDot={showDot} onPick={open} />
        <Text style={s.tip}>Swipe sideways to explore. Tap any country to add someone.</Text>
      </Animated.View>

      {loaded && people.length === 0 ? (
        <Animated.View entering={enter(6)} style={[ui.card, { gap: 6 }]}>
          <Text style={s.emptyTitle}>Your map is empty</Text>
          <Text style={ui.sub}>Tap a country above, or open the Countries tab, to add your first connection.</Text>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  mapTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  mapTitle: { fontFamily: F.heavy, fontSize: 17, color: C.ink },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sw: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontFamily: F.medium, fontSize: 13, color: C.ink2 },
  tip: { fontFamily: F.regular, fontSize: 13, color: C.ink3, paddingHorizontal: 4 },
  emptyTitle: { fontFamily: F.heavy, fontSize: 18, color: C.ink },
  error: { fontFamily: F.semibold, color: C.redInk, fontSize: 14 },
});
