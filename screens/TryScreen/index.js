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
import Strings from '../../Components/Strings';
import T from '../../Components/Constants/DesignTokens';
import { Card, Badge, NoteBox } from '../../Components/UI';
import { fetchCampaigns, selectCampaigns, selectMyApplications } from '../../slices/campaign';
import { getCreatorProfile } from '../../api/creators';
import { personalizedPoints, CURATED_MIN_G } from './points';

const { COLORS, TYPE } = T;

// v2 §4-1: Open/Curated 2-트랙. Curated 미달은 숨기지 말고 잠가서 보여준다.
function CampaignCard({ campaign, applied, gScore, completedCount, onPress }) {
  const closed = campaign.status !== 'open' || campaign.remaining <= 0;
  const isCurated = campaign.track === 'curated';
  const curatedUnlocked = gScore >= CURATED_MIN_G || completedCount >= 2;
  const locked = isCurated && !curatedUnlocked;
  const deadline = campaign.deadline ? campaign.deadline.slice(5, 10).replace('-', '/') : '';
  const points = personalizedPoints(campaign.basePoints ?? campaign.rewardPoint, gScore);
  const bonus = points - (campaign.basePoints ?? campaign.rewardPoint);

  const trackBadge = isCurated
    ? { tone: 'curated', text: locked ? '🔒 Curated' : 'Curated' }
    : {
        tone: 'open',
        text: !closed ? `Open · ${Strings.CAMPAIGN_FIRST_COME(campaign.remaining)}` : 'Open',
      };
  const pointBadge = closed
    ? { tone: 'curated', text: Strings.CAMPAIGN_CLOSED }
    : applied
      ? { tone: 'curated', text: Strings.CAMPAIGN_APPLIED }
      : { tone: locked ? 'curated' : 'amber', text: `+${points}P` };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={closed || locked}>
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Badge tone={trackBadge.tone} text={trackBadge.text} />
          <Text style={styles.xs}>{Strings.CAMPAIGN_DEADLINE(deadline)}</Text>
        </View>
        <View style={styles.midRow}>
          <FastImage source={{ uri: campaign.thumbnailUrl }} style={styles.thumb} />
          <View style={styles.midBody}>
            <Text style={styles.brand}>{campaign.brand}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {campaign.title}
            </Text>
            <Text style={styles.xs} numberOfLines={1}>
              {Strings.CAMPAIGN_REMAINING(campaign.remaining)} · {campaign.countries.join(' · ')}
            </Text>
          </View>
        </View>
        <View style={styles.pointRow}>
          <Badge tone={pointBadge.tone} text={pointBadge.text} />
          {!closed && !applied && bonus > 0 ? (
            <Text style={styles.bonusText}>+{bonus}P</Text>
          ) : null}
        </View>
        {locked ? (
          <NoteBox
            tone="amber"
            style={styles.lockNote}
            text={Strings.CURATED_LOCKED_HINT(CURATED_MIN_G)}
          />
        ) : null}
      </Card>
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
        <Badge tone="amber" text={`G${gScore}`} />
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { ...TYPE.H_TITLE },
  listContent: { padding: 16 },
  card: { marginBottom: 11 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xs: { ...TYPE.XS },
  midRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.TRACK,
  },
  midBody: { flex: 1, marginLeft: 11 },
  brand: { ...TYPE.XS, marginBottom: 1 },
  title: { ...TYPE.CARD_TITLE },
  pointRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9, gap: 8 },
  bonusText: { ...TYPE.XS, fontFamily: T.FONT.ExtraBold, color: COLORS.GREEN },
  lockNote: { marginTop: 9 },
  empty: { ...TYPE.SUB, textAlign: 'center', marginTop: 60 },
});
