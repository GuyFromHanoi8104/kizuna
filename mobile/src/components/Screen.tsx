import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, EASE } from '@/lib/theme';

/**
 * Tab screen wrapper. Each time the tab is focused its content fades and slides in,
 * so switching tabs animates like the website.
 */
export default function Screen({ children, from = 'right', ...props }: ScrollViewProps & { from?: 'left' | 'right' }) {
  const focused = useIsFocused();
  const t = useSharedValue(0);
  useEffect(() => {
    if (focused) {
      t.set(0);
      t.set(withTiming(1, { duration: 450, easing: EASE }));
    }
  }, [focused, t]);
  const a = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateX: (1 - t.value) * (from === 'right' ? 36 : -36) }],
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Animated.View style={[{ flex: 1 }, a]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }} keyboardShouldPersistTaps="handled" {...props}>
          {children}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
