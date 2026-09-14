import React, { useCallback, useState } from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import { Card, Badge, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { fetchCampaignReviews } from '../../api/reviews';
import { getEvaluations } from '../../api/evaluations';

const { COLORS, FONT } = T;

// 시안: 브랜드 마이 — 계정 · 진행 캠페인 · 리포트 · 문의 · About.
export default function BrandMy({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const [brandName, setBrandName] = useState('');
  const [uploads, setUploads] = useState(0);
  const [evaluated, setEvaluated] = useState(0);

  // 브랜드 캠페인 목록 — 진행 중(open)과 지난(closed)을 데이터로 센다 (이전엔 '1건' 고정 문자열)
  const ongoing = campaigns.filter((c) => c.status !== 'closed');
  const past = campaigns.filter((c) => c.status === 'closed');
  const campaign = ongoing[0] || campaigns[0];

  useFocusEffect(
    useCallback(() => {
      // BrandDashboard와 동일 소스: 게이트에서 저장한 inviteBrandName
      Preference.get('inviteBrandName').then((v) =>
        setBrandName(v || Strings.BRAND_MY_DEFAULT_NAME),
      );
      if (campaigns.length === 0) {
        dispatch(fetchCampaigns());
      }
      const id = (campaigns.find((c) => c.status !== 'closed') || campaigns[0])?.id;
      if (id) {
        Promise.all([fetchCampaignReviews(id), getEvaluations()]).then(([reviews, evals]) => {
          setUploads(reviews.length);
          setEvaluated(reviews.filter((r) => evals[r.id]?.triage).length);
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaigns]),
  );

  const campaignLine = campaign
    ? Strings.BRAND_MY_CAMPAIGN_LINE(campaign.title, uploads, evaluated)
    : Strings.BRAND_MY_NO_CAMPAIGN;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={T.TYPE.H_TITLE}>{Strings.MY_TITLE}</Text>

        {/* 계정 */}
        <Card style={styles.accountCard}>
          <View style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 11 }}>
            <Text style={styles.accountName}>{brandName}</Text>
            <Text style={styles.xs}>{Strings.BRAND_MY_ACCOUNT_META}</Text>
          </View>
        </Card>

        {/* 진행 중 캠페인 */}
        <Card style={styles.rowCard}>
          <View style={styles.rowHead}>
            <Text style={styles.rowTitle}>{Strings.BRAND_MY_ONGOING}</Text>
            <Badge
              tone={ongoing.length > 0 ? 'open' : 'curated'}
              text={Strings.BRAND_MY_ONGOING_COUNT(ongoing.length)}
            />
          </View>
          <Text style={styles.campaignLine}>{campaignLine}</Text>
        </Card>

        {/* 지난 캠페인 */}
        <Card style={[styles.rowCard, styles.rowInline]}>
          <Text style={styles.rowTitle}>{Strings.BRAND_MY_PAST}</Text>
          <Text style={styles.xs}>{Strings.BRAND_MY_PAST_COUNT_N(past.length)}</Text>
        </Card>

        {/* FGI 리포트 */}
        <Card style={styles.rowCard}>
          <View style={styles.rowHead}>
            <Text style={styles.rowTitle}>{Strings.BRAND_MY_REPORT}</Text>
            {/* 리포트는 캠페인 종료 후 애널리스트가 작성 — 종료 캠페인 수만큼 제공 예정 */}
            <Text style={styles.xs}>{Strings.BRAND_MY_REPORT_COUNT_N(past.length)}</Text>
          </View>
          <Text style={[styles.xs, { marginTop: 4 }]}>{Strings.BRAND_MY_REPORT_NOTE}</Text>
        </Card>

        {/* 담당 애널리스트 문의 */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL('mailto:hello@greyd.app')}
        >
          <Card style={[styles.rowCard, styles.rowInline]}>
            <Text style={styles.rowTitle}>{Strings.BRAND_MY_CONTACT}</Text>
            <Text style={styles.xs}>✉️ ›</Text>
          </Card>
        </TouchableOpacity>

        {/* About */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AboutGreyd')}>
          <Card style={[styles.rowCard, styles.rowInline]}>
            <Text style={styles.rowTitle}>{Strings.MY_ABOUT_ROW}</Text>
            <Text style={styles.xs}>ARBAIM INC. ›</Text>
          </Card>
        </TouchableOpacity>

        <NoteBox tone="amber" text={Strings.BRAND_MY_PHASE2_NOTE} style={{ marginTop: 14 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  accountCard: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  avatar: { width: 38, height: 38, borderRadius: 9, backgroundColor: COLORS.DARK },
  accountName: { fontFamily: FONT.Bold, fontSize: 13.5, color: COLORS.INK },
  xs: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY, marginTop: 2 },
  rowCard: { marginTop: 10 },
  rowInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK },
  campaignLine: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.INK, marginTop: 6 },
});
