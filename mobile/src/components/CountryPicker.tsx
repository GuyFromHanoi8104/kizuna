import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles as ui } from '@/components/ui';
import { C, F } from '@/lib/theme';
import { COUNTRIES, countryName } from '@/lib/world';

/** A field that opens a searchable sheet of all countries. */
export default function CountryPicker({ label, value, onChange, placeholder, required, hint }: { label: string; value: string; onChange: (code: string) => void; placeholder: string; required?: boolean; hint?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return COUNTRIES.filter((c) => !t || c.name.toLowerCase().includes(t));
  }, [q]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQ('');
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.label}>
        {label}
        {required ? <Text style={{ color: C.red }}> *</Text> : null}
        {hint ? <Text style={{ color: C.ink3, fontFamily: F.medium }}> {hint}</Text> : null}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ? countryName(value) : placeholder}`} onPress={() => setOpen(true)} style={[ui.input, s.field]}>
        <Text style={{ fontFamily: F.regular, fontSize: 16, color: value ? C.ink : C.ink3 }}>{value ? countryName(value) : placeholder}</Text>
        <Text style={{ color: C.ink3, fontSize: 16 }}>⌄</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.white }} edges={['bottom']}>
          <View style={s.top}>
            <Text style={s.title}>{label}</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={s.done}>Close</Text>
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20 }}>
            <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Search countries" placeholderTextColor={C.ink3} style={ui.input} accessibilityLabel="Search countries" />
          </View>
          <FlatList
            data={[{ code: '', name: placeholder, cont: '' }, ...list]}
            keyExtractor={(c) => c.code || 'none'}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => choose(item.code)} style={({ pressed }) => [s.row, (pressed || item.code === value) && { backgroundColor: item.code === value ? '#FFE9E3' : '#EEF6FF' }]}>
                <Text style={[s.rowText, !item.code && { color: C.ink3 }]}>{item.name}</Text>
                {item.code ? <Text style={s.code}>{item.code}</Text> : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontFamily: F.heavy, fontSize: 20, color: C.ink },
  done: { fontFamily: F.bold, fontSize: 16, color: C.skyInk },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, paddingHorizontal: 12, borderRadius: 12 },
  rowText: { fontFamily: F.medium, fontSize: 16, color: C.ink },
  code: { fontFamily: F.heavy, fontSize: 12, color: C.ink2 },
});
