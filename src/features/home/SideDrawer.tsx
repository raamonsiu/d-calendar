import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fmtAgo } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import { Label, T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, hitSlopFor } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { DashedButton } from '@/ui/controls';
import { usePanelTransition } from '@/ui/usePanelTransition';
import {
  ArrowsClockwiseIcon,
  CaretRightIcon,
  CheckIcon,
  GearSixIcon,
  InfoIcon,
  PlusIcon,
  QuestionIcon,
  XIcon,
} from '@/ui/icons';
import type { Calendar } from '@/types';

const APP_VERSION = '1.4';

type Props = {
  open: boolean;
  onClose: () => void;
  onAddSource: () => void;
};

export function SideDrawer({ open, onClose, onAddSource }: Props) {
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelW = width * 0.8;

  const accounts = useAppStore((s) => s.accounts);
  const calendars = useAppStore((s) => s.calendars);
  const toggleCalendar = useAppStore((s) => s.toggleCalendar);
  const refresh = useAppStore((s) => s.refresh);
  const refreshing = useAppStore((s) => s.refreshing);
  const lastSync = useAppStore((s) => s.lastSync);

  const { mounted, progress } = usePanelTransition(open, onClose);
  const drag = useSharedValue(0);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.55,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(1 - progress.value) * (panelW + 8) + drag.value },
    ],
  }));

  const pan = Gesture.Pan()
    .activeOffsetX(-10)
    .failOffsetX(10)
    .onChange((e) => {
      drag.value = Math.min(0, drag.value + e.changeX);
    })
    .onEnd((e) => {
      const shouldClose =
        drag.value < -panelW * 0.35 || e.velocityX < -800;
      drag.value = withTiming(0, { duration: 180 });
      if (shouldClose) runOnJS(onClose)();
    });

  const grouped = useMemo(
    () =>
      accounts.map((a) => ({
        account: a,
        items: calendars.filter((c) => c.accountId === a.id),
      })),
    [accounts, calendars],
  );
  const others = useMemo(
    () => calendars.filter((c) => c.accountId === null),
    [calendars],
  );

  const go = (path: '/settings' | '/help' | '/about') => {
    onClose();
    router.push(path);
  };

  const CalendarRow = ({ cal }: { cal: Calendar }) => (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: cal.visible }}
      accessibilityLabel={cal.name}
      onPress={() => toggleCalendar(cal.id)}
      style={({ pressed }) => [
        styles.calRow,
        pressed && { backgroundColor: color.hairline },
      ]}>
      <View
        style={[
          styles.checkbox,
          {
            borderColor: cal.visible ? accent : '#3a3a42',
            backgroundColor: cal.visible ? accent : 'transparent',
          },
        ]}>
        {cal.visible ? (
          <CheckIcon size={11} color={color.text} weight="bold" />
        ) : null}
      </View>
      <View
        style={[
          styles.calDot,
          { backgroundColor: cal.visible ? (cal.dot ?? accent) : '#2f2f36' },
        ]}
      />
      <T
        numberOfLines={1}
        style={[
          styles.calName,
          { color: cal.visible ? '#e9e9ec' : '#5c5c65' },
        ]}>
        {cal.name}
      </T>
      {cal.kind ? <T style={styles.calKind}>{cal.kind}</T> : null}
    </Pressable>
  );

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Cerrar menú"
        onPress={onClose}
        style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />
      </Pressable>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.panel,
            {
              width: panelW,
              paddingTop: insets.top + 18,
              paddingBottom: insets.bottom + 14,
            },
            panelStyle,
          ]}>
          <View style={styles.head}>
            <View style={{ gap: 3 }}>
              <T w={500} style={styles.appName}>
                D-Calendar
              </T>
              <T style={styles.version}>VERSIÓN {APP_VERSION}</T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              hitSlop={hitSlopFor(28)}
              onPress={onClose}
              style={styles.closeBtn}>
              <XIcon size={14} color={color.label} />
            </Pressable>
          </View>

          <View style={styles.refreshWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={refresh}
              style={({ pressed }) => [
                styles.refresh,
                pressed && { borderColor: accent },
              ]}>
              <ArrowsClockwiseIcon
                size={14}
                color={refreshing ? accent : color.textMuted}
              />
              <T style={styles.refreshLabel}>Actualizar calendarios</T>
              <T style={styles.refreshMeta}>
                {refreshing ? 'AHORA' : fmtAgo(lastSync)}
              </T>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            {grouped.map(({ account, items }) => (
              <View key={account.id} style={{ gap: 7 }}>
                <View style={styles.accountHead}>
                  <Avatar size={20} initial={account.initial} />
                  <T numberOfLines={1} style={styles.accountEmail}>
                    {account.email}
                  </T>
                  <T style={styles.count}>
                    {items.filter((c) => c.visible).length}/{items.length}
                  </T>
                </View>
                <View style={{ gap: 2 }}>
                  {items.map((cal) => (
                    <CalendarRow key={cal.id} cal={cal} />
                  ))}
                </View>
              </View>
            ))}

            <View style={{ gap: 7 }}>
              <View style={styles.otherHead}>
                <Label>Otros calendarios</Label>
                <T style={styles.count}>
                  {others.filter((c) => c.visible).length}/{others.length}
                </T>
              </View>
              <View style={{ gap: 2 }}>
                {others.map((cal) => (
                  <CalendarRow key={cal.id} cal={cal} />
                ))}
              </View>
              <DashedButton
                height={36}
                label="AÑADIR CUENTA O CALENDARIO"
                icon={<PlusIcon size={11} color={color.label} />}
                onPress={onAddSource}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {(
              [
                { label: 'Ajustes', icon: GearSixIcon, path: '/settings' },
                { label: 'Ayuda y comentarios', icon: QuestionIcon, path: '/help' },
                {
                  label: 'Acerca de la app y el desarrollador',
                  icon: InfoIcon,
                  path: '/about',
                },
              ] as const
            ).map(({ label, icon: Icon, path }) => (
              <Pressable
                key={path}
                accessibilityRole="button"
                onPress={() => go(path)}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && { backgroundColor: color.hairline },
                ]}>
                <Icon size={15} color={color.textMuted} />
                <T numberOfLines={1} style={styles.menuLabel}>
                  {label}
                </T>
                <CaretRightIcon size={11} color="#3f3f47" />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: '#000' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.box,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  appName: { fontSize: 17, letterSpacing: -0.2 },
  version: { fontSize: 8.5, letterSpacing: 1.4, color: color.labelDim },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  refresh: {
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
  },
  refreshLabel: { flex: 1, fontSize: 11.5, color: '#e9e9ec' },
  refreshMeta: { fontSize: 8.5, letterSpacing: 1.1, color: color.faint },
  scroll: { gap: 14, paddingHorizontal: 14, paddingTop: 2, paddingBottom: 8 },
  accountHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  accountEmail: {
    flex: 1,
    fontSize: 10,
    letterSpacing: 0.4,
    color: color.textMuted,
  },
  count: { fontSize: 8, letterSpacing: 1.1, color: color.faint },
  otherHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 13,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDot: { width: 6, height: 6, borderRadius: 3 },
  calName: { flex: 1, fontSize: 12 },
  calKind: { fontSize: 8, letterSpacing: 1.1, color: color.faint },
  footer: {
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: color.line,
    gap: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 42,
    paddingHorizontal: 8,
    borderRadius: 13,
  },
  menuLabel: { flex: 1, fontSize: 12.5, color: color.textSoft },
});
