import { View } from 'react-native';

type Props = {
  axis: 'vertical' | 'horizontal';
  /** El gap del grupo: 5 en vertical (Crear), 6 en horizontal (semana). */
  gap: number;
  /** Color de la caja que se une. */
  surface: string;
  /** Color de lo que hay detrás del gap. */
  behind: string;
};

const INNER_RADIUS = 5;
/** El puente ocupa el 30% central; a cada lado queda un 35% recortado. */
const SIDE = '35%';

/**
 * El puente del «gap Nothing» conectado (handoff §4b).
 *
 * Se pinta como hijo absoluto del SEGUNDO elemento del par. El elemento no
 * puede llevar `overflow: 'hidden'` o el puente se recorta.
 */
export function Bridge({ axis, gap, surface, behind }: Props) {
  if (axis === 'vertical') {
    const band = {
      position: 'absolute',
      left: 0,
      right: 0,
      top: -(gap + 1),
      height: gap + 2,
    } as const;

    return (
      <>
        <View
          pointerEvents="none"
          style={[band, { backgroundColor: surface }]}
        />
        <View
          pointerEvents="none"
          style={[
            band,
            {
              left: -1,
              right: undefined,
              width: SIDE,
              backgroundColor: behind,
              borderTopRightRadius: INNER_RADIUS,
              borderBottomRightRadius: INNER_RADIUS,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            band,
            {
              left: undefined,
              right: -1,
              width: SIDE,
              backgroundColor: behind,
              borderTopLeftRadius: INNER_RADIUS,
              borderBottomLeftRadius: INNER_RADIUS,
            },
          ]}
        />
      </>
    );
  }

  const band = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -gap,
    width: gap,
  } as const;

  return (
    <>
      <View pointerEvents="none" style={[band, { backgroundColor: surface }]} />
      <View
        pointerEvents="none"
        style={[
          band,
          {
            bottom: undefined,
            height: SIDE,
            backgroundColor: behind,
            borderBottomLeftRadius: INNER_RADIUS,
            borderBottomRightRadius: INNER_RADIUS,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          band,
          {
            top: undefined,
            height: SIDE,
            backgroundColor: behind,
            borderTopLeftRadius: INNER_RADIUS,
            borderTopRightRadius: INNER_RADIUS,
          },
        ]}
      />
    </>
  );
}
