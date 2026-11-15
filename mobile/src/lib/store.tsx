import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Connection, NewConnection, View } from '@/lib/connections';
import { loadProfile, removeOldAvatars, type Profile } from '@/lib/profile';
import { isConfigured, supabase } from '@/lib/supabase';

const COLUMNS = 'id,name,from_country,lives_in,contact,how_met,created_at';

type Store = {
  session: Session | null | undefined; // undefined = still checking
  profile: Profile | null | undefined; // undefined = loading, null = needs onboarding
  profileError: string;
  setProfile: (p: Profile) => void;
  people: Connection[];
  loaded: boolean;
  error: string;
  view: View;
  setView: (v: View) => void;
  add: (c: NewConnection) => Promise<Connection>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(isConfigured ? undefined : null);
  const [people, setPeople] = useState<Connection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('from');
  const [profile, setProfileState] = useState<Profile | null | undefined>(undefined);
  const [profileError, setProfileError] = useState('');
  const setProfile = useCallback((p: Profile) => setProfileState(p), []);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    loadProfile(userId)
      .then((p) => alive && setProfileState(p))
      .catch((e) => alive && setProfileError((e as Error).message));
    return () => {
      alive = false;
      setProfileState(undefined);
      setProfileError('');
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('connections').select(COLUMNS).order('created_at', { ascending: true });
    if (error) setError(error.message);
    else {
      setError('');
      setPeople((data ?? []) as Connection[]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase
      .from('connections')
      .select(COLUMNS)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setError(error.message);
        else setPeople((data ?? []) as Connection[]);
        setLoaded(true);
      });
    return () => {
      alive = false;
      setPeople([]);
      setLoaded(false);
    };
  }, [userId]);

  const add = useCallback(async (c: NewConnection) => {
    const { data, error } = await supabase.from('connections').insert(c).select(COLUMNS).single();
    if (error) throw new Error(error.message);
    const row = data as Connection;
    setPeople((p) => [...p, row]);
    return row;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('connections').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setPeople((p) => p.filter((x) => x.id !== id));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async () => {
    if (userId) await removeOldAvatars(userId).catch(() => {});
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw new Error(error.message);
    await supabase.auth.signOut();
  }, [userId]);

  const value = useMemo(
    () => ({ session, profile, profileError, setProfile, people, loaded, error, view, setView, add, remove, refresh, signOut, deleteAccount }),
    [session, profile, profileError, setProfile, people, loaded, error, view, add, remove, refresh, signOut, deleteAccount],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
