/**
 * Overlay shown once per cold start, in front of the whole app, with what is
 * still pending today: a greeting for the part of the day, a headline with
 * `HOY` in the user's own accent, and one row per kind of item - its icon, how
 * many are left and what they are. The icons are the ones the app already
 * uses for the three kinds in onboarding and in Ajustes › Notificaciones.
 *
 * Each row has its own colour (`itemColor`), so the three read apart from one
 * another; this one screen departs from handoff §6's "accent only" rule on
 * purpose. A row with nothing left is drawn dim, and with nothing left at all
 * the headline says so instead, without anything moving: the rows and the
 * "still pending" headline stay laid out, only hidden, so the block keeps the
 * height the device's font scale actually gives them and the message never
 * jumps when the last count arrives.
 *
 * The whole screen is there on its first frame - nothing fades in, nothing
 * waits on data. The counts follow the store while it is up, and the device's
 * calendars are the one part a cold start does not have yet, since their
 * events are never stored: the events row shows a dash until that read comes
 * back, and the "nothing pending" headline waits for it too
 * (`welcomeMessage`). The countdown starts once the native splash has faded
 * off it, so it is readable for exactly the seconds chosen.
 *
 * Those are the seconds in Ajustes (`welcomeSeconds`), or fewer if swiped up,
 * and the bottom of the screen says both: an arrow over "Desliza hacia arriba"
 * that bounces every so often, and a bar that empties over exactly the time
 * left. When the bar is empty the overlay slides off the top the way a swipe
 * takes it, only unhurried: the slide is chained to the end of the bar, so the
 * two share one timeline and cannot drift apart. A swipe let go past the
 * threshold finishes the slide from where the finger left it, at a panel's
 * pace. Whichever exit starts first raises `leaving`, so the other one, and
 * any further drag, is ignored from then on.
 *
 * Under "Reducir animaciones" nothing moves, on its own or under the finger:
 * a swipe is judged when it is let go instead of dragging the overlay along,
 * the overlay fades out quickly instead of sliding, the arrow stays still and
 * the bar steps down once a second. Everything that carries the countdown
 * opts out of Reanimated's own reduce-motion handling (`ReduceMotion.Never`):
 * that handling follows the system setting and ends timings at once, which
 * would take the overlay away the moment it appeared. The app already handles
 * reduce motion itself, through `useDuration`.
 *
 * Both exits run on the UI thread, because the JS thread is at its busiest
 * during a cold start, and an exit waiting on it would leave the overlay up
 * after its bar has emptied.
 *
 * Any navigation while it is up, like a notification tapped to open an item,
 * takes it away at once: whoever asked for a specific screen should not wait
 * for a summary in front of it.
 *
 * A screen reader takes the swipe for itself, so the overlay is a modal to it
 * and offers the same early exit as an action: on the hint, on iOS's escape
 * gesture and on Android's Back, which would otherwise send the whole app to
 * the background with the overlay still up.
 *
 * Mounted by `AppShell` at most once per launch, and opaque from its first
 * frame: `AppShell` takes the native splash down on its own first layout, with
 * this already in the tree on the same background colour, so the navigator
 * mounting underneath is never seen.
 */
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BackHandler,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dayEndClock } from '@/lib/habits';
import { DEVICE_CALENDARS_SUPPORTED } from '@/services/deviceCalendars';
import {
  welcomeCounts,
  welcomeMessage,
  type WelcomeCounts,
} from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { useShownEvents } from '@/store/useShownEvents';
import { AppText, Label } from '@/theme/Text';
import { useAccent, useDuration, usePrefs } from '@/theme/prefs';
import {
  EASE_OUT,
  color,
  duration,
  itemColor,
  layer,
} from '@/theme/tokens';
import {
  CalendarBlankIcon,
  CaretUpIcon,
  FireIcon,
  ListChecksIcon,
} from '@/ui/icons';
import { greetingPeriod, type GreetingPeriod } from './greeting';

/** `welcomeSeconds` is stored in seconds; timers take milliseconds. */
const MS_PER_SECOND = 1000;

/**
 * Drawn in place of the events count while the device's calendars are still
 * being read: a dash, not a zero that may be false.
 */
const UNKNOWN_COUNT = '–';

/**
 * Largest count written out; anything above it is drawn as `OVERFLOW_COUNT`,
 * which is also the widest text the count column is kept wide enough for, so
 * the three columns line up whatever the counts are.
 */
const MAX_SHOWN_COUNT = 99;
const OVERFLOW_COUNT = `${MAX_SHOWN_COUNT}+`;

