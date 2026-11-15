import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import Avatar from '@/components/Avatar';
import CountryPicker from '@/components/CountryPicker';
import { Button, Field, PressScale, styles as ui } from '@/components/ui';
import { removeOldAvatars, saveProfile, uploadAvatar, type Profile } from '@/lib/profile';
import { C, EASE, F } from '@/lib/theme';

type Props = { userId: string; initial?: Profile | null; onSaved: (p: Profile) => void };

export default function ProfileForm({ userId, initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [age, setAge] = useState(initial?.age ? String(initial.age) : '');
  const [from, setFrom] = useState(initial?.from_country ?? '');
  const [live, setLive] = useState(initial?.lives_in ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [photo, setPhoto] = useState<{ uri: string; mime: string } | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onboarding = !initial;
  const shown = removePhoto ? null : (photo?.uri ?? initial?.avatar_url ?? null);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setPhoto({ uri: res.assets[0].uri, mime: res.assets[0].mimeType ?? 'image/jpeg' });
      setRemovePhoto(false);
    }
  };

  const submit = async () => {
    setError('');
    if (!name.trim()) return setError('Add your name.');
    if (!from) return setError('Pick where you’re from.');
    if (!live) return setError('Pick where you live.');
    const ageNum = age.trim() ? Number(age) : null;
    if (ageNum !== null && (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120)) return setError('Age should be a number between 13 and 120.');
    setBusy(true);
    try {
      let avatar_url = initial?.avatar_url ?? null;
      if (photo) avatar_url = await uploadAvatar(userId, photo.uri, photo.mime);
      else if (removePhoto) {
        await removeOldAvatars(userId);
        avatar_url = null;
      }
      onSaved(await saveProfile(userId, { name: name.trim(), age: ageNum, from_country: from, lives_in: live, phone: phone.trim() || null, avatar_url }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const enter = (i: number) => FadeInDown.duration(550).delay(80 + i * 70).easing(EASE);

  return (
    <View style={{ gap: 16 }}>
      <Animated.View entering={enter(0)} style={s.photoRow}>
        <Animated.View entering={ZoomIn.springify().damping(12).delay(200)} style={s.ring}>
          <View style={s.ringInner}>
            <Avatar url={shown} seed={userId} size={88} />
          </View>
        </Animated.View>
        <View style={{ gap: 8 }}>
          <PressScale onPress={pick} label="Choose a profile photo" style={s.chip}>
            <Text style={s.chipText}>{shown ? 'Change photo' : 'Upload photo'}</Text>
          </PressScale>
          {shown ? (
            <PressScale onPress={() => { setPhoto(null); setRemovePhoto(true); }} label="Remove photo" style={s.chip}>
              <Text style={s.chipText}>Remove</Text>
            </PressScale>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={enter(1)} style={[ui.card, { gap: 16 }]}>
        <Field label="Name" required value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" textContentType="name" maxLength={80} />
        <Field label="Age" hint="(optional)" value={age} onChangeText={(t) => setAge(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} placeholder="e.g. 22" />
        <CountryPicker label="Where you’re from" required value={from} onChange={setFrom} placeholder="Choose a country" />
        <CountryPicker label="Where you live" required value={live} onChange={setLive} placeholder="Choose a country" />
        <Field label="Phone" hint="(optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" maxLength={40} placeholder="+49 …" />
      </Animated.View>

      <Animated.View entering={enter(2)} style={{ gap: 10 }}>
        <Button title={onboarding ? 'Start my map' : 'Save profile'} onPress={submit} busy={busy} />
        {error ? (
          <Animated.Text key={error} entering={FadeInDown.duration(250)} style={s.error} accessibilityRole="alert">
            {error}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ring: { padding: 4, borderRadius: 60, borderWidth: 3, borderColor: C.sky, borderRightColor: C.red, borderBottomColor: C.red },
  ringInner: { borderRadius: 50, overflow: 'hidden' },
  chip: { height: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1.5, borderColor: C.line2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  error: { fontFamily: F.semibold, fontSize: 15, color: C.redInk, textAlign: 'center' },
});
