import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Preference from 'react-native-default-preference';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { applyToCampaign, selectMyApplications } from '../../slices/campaign';
import { isGuestUser, LogoutAlert } from '../../Components/utils';
import { getCreatorProfile } from '../../api/creators';
import { upsertSeeding, setSeedingStatus, SEEDING_STATUS } from '../../api/seedings';
import { personalizedPoints } from './points';

export default function CampaignDetail({ route, navigation }) {
  const { campaign } = route.params;
  const dispatch = useDispatch();
  const applications = useSelector(selectMyApplications);
  const applied = applications[campaign.id] != null;

  // v2 §3-④: 업로드 서약 체크박스 1개 + 한 줄 어필(선택)
  const [pledged, setPledged] = useState(false);
  const [appeal, setAppeal] = useState('');
  const [gScore, setGScore] = useState(50);

  useEffect(() => {
    getCreatorProfile().then((p) => {
      if (p?.gScore != null) {
        setGScore(p.gScore);
      }
    });
  }, []);

  const points = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);

  // 게스트는 신청/업로드 불가 — 로그인 유도 (다른 업로드 진입점과 동일 정책)
  const guardGuest = async () => {
    const userId = await Preference.get('userId');
    if (isGuestUser(userId)) {
      LogoutAlert({ route, navigation });
      return true;
    }
    return false;
  };

  const onApply = async () => {
    if (await guardGuest()) {
      return;
    }
    if (!pledged) {
      Alert.alert(Strings.APPLY_PLEDGE_REQUIRED);
      return;
    }
    const userId = await Preference.get('userId');
    const action = await dispatch(applyToCampaign({ campaignId: campaign.id, userId }));
    // thunk 실패 시 완료 알럿을 띄우지 않는다
    if (action?.error) {
      Alert.alert(Strings.RETRY_GUIDELINES);
      return;
    }
    // 시딩 인스턴스 생성 (상태머신 시작점)
    await upsertSeeding(campaign.id, { pledgeChecked: true, appealText: appeal.trim() });
    await setSeedingStatus(campaign.id, SEEDING_STATUS.APPLIED);
    Alert.alert(Strings.CAMPAIGN_APPLIED);
  };

  const onUpload = async () => {
    if (await guardGuest()) {
      return;
    }
    // FGI 설문 미완료 시 설문부터 (업로드는 설문 완료 화면에서 이어짐)
    const { getSeedings } = require('../../api/seedings');
    const seedings = await getSeedings();
    if (!seedings[campaign.id]?.fgiSurvey) {
      navigation.navigate('FgiSurvey', { campaign });
      return;
    }
    navigation.navigate('AddingNewVideo', { campaignId: campaign.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.hero} />
        <View style={styles.body}>
          <Text style={styles.brand}>{campaign.brand}</Text>
          <Text style={styles.title}>{campaign.title}</Text>
          <Text style={styles.meta}>
            {Strings.CAMPAIGN_REMAINING(campaign.remaining)} ·{' '}
            {(campaign.countries || []).join(' · ')} · +{points}P
          </Text>
          <Text style={styles.approvalNote}>{Strings.APPLY_AVG_APPROVAL}</Text>

          {Array.isArray(campaign.contentGuide) && campaign.contentGuide.length > 0 ? (
            <View style={styles.guideBox}>
              {campaign.contentGuide.map((g) => (
                <Text key={g} style={styles.guideItem}>
                  · {g}
                </Text>
              ))}
            </View>
          ) : null}

          {!applied ? (
            <>
              <TextInput
                style={styles.appealInput}
                placeholder={Strings.APPLY_APPEAL_PLACEHOLDER}
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                maxLength={100}
                value={appeal}
                onChangeText={setAppeal}
              />
              <TouchableOpacity style={styles.pledgeRow} onPress={() => setPledged(!pledged)}>
                <View style={[styles.checkbox, pledged && styles.checkboxOn]}>
                  {pledged ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.pledgeText}>{Strings.APPLY_PLEDGE}</Text>
              </TouchableOpacity>
              <Text style={styles.honestyNote}>{Strings.APPLY_HONESTY_NOTE}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {applied ? (
          <TouchableOpacity style={[styles.cta, styles.ctaSecondary]} onPress={onUpload}>
            <Text style={styles.ctaText}>{Strings.UPLOAD_REVIEW_CTA}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.cta, !pledged && styles.ctaDisabled]}
            onPress={onApply}
          >
            <Text style={styles.ctaText}>{Strings.CAMPAIGN_APPLY}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  hero: { width: '100%', height: 220, backgroundColor: '#eee' },
  body: { padding: 16 },
  brand: { fontSize: 13, color: Constants.TIER_COLORS.OPERATOR },
  title: {
    fontSize: 20,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    marginVertical: 6,
  },
  meta: { fontSize: 13, color: Constants.TIER_COLORS.STRIVER },
  approvalNote: { fontSize: 12, color: '#1c7c31', marginTop: 6, fontWeight: '600' },
  guideBox: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
  },
  guideItem: { fontSize: 13, color: Constants.TIER_COLORS.ARTISAN, lineHeight: 21 },
  appealInput: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
    backgroundColor: '#fff',
    color: Constants.TIER_COLORS.ARTISAN,
  },
  pledgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#bbb',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: Constants.COLOR_MAIN, borderColor: Constants.COLOR_MAIN },
  checkboxMark: { fontSize: 14, fontWeight: '900', color: '#16130d' },
  pledgeText: { flex: 1, fontSize: 13.5, color: Constants.TIER_COLORS.ARTISAN, lineHeight: 20 },
  honestyNote: { fontSize: 12, color: Constants.TIER_COLORS.STRIVER, marginTop: 10, lineHeight: 18 },
  ctaDisabled: { opacity: 0.45 },
  footer: { padding: 16 },
  cta: {
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaSecondary: { backgroundColor: Constants.COLOR_POINT_BLUE },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#16130d' },
});