/**
 * Largest system font scale the overlay's text follows. Beyond it the three
 * rows, the headline and the swipe hint no longer fit a phone's screen
 * together, and this one screen has no scroll to fall back on. On the
 * narrowest phones a label that still does not fit shrinks to one line rather
 * than wrapping, so its row keeps its height whichever form it shows.
 */
const MAX_FONT_SCALE = 1.3;

/** Route of Home; being anywhere else means something navigated. */
const HOME_PATH = '/';

/** Upward drag distance and speed past which a swipe takes it away. */
const DISMISS_DRAG = 60;
const DISMISS_VELOCITY = 600;

/** Gesture threshold: below this the touch is not a swipe yet. */
const DRAG_ACTIVATION = 10;

/** Curve of a swipe finishing the slide from where the finger let go. */
const FLICK_EASING = Easing.bezier(...EASE_OUT);

/** Accessibility actions the hint answers to, besides the escape gesture. */
const LEAVE_ACTIONS = [{ name: 'activate' }];

/** Travel of the arrow's bounce. */
const BOUNCE_TRAVEL = 8;

/**
 * Curve of the unhurried slide once the bar is empty: it eases off the mark
 * like a finger starting a swipe, and eases out of sight.
 */
const SWIPE_AWAY_EASING = Easing.inOut(Easing.cubic);

/**
 * Size of the bar that empties while the overlay is on screen: wide and thick
 * enough to be noticed at a glance, since it is the only sign the overlay is
 * about to leave by itself.
 */
const COUNTDOWN_WIDTH = 96;
const COUNTDOWN_HEIGHT = 3;

/**
 * Room between the bottom safe area and the swipe hint. The hint sits in the
 * overlay's flow, below the block it is centred in, so the two can never
 * overlap, however large the text.
 */
const FOOTER_GAP = 32;

/** Icon sizes of the swipe-up arrow and of a count row. */
const HINT_ICON = 22;
const ROW_ICON = 24;

/** Translation key of the greeting for each part of the day. */
const GREETING_KEYS: Record<GreetingPeriod, string> = {
  morning: 'welcome.greetingMorning',
  afternoon: 'welcome.greetingAfternoon',
  night: 'welcome.greetingNight',
};

/** What one count row needs to be drawn, besides the count itself. */
type CountRowSpec = {
  kind: keyof WelcomeCounts;
  Icon: typeof CalendarBlankIcon;
  tone: string;
  singularKey: string;
  pluralKey: string;
};

/** The three rows, in the order they are listed. */
const COUNT_ROWS: CountRowSpec[] = [
  {
    kind: 'events',
    Icon: CalendarBlankIcon,
    tone: itemColor.event,
    singularKey: 'welcome.eventSingular',
    pluralKey: 'welcome.eventPlural',
  },
  {
    kind: 'tasks',
    Icon: ListChecksIcon,
    tone: itemColor.task,
    singularKey: 'welcome.taskSingular',
    pluralKey: 'welcome.taskPlural',
  },
  {
    kind: 'habits',
    Icon: FireIcon,
    tone: itemColor.habit,
    singularKey: 'welcome.habitSingular',
    pluralKey: 'welcome.habitPlural',
  },
];

type WelcomeOverlayProps = {
  /**
   * Called once the overlay has finished leaving the screen. Expected to keep
   * its identity across renders: the exits are scheduled with it.
   */
  onDone: () => void;
};

/**
 * What the overlay can say about today, following the store: everything but
 * the device's events, which are never stored and only arrive once that read
 * comes back.
 *
 * Postcondition: the events count is null until that read comes back, and
 * known straight away where there are no device calendars to read at all,
 * since nothing is outstanding then.
 */
function useTodayMessage() {
  const { weekStart, dayEndTime } = usePrefs();
  const shownEvents = useShownEvents();
  const tasks = useAppStore((state) => state.tasks);
  const habits = useAppStore((state) => state.habits);
  const deviceEventsRead = useAppStore((state) => state.deviceEventsRead);
  const calendarsRead = !DEVICE_CALENDARS_SUPPORTED || deviceEventsRead;

  const counts = useMemo(
    () =>
      welcomeCounts(
        shownEvents,
        tasks,
        habits,
        weekStart,
        dayEndClock(dayEndTime),
      ),
    [shownEvents, tasks, habits, weekStart, dayEndTime],
  );

  return welcomeMessage(counts, calendarsRead);
}

type CountRowProps = {
  Icon: typeof CalendarBlankIcon;
  /** Colour of this kind of item, used while there is anything left. */
  tone: string;
  /** How many are left, or null while that is not known yet. */
  count: number | null;
  /** Label for exactly one, and for any other count or an unknown one. */
  singular: string;
  plural: string;
  /** What a screen reader says for the dash, instead of the dash itself. */
  unknownLabel: string;
};

