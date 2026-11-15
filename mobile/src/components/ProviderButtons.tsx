import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { PressScale, tap } from '@/components/ui';
import { appleAvailable, connect, type Mode, type Provider } from '@/lib/accounts';
import { C, F } from '@/lib/theme';

const GoogleLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.8Z" />
    <Path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
    <Path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1Z" />
    <Path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.53 11.53 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
  </Svg>
);

/** Apple (native button, iOS only) + Google. `mode` = link the current guest account, or sign in to an existing one. */
export default function ProviderButtons({ mode }: { mode: Mode }) {
  const [hasApple, setHasApple] = useState(false);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    appleAvailable().then(setHasApple).catch(() => setHasApple(false));
  }, []);

  const go = async (p: Provider) => {
    tap();
    setError('');
    setBusy(p);
    try {
      await connect(p, mode);
    } catch (e) {
      const err = e as { code?: string; message: string };
      if (err.code !== 'ERR_REQUEST_CANCELED') setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {hasApple ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={mode === 'link' ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ height: 50, width: '100%', opacity: busy ? 0.6 : 1 }}
          onPress={() => !busy && go('apple')}
        />
      ) : null}
      <PressScale onPress={() => go('google')} disabled={busy !== null} label={`${mode === 'link' ? 'Continue' : 'Sign in'} with Google`} style={s.google} haptic={false}>
        {busy === 'google' ? <ActivityIndicator color={C.ink} /> : <GoogleLogo />}
        <Text style={s.googleText}>{mode === 'link' ? 'Continue' : 'Sign in'} with Google</Text>
      </PressScale>
      {error ? (
        <Animated.Text entering={FadeIn} style={s.error} accessibilityRole="alert">
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  google: { height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: C.line2, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleText: { fontFamily: F.semibold, fontSize: 17, color: '#1F1F1F' },
  error: { fontFamily: F.semibold, fontSize: 14, color: C.redInk, lineHeight: 20 },
});
