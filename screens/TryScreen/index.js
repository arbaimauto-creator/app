import React, { useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import {
  fetchCampaigns,
  selectCampaigns,
  selectMyApplications,
} from '../../slices/campaign';

function CampaignCard({ campaign, applied, onPress }) {
  const closed = campaign.status !== 'open' || campaign.remaining <= 0;
  const deadline = campaign.deadline ? campaign.deadline.slice(5, 10).replace('-', '/') : '';
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress} disabled={closed}>
      <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.thumb} />
      <View style={styles.cardBody}>
        <Text style={styles.brand}>{campaign.brand}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>
        <Text style={styles.meta}>
          {Strings.CAMPAIGN_REMAINING(campaign.remaining)} · {Strings.CAMPAIGN_DEADLINE(deadline)}
        </Text>
        <Text style={styles.countries}>{campaign.countries.join(' · ')}</Text>
      </View>
      <View style={[styles.badge, closed ? styles.badgeClosed : applied ? styles.badgeApplied : null]}>
        <Text style={styles.badgeText}>
          {closed ? Strings.CAMPAIGN_CLOSED : applied ? Strings.CAMPAIGN_APPLIED : `+${campaign.rewardPoint}P`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TryScreen({ navigation }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const applications = useSelector(selectMyApplications);
  const loading = useSelector((s) => s.campaign.loading);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{Strings.TRY_TAB}</Text>
      <FlatList
        data={campaigns}
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
            onPress={() => navigation.navigate('CampaignDetail', { campaign: item })}
          />
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#eee' },
  cardBody: { flex: 1, marginLeft: 12, marginRight: 8 },
  brand: { fontSize: 12, color: Constants.TIER_COLORS.OPERATOR },
  title: { fontSize: 15, fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5, marginVertical: 2 },
  meta: { fontSize: 12, color: Constants.TIER_COLORS.STRIVER },
  countries: { fontSize: 11, color: Constants.TIER_COLORS.OPERATOR, marginTop: 2 },
  badge: {
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeApplied: { backgroundColor: Constants.COLOR_POINT_BLUE },
  badgeClosed: { backgroundColor: '#bbb' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#16130d' },
  empty: { textAlign: 'center', marginTop: 60, color: Constants.TIER_COLORS.STRIVER },
});
