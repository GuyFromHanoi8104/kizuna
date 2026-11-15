import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Avatar from '@/components/Avatar';
import Screen from '@/components/Screen';
import { Button, PressScale, styles as ui } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, EASE, F, WEB_URL } from '@/lib/theme';
import { countryName } from '@/lib/world';

export default function Account() {
  const { session, profile, people, signOut, deleteAccount } = useStore();
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

      {profile ? (
        <Animated.View entering={enter(1)} style={[ui.card, s.me]}>
          <Avatar url={profile.avatar_url} seed={profile.id} size={64} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.meName}>
              {profile.name}
              {profile.age ? `, ${profile.age}` : ''}
            </Text>
            <Text style={s.meSub}>From {countryName(profile.from_country)}</Text>
            <Text style={s.meSub}>Lives in {countryName(profile.lives_in)}</Text>
            {profile.phone ? <Text style={s.meSub}>{profile.phone}</Text> : null}
          </View>
          <PressScale onPress={() => router.push('/profile')} label="Edit profile" style={s.edit}>
            <Text style={s.editText}>Edit</Text>
          </PressScale>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(2)} style={[ui.card, { gap: 4 }]}>
        <Text style={s.big}>{people.length}</Text>
        <Text style={ui.sub}>{people.length === 1 ? 'connection saved' : 'connections saved'}, synced with the Kizuna website.</Text>
      </Animated.View>

      <Animated.View entering={enter(3)} style={{ gap: 12 }}>
        <Button title="Sign out" tone="white" onPress={signOut} style={s.outline} />
        {WEB_URL ? (
          <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)} style={s.linkRow}>
            <Text style={s.link}>Privacy policy</Text>
          </Pressable>
        ) : null}
      </Animated.View>

      <Animated.View entering={enter(4)} style={[ui.card, { gap: 10, marginTop: 24 }]}>
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
  me: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meName: { fontFamily: F.heavy, fontSize: 18, color: C.ink },
  meSub: { fontFamily: F.regular, fontSize: 14, color: C.ink2, marginTop: 2 },
  edit: { height: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  editText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  big: { fontFamily: F.heavy, fontSize: 44, color: C.ink },
  outline: { borderWidth: 1.5, borderColor: C.line2 },
  linkRow: { paddingVertical: 10, alignItems: 'center' },
  link: { fontFamily: F.semibold, fontSize: 15, color: C.skyInk },
  dangerTitle: { fontFamily: F.heavy, fontSize: 18, color: C.ink },
});
