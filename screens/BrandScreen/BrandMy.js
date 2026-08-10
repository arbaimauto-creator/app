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

  const campaign = campaigns[0];

  useFocusEffect(
    useCallback(() => {
      // BrandDashboard와 동일 소스: 게이트에서 저장한 inviteBrandName
      Preference.get('inviteBrandName').then((v) => setBrandName(v || 'SonPlan'));
      if (campaigns.length === 0) {
        dispatch(fetchCampaigns());
      }
      const id = campaigns[0]?.id;
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
            <Badge tone="open" text="1" />
          </View>
          <Text style={styles.campaignLine}>{campaignLine}</Text>
        </Card>

        {/* 지난 캠페인 */}
        <Card style={[styles.rowCard, styles.rowInline]}>
          <Text style={styles.rowTitle}>{Strings.BRAND_MY_PAST}</Text>
          <Text style={styles.xs}>{Strings.BRAND_MY_PAST_COUNT}</Text>
        </Card>

        {/* FGI 리포트 */}
        <Card style={styles.rowCard}>
          <View style={styles.rowHead}>
            <Text style={styles.rowTitle}>{Strings.BRAND_MY_REPORT}</Text>
            <Text style={styles.xs}>{Strings.BRAND_MY_REPORT_COUNT}</Text>
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
