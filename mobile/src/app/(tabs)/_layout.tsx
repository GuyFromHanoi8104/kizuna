import { NativeTabs } from 'expo-router/native-tabs';

import { C } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={C.red} labelStyle={{ color: C.ink }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>World</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'globe', selected: 'globe.europe.africa.fill' }} md="public" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="countries">
        <NativeTabs.Trigger.Label>Countries</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
