/**
 * About (route `/about`).
 *
 * How you get here: from the Home side menu.
 *
 * Where it leads: nowhere inside the app; the changelog opens in a bottom
 * sheet. The developer links open in the system browser through `expo-linking`.
 *
 * Mock: the privacy, licences, rate and share rows show a toast saying they
 * will arrive once the app is published.
 */
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { APP_BUILD, APP_VERSION, RELEASES } from '@/data/releases';
import { groupRadius } from '@/lib/groupRadius';
import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, radius, tint } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { GroupRow } from '@/ui/controls';
import {
  ArrowUpRightIcon,
  CodeIcon,
  CoffeeIcon,
  GithubLogoIcon,
  HeartStraightIcon,
  LinkedinLogoIcon,
  LockSimpleIcon,
  ScrollIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StarIcon,
  type Icon,
} from '@/ui/icons';

/** Developer profiles. */
const DEV_LINKS: { label: string; handle: string; url: string; Logo: Icon }[] = [
  {
    label: 'GitHub',
    handle: 'github.com/d1ito',
    url: 'https://github.com/d1ito',
    Logo: GithubLogoIcon,
  },
  {
    label: 'LinkedIn',
    handle: 'in/d1ito',
    url: 'https://www.linkedin.com/in/d1ito',
    Logo: LinkedinLogoIcon,
  },
];

const COFFEE_URL = 'https://buymeacoffee.com/d1ito';

/** How many open source dependencies the app declares. */
const LICENSE_COUNT = '14';

/**
 * Maximum height of the changelog sheet, so it never covers the whole screen.
 */
const CHANGELOG_MAX_HEIGHT = 330;

/**
 * The developer group is four connected pieces: the card, the two links and the
 * coffee row. `groupRadius` needs the count to know which ones are the ends.
 */
const CARD_COUNT_DEV = 4;

