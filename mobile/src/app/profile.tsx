import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfileForm from '@/components/ProfileForm';
import { styles as ui } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, F } from '@/lib/theme';

/** Edit-profile sheet, opened from the Account tab. */
export default function EditProfile() {
  const { session, profile, setProfile } = useStore();
  if (!session) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={s.top}>
            <Text style={ui.h1}>Edit profile</Text>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
              <Text style={s.close}>Close</Text>
            </Pressable>
          </View>
          <ProfileForm
            userId={session.user.id}
            initial={profile ?? null}
            onSaved={(p) => {
              setProfile(p);
              router.back();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontFamily: F.bold, fontSize: 16, color: C.skyInk },
});
