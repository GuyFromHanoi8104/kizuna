import type { User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type Provider = 'apple' | 'google';
export type Mode = 'link' | 'signin';
export const PROVIDER_NAME: Record<Provider, string> = { apple: 'Apple', google: 'Google' };

WebBrowser.maybeCompleteAuthSession();

export const linkedProviders = (user: User | null | undefined): Provider[] =>
  (user?.identities ?? []).map((i) => i.provider).filter((p): p is Provider => p === 'apple' || p === 'google');

const friendly = (msg: string) =>
  /already.*linked|identity.*exists|already.*registered/i.test(msg)
    ? 'That account is already connected to another Kizuna map. To open that map here, delete this guest map in Account, then sign in with it.'
    : msg;

/** Native Sign in with Apple (iOS). `link` attaches it to the current guest account; `signin` opens an existing account. */
async function apple(mode: Mode) {
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
  });
  if (!cred.identityToken) throw new Error('Apple didn’t return a sign-in token. Please try again.');
  const { error } =
    mode === 'link'
      ? await supabase.auth.linkIdentity({ provider: 'apple', token: cred.identityToken })
      : await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
  if (error) throw new Error(friendly(error.message));
}

/** Google through the secure in-app browser, then back into the app. */
async function google(mode: Mode) {
  const redirectTo = Linking.createURL('auth-callback');
  const options = { redirectTo, skipBrowserRedirect: true };
  const { data, error } =
    mode === 'link'
      ? await supabase.auth.linkIdentity({ provider: 'google', options })
      : await supabase.auth.signInWithOAuth({ provider: 'google', options });
  if (error || !data?.url) throw new Error(friendly(error?.message ?? 'Couldn’t open Google.'));

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return; // closed by the user

  const url = new URL(res.url);
  const params = new URLSearchParams(url.search);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const err = params.get('error_description') || hash.get('error_description');
  if (err) throw new Error(friendly(err.replace(/\+/g, ' ')));

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(friendly(error.message));
    return;
  }
  const access_token = hash.get('access_token');
  const refresh_token = hash.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw new Error(friendly(error.message));
  }
}

export async function connect(provider: Provider, mode: Mode) {
  if (provider === 'apple') await apple(mode);
  else await google(mode);
  // Pick up the newly linked identity in the session.
  if (mode === 'link') await supabase.auth.refreshSession();
}

export const appleAvailable = () => (Platform.OS === 'ios' ? AppleAuthentication.isAvailableAsync() : Promise.resolve(false));
