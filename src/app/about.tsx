import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BUILD, APP_VERSION, RELEASES } from '@/data/releases';
import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, radius, space } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { ScreenHeader } from '@/ui/ScreenHeader';
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

const DEV_LINKS: { label: string; handle: string; url: string; Icon: Icon }[] = [
  {
    label: 'GitHub',
    handle: 'github.com/d1ito',
    url: 'https://github.com/d1ito',
    Icon: GithubLogoIcon,
  },
  {
    label: 'LinkedIn',
    handle: 'in/d1ito',
    url: 'https://www.linkedin.com/in/d1ito',
    Icon: LinkedinLogoIcon,
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const toast = useToast();
  const [changelog, setChangelog] = useState(false);

  const rows: { label: string; meta?: string; Icon: Icon; onPress: () => void }[] =
    [
      {
        label: 'Novedades',
        meta: APP_VERSION,
        Icon: SparkleIcon,
        onPress: () => setChangelog(true),
      },
      {
        label: 'Política de privacidad',
        Icon: ShieldCheckIcon,
        onPress: () => toast.show('Pendiente de publicar'),
      },
      {
        label: 'Términos de uso',
        Icon: ScrollIcon,
        onPress: () => toast.show('Pendiente de publicar'),
      },
      {
        label: 'Licencias de código abierto',
        meta: '14',
        Icon: CodeIcon,
        onPress: () => toast.show('Pendiente de publicar'),
      },
      {
        label: 'Valorar en Google Play',
        Icon: StarIcon,
        onPress: () => toast.show('Disponible cuando la app esté publicada'),
      },
      {
        label: 'Compartir la app',
        Icon: ShareNetworkIcon,
        onPress: () => toast.show('Disponible cuando la app esté publicada'),
      },
    ];

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 14 },
        ]}>
        <ScreenHeader title="Acerca de" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={styles.logo}>
              <T mono style={styles.logoText}>
                D—C
              </T>
            </View>
            <View style={styles.heroBody}>
              <T w={500} style={styles.appName}>
                D-Calendar
              </T>
              <T style={styles.tagline}>
                Calendario, tareas y hábitos en una sola pantalla.
              </T>
              <View style={styles.heroMeta}>
                <T style={styles.microMeta}>VERSIÓN {APP_VERSION}</T>
                <View style={styles.metaDot} />
                <T style={styles.microMeta}>BUILD {APP_BUILD}</T>
              </View>
            </View>
          </View>

          <Group title="La app">
            {rows.map((r, i) => (
              <GroupRow
                key={r.label}
                index={i}
                count={rows.length}
                height={54}
                label={r.label}
                value={r.meta}
                onPress={r.onPress}
                icon={<r.Icon size={15} color={color.textMuted} />}
              />
            ))}
            <View style={styles.privacy}>
              <LockSimpleIcon size={12} color={color.faint} />
              <T style={styles.privacyText}>
                Sin cuentas propias, sin anuncios y sin rastreo: tus eventos y
                hábitos viajan solo entre tu móvil y los calendarios que
                conectas.
              </T>
            </View>
          </Group>

          <Group title="El desarrollador">
            <View style={styles.devCard}>
              <View style={styles.devAvatar}>
                <T mono style={[styles.devInitials, { color: accent }]}>
                  D1
                </T>
              </View>
              <View style={styles.devBody}>
                <T w={500} style={styles.devName}>
                  D1ITO
                </T>
                <T style={styles.devRole}>
                  Diseño y desarrollo. Proyecto independiente, hecho a ratos.
                </T>
              </View>
            </View>

            {DEV_LINKS.map((link) => (
              <Pressable
                key={link.label}
                accessibilityRole="link"
                onPress={() => Linking.openURL(link.url)}
                style={({ pressed }) => [
                  styles.linkRow,
                  { backgroundColor: pressed ? color.cardHover : color.surface },
                ]}>
                <link.Icon size={16} color="#b9b9c1" />
                <View style={styles.linkBody}>
                  <T style={styles.linkLabel}>{link.label}</T>
                  <T style={styles.linkHandle}>{link.handle}</T>
                </View>
                <ArrowUpRightIcon size={12} color="#3f3f47" />
              </Pressable>
            ))}

            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL('https://buymeacoffee.com/d1ito')}
              style={({ pressed }) => [
                styles.coffee,
                {
                  borderColor: accent,
                  backgroundColor: alpha(accent, pressed ? 0.14 : 0.07),
                },
              ]}>
              <CoffeeIcon size={17} color={accent} />
              <View style={styles.linkBody}>
                <T style={styles.coffeeTitle}>Buy me a coffee</T>
                <T style={styles.coffeeHint}>Mantiene la app sin anuncios</T>
              </View>
              <ArrowUpRightIcon size={12} color={accent} />
            </Pressable>
          </Group>

          <View style={styles.love}>
            <T style={styles.loveText}>With love,</T>
            <HeartStraightIcon size={11} color={accent} weight="fill" />
            <T mono style={styles.loveName}>
              D1ITO
            </T>
          </View>
        </ScrollView>
      </View>

      <Sheet
        open={changelog}
        onClose={() => setChangelog(false)}
        title="Novedades">
        <ScrollView style={{ maxHeight: 330 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 15 }}>
            {RELEASES.map((release) => (
              <View key={release.version} style={{ gap: 8 }}>
                <View style={styles.releaseHead}>
                  <T mono style={styles.releaseVersion}>
                    {release.version}
                  </T>
                  <T style={styles.releaseDate}>{release.date}</T>
                </View>
                <View style={{ gap: 6 }}>
                  {release.notes.map((note, i) => (
                    <View key={i} style={styles.noteRow}>
                      <View
                        style={[styles.noteDot, { backgroundColor: accent }]}
                      />
                      <T style={styles.noteText}>{note}</T>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  screen: { flex: 1, paddingHorizontal: space.screen, gap: 12 },
  scroll: { gap: 16, paddingBottom: 6 },
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
    borderRadius: 22,
    backgroundColor: '#0e0e10',
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 19, letterSpacing: -1 },
  heroBody: { flex: 1, gap: 5 },
  appName: { fontSize: 20, letterSpacing: -0.4 },
  tagline: { fontSize: 11.5, lineHeight: 16, color: color.textMuted },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 2 },
  microMeta: { fontSize: 8.5, letterSpacing: 1.4, color: color.labelDim },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#2f2f36' },
  privacy: { flexDirection: 'row', gap: 9, paddingHorizontal: 8, paddingTop: 9 },
  privacyText: { flex: 1, fontSize: 10.5, lineHeight: 16, color: color.labelDim },
  devCard: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.box,
    borderTopRightRadius: radius.box,
    borderBottomLeftRadius: radius.joined,
    borderBottomRightRadius: radius.joined,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  devAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0e0e10',
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
    borderRadius: radius.joined,
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
    borderTopLeftRadius: radius.joined,
    borderTopRightRadius: radius.joined,
    borderBottomLeftRadius: radius.box,
    borderBottomRightRadius: radius.box,
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
  releaseHead: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  releaseVersion: { fontSize: 12, color: color.text },
  releaseDate: { fontSize: 8.5, letterSpacing: 1.4, color: color.labelDim },
  noteRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  noteDot: { width: 4, height: 4, borderRadius: 2, marginTop: 7 },
  noteText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: '#b9b9c1' },
});
