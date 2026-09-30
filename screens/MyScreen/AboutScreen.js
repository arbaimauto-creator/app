// About · 사업자 정보 (시안 화면 20)
import React from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Card } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { getBuildNumber, getVersion } from 'react-native-device-info';

const { COLORS, FONT, TYPE } = T;

export default function AboutScreen({ navigation }) {
  const openUrl = (url) => Linking.openURL(url).catch(() => {});

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.logoCard}>
          <Text style={styles.logo}>
            greyd<Text style={{ color: COLORS.AMBER }}>.</Text>
          </Text>
          <Text style={styles.xs}>{Strings.ABOUT_TAGLINE}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>{Strings.ABOUT_BIZ_LABEL}</Text>
          <Text style={styles.bizText}>{Strings.ABOUT_BIZ_INFO}</Text>
        </Card>

        <TouchableOpacity activeOpacity={0.7} onPress={() => openUrl(Strings.TERMS_URL.SERVICE)}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.ABOUT_TERMS}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openUrl(Strings.TERMS_URL.PRIVACY_POLICY)}
        >
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.ABOUT_PRIVACY}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => openUrl('mailto:hello@greyd.app')}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.ABOUT_CONTACT}</Text>
              <Text style={styles.xs}>hello@greyd.app ›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <Text style={styles.version}>
          v{getVersion()} ({getBuildNumber()})
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK },
  scroll: { padding: 16, paddingTop: 4, paddingBottom: 32, gap: 9 },
  logoCard: { alignItems: 'center', paddingVertical: 22, gap: 5 },
  logo: { fontFamily: T.SERIF.SemiBold, fontSize: 30, color: COLORS.INK },
  xs: { ...TYPE.XS },
  label: { fontFamily: FONT.Bold, fontSize: 10.5, color: COLORS.GREY, marginBottom: 6 },
  bizText: { fontFamily: FONT.Regular, fontSize: 13, color: COLORS.INK, lineHeight: 13 * 1.7 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  chev: { fontFamily: FONT.Bold, fontSize: 16, color: COLORS.GREY },
  version: { ...TYPE.XS, textAlign: 'center', marginTop: 8 },
});