export default function AboutScreen() {
  const accent = useAccent();
  const toast = useToast();
  const [changelogOpen, setChangelogOpen] = useState(false);

  const pending = (message: string) => () => toast.show(message);

  const appRows: {
    label: string;
    meta?: string;
    Logo: Icon;
    onPress: () => void;
  }[] = [
    {
      label: 'Novedades',
      meta: APP_VERSION,
      Logo: SparkleIcon,
      onPress: () => setChangelogOpen(true),
    },
    {
      label: 'Política de privacidad',
      Logo: ShieldCheckIcon,
      onPress: pending('Pendiente de publicar'),
    },
    {
      label: 'Términos de uso',
      Logo: ScrollIcon,
      onPress: pending('Pendiente de publicar'),
    },
    {
      label: 'Licencias de código abierto',
      meta: LICENSE_COUNT,
      Logo: CodeIcon,
      onPress: pending('Pendiente de publicar'),
    },
    {
      label: 'Valorar en Google Play',
      Logo: StarIcon,
      onPress: pending('Disponible cuando la app esté publicada'),
    },
    {
      label: 'Compartir la app',
      Logo: ShareNetworkIcon,
      onPress: pending('Disponible cuando la app esté publicada'),
    },
  ];

  return (
    <SecondaryScreen
      title="Acerca de"
      overlays={
        <Sheet
          open={changelogOpen}
          onClose={() => setChangelogOpen(false)}
          title="Novedades">
          <ScrollView
            style={styles.changelog}
            showsVerticalScrollIndicator={false}>
            <View style={styles.releaseList}>
              {RELEASES.map((release) => (
                <View key={release.version} style={styles.release}>
                  <View style={styles.releaseHead}>
                    <AppText mono style={styles.releaseVersion}>
                      {release.version}
                    </AppText>
                    <AppText style={styles.releaseDate}>{release.date}</AppText>
                  </View>
                  <View style={styles.releaseNotes}>
                    {release.notes.map((note) => (
                      <View key={note} style={styles.noteRow}>
                        <View
                          style={[styles.noteDot, { backgroundColor: accent }]}
                        />
                        <AppText style={styles.noteText}>{note}</AppText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </Sheet>
      }>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <AppText mono style={styles.logoText}>
            D—C
          </AppText>
        </View>
        <View style={styles.heroBody}>
          <AppText weight={500} style={styles.appName}>
            D-Calendar
          </AppText>
          <AppText style={styles.tagline}>
            Calendario, tareas y hábitos en una sola pantalla.
          </AppText>
          <View style={styles.heroMeta}>
            <AppText style={styles.microMeta}>VERSIÓN {APP_VERSION}</AppText>
            <View style={styles.metaDot} />
            <AppText style={styles.microMeta}>BUILD {APP_BUILD}</AppText>
          </View>
        </View>
      </View>

      <Group title="La app">
        {appRows.map((row, index) => (
          <GroupRow
            key={row.label}
            index={index}
            count={appRows.length}
            height={54}
            label={row.label}
            value={row.meta}
            onPress={row.onPress}
            icon={<row.Logo size={15} color={color.textMuted} />}
          />
        ))}
        <View style={styles.privacy}>
          <LockSimpleIcon size={12} color={color.faint} />
          <AppText style={styles.privacyText}>
            Sin cuentas propias, sin anuncios y sin rastreo: tus eventos y
            hábitos viajan solo entre tu móvil y los calendarios que conectas.
          </AppText>
        </View>
      </Group>

      <Group title="El desarrollador">
        <View style={[styles.devCard, groupRadius(0, CARD_COUNT_DEV)]}>
          <View style={styles.devAvatar}>
            <AppText mono style={[styles.devInitials, { color: accent }]}>
              D1
            </AppText>
          </View>
          <View style={styles.devBody}>
            <AppText weight={500} style={styles.devName}>
              D1ITO
            </AppText>
            <AppText style={styles.devRole}>
              Diseño y desarrollo. Proyecto independiente, hecho a ratos.
            </AppText>
          </View>
        </View>

        {DEV_LINKS.map(({ label, handle, url, Logo }, index) => (
          <Pressable
            key={label}
            accessibilityRole="link"
            onPress={() => Linking.openURL(url)}
            style={({ pressed }) => [
              styles.linkRow,
              groupRadius(index + 1, CARD_COUNT_DEV),
              { backgroundColor: pressed ? color.cardHover : color.surface },
            ]}>
            <Logo size={16} color={color.textNote} />
            <View style={styles.linkBody}>
              <AppText style={styles.linkLabel}>{label}</AppText>
              <AppText style={styles.linkHandle}>{handle}</AppText>
            </View>
            <ArrowUpRightIcon size={12} color={color.caret} />
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(COFFEE_URL)}
          style={({ pressed }) => [
            styles.coffee,
            groupRadius(CARD_COUNT_DEV - 1, CARD_COUNT_DEV),
            {
              borderColor: accent,
              backgroundColor: alpha(
                accent,
                pressed ? tint.fillPressed : tint.fill,
              ),
            },
          ]}>
          <CoffeeIcon size={17} color={accent} />
          <View style={styles.linkBody}>
            <AppText style={styles.coffeeTitle}>Buy me a coffee</AppText>
            <AppText style={styles.coffeeHint}>
              Mantiene la app sin anuncios
            </AppText>
          </View>
          <ArrowUpRightIcon size={12} color={accent} />
        </Pressable>
      </Group>

      <View style={styles.love}>
        <AppText style={styles.loveText}>With love,</AppText>
        <HeartStraightIcon size={11} color={accent} weight="fill" />
        <AppText mono style={styles.loveName}>
          D1ITO
        </AppText>
      </View>
    </SecondaryScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: color.surface,
    borderRadius: radius.box,
    paddingVertical: 22,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.logo,
    backgroundColor: color.sunken,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 19, letterSpacing: -1 },
  heroBody: { flex: 1, gap: 5 },
  appName: { fontSize: 20, letterSpacing: -0.4 },
  tagline: { fontSize: 11.5, lineHeight: 16, color: color.textMuted },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 2,
  },
  microMeta: { fontSize: 8.5, letterSpacing: 1.4, color: color.labelDim },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: color.edge,
  },
  privacy: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 8,
    paddingTop: 9,
  },
  privacyText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: color.labelDim,
  },
  devCard: {
    backgroundColor: color.surface,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  devAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: color.sunken,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devInitials: { fontSize: 13 },
  devBody: { flex: 1, gap: 4 },
  devName: { fontSize: 14.5, letterSpacing: -0.2 },
  devRole: { fontSize: 11, lineHeight: 15, color: color.textMuted },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    paddingHorizontal: 16,
  },
  linkBody: { flex: 1, gap: 2 },
  linkLabel: { fontSize: 12.5, color: color.textBody },
  linkHandle: { fontSize: 9, letterSpacing: 0.8, color: color.labelDim },
  coffee: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: 16,
  },
  coffeeTitle: { fontSize: 12.5, color: color.text },
  coffeeHint: { fontSize: 9, letterSpacing: 0.8, color: color.textMuted },
  love: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingTop: 8,
    paddingBottom: 4,
  },
  loveText: { fontSize: 10.5, letterSpacing: 0.4, color: color.labelDim },
  loveName: { fontSize: 10.5, letterSpacing: 1.4, color: color.textMuted },
  changelog: { maxHeight: CHANGELOG_MAX_HEIGHT },
  releaseList: { gap: 15 },
  release: { gap: 8 },
  releaseHead: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  releaseVersion: { fontSize: 12, color: color.text },
  releaseDate: { fontSize: 8.5, letterSpacing: 1.4, color: color.labelDim },
  releaseNotes: { gap: 6 },
  noteRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  noteDot: { width: 4, height: 4, borderRadius: 2, marginTop: 7 },
  noteText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: color.textNote },
});
