import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Label } from '@/theme/Text';

/** Grupo de ajustes: micro-etiqueta + items separados con gap 5 (handoff §4a). */
export function Group({
  title,
  gap = 5,
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
