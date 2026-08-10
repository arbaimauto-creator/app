// 설정 · 계정 삭제 (시안 화면 25)
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Card, Badge } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { menuLogout } from '../../Components/utils';
import { getSeedings } from '../../api/seedings';

const { COLORS, FONT, TYPE } = T;

const ACTIVE_STATUSES = ['applied', 'approved', 'shipped', 'received', 'reviewing'];

export default function SettingsScreen({ navigation, route }) {
  const isKorean = Strings.CANCEL === '취소';

  const onDeleteAccount = async () => {
    const seedings = await getSeedings();
    const hasActive = Object.values(seedings).some((s) => ACTIVE_STATUSES.includes(s.status));
    if (hasActive) {
      Alert.alert('진행 중인 체험이 있어요 — 완료하거나 취소한 뒤 삭제할 수 있어요.');
      return;
    }
    Alert.alert(
      '정말 삭제할까요?',
      '이 작업은 되돌릴 수 없어요. 포인트·G-스코어·추천 코드가 모두 사라져요.',
      [
        { text: Strings.CANCEL, style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => navigation.navigate('AgreementToWithdrawal'),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>D-day 리마인더</Text>
            <Badge tone="open" text="켜짐" />
          </View>
          <Text style={[styles.xs, styles.mt4]}>마감 관련 알림만 — 마케팅 알림 없음</Text>
        </Card>

        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>언어</Text>
            <View style={styles.seg}>
              <View style={[styles.segItem, !isKorean && styles.segItemOn]}>
                <Text style={[styles.segText, !isKorean && styles.segTextOn]}>EN</Text>
              </View>
              <View style={[styles.segItem, isKorean && styles.segItemOn]}>
                <Text style={[styles.segText, isKorean && styles.segTextOn]}>한국어</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.xs, styles.mt4]}>글로벌 기본 English · 기기 언어 자동 감지</Text>
        </Card>

        <Card>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>이용약관 · 개인정보 처리방침</Text>
            <Text style={styles.chev}>›</Text>
          </View>
        </Card>

        <TouchableOpacity activeOpacity={0.7} onPress={() => menuLogout({ navigation, route })}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>로그아웃</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onDeleteAccount}>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>계정 삭제</Text>
            <Text style={[styles.xs, styles.mt4]}>
              포인트 · G-스코어 · 추천 코드가 모두 사라져요. 진행 중인 체험이 있으면 완료하거나
              취소한 뒤 삭제할 수 있어요.
            </Text>
          </Card>
        </TouchableOpacity>

        <Text style={styles.version}>v2.0.0 (Phase 1)</Text>
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
