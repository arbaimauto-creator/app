import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Preference from 'react-native-default-preference';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { applyToCampaign, selectMyApplications } from '../../slices/campaign';
import { isGuestUser, LogoutAlert } from '../../Components/utils';

export default function CampaignDetail({ route, navigation }) {
  const { campaign } = route.params;
  const dispatch = useDispatch();
  const applications = useSelector(selectMyApplications);
  const applied = applications[campaign.id] != null;

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
    const userId = await Preference.get('userId');
    const action = await dispatch(applyToCampaign({ campaignId: campaign.id, userId }));
    // thunk 실패 시 완료 알럿을 띄우지 않는다
    if (action?.error) {
      Alert.alert(Strings.RETRY_GUIDELINES);
      return;
    }
    Alert.alert(Strings.CAMPAIGN_APPLIED);
  };

  const onUpload = async () => {
    if (await guardGuest()) {
      return;
    }
    navigation.navigate('AddingNewVideo', {});
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
            {campaign.countries.join(' · ')} · +{campaign.rewardPoint}P
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {applied ? (
          <TouchableOpacity style={[styles.cta, styles.ctaSecondary]} onPress={onUpload}>
            <Text style={styles.ctaText}>{Strings.UPLOAD_REVIEW_CTA}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cta} onPress={onApply}>
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
