// 설정 · 계정 삭제 (시안 화면 25)
import React from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Card, GlassOrbs } from '../../Components/UI';
import Strings, { getLanguage, setLanguage } from '../../Components/Strings';
import { pushNotifications } from '../../Components/services';
import { menuLogout } from '../../Components/utils';
import { getSeedings } from '../../api/seedings';
import { getBuildNumber, getVersion } from 'react-native-device-info';

const { COLORS, FONT, TYPE } = T;

const ACTIVE_STATUSES = ['applied', 'approved', 'shipped', 'received', 'reviewing'];

export default function SettingsScreen({ navigation, route }) {
  // 언어·알림은 앱 안에서 바로 바뀐다 (2026-09-17 피드백 — 시스템 설정으로만 보내던 것 수정)
  const [language, setLanguageState] = React.useState(getLanguage());
  const [pushOn, setPushOn] = React.useState(pushNotifications.isPushEnabled());
  const isKorean = language === 'ko';
  const openAppSettings = () =>
    Linking.openSettings().catch(() => Alert.alert(Strings.RETRY_GUIDELINES));

  const onSelectLanguage = (lang) => {
    if (lang === language) {
      return;
    }
    setLanguage(lang).finally(() => setLanguageState(lang));
  };

  const onTogglePush = (enabled) => {
    setPushOn(enabled);
    pushNotifications.setPushEnabled(enabled);
  };
  const openPrivacyPolicy = () =>
    Linking.openURL(Strings.TERMS_URL.PRIVACY_POLICY).catch(() =>
      Alert.alert(Strings.FAILED_TO_LOAD_TERMS),
    );

  const onDeleteAccount = async () => {
    let hasActive = true;
    try {
      const seedings = await getSeedings();
      hasActive = Object.values(seedings).some((s) => ACTIVE_STATUSES.includes(s.status));
    } catch (e) {
      // 진행 미션을 확인하지 못하면 삭제를 막는다(닫힌 실패)
      Alert.alert(Strings.RETRY_GUIDELINES);
      return;
    }
    if (hasActive) {
      Alert.alert(Strings.SET_DELETE_BLOCKED);
      return;
    }
    Alert.alert(Strings.SET_DELETE_CONFIRM_TITLE, Strings.SET_DELETE_CONFIRM_BODY, [
      { text: Strings.CANCEL, style: 'cancel' },
      {
        text: Strings.SET_DELETE,
        style: 'destructive',
        // 'AgreementToWithdrawal'은 리워드 출금 약관 화면이다 — 계정 삭제는 MembershipWithdrawal(cancelMembership)
        onPress: () => navigation.navigate('MembershipWithdrawal'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <GlassOrbs />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.SET_TITLE}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{Strings.SET_REMINDER_TITLE}</Text>
            <Switch
              trackColor={{ false: COLORS.TRACK, true: COLORS.AMBER }}
              thumbColor={COLORS.SURFACE}
              ios_backgroundColor={COLORS.TRACK}
              onValueChange={onTogglePush}
              value={pushOn}
            />
          </View>
          <Text style={[styles.xs, styles.mt4]}>{Strings.SET_REMINDER_NOTE}</Text>
          <TouchableOpacity onPress={openAppSettings} accessibilityRole="link">
            <Text style={[styles.link, styles.mt4]}>{Strings.SET_OPEN_SETTINGS} ›</Text>
          </TouchableOpacity>
        </Card>

        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{Strings.SET_LANGUAGE}</Text>
            <View style={styles.seg}>
              <TouchableOpacity
                style={[styles.segItem, !isKorean && styles.segItemOn]}
                onPress={() => onSelectLanguage('en')}
                accessibilityRole="button"
              >
                <Text style={[styles.segText, !isKorean && styles.segTextOn]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segItem, isKorean && styles.segItemOn]}
                onPress={() => onSelectLanguage('ko')}
                accessibilityRole="button"
              >
                <Text style={[styles.segText, isKorean && styles.segTextOn]}>
                  {Strings.SET_LANG_KO}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.xs, styles.mt4]}>{Strings.SET_LANGUAGE_NOTE}</Text>
        </Card>

        <TouchableOpacity activeOpacity={0.7} onPress={openPrivacyPolicy}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.SET_TERMS_PRIVACY}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => menuLogout({ navigation, route })}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{Strings.SET_LOGOUT}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onDeleteAccount}>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>{Strings.SET_DELETE_ACCOUNT}</Text>
            <Text style={[styles.xs, styles.mt4]}>{Strings.SET_DELETE_ACCOUNT_NOTE}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.INK },
  xs: { ...TYPE.XS },
  mt4: { marginTop: 4 },
  chev: { fontFamily: FONT.Bold, fontSize: 16, color: COLORS.GREY },
  link: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP },
  seg: {
    flexDirection: 'row',
    width: 130,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segItem: { flex: 1, paddingVertical: 5, alignItems: 'center' },
  segItemOn: { backgroundColor: COLORS.AMBER_SOFT },
  segText: { fontFamily: FONT.Regular, fontSize: 11, color: COLORS.GREY },
  segTextOn: { fontFamily: FONT.ExtraBold, color: COLORS.AMBER_DEEP },
  dangerCard: { borderWidth: 1.5, borderColor: '#F3C9BC' },
  dangerTitle: { fontFamily: FONT.Bold, fontSize: 12.5, color: COLORS.RED },
  version: { ...TYPE.XS, textAlign: 'center', marginTop: 8 },
});
