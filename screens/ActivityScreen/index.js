import React, { useEffect } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns, selectMyApplications } from '../../slices/campaign';

const STATUS_LABEL = {
  applied: Strings.CAMPAIGN_STATUS_APPLIED,
  approved: Strings.CAMPAIGN_STATUS_APPROVED,
  shipped: Strings.CAMPAIGN_STATUS_SHIPPED,
  reviewing: Strings.CAMPAIGN_STATUS_REVIEWING,
  done: Strings.CAMPAIGN_STATUS_DONE,
};

export default function ActivityScreen() {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const applications = useSelector(selectMyApplications);
  const totalReward = useSelector((s) => s.user.totalReward);

  // Try 탭을 거치지 않고 진입해도 미션 목록이 비지 않도록 직접 조회한다
  useEffect(() => {
    if (campaigns.length === 0) {
      dispatch(fetchCampaigns());
    }
    // 최초 진입 시 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const missions = campaigns
    .filter((c) => applications[c.id] != null)
    .map((c) => ({ ...c, missionStatus: applications[c.id] }));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{Strings.ACTIVITY_TAB}</Text>
      <View style={styles.pointCard}>
        <Text style={styles.pointLabel}>Point</Text>
        <Text style={styles.pointValue}>{totalReward ?? 0}P</Text>
      </View>
      <Text style={styles.section}>{Strings.MY_MISSIONS}</Text>
      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>{Strings.NO_CAMPAIGNS}</Text>}
        renderItem={({ item }) => (
          <View style={styles.mission}>
            <Text style={styles.missionTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.missionStatus}>{STATUS_LABEL[item.missionStatus] || item.missionStatus}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  header: {
    fontSize: 24,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pointCard: {
    margin: 16,
    padding: 18,
    borderRadius: 14,
    backgroundColor: Constants.COLOR_MAIN,
  },
  pointLabel: { fontSize: 12, fontWeight: '700', color: '#16130d', opacity: 0.7 },
  pointValue: { fontSize: 28, fontWeight: '900', color: '#16130d' },
  section: {
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  mission: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  missionTitle: { flex: 1, fontSize: 14, marginRight: 10 },
  missionStatus: { fontSize: 12, fontWeight: '700', color: Constants.COLOR_POINT_BLUE },
  empty: { textAlign: 'center', marginTop: 40, color: Constants.TIER_COLORS.STRIVER },
});
