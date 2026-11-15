import { memo, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { C, EASE } from '@/lib/theme';
import { DOTS, SHAPES } from '@/lib/world';

type Props = {
  fillOf: (code: string) => string;
  showDot: (code: string) => boolean;
  onPick?: (code: string) => void;
  width: number;
};

const MapShapes = memo(function MapShapes({ fillOf, showDot, onPick }: Omit<Props, 'width'>) {
  return (
    <G>
      {SHAPES.map((s) => (
        <Path key={s.code} d={s.d} fill={fillOf(s.code)} stroke={C.white} strokeWidth={0.6} onPress={onPick ? () => onPick(s.code) : undefined} />
      ))}
      {DOTS.map((p) => {
        const on = showDot(p.code);
        return (
          <Circle key={p.code} cx={p.x} cy={p.y} r={on ? 6 : 3} fill={on ? fillOf(p.code) : C.dot} stroke={C.white} strokeWidth={0.8} onPress={onPick ? () => onPick(p.code) : undefined} />
        );
      })}
    </G>
  );
});

/**
 * World map. The map is drawn wider than the screen so small countries are tappable;
 * it scrolls sideways and starts centred on Europe/Africa. A white curtain wipes off
 * from west to east on mount so the map "draws in".
 */
export default function WorldMap({ width, ...rest }: Props) {
  const mapW = Math.max(width, 720);
  const mapH = mapW / 2;
  const wipe = useSharedValue(0);
  useEffect(() => {
    wipe.set(withDelay(350, withTiming(1, { duration: 1100, easing: EASE })));
  }, [wipe]);
  const curtain = useAnimatedStyle(() => ({ transform: [{ translateX: wipe.value * mapW }] }));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: Math.max(0, mapW * 0.42 - width / 2), y: 0 }}
      style={{ borderRadius: 14 }}>
      <View style={{ width: mapW, height: mapH, overflow: 'hidden' }}>
        <Svg width={mapW} height={mapH} viewBox="0 0 1000 500" accessibilityLabel="World map. Countries where you know someone are blue.">
          <MapShapes {...rest} />
        </Svg>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: mapW, backgroundColor: C.white }, curtain]} />
      </View>
    </ScrollView>
  );
}
