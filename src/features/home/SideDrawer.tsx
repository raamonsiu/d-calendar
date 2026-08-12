import { router } from 'expo-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_VERSION } from '@/data/releases';
import { ownerLabel } from '@/lib/calendarSources';
import { formatAgo } from '@/lib/date';
import { isDeviceId } from '@/lib/sourceIds';
import { useAppStore } from '@/store/useAppStore';
import { AppText, Label } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import {
  OVERLAY_OPACITY,
  color,
  duration,
  hitSlopFor,
  layer,
  radius,
} from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { CalendarDot } from '@/ui/CalendarDot';
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

/** Share of the screen width taken by the panel. */
const PANEL_WIDTH_RATIO = 0.8;

/** Extra travel on the way out so the panel disappears completely. */
const EXIT_OVERSHOOT = 8;

/** Share of the panel that has to be dragged for it to close. */
const CLOSE_DRAG_RATIO = 0.35;
const CLOSE_VELOCITY = 800;

/** Gesture threshold: below this the touch is still a tap. */
const DRAG_ACTIVATION = 10;

/** The calendar dots of the menu are smaller than the ones in the form. */
const DRAWER_DOT_SIZE = 6;

/** One full turn of the refresh icon while a sync is in flight. */
const SPIN_MS = 900;

/** Destinations in the menu footer. */
const MENU_ITEMS = [
  { label: 'Ajustes', icon: GearSixIcon, path: '/settings' },
  { label: 'Ayuda y comentarios', icon: QuestionIcon, path: '/help' },
  {
    label: 'Acerca de la app y el desarrollador',
    icon: InfoIcon,
    path: '/about',
  },
] as const;

type SideDrawerProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Opens the add account or subscription flow, which lives on the Home screen.
   */
  onAddSource: () => void;
};

/**
 * Home side menu: accounts with their calendars, the account-less
 * subscriptions, and the footer with the secondary screens.
 *
 * It closes by tapping the overlay, with the X, with the back button, or by
 * dragging the panel to the left.
 */
