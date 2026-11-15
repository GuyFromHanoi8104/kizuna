import { Redirect } from 'expo-router';

/** Landing spot for the Google sign-in redirect; the in-app browser handles it, this just routes home. */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