type WidthReserveProps = {
  /** Every text the column may show. */
  texts: string[];
  /** Whether the column is the count, in Roboto Mono, or the label. */
  mono?: boolean;
};

/**
 * Keeps a column as wide as the widest of the given texts, drawn invisibly
 * and with no height, so what is shown in it can change without the column,
 * and the centred block of rows with it, changing width.
 */
function WidthReserve({ texts, mono }: WidthReserveProps) {
  return texts.map((text, index) => (
    <AppText
      key={index}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      mono={mono}
      weight={mono ? 500 : 400}
      numberOfLines={1}
      style={[mono ? styles.count : styles.rowLabel, styles.reserve]}
      importantForAccessibility="no"
      accessibilityElementsHidden>
      {text}
    </AppText>
  ));
}

/**
 * One kind of item: its icon, how many are left in Roboto Mono so the
 * figures line up in a column, and what they are. Drawn in the row's own
 * colour, or dim when there are none left or the count is not known yet, in
 * which case a dash stands in for the number (announced as unknown), and
 * a count past `MAX_SHOWN_COUNT` is capped. Both columns reserve the width
 * of their widest possible text, so a count arriving never moves the rows.
 */
function CountRow({
  Icon,
  tone,
  count,
  singular,
  plural,
  unknownLabel,
}: CountRowProps) {
  const dim = count === null || count === 0;
  const shown = dim ? color.textDim : tone;

  return (
    <View style={styles.row}>
      <Icon size={ROW_ICON} color={shown} />
      <View>
        <AppText
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          mono
          weight={500}
          accessibilityLabel={count === null ? unknownLabel : undefined}
          style={[styles.count, { color: shown }]}>
          {count === null
            ? UNKNOWN_COUNT
            : count > MAX_SHOWN_COUNT
              ? OVERFLOW_COUNT
              : count}
        </AppText>
        <WidthReserve mono texts={[OVERFLOW_COUNT]} />
      </View>
      <View style={styles.labelColumn}>
        <AppText
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          numberOfLines={1}
          adjustsFontSizeToFit
          weight={400}
          style={[
            styles.rowLabel,
            { color: dim ? color.textDim : color.textSoft },
          ]}>
          {count === 1 ? singular : plural}
        </AppText>
        <WidthReserve texts={[singular, plural]} />
      </View>
    </View>
  );
}

type HeadlineProps = {
  /** The user's accent, for the highlighted word. */
  accent: string;
  /** Translation key of what follows the highlighted word. */
  restKey: string;
};

/** The headline: "HOY" in the accent, followed by the rest of the sentence. */
function Headline({ accent, restKey }: HeadlineProps) {
  const { t } = useTranslation();

  return (
    <AppText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      weight={500}
      style={styles.headline}>
      <AppText
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        weight={500}
        style={[styles.headline, { color: accent }]}>
        {t('welcome.today')}
      </AppText>{' '}
      {t(restKey)}
    </AppText>
  );
}

/**
 * The welcome overlay itself, covering the whole app: the greeting, the
 * headline, the three count rows (hidden behind the "nothing pending"
 * headline when there is nothing left) and the swipe hint with its countdown.
 * Calls `onDone` once it has left, by whichever exit.
 */
