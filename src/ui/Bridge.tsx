import { StyleSheet, View, type ViewStyle } from 'react-native';

/** Radius of the two notches left on either side of the bridge. */
const NOTCH_RADIUS = 5;

/** The bridge takes the middle 30%: a 35% notch is cut on each side. */
const NOTCH_SIZE = '35%';

type BridgeProps = {
  axis: 'vertical' | 'horizontal';
  /** The group gap: 5 vertically (Crear), 6 horizontally (week view). */
  gap: number;
  /** Colour of the box being joined. */
  surface: string;
  /** Colour of whatever sits behind the gap. */
  behind: string;
};

/**
 * The connected "gap Nothing" bridge (handoff §4b): it covers the gap between
 * two boxes leaving a rounded notch on each side.
 *
 * It is drawn as an absolute child of the SECOND element of the pair, and that
 * element must not carry `overflow: 'hidden'` or the bridge gets clipped.
 */
export function Bridge({ axis, gap, surface, behind }: BridgeProps) {
  return axis === 'vertical' ? (
    <VerticalBridge gap={gap} surface={surface} behind={behind} />
  ) : (
    <HorizontalBridge gap={gap} surface={surface} behind={behind} />
  );
}

type AxisBridgeProps = Omit<BridgeProps, 'axis'>;

/** Bridge between two stacked boxes: a horizontal band over the top edge. */
function VerticalBridge({ gap, surface, behind }: AxisBridgeProps) {
  /** It runs 1px past each side so no antialiasing seam is left. */
  const band: ViewStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -(gap + 1),
    height: gap + 2,
  };

  return (
    <>
      <View pointerEvents="none" style={[band, { backgroundColor: surface }]} />
      <View
        pointerEvents="none"
        style={[
          band,
          styles.leftNotch,
          {
            width: NOTCH_SIZE,
            backgroundColor: behind,
            borderTopRightRadius: NOTCH_RADIUS,
            borderBottomRightRadius: NOTCH_RADIUS,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          band,
          styles.rightNotch,
          {
            width: NOTCH_SIZE,
            backgroundColor: behind,
            borderTopLeftRadius: NOTCH_RADIUS,
            borderBottomLeftRadius: NOTCH_RADIUS,
          },
        ]}
      />
    </>
  );
}

/** Bridge between two cells in a row: a vertical band over the left edge. */
function HorizontalBridge({ gap, surface, behind }: AxisBridgeProps) {
  const band: ViewStyle = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -gap,
    width: gap,
  };

  return (
    <>
      <View pointerEvents="none" style={[band, { backgroundColor: surface }]} />
      <View
        pointerEvents="none"
        style={[
          band,
          styles.topNotch,
          {
            height: NOTCH_SIZE,
            backgroundColor: behind,
            borderBottomLeftRadius: NOTCH_RADIUS,
            borderBottomRightRadius: NOTCH_RADIUS,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          band,
          styles.bottomNotch,
          {
            height: NOTCH_SIZE,
            backgroundColor: behind,
            borderTopLeftRadius: NOTCH_RADIUS,
            borderTopRightRadius: NOTCH_RADIUS,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  leftNotch: { left: -1, right: undefined },
  rightNotch: { left: undefined, right: -1 },
  topNotch: { bottom: undefined },
  bottomNotch: { top: undefined },
});
