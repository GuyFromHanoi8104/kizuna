import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfileForm from '@/components/ProfileForm';
import { styles as ui } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, EASE } from '@/lib/theme';

/** Shown once, right after sign-up: the user's own profile. */
export default function Onboarding() {
  const { session, setProfile } = useStore();
  if (!session) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(600).easing(EASE)}>
            <Text style={ui.h1}>About you</Text>
            <Text style={ui.sub}>One last step. Only name, where you’re from and where you live are required.</Text>
          </Animated.View>
          <ProfileForm userId={session.user.id} onSaved={setProfile} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
