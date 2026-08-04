import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Label } from '@/theme/Text';
import { space } from '@/theme/tokens';

/**
 * A group on a list screen (Settings, Calendars, Help, About): micro label on
 * top and the items separated by the "gap Nothing" gap (handoff §4a).
 */
export function Group({
  title,
  gap = space.gap,
  children,
}: {
  title: string;
  gap?: number;
  children: ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Label style={styles.label}>{title}</Label>
      <View style={{ gap }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 7 },
  label: { paddingLeft: 6 },
});
