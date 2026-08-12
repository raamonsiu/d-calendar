import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space } from '@/theme/tokens';
import { ScreenHeader } from './ScreenHeader';

/** Room above the header and below the last group, on top of the safe area. */
const TOP_PADDING = 12;
const BOTTOM_PADDING = 14;

/** Gap between groups on a list screen. */
const GROUP_GAP = 16;

type SecondaryScreenProps = {
  title: string;
  /** 15px title, for the help articles. */
  compactTitle?: boolean;
  /** Gap between the scroll children; articles use the "gap Nothing" one. */
  contentGap?: number;
  children: ReactNode;
  /**
   * Bottom sheets of the screen. They go outside the padded container so they
   * can take the full width and cover it completely.
   */
  overlays?: ReactNode;
  /**
   * Fixed below the scroll instead of inside it, for the one thing on the
   * screen that should never need scrolling to reach: Help's "Enviar
   * comentario" card. The scroll view shrinks to make room for it on its own,
   * the same way the create form's own bottom button already does.
   */
  footer?: ReactNode;
};

/**
 * Scaffold of the secondary screens (Settings, Calendars, Help, article and
 * About): background, safe area, header with a back arrow and a vertical scroll
 * for the content.
 *
 * It centralises the inset arithmetic, which is where it is easiest for one
 * screen to drift out of line with the others.
 */
export function SecondaryScreen({
  title,
  compactTitle,
  contentGap = GROUP_GAP,
  children,
  overlays,
  footer,
}: SecondaryScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + TOP_PADDING,
            paddingBottom: insets.bottom + BOTTOM_PADDING,
          },
        ]}>
        <ScreenHeader title={title} compact={compactTitle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { gap: contentGap }]}>
          {children}
        </ScrollView>

        {footer}
      </View>
      {overlays}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background },
  screen: { flex: 1, paddingHorizontal: space.screen, gap: 12 },
  content: { paddingBottom: 6 },
});