export function WelcomeOverlay({ onDone }: WelcomeOverlayProps) {
  const { t } = useTranslation();
  const resolveDuration = useDuration();
  const prefs = usePrefs();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const pathname = usePathname();
  const message = useTodayMessage();
  const [greeting] = useState(() =>
    greetingPeriod(new Date().getHours(), prefs.language),
  );

  /**
   * Whether motion is off, how long the overlay stays up and every duration it
   * uses, fixed once when it mounts. Resolved on the JS thread because the
   * swipe's handlers run as worklets on the UI thread, where `resolveDuration`
   * cannot be called; fixed because the countdown is scheduled once, and a
   * setting changing during those few seconds would otherwise restart it or
   * leave the other branch's animations running.
   */
  const [timing] = useState(() => ({
    motionOff: prefs.motionOff,
    seconds: prefs.welcomeSeconds,
    displayMs: prefs.welcomeSeconds * MS_PER_SECOND,
    fadeOutMs: resolveDuration(duration.overlay, 'overlay'),
    flickMs: resolveDuration(duration.panel),
    swipeAwayMs: resolveDuration(duration.swipeAway),
    snapBackMs: resolveDuration(duration.press),
    halfBounceMs: resolveDuration(duration.pulse) / 2,
    hintPauseMs: resolveDuration(duration.hintPause),
  }));

  const overlayHeight = useSharedValue(windowHeight);
  const exitProgress = useSharedValue(0);
  const dragLift = useSharedValue(0);
  const fade = useSharedValue(1);
  const leaving = useSharedValue(false);
  const hintBounce = useSharedValue(0);
  const timeLeft = useSharedValue(1);

  /**
   * Completion callback of every exit. A worklet, since the exits run on the
   * UI thread; it only hops to JS to report that the overlay is gone.
   *
   * Postcondition: `onDone` is called only for an exit that ran to its end.
   *
   * @param finished Whether the exit ran to its end, rather than being
   * cancelled by another one taking over.
   */
  const whenGone = useCallback(
    (finished?: boolean) => {
      'worklet';
      if (finished) runOnJS(onDone)();
    },
    [onDone],
  );

  /**
   * Takes the overlay away before its bar is empty, the way a swipe let go past
   * the threshold does: the slide finishes from where the finger left it, or,
   * with motion off, it fades. A worklet, so the swipe runs it on the UI
   * thread; a screen reader's action runs the same one from JS.
   *
   * Postcondition: does nothing once any exit has started; otherwise raises
   * `leaving` and stops the countdown, the bounce and the unhurried slide.
   */
  const leaveEarly = useCallback(() => {
    'worklet';
    if (leaving.value) return;
    leaving.value = true;
    cancelAnimation(hintBounce);
    cancelAnimation(timeLeft);
    cancelAnimation(exitProgress);
    if (timing.motionOff) {
      fade.value = withTiming(
        0,
        { duration: timing.fadeOutMs, reduceMotion: ReduceMotion.Never },
        whenGone,
      );
    } else {
      dragLift.value = withTiming(
        -overlayHeight.value,
        { duration: timing.flickMs, easing: FLICK_EASING },
        whenGone,
      );
    }
  }, [
    leaving,
    hintBounce,
    timeLeft,
    exitProgress,
    timing,
    fade,
    whenGone,
    dragLift,
    overlayHeight,
  ]);

  /**
   * Starts the countdown and hands its end to the exit, along with the arrow's
   * bounce. The countdown waits out the native splash's fade first, which
   * `AppShell` runs over the same `duration.overlay` right after this mounts,
   * so the bar starts full once the overlay can actually be seen. Every value
   * it reads is fixed for the overlay's life, so this runs once, when it
   * mounts, and nothing can restart it; the cleanup stops every
   * animation the overlay runs, so neither they nor the `onDone` at the end of
   * an exit outlive the screen they belong to.
   */
  useEffect(() => {
    if (!timing.motionOff) {
      hintBounce.value = withRepeat(
        withDelay(
          timing.hintPauseMs,
          withSequence(
            withTiming(1, { duration: timing.halfBounceMs }),
            withTiming(0, { duration: timing.halfBounceMs }),
          ),
        ),
        -1,
      );
    }

    timeLeft.value = withDelay(
      timing.fadeOutMs,
      withTiming(
        0,
        {
          duration: timing.displayMs,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          'worklet';
          if (!finished) return;
          leaving.value = true;
          if (timing.motionOff) {
            fade.value = withTiming(
              0,
              { duration: timing.fadeOutMs, reduceMotion: ReduceMotion.Never },
              whenGone,
            );
          } else {
            exitProgress.value = withTiming(
              1,
              {
                duration: timing.swipeAwayMs,
                easing: SWIPE_AWAY_EASING,
                reduceMotion: ReduceMotion.Never,
              },
              whenGone,
            );
          }
        },
      ),
      ReduceMotion.Never,
    );

    return () => {
      cancelAnimation(hintBounce);
      cancelAnimation(timeLeft);
      cancelAnimation(exitProgress);
      cancelAnimation(fade);
      cancelAnimation(dragLift);
    };
  }, [
    timing,
    whenGone,
    leaving,
    timeLeft,
    fade,
    hintBounce,
    exitProgress,
    dragLift,
  ]);

  /**
   * Makes Android's Back the early exit while the overlay is mounted, and
   * swallows it during the exit too, rather than letting it reach the
   * navigator or the system.
   */
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        leaveEarly();
        return true;
      },
    );
    return () => subscription.remove();
  }, [leaveEarly]);

  /**
   * Takes the overlay away with a quick fade as soon as anything navigates off
   * Home, unless another exit already started. Like the timed exit, the fade
   * opts out of Reanimated's reduce-motion handling, since its duration is
   * already the app's own.
   */
  useEffect(() => {
    if (pathname === HOME_PATH || leaving.value) return;
    leaving.value = true;
    cancelAnimation(timeLeft);
    cancelAnimation(exitProgress);
    fade.value = withTiming(
      0,
      { duration: timing.fadeOutMs, reduceMotion: ReduceMotion.Never },
      whenGone,
    );
  }, [pathname, timing, whenGone, leaving, timeLeft, exitProgress, fade]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetY(-DRAG_ACTIVATION)
    .onChange((event) => {
      if (leaving.value || timing.motionOff) return;
      dragLift.value = Math.min(0, dragLift.value + event.changeY);
    })
    .onEnd((event) => {
      if (leaving.value) return;
      const lifted = timing.motionOff ? -event.translationY : -dragLift.value;
      const shouldLeave =
        lifted > DISMISS_DRAG || -event.velocityY > DISMISS_VELOCITY;
      if (shouldLeave) {
        leaveEarly();
      } else {
        dragLift.value = withTiming(0, { duration: timing.snapBackMs });
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      {
        translateY:
          -exitProgress.value * overlayHeight.value + dragLift.value,
      },
    ],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -hintBounce.value * BOUNCE_TRAVEL }],
  }));

  const countdownStyle = useAnimatedStyle(() => {
    const shown = timing.motionOff
      ? Math.ceil(timeLeft.value * timing.seconds) / timing.seconds
      : timeLeft.value;
    return { width: shown * COUNTDOWN_WIDTH };
  });

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        onLayout={(event) => {
          overlayHeight.value = event.nativeEvent.layout.height;
        }}
        accessibilityViewIsModal
        onAccessibilityEscape={leaveEarly}
        style={[
          StyleSheet.absoluteFill,
          styles.layer,
          { paddingTop: insets.top },
          overlayStyle,
        ]}>
        <View style={styles.content}>
          <AppText
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            weight={300}
            style={styles.greeting}>
            {t(GREETING_KEYS[greeting])}
          </AppText>
          <View style={styles.headlines}>
            <View
              style={message.allDone && styles.hidden}
              importantForAccessibility={
                message.allDone ? 'no-hide-descendants' : 'auto'
              }
              accessibilityElementsHidden={message.allDone}>
              <Headline accent={accent} restKey="welcome.pending" />
            </View>
            {message.allDone ? (
              <View style={styles.allDoneHeadline}>
                <Headline accent={accent} restKey="welcome.allDone" />
              </View>
            ) : null}
          </View>

          <View
            style={[styles.rows, message.allDone && styles.hidden]}
            importantForAccessibility={
              message.allDone ? 'no-hide-descendants' : 'auto'
            }
            accessibilityElementsHidden={message.allDone}>
            {COUNT_ROWS.map((spec) => {
              const count = message[spec.kind];
              return (
                <CountRow
                  key={spec.kind}
                  Icon={spec.Icon}
                  tone={spec.tone}
                  count={count}
                  singular={t(spec.singularKey)}
                  plural={t(spec.pluralKey)}
                  unknownLabel={t('welcome.unknownCount')}
                />
              );
            })}
          </View>
        </View>

        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('welcome.enter')}
          accessibilityActions={LEAVE_ACTIONS}
          onAccessibilityAction={leaveEarly}
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + FOOTER_GAP },
          ]}>
          <Animated.View style={arrowStyle}>
            <CaretUpIcon size={HINT_ICON} color={color.textNote} weight="bold" />
          </Animated.View>
          <Label
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            size={10}
            style={styles.swipeHint}>
            {t('welcome.swipeHint')}
          </Label>
          <View style={styles.countdownTrack}>
            <Animated.View style={[styles.countdownFill, countdownStyle]} />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: layer.welcome,
    backgroundColor: color.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    color: color.textNote,
  },
  headline: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    color: color.text,
  },
  headlines: {
    alignSelf: 'stretch',
  },
  allDoneHeadline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  hidden: {
    opacity: 0,
  },
  rows: {
    marginTop: 26,
    gap: 14,
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reserve: {
    height: 0,
    opacity: 0,
  },
  count: {
    fontSize: 40,
    lineHeight: 46,
    textAlign: 'right',
  },
  labelColumn: {
    flexShrink: 1,
  },
  rowLabel: {
    fontSize: 19,
    lineHeight: 26,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  swipeHint: {
    color: color.textNote,
  },
  countdownTrack: {
    width: COUNTDOWN_WIDTH,
    height: COUNTDOWN_HEIGHT,
    marginTop: 4,
    alignItems: 'center',
    backgroundColor: color.border,
  },
  countdownFill: {
    height: COUNTDOWN_HEIGHT,
    backgroundColor: color.textNote,
  },
});
