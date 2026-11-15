import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function Root() {
  const { session, profile, profileError } = useStore();
  const [fontsLoaded] = useFonts({ Anton_400Regular, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  // Wait for the profile too (unless loading it failed), so the right screen shows straight away.
  const ready = fontsLoaded && session !== undefined && (!session || profile !== undefined || !!profileError);
  const hasProfile = !!profile || !!profileError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F3F6FA' } }}>
        <Stack.Protected guard={!!session && hasProfile}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="country/[code]" />
          <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!session || !hasProfile}>
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Screen name="auth-callback" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
