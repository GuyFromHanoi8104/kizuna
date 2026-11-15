import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  name: string;
  age: number | null;
  from_country: string;
  lives_in: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
};

export type ProfileInput = Omit<Profile, 'id'>;

const COLUMNS = 'id,name,age,from_country,lives_in,phone,email,avatar_url';

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(COLUMNS).eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function saveProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...input, updated_at: new Date().toISOString() })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}

/** Uploads a picked image (already cropped square by the picker) and returns its public URL. */
export async function uploadAvatar(userId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  const body = await fetch(uri).then((r) => r.arrayBuffer());
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType: mimeType, upsert: true });
  if (error) throw new Error(error.message);
  await removeOldAvatars(userId, path);
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/** Deletes every picture in the user's folder except `keep`. */
export async function removeOldAvatars(userId: string, keep?: string) {
  const { data } = await supabase.storage.from('avatars').list(userId);
  const old = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (old.length) await supabase.storage.from('avatars').remove(old);
}