export function SideDrawer({ open, onClose, onAddSource }: SideDrawerProps) {
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = width * PANEL_WIDTH_RATIO;

  const accounts = useAppStore((state) => state.accounts);
  const calendars = useAppStore((state) => state.calendars);
  const toggleCalendar = useAppStore((state) => state.toggleCalendar);
  const refresh = useAppStore((state) => state.refresh);
  const readingDevice = useAppStore((state) => state.refreshing);
  const downloading = useAppStore((state) => state.syncingSubscriptions);

  /**
   * There is one "sync" from where the user stands: the calendars of the device
   * being read again and the subscribed ones being downloaded. Which of the two
   * is still going is not their problem, so the control reports either.
   */
  const refreshing = readingDevice || downloading;
  const lastSync = useAppStore((state) => state.lastSync);

  /**
   * Turns while `refreshing` is true, and eases back to rest rather than
   * snapping when it stops, so the icon does not jump mid-turn. `readDeviceCalendarData`
   * and the subscription downloads are already asynchronous — this is only the
   * part that shows it.
   */
  const { motionOff } = usePrefs();
  const spin = useSharedValue(0);

  useEffect(() => {
    if (refreshing && !motionOff) {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(360, { duration: SPIN_MS, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(spin);
      spin.value = withTiming(0, { duration: 150 });
    }
  }, [motionOff, refreshing, spin]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const { mounted, progress } = usePanelTransition(open, onClose);
  const dragOffset = useSharedValue(0);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * OVERLAY_OPACITY,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -(1 - progress.value) * (panelWidth + EXIT_OVERSHOOT) +
          dragOffset.value,
      },
    ],
  }));

  const dragGesture = Gesture.Pan()
    .activeOffsetX(-DRAG_ACTIVATION)
    .failOffsetX(DRAG_ACTIVATION)
    .onChange((event) => {
      dragOffset.value = Math.min(0, dragOffset.value + event.changeX);
    })
    .onEnd((event) => {
      const shouldClose =
        dragOffset.value < -panelWidth * CLOSE_DRAG_RATIO ||
        event.velocityX < -CLOSE_VELOCITY;
      dragOffset.value = withTiming(0, { duration: duration.press });
      if (shouldClose) runOnJS(onClose)();
    });

  const byAccount = useMemo(
    () =>
      accounts.map((account) => ({
        account,
        calendars: calendars.filter(
          (calendar) => calendar.accountId === account.id,
        ),
      })),
    [accounts, calendars],
  );

  /**
   * The app's own calendars, which are where everything it creates goes.
   *
   * A calendar subscribed by URL is created here too, so it carries an id of the
   * app; what tells it apart is the address it is downloaded from, and it
   * belongs with the other subscriptions rather than next to Personal, which is
   * a calendar you can write in.
   */
  const ownCalendars = useMemo(
    () =>
      calendars.filter(
        (calendar) => !isDeviceId(calendar.id) && !calendar.url,
      ),
    [calendars],
  );

  /**
   * The calendars that hang from no account split in two: the ones somebody
   * shared, which carry who did, and the subscriptions, whether they were
   * subscribed to here or on the phone.
   */
  const shared = useMemo(
    () =>
      calendars.filter(
        (calendar) =>
          isDeviceId(calendar.id) &&
          calendar.accountId === null &&
          calendar.sharedBy,
      ),
    [calendars],
  );

  const subscriptions = useMemo(
    () =>
      calendars.filter(
        (calendar) =>
          calendar.url ||
          (isDeviceId(calendar.id) &&
            calendar.accountId === null &&
            !calendar.sharedBy),
      ),
    [calendars],
  );

  const openScreen = (path: (typeof MENU_ITEMS)[number]['path']) => {
    onClose();
    router.push(path);
  };

  if (!mounted) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.layer]}
      pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Cerrar menú"
        onPress={onClose}
        style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />
      </Pressable>

      <GestureDetector gesture={dragGesture}>
        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              paddingTop: insets.top + 18,
              paddingBottom: insets.bottom + 14,
            },
            panelStyle,
          ]}>
          <View style={styles.head}>
            <View style={styles.headTitles}>
              <AppText weight={500} style={styles.appName}>
                D-Calendar
              </AppText>
              <AppText style={styles.version}>VERSIÓN {APP_VERSION}</AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              hitSlop={hitSlopFor(28)}
              onPress={onClose}
              style={styles.close}>
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
              <Animated.View style={spinStyle}>
                <ArrowsClockwiseIcon
                  size={14}
                  color={refreshing ? accent : color.textMuted}
                />
              </Animated.View>
              <AppText style={styles.refreshLabel}>
                Actualizar calendarios
              </AppText>
              <AppText style={styles.refreshMeta}>
                {refreshing ? 'AHORA' : formatAgo(lastSync)}
              </AppText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            {byAccount.map(({ account, calendars: accountCalendars }) => (
              <CalendarGroup
                key={account.id}
                calendars={accountCalendars}
                onToggle={toggleCalendar}
                header={
                  <View style={styles.accountHead}>
                    <Avatar size={20} initial={account.initial} />
                    <AppText numberOfLines={1} style={styles.accountEmail}>
                      {account.email}
                    </AppText>
                    <AppText style={styles.count}>
                      {visibilitySummary(accountCalendars)}
                    </AppText>
                  </View>
                }
              />
            ))}

            {ownCalendars.length > 0 ? (
              <CalendarGroup
                calendars={ownCalendars}
                onToggle={toggleCalendar}
                header={
                  <View style={styles.otherHead}>
                    <Label>En esta app</Label>
                    <AppText style={styles.count}>
                      {visibilitySummary(ownCalendars)}
                    </AppText>
                  </View>
                }
              />
            ) : null}

            {shared.length > 0 ? (
              <CalendarGroup
                calendars={shared}
                onToggle={toggleCalendar}
                header={
                  <View style={styles.otherHead}>
                    <Label>Compartidos contigo</Label>
                    <AppText style={styles.count}>
                      {visibilitySummary(shared)}
                    </AppText>
                  </View>
                }
              />
            ) : null}

            <CalendarGroup
              calendars={subscriptions}
              onToggle={toggleCalendar}
              header={
                <View style={styles.otherHead}>
                  <Label>Otros calendarios</Label>
                  <AppText style={styles.count}>
                    {visibilitySummary(subscriptions)}
                  </AppText>
                </View>
              }
              footer={
                <DashedButton
                  height={36}
                  label="AÑADIR CUENTA O CALENDARIO"
                  icon={<PlusIcon size={11} color={color.label} />}
                  onPress={onAddSource}
                />
              }
            />
          </ScrollView>

          <View style={styles.footer}>
            {MENU_ITEMS.map(({ label, icon: Icon, path }) => (
              <Pressable
                key={path}
                accessibilityRole="button"
                onPress={() => openScreen(path)}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && { backgroundColor: color.hairline },
                ]}>
                <Icon size={15} color={color.textMuted} />
                <AppText numberOfLines={1} style={styles.menuLabel}>
                  {label}
                </AppText>
                <CaretRightIcon size={11} color={color.caret} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/**
 * How many calendars of a group are checked, in the "3/5" format of the menu
 * headers.
 *
 * @param calendars Calendars in the group.
 */
function visibilitySummary(calendars: Calendar[]) {
  const visible = calendars.filter((calendar) => calendar.visible).length;
  return `${visible}/${calendars.length}`;
}

/**
 * A calendar block of the menu: a header, the rows and an optional footer.
 *
 * This is the common part of the two kinds of group: account groups carry an
 * avatar and an email in the header, and the subscriptions one carries a micro
 * label and the add button in the footer.
 */
function CalendarGroup({
  header,
  calendars,
  onToggle,
  footer,
}: {
  header: ReactNode;
  calendars: Calendar[];
  onToggle: (id: string) => void;
  footer?: ReactNode;
}) {
  return (
    <View style={styles.group}>
      {header}
      <View style={styles.groupRows}>
        {calendars.map((calendar) => (
          <CalendarRow
            key={calendar.id}
            calendar={calendar}
            onToggle={() => onToggle(calendar.id)}
          />
        ))}
      </View>
      {footer}
    </View>
  );
}

/**
 * Calendar row: checkbox, colour dot and name.
 *
 * While unchecked, the dot and the name dim. The label on the right says the
 * kind (TAREAS, CALDAV, ICS) or, on a calendar somebody shared, who did: with
 * several colleagues in the same group, the name alone does not say whose it
 * is.
 */
function CalendarRow({
  calendar,
  onToggle,
}: {
  calendar: Calendar;
  onToggle: () => void;
}) {
  const accent = useAccent();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: calendar.visible }}
      accessibilityLabel={calendar.name}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.calendarRow,
        pressed && { backgroundColor: color.hairline },
      ]}>
      <View
        style={[
          styles.checkbox,
          {
            borderColor: calendar.visible ? accent : color.outline,
            backgroundColor: calendar.visible ? accent : 'transparent',
          },
        ]}>
        {calendar.visible ? (
          <CheckIcon size={11} color={color.text} weight="bold" />
        ) : null}
      </View>

      <CalendarDot
        size={DRAWER_DOT_SIZE}
        color={calendar.visible ? calendar.dotColor : color.edge}
      />

      <AppText
        numberOfLines={1}
        style={[
          styles.calendarName,
          { color: calendar.visible ? color.textBody : color.textDisabled },
        ]}>
        {calendar.name}
      </AppText>

      {calendar.sharedBy ? (
        <AppText numberOfLines={1} style={styles.calendarKind}>
          {ownerLabel(calendar.sharedBy)}
        </AppText>
      ) : calendar.kind ? (
        <AppText style={styles.calendarKind}>{calendar.kind}</AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: layer.panel },
  overlay: { backgroundColor: color.scrim },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.box,
    borderTopRightRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headTitles: { gap: 3 },
  appName: { fontSize: 17, letterSpacing: -0.2 },
  version: { fontSize: 8.5, letterSpacing: 1.4, color: color.labelDim },
  close: {
    width: 28,
    height: 28,
    borderRadius: radius.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  refresh: {
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
  },
  refreshLabel: { flex: 1, fontSize: 11.5, color: color.textBody },
  refreshMeta: { fontSize: 8.5, letterSpacing: 1.1, color: color.faint },
  scroll: { gap: 14, paddingHorizontal: 14, paddingTop: 2, paddingBottom: 8 },
  group: { gap: 7 },
  groupRows: { gap: 2 },
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
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: radius.control,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radius.check,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarName: { flex: 1, fontSize: 12 },
  calendarKind: { fontSize: 8, letterSpacing: 1.1, color: color.faint },
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
    borderRadius: radius.control,
  },
  menuLabel: { flex: 1, fontSize: 12.5, color: color.textSoft },
});
