import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Screen from '@/components/Screen';
import { Button, styles as ui } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, EASE, F, WEB_URL } from '@/lib/theme';

export default function Account() {
  const { session, people, signOut, deleteAccount } = useStore();
  const [busy, setBusy] = useState(false);
  const enter = (i: number) => FadeInDown.duration(600).delay(80 + i * 90).easing(EASE);

  const confirmDelete = () =>
    Alert.alert('Delete account?', 'This permanently deletes your Kizuna account and all your saved connections. It can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteAccount();
          } catch (e) {
            Alert.alert('Couldn’t delete account', (e as Error).message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <Screen>
      <Animated.View entering={enter(0)}>
        <Text style={ui.h1}>Account</Text>
        <Text style={ui.sub}>Signed in as {session?.user.email}</Text>
      </Animated.View>

      <Animated.View entering={enter(1)} style={[ui.card, { gap: 4 }]}>
        <Text style={s.big}>{people.length}</Text>
        <Text style={ui.sub}>{people.length === 1 ? 'connection saved' : 'connections saved'}, synced with the Kizuna website.</Text>
      </Animated.View>

      <Animated.View entering={enter(2)} style={{ gap: 12 }}>
        <Button title="Sign out" tone="white" onPress={signOut} style={s.outline} />
        {WEB_URL ? (
          <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)} style={s.linkRow}>
            <Text style={s.link}>Privacy policy</Text>
          </Pressable>
        ) : null}
      </Animated.View>

      <Animated.View entering={enter(3)} style={[ui.card, { gap: 10, marginTop: 24 }]}>
        <Text style={s.dangerTitle}>Delete account</Text>
        <Text style={ui.sub}>Erases your account and every connection you saved.</Text>
        <View style={{ marginTop: 6 }}>
          <Button title="Delete my account" onPress={confirmDelete} busy={busy} />
        </View>
      </Animated.View>
    </Screen>
  );
}

const s = StyleSheet.create({
  big: { fontFamily: F.heavy, fontSize: 44, color: C.ink },
  outline: { borderWidth: 1.5, borderColor: C.line2 },
  linkRow: { paddingVertical: 10, alignItems: 'center' },
  link: { fontFamily: F.semibold, fontSize: 15, color: C.skyInk },
  dangerTitle: { fontFamily: F.heavy, fontSize: 18, color: C.ink },
});
