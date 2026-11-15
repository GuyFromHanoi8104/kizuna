import { getSupabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  name: string;
  age: number | null;
  from_country: string;
  lives_in: string;
  phone: string | null;
  avatar_url: string | null;
};

export type ProfileInput = Omit<Profile, "id">;

const COLUMNS = "id,name,age,from_country,lives_in,phone,avatar_url";

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase().from("profiles").select(COLUMNS).eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function saveProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .upsert({ id: userId, ...input, updated_at: new Date().toISOString() })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}

/** Shrinks the picture to 512px (square crop) as a JPEG before uploading. */
async function toSquareJpeg(file: File, size = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const s = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn’t read that picture.");
  ctx.drawImage(bitmap, (bitmap.width - s) / 2, (bitmap.height - s) / 2, s, s, 0, 0, size, size);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn’t read that picture."))), "image/jpeg", 0.85));
}

/** Uploads a profile picture and returns its public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = getSupabase();
  const blob = await toSquareJpeg(file);
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(error.message);
  await removeOldAvatars(userId, path);
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

/** Deletes every picture in the user's folder except `keep`. */
export async function removeOldAvatars(userId: string, keep?: string) {
  const supabase = getSupabase();
  const { data } = await supabase.storage.from("avatars").list(userId);
  const old = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (old.length) await supabase.storage.from("avatars").remove(old);
}
