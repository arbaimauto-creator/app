import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns, selectMyApplications } from '../../slices/campaign';
import { getCreatorProfile } from '../../api/creators';
import { personalizedPoints, CURATED_MIN_G } from './points';

// v2 §4-1: Open/Curated 2-트랙. Curated 미달은 숨기지 말고 잠가서 보여준다.
function CampaignCard({ campaign, applied, gScore, completedCount, onPress }) {
  const closed = campaign.status !== 'open' || campaign.remaining <= 0;
  const isCurated = campaign.track === 'curated';
  const curatedUnlocked = gScore >= CURATED_MIN_G || completedCount >= 2;
  const locked = isCurated && !curatedUnlocked;
  const deadline = campaign.deadline ? campaign.deadline.slice(5, 10).replace('-', '/') : '';
  const points = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);
  const bonus = points - (campaign.basePoints ?? campaign.rewardPoint);

  return (
    <TouchableOpacity
      style={[styles.card, locked && styles.cardLocked]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={closed || locked}
    >
      <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.thumb} />
      <View style={styles.cardBody}>
        <View style={styles.trackRow}>
          <Text style={[styles.trackTag, isCurated ? styles.trackCurated : styles.trackOpen]}>
            {isCurated ? 'Curated' : 'Open'}
          </Text>
          {!isCurated && !closed ? (
            <Text style={styles.firstCome}>
              {Strings.CAMPAIGN_FIRST_COME(campaign.remaining)}
            </Text>
          ) : null}
        </View>
        <Text style={styles.brand}>{campaign.brand}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>
        <Text style={styles.meta}>
          {Strings.CAMPAIGN_REMAINING(campaign.remaining)} · {Strings.CAMPAIGN_DEADLINE(deadline)}
        </Text>
        <Text style={styles.countries}>{campaign.countries.join(' · ')}</Text>
        {locked ? (
          <Text style={styles.lockHint}>{Strings.CURATED_LOCKED_HINT(CURATED_MIN_G)}</Text>
        ) : null}
      </View>
      <View
        style={[styles.badge, closed ? styles.badgeClosed : applied ? styles.badgeApplied : null]}
      >
        <Text style={styles.badgeText}>
          {closed ? Strings.CAMPAIGN_CLOSED : applied ? Strings.CAMPAIGN_APPLIED : `+${points}P`}
        </Text>
        {!closed && !applied && bonus > 0 ? (
          <Text style={styles.bonusText}>+{bonus}P</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function TryScreen({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const applications = useSelector(selectMyApplications);
  const loading = useSelector((s) => s.campaign.loading);
  const [gScore, setGScore] = useState(50);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  // 완주/평가로 G-스코어가 바뀔 수 있으므로 포커스마다 갱신
  useFocusEffect(
    useCallback(() => {
      getCreatorProfile().then((profile) => {
        if (profile) {
          setGScore(profile.gScore ?? 50);
          setCompletedCount(profile.completedCount ?? 0);
        }
      });
    }, []),
  );

  // Open 캠페인 최상단 고정 (v2 §3-④)
  const sorted = [...campaigns].sort((a, b) => {
    const aOpen = a.track !== 'curated' ? 0 : 1;
    const bOpen = b.track !== 'curated' ? 0 : 1;
    return aOpen - bOpen;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{Strings.TRY_TAB}</Text>
        <Text style={styles.gScore}>G{gScore}</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchCampaigns())} />
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>{Strings.NO_CAMPAIGNS}</Text> : null
        }
        renderItem={({ item }) => (
          <CampaignCard
            campaign={item}
            applied={applications[item.id] != null}
            gScore={gScore}
            completedCount={completedCount}
            onPress={() => navigation.navigate('CampaignDetail', { campaign: item })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    fontSize: 24,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  gScore: {
    fontSize: 15,
    fontWeight: '800',
    color: Constants.COLOR_MAIN,
    backgroundColor: '#26231d',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  cardLocked: { opacity: 0.55 },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#eee' },
  cardBody: { flex: 1, marginLeft: 12, marginRight: 8 },
  trackRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  trackTag: {
    fontSize: 10.5,
    fontWeight: '800',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    overflow: 'hidden',
    marginRight: 6,
  },
  trackOpen: { backgroundColor: '#e2f5e5', color: '#1c7c31' },
  trackCurated: { backgroundColor: '#f1eafc', color: '#6b3fc9' },
  firstCome: { fontSize: 10.5, color: '#1c7c31', fontWeight: '600' },
  brand: { fontSize: 12, color: Constants.TIER_COLORS.OPERATOR },
  title: { fontSize: 15, fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5, marginVertical: 2 },
  meta: { fontSize: 12, color: Constants.TIER_COLORS.STRIVER },
  countries: { fontSize: 11, color: Constants.TIER_COLORS.OPERATOR, marginTop: 2 },
  lockHint: { fontSize: 11.5, color: '#6b3fc9', marginTop: 4, fontWeight: '600' },
  badge: {
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  badgeApplied: { backgroundColor: '#d9d6cf' },
  badgeClosed: { backgroundColor: '#bbb' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#16130d' },
  bonusText: { fontSize: 10, fontWeight: '800', color: '#1c7c31', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 60, color: Constants.TIER_COLORS.STRIVER },
});
