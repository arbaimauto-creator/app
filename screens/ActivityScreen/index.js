import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  FlatList,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FEATURES from '../../Components/Constants/Features';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Preference from 'react-native-default-preference';
import T from '../../Components/Constants/DesignTokens';
import { Card, GlowCard, Btn, Badge, StatusPill, ProgressBar, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';
import { fetchCampaigns, selectCampaigns } from '../../slices/campaign';
import { getSeedings, setSeedingStatus, upsertSeeding, SEEDING_STATUS } from '../../api/seedings';
import { seedingStatusLabel, ONGOING_STATUSES, gProgressRatio } from '../../api/statusModel';
import { logEvent } from '../../api/common/analytics';
import { getCreatorProfile, refreshServerStats, saveCreatorProfile } from '../../api/creators';
import { getMyConsents, pendingConsents } from '../../api/consents';
import { EMPTY_INCENTIVES, getMyIncentives, hasAnyIncentiveActivity } from '../../api/incentives';
import { opsFgiCheckIn } from '../../api/opsBridge';
import { referralCodesFor } from '../../api/referral';
import {
  personalizedPoints,
  gradeMultiplier,
  G_DELTA,
  GRACE_MULTIPLIER,
  CURATED_MIN_G,
} from '../TryScreen/points';
import { daysLeft, isInGrace, isNoShowDue, addressHoursLeft, EXTENSION_DAYS } from './missionLogic';
import { isFgiEnabled } from '../../api/campaignMeta';
import AddressModal from './AddressModal';
import { scheduleUploadReminders, cancelUploadReminders } from './reminders';
import { opsAddress, opsCancel, opsReceived } from '../../api/opsBridge';
import { flush as flushOpsOutbox } from '../../api/opsOutbox';

const { COLORS, RADIUS, FONT, LATIN, TYPE } = T;

// 운영 수동 전이(승인·발송)를 에뮬레이터에서 확인하기 위한 개발 전용 시뮬 버튼
const DEV_NEXT = {
  [SEEDING_STATUS.APPLIED]: SEEDING_STATUS.APPROVED,
  // 운영이 운송장을 넣으면 넘어가는 단계 — 앱에서 수령 버튼을 보려면 여기까지 와야 한다
  [SEEDING_STATUS.APPROVED]: SEEDING_STATUS.SHIPPED,
  [SEEDING_STATUS.SHIPPED]: null, // 수령은 사용자 버튼
  [SEEDING_STATUS.REVIEWING]: SEEDING_STATUS.DONE,
};

// 시안 24: 진행/완료 세그먼트 분류 기준 — api/statusModel ONGOING_STATUSES (단일 출처)

export default function ActivityScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const campaignLoading = useSelector((s) => s.campaign.loading);
  const campaignError = useSelector((s) => s.campaign.error);
  const [seedings, setSeedings] = useState({});
  const [loadFailed, setLoadFailed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [addressFor, setAddressFor] = useState(null); // campaignId | null
  const [tab, setTab] = useState('ongoing'); // 시안 24: 'ongoing' | 'done'
  const receiveLocksRef = useRef(new Set());
  const actionLocksRef = useRef(new Set());

  const [bonusPoints, setBonusPoints] = useState(0);

  // 2차 가공 요청 (2026-09-16) — 브랜드가 리뷰 재활용을 요청하면 여기 카드로 뜬다.
  // 서버가 조용히 실패해도 빈 배열이라 화면은 그대로 뜬다.
  const [consents, setConsents] = useState([]);
  const [incentives, setIncentives] = useState(EMPTY_INCENTIVES);
  const loadConsents = useCallback(async () => {
    const [c, inc] = await Promise.all([getMyConsents(), getMyIncentives()]);
    setConsents(c);
    setIncentives(inc);
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadConsents();
    }, [loadConsents]),
  );

  // 수령 후 D+16 미업로드 → no_show(Strike). 서버 스냅샷·로컬 어느 쪽이든 한 번만 적용한다.
  // 이게 없으면 만료 미션이 영원히 "진행 중"으로 남아 동시 한도를 차지한다.
  const applyNoShows = useCallback(async (all) => {
    let changed = false;
    for (const seeding of Object.values(all)) {
      if (seeding.status === SEEDING_STATUS.RECEIVED && isNoShowDue(seeding)) {
        await setSeedingStatus(seeding.campaignId, SEEDING_STATUS.NO_SHOW);
        try {
          cancelUploadReminders(seeding.campaignId);
        } catch (e) {
          // 알림 취소 실패는 상태 전이를 막지 않는다
        }
        const current = await getCreatorProfile().catch(() => null);
        if (current && !(current.strikedCampaignIds || []).includes(seeding.campaignId)) {
          await saveCreatorProfile({
            ...current,
            strikes: (current.strikes ?? 0) + 1,
            gScore: Math.max(0, (current.gScore ?? 50) + G_DELTA.STRIKE),
            strikedCampaignIds: [...(current.strikedCampaignIds || []), seeding.campaignId],
          });
        }
        logEvent('no_show_applied', { campaign_id: seeding.campaignId });
        changed = true;
      }
    }
    return changed;
  }, []);

  // 서버에서 received가 내려온 경우(ops DELIVERED)엔 수령 탭 경로를 거치지 않아 리마인더가
  // 예약되지 않는다. 플래그로 1회만 예약한다.
  const ensureReminders = useCallback(async (all, byId) => {
    for (const seeding of Object.values(all)) {
      if (
        seeding.status === SEEDING_STATUS.RECEIVED &&
        seeding.receivedAt &&
        !seeding.remindersScheduledAt
      ) {
        try {
          scheduleUploadReminders(
            seeding.campaignId,
            byId[seeding.campaignId]?.title || '',
            seeding.receivedAt,
            !!seeding.extensionUsed,
          );
        } catch (e) {
          // 알림 예약 실패는 무시
        }
        await upsertSeeding(seeding.campaignId, {
          remindersScheduledAt: new Date().toISOString(),
        });
      }
    }
  }, []);

  const reload = useCallback(() => {
    getSeedings()
      .then(async (all) => {
        setLoadFailed(false);
        const byId = Object.fromEntries(campaigns.map((c) => [c.id, c]));
        await ensureReminders(all, byId);
        if (await applyNoShows(all)) {
          all = await getSeedings();
        }
        setSeedings(all);
      })
      .catch(() => setLoadFailed(true));
    getCreatorProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
    // 온보딩 완료 보상 +50P (v2 §3-③) — mock: 로컬 합산
    Preference.get('onboardingBonusGranted')
      .then((v) => setBonusPoints(v === 'true' ? 50 : 0))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns.length]);

  useFocusEffect(
    useCallback(() => {
      if (campaigns.length === 0) {
        dispatch(fetchCampaigns());
      }
      reload();
      flushOpsOutbox();
      // 신청 완료 화면의 "배송지 입력" CTA 딥링크. 중첩 navigate params({screen, params})는
      // 커스텀 탭 내비게이터(MyMaterialBottomTabNavigator)와 조합 시 StackNavigator가
      // 무한 재디스패치(Maximum update depth)에 빠지고 param도 도착하지 않아,
      // Preference 1회성 핸드오프로 전달한다.
      Preference.get('pendingAddressFor')
        .then((requestedCampaignId) => {
          if (!requestedCampaignId) {
            return;
          }
          getSeedings()
            .then((saved) => {
              const target = saved[requestedCampaignId];
              if (target?.status === SEEDING_STATUS.APPROVED && !target?.address) {
                // 모달을 실제로 열 때만 핸드오프를 소모한다 — 승인 동기화가 늦으면 다음 포커스에서 다시 시도
                Preference.set('pendingAddressFor', '');
                setAddressFor(requestedCampaignId);
              } else if (target?.address || !target || target.status !== SEEDING_STATUS.APPLIED) {
                Preference.set('pendingAddressFor', '');
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
      // 마운트 시 1회 + 포커스마다
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, campaigns.length]),
  );

  const campaignById = Object.fromEntries(campaigns.map((c) => [c.id, c]));
  const missions = Object.values(seedings)
    .filter((s) => campaignById[s.campaignId])
    .sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
  const ongoingMissions = missions.filter((s) => ONGOING_STATUSES.includes(s.status));
  const doneMissions = missions.filter((s) => !ONGOING_STATUSES.includes(s.status));
  const shownMissions = tab === 'ongoing' ? ongoingMissions : doneMissions;

  const gScore = profile?.gScore ?? 50;
  // 포인트(P)와 레거시 리워드(R, 통화)는 단위가 다르다 — P에는 rewardPoints만 합산한다.
  const points = (profile?.rewardPoints ?? 0) + bonusPoints;

  const onReceive = async (campaignId) => {
    if (
      receiveLocksRef.current.has(campaignId) ||
      seedings[campaignId]?.status !== SEEDING_STATUS.SHIPPED
    ) {
      return;
    }
    receiveLocksRef.current.add(campaignId);
    const prev = seedings[campaignId];
    let all;
    try {
      all = await setSeedingStatus(campaignId, SEEDING_STATUS.RECEIVED);
    } catch (e) {
      receiveLocksRef.current.delete(campaignId);
      Alert.alert(Strings.RETRY_GUIDELINES);
      return;
    }
    setSeedings(all);
    // 수령 확인 = 리마인더 시퀀스 시작 (D+7/D-3/D-1/마감/유예)
    const s = all[campaignId];
    // 이벤트 맵: 북극성 분모 — 배송 리드타임 분포의 원천
    logEvent('received_confirm', {
      campaign_id: campaignId,
      days_since_shipped: prev?.shippedAt
        ? Math.round((Date.now() - new Date(prev.shippedAt).getTime()) / 86400000)
        : -1,
    });
    try {
      scheduleUploadReminders(
        campaignId,
        campaignById[campaignId]?.title || '',
        s.receivedAt,
        false,
      );
    } catch (e) {
      // 수령 상태 저장이 정본이다. 알림 예약 실패로 수령을 되돌리지 않는다.
    }
    upsertSeeding(campaignId, { remindersScheduledAt: new Date().toISOString() }).catch(() => {});
    // Phase 1.5: ops Shipment DELIVERED 미러링
    opsReceived(campaignId);
    // 시안 22: 알림 가치가 가장 높은 순간(리마인더 시작 직후)에만 권한 컨텍스트 프롬프트 (Android 13+, 1회)
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const shown = await Preference.get('notifPromptShown');
        if (shown !== 'true') {
          // "나중에"는 다음 수령 때 다시 묻는다. 허용을 눌렀을 때만 완료로 기록한다.
          Alert.alert(Strings.ACT_NOTIF_TITLE, Strings.ACT_NOTIF_BODY, [
            {
              text: Strings.ACT_NOTIF_LATER,
              style: 'cancel',
              onPress: () => logEvent('noti_permission_prompt', { result: 'later' }),
            },
            {
              text: Strings.ACT_NOTIF_ALLOW,
              onPress: () => {
                logEvent('noti_permission_prompt', { result: 'allow' });
                PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
                  .then((granted) => {
                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                      Preference.set('notifPromptShown', 'true');
                    }
                  })
                  .catch(() => {});
              },
            },
          ]);
        }
      }
    } catch (e) {
      // 권한 프롬프트 실패는 수령 및 첫인상 흐름을 막지 않는다.
    }
    reload();
    // D27: 개봉 직후에만 잡히는 데이터 — 첫인상 30초 설문 (스킵 가능)
    const campaign = campaignById[campaignId];
    if (campaign) {
      navigation.navigate('FirstImpression', { campaign });
    }
    receiveLocksRef.current.delete(campaignId);
  };

  // 시안 23: 발송 전(applied/approved) 무페널티 취소
  const onCancel = (campaignId) => {
    Alert.alert(Strings.ACT_CANCEL_TITLE, Strings.ACT_CANCEL_BODY, [
      { text: Strings.ACT_CANCEL_KEEP, style: 'cancel' },
      {
        text: Strings.ACT_CANCEL_CONFIRM,
        style: 'destructive',
        onPress: async () => {
          if (actionLocksRef.current.has(campaignId)) {
            return;
          }
          actionLocksRef.current.add(campaignId);
          try {
            // 확인 다이얼로그가 떠 있는 동안 발송으로 넘어갔을 수 있다 — 쓰기 직전에 재확인
            const latest = (await getSeedings())[campaignId];
            if (
              latest?.status !== SEEDING_STATUS.APPLIED &&
              latest?.status !== SEEDING_STATUS.APPROVED
            ) {
              reload();
              return;
            }
            logEvent('cancel_confirm', {
              campaign_id: campaignId,
              status_at_cancel: latest.status,
            });
            const all = await setSeedingStatus(campaignId, SEEDING_STATUS.CANCELLED);
            setSeedings(all);
            // ops 미러링은 아웃박스가 재시도한다 — 로컬 취소는 이미 확정됐으니 실패를 사용자 오류로 보이지 않는다
            opsCancel(campaignId).catch(() => {});
            reload();
          } catch (e) {
            Alert.alert(Strings.RETRY_GUIDELINES);
          } finally {
            actionLocksRef.current.delete(campaignId);
          }
        },
      },
    ]);
  };

  const onExtend = async (seeding) => {
    if (seeding.extensionUsed || actionLocksRef.current.has(seeding.campaignId)) {
      return;
    }
    actionLocksRef.current.add(seeding.campaignId);
    try {
      logEvent('extension_use', { campaign_id: seeding.campaignId });
      const all = await upsertSeeding(seeding.campaignId, { extensionUsed: true });
      setSeedings(all);
      // 연장된 마감 기준으로 리마인더 재스케줄
      try {
        scheduleUploadReminders(
          seeding.campaignId,
          campaignById[seeding.campaignId]?.title || '',
          seeding.receivedAt,
          true,
        );
      } catch (e) {
        // 연장 상태는 저장됐으므로 알림 재예약 실패만 무시한다.
      }
      Alert.alert(Strings.EXTENSION_GRANTED(EXTENSION_DAYS));
      reload();
    } catch (e) {
      Alert.alert(Strings.RETRY_GUIDELINES);
    } finally {
      actionLocksRef.current.delete(seeding.campaignId);
    }
  };

  const onUpload = (campaignId) => {
    // FGI 설문(구매의향·가격·경쟁력 + 정성)이 업로드보다 먼저다 — 리포트 데이터 원천
    const seeding = seedings[campaignId];
    const campaign = campaignById[campaignId];
    // 기획서 §2.1: FGI는 캠페인별 선택형 — 꺼진 캠페인은 설문 없이 바로 업로드
    if (!seeding?.fgiSurvey && campaign && isFgiEnabled(campaign)) {
      navigation.navigate('FgiSurvey', { campaign });
      return;
    }
    navigation.navigate('ReviewLinkSubmit', { campaignId });
  };

  const onSubmitAddress = async (address) => {
    await upsertSeeding(addressFor, { address });
    setAddressFor(null);
    opsAddress(addressFor, address).catch(() => {});
    reload();
  };

  // 시안 16: 완주 리포트 화면 이동 params (devAdvance 전이 직후·완료 카드 재진입 공용)
  const openMissionDone = (seeding, campaign, gBefore, gAfter) => {
    const grace = isInGrace(seeding);
    const base = personalizedPoints(campaign?.basePoints ?? 0, gBefore);
    // 서버에서 done이 내려온 시딩은 지급 스냅샷이 없다 — 현재 값으로 지어내지 않고 "확정 중"으로 표시
    const hasSnapshot = seeding.pointsGranted != null;
    const granted = hasSnapshot ? seeding.pointsGranted : null;
    navigation.navigate('MissionDone', {
      pointsGranted: granted,
      basePoints: seeding.basePointsAtCompletion ?? campaign?.basePoints ?? 0,
      multiplier: seeding.multiplierAtCompletion ?? gradeMultiplier(gBefore),
      gBefore: seeding.gBefore ?? gBefore,
      gAfter: seeding.gAfter ?? gAfter,
      brandName: campaign?.brand,
      handleUrl: profile?.handleUrl,
    });
  };

  // 개발용 운영 시뮬: 다음 상태로 전이 + done 시 보상/G-스코어 반영
  const devAdvance = async (seeding) => {
    // 릴리스 번들로 실기기/에뮬 검증할 때도 운영 전이(승인·발송)를 흉내 내야 한다.
    // TEST_GUEST_ENTRY가 켜진 테스트 빌드에서만 열리고, 스토어 배포 시 함께 닫힌다.
    if (!__DEV__) {
      return;
    }
    // 프로필이 없으면(로드 실패·진행 중) 보상 계산이 G50 기준으로 덮어써진다 — 중단
    if (profile == null || actionLocksRef.current.has(seeding.campaignId)) {
      return;
    }
    const next =
      seeding.status === SEEDING_STATUS.RECEIVED
        ? SEEDING_STATUS.REVIEWING
        : DEV_NEXT[seeding.status];
    if (!next) {
      return;
    }
    actionLocksRef.current.add(seeding.campaignId);
    try {
      if (next !== SEEDING_STATUS.DONE) {
        await setSeedingStatus(seeding.campaignId, next);
      }
      if (next === SEEDING_STATUS.REVIEWING) {
        cancelUploadReminders(seeding.campaignId);
      }
      if (next === SEEDING_STATUS.DONE) {
        const campaign = campaignById[seeding.campaignId];
        const grace = isInGrace(seeding);
        const base = personalizedPoints(campaign?.basePoints ?? 0, gScore);
        const granted = Math.round(base * (grace ? GRACE_MULTIPLIER : 1));
        const completedCampaignIds = profile?.completedCampaignIds ?? [];
        const alreadyGranted = completedCampaignIds.includes(seeding.campaignId);
        const nextProfile = alreadyGranted
          ? profile
          : {
              ...(profile || {}),
              gScore: gScore + (grace ? G_DELTA.GRACE_COMPLETE : G_DELTA.COMPLETE),
              completedCount: (profile?.completedCount ?? 0) + 1,
              rewardPoints: (profile?.rewardPoints ?? 0) + granted,
              completedCampaignIds: [...completedCampaignIds, seeding.campaignId],
            };
        if (!alreadyGranted) {
          await saveCreatorProfile(nextProfile);
          refreshServerStats(); // 서버 지급분과 수렴하도록 캐시 무효화
        }
        const completedSeedings = await setSeedingStatus(seeding.campaignId, next);
        const withReward = await upsertSeeding(seeding.campaignId, {
          pointsGranted: alreadyGranted ? (seeding.pointsGranted ?? granted) : granted,
          basePointsAtCompletion: campaign?.basePoints ?? 0,
          multiplierAtCompletion: gradeMultiplier(gScore),
          gBefore: alreadyGranted ? (seeding.gBefore ?? gScore) : gScore,
          gAfter: alreadyGranted
            ? (seeding.gAfter ?? nextProfile?.gScore ?? gScore)
            : nextProfile.gScore,
          doneAt: completedSeedings[seeding.campaignId].doneAt,
        });
        // 시안 16: 완주 보상 리포트로 즉시 연결
        openMissionDone(
          withReward[seeding.campaignId],
          campaign,
          gScore,
          nextProfile?.gScore ?? gScore,
        );
      }
      reload();
    } finally {
      actionLocksRef.current.delete(seeding.campaignId);
    }
  };

  const renderMission = ({ item: seeding }) => {
    const campaign = campaignById[seeding.campaignId];
    const left = daysLeft(seeding);
    const grace = isInGrace(seeding);
    const noShowDue = isNoShowDue(seeding);
    const label = seedingStatusLabel(seeding.status);

    return (
      <Card
        style={[
          styles.mission,
          seeding.status === SEEDING_STATUS.CANCELLED && styles.cancelledCard,
        ]}
      >
        {/* 시안: 남은 기한을 카드 맨 위에 D-N으로. 목록을 훑을 때 급한 것부터 보인다.
            3일 이하면 빨강, 유예 중이면 별도 표시. 기한이 없는 단계(신청·검토)는 생략. */}
        {typeof left === 'number' && left >= 0 && !grace ? (
          <Badge tone={left <= 3 ? 'red' : 'curated'} text={`D-${left}`} style={styles.dDayBadge} />
        ) : null}
        <View style={styles.missionHeader}>
          <Text style={styles.missionTitle} numberOfLines={1}>
            {campaign.title}
          </Text>
          <TouchableOpacity onLongPress={() => devAdvance(seeding)}>
            <StatusPill status={seeding.status} label={label} />
          </TouchableOpacity>
        </View>

        {seeding.status === SEEDING_STATUS.APPROVED && !seeding.address ? (
          <>
            <Btn
              title={Strings.ADDRESS_CTA}
              onPress={() => setAddressFor(seeding.campaignId)}
              style={styles.actionGap}
            />
            {addressHoursLeft(seeding) != null ? (
              <Text
                style={[styles.subInfo, addressHoursLeft(seeding) <= 0 ? styles.ddayDanger : null]}
              >
                {addressHoursLeft(seeding) > 0
                  ? Strings.ADDRESS_HOURS_LEFT(addressHoursLeft(seeding))
                  : Strings.ADDRESS_DEADLINE_PASSED}
              </Text>
            ) : null}
          </>
        ) : null}
        {seeding.status === SEEDING_STATUS.APPROVED && seeding.address ? (
          <Text style={styles.subInfo}>{Strings.ADDRESS_SAVED}</Text>
        ) : null}

        {/* FGI 일정·선정·출석 (2026-09-16, 기획서 §5.3 P3) — 세션이 설정된 캠페인만 */}
        {campaign.fgiSession && seeding.status !== SEEDING_STATUS.CANCELLED ? (
          <View style={styles.fgiBox}>
            <Text style={styles.fgiTitle}>
              {Strings.FGI_SESSION_TITLE} ·{' '}
              {campaign.fgiSession.mode === 'OFFLINE' ? Strings.FGI_OFFLINE : Strings.FGI_ONLINE}
            </Text>
            {campaign.fgiSession.at ? (
              <Text style={styles.subInfo}>
                {new Date(campaign.fgiSession.at).toLocaleString()}
              </Text>
            ) : null}
            {campaign.fgiSession.place ? (
              <Text style={styles.subInfo}>{campaign.fgiSession.place}</Text>
            ) : null}
            <Text
              style={[styles.subInfo, seeding.fgiSelection === 'SELECTED' && styles.fgiSelected]}
            >
              {seeding.fgiSelection === 'SELECTED'
                ? Strings.FGI_SELECTED
                : seeding.fgiSelection === 'WAITLIST'
                  ? Strings.FGI_WAITLIST
                  : seeding.fgiSelection === 'REJECTED'
                    ? Strings.FGI_REJECTED
                    : Strings.FGI_SELECTION_PENDING}
            </Text>
            {seeding.fgiNoShowAt ? <Badge tone="red" text={Strings.FGI_NO_SHOW} /> : null}
            {seeding.fgiSelection === 'SELECTED' && !seeding.fgiNoShowAt ? (
              <View style={styles.fgiActions}>
                {campaign.fgiSession.link ? (
                  <Btn
                    variant="ghost"
                    small
                    title={Strings.FGI_JOIN_LINK}
                    onPress={() => Linking.openURL(campaign.fgiSession.link).catch(() => {})}
                  />
                ) : null}
                {seeding.fgiAttendedAt ? (
                  <Badge tone="open" text={Strings.FGI_CHECKED_IN} />
                ) : (
                  <Btn
                    small
                    title={Strings.FGI_CHECK_IN}
                    onPress={async () => {
                      try {
                        const res = await opsFgiCheckIn(seeding.campaignId);
                        await upsertSeeding(seeding.campaignId, { fgiAttendedAt: res?.attendedAt });
                        reload();
                      } catch (e) {
                        const code = e?.body?.error || e?.message;
                        Alert.alert(
                          code === 'too_early'
                            ? Strings.FGI_CHECKIN_WINDOW
                            : Strings.FGI_CHECKIN_FAILED,
                          '',
                          [{ text: Strings.OK }],
                        );
                      }
                    }}
                  />
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 시안 23: 발송 전에는 무페널티 취소 가능 */}
        {seeding.status === SEEDING_STATUS.APPLIED || seeding.status === SEEDING_STATUS.APPROVED ? (
          <Btn
            variant="ghost"
            small
            title={Strings.CANCEL}
            onPress={() => onCancel(seeding.campaignId)}
            style={styles.cancelBtn}
          />
        ) : null}

        {seeding.status === SEEDING_STATUS.SHIPPED ? (
          <>
            {seeding.trackingNo ? (
              <Text style={styles.subInfo}>
                {Strings.TRACKING_NO}: {seeding.trackingNo}
              </Text>
            ) : null}
            <Btn
              title={Strings.RECEIVED_CTA}
              onPress={() => onReceive(seeding.campaignId)}
              style={styles.actionGap}
            />
            <Text style={styles.subInfo}>{Strings.AUTO_RECEIVE_NOTE}</Text>
          </>
        ) : null}

        {seeding.status === SEEDING_STATUS.RECEIVED ? (
          <>
            {grace ? (
              <NoteBox tone="amber" text={Strings.GRACE_NOTE} style={styles.actionGap} />
            ) : (
              <Text
                style={[
                  styles.dday,
                  (left != null && left <= 3) || noShowDue ? styles.ddayDanger : null,
                ]}
              >
                {noShowDue ? Strings.CAMPAIGN_STATUS_NO_SHOW : Strings.DDAY_LEFT(left)}
              </Text>
            )}
            <View style={styles.rowBtns}>
              {!noShowDue ? (
                <Btn
                  title={Strings.UPLOAD_REVIEW_CTA}
                  onPress={() => onUpload(seeding.campaignId)}
                  style={styles.rowBtn}
                />
              ) : null}
              {!seeding.extensionUsed && left != null && left <= 3 && !grace ? (
                <Btn
                  variant="ghost"
                  title={Strings.EXTEND_CTA(EXTENSION_DAYS)}
                  onPress={() => onExtend(seeding)}
                  style={styles.rowBtn}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {seeding.status === SEEDING_STATUS.DONE ? (
          <View style={styles.feedbackCard}>
            {/* 브랜드 평가 데이터는 아직 앱에 내려오지 않는다 — 가짜 별점 대신 확인 상태(원장 pointsGranted)만 정직하게 */}
            <Text style={styles.feedbackText}>
              {seeding.pointsGranted != null
                ? Strings.ACT_BRAND_CONFIRMED(campaign.brand)
                : Strings.ACT_BRAND_REVIEWING(campaign.brand)}
            </Text>
            <Btn
              variant="ghost"
              small
              title={Strings.ACT_FEEDBACK_VIEW_ALL}
              onPress={() => openMissionDone(seeding, campaign, gScore, gScore)}
              style={styles.actionGap}
            />
          </View>
        ) : null}

        {seeding.status === SEEDING_STATUS.CANCELLED ? (
          <Text style={styles.cancelledNote}>{Strings.ACT_CANCELLED_NOTE}</Text>
        ) : null}

        {seeding.status === SEEDING_STATUS.NO_SHOW ? (
          <NoteBox tone="red" text={Strings.STRIKE_WARNING} style={styles.actionGap} />
        ) : null}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{Strings.ACTIVITY_TAB}</Text>
        <Badge tone="amber" text={`${points}P`} />
      </View>

      {/* 시안 24: 진행/완료 세그먼트 */}
      <View style={styles.segWrap}>
        {[
          ['ongoing', Strings.ACT_SEG_ONGOING(ongoingMissions.length)],
          ['done', Strings.ACT_SEG_DONE(doneMissions.length)],
        ].map(([key, segLabel]) => (
          <TouchableOpacity
            key={key}
            style={[styles.segCell, tab === key && styles.segCellOn]}
            onPress={() => setTab(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segText, tab === key && styles.segTextOn]}>{segLabel}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.topRow}>
        {/* 2026-09-16 컨셉: G-스코어 카드는 앰버 글로우 */}
        <GlowCard style={styles.topCard} glow={0.5}>
          <Text style={styles.topLabel}>G-Score</Text>
          <Text style={styles.gValue}>G{gScore}</Text>
          <ProgressBar ratio={gProgressRatio(gScore)} style={styles.gBar} />
          <Text style={styles.topNote}>
            {gScore < CURATED_MIN_G
              ? Strings.G_NEXT_UNLOCK(CURATED_MIN_G - gScore)
              : Strings.G_UNLOCKED}
          </Text>
        </GlowCard>
        <Card style={styles.topCard}>
          <Text style={styles.topLabel}>Point</Text>
          <Text style={styles.pointValue}>{points}P</Text>
          <Text style={styles.topNote}>{Strings.POINT_CASHOUT_NOTE}</Text>
        </Card>
      </View>

      {/* 2차 가공 요청 (2026-09-16) — 동의는 앱에서, 제작·유통은 브랜드·greyd가 한다 */}
      {pendingConsents(consents).length > 0 ? (
        <Card style={styles.consentCard}>
          <Text style={styles.consentTitle}>
            {Strings.CONSENT_CARD_TITLE(pendingConsents(consents).length)}
          </Text>
          <Text style={styles.consentDesc}>{Strings.CONSENT_CARD_DESC}</Text>
          <Btn
            title={Strings.CONSENT_CARD_CTA}
            small
            onPress={() =>
              navigation.navigate('SecondaryUseConsent', {
                consent: pendingConsents(consents)[0],
                onDone: loadConsents,
              })
            }
            style={styles.consentBtn}
          />
        </Card>
      ) : null}

      {/* 내 2차 활용 현황 (2026-09-16 P2·P3) — 가공물·인센티브·공동구매가 하나라도 있으면 */}
      {hasAnyIncentiveActivity(incentives) ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SecondaryUseStatus')}
        >
          <Card style={styles.consentCard}>
            <Text style={styles.consentTitle}>{Strings.INC_CARD_TITLE}</Text>
            <Text style={styles.consentDesc}>
              {Strings.INC_CARD_DESC(
                incentives.totals.pending + incentives.totals.approved,
                incentives.totals.paid,
              )}
            </Text>
            <Text style={styles.incCta}>{Strings.INC_CARD_CTA} ›</Text>
          </Card>
        </TouchableOpacity>
      ) : null}

      {/* v2 §7-4 (D6): 첫 검증 루프 완료 시 추천 코드 3장 — 발급자 핸들 각인 */}
      {FEATURES.REFERRAL && (profile?.completedCount ?? 0) >= 1 ? (
        <Card style={styles.referralCard}>
          <Text style={styles.referralTitle}>{Strings.REFERRAL_TITLE}</Text>
          <View style={styles.referralCodes}>
            {referralCodesFor(profile).map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.referralCode}
                activeOpacity={0.7}
                onPress={() =>
                  Share.share({
                    message: Strings.REFERRAL_SHARE_MESSAGE_NAMED(
                      code,
                      profile?.handleUrl || 'greyd',
                    ),
                  }).catch(() => {})
                }
              >
                <Text style={styles.referralCodeText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.referralNote}>
            {Strings.REFERRAL_INVITED_BY(profile?.handleUrl || '')} · {Strings.REFERRAL_NOTE}
          </Text>
        </Card>
      ) : null}

      <Text style={styles.section}>{Strings.MY_MISSIONS}</Text>
      <FlatList
        data={shownMissions}
        keyExtractor={(item) => item.campaignId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          campaignLoading && campaigns.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{Strings.MAIN_FEED_LOADING}</Text>
            </View>
          ) : loadFailed || (campaignError && campaigns.length === 0) ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>⚠️</Text>
              <Text style={styles.emptyTitle}>{Strings.CAMPAIGNS_LOAD_ERROR}</Text>
              <Btn
                variant="ghost"
                small
                title={Strings.RETRY}
                onPress={() => {
                  dispatch(fetchCampaigns());
                  reload();
                }}
              />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>{Strings.NO_CAMPAIGNS}</Text>
            </View>
          )
        }
        renderItem={renderMission}
      />

      <AddressModal
        visible={addressFor != null}
        onClose={() => setAddressFor(null)}
        onSubmit={onSubmitAddress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { ...TYPE.H_TITLE },

  // 시안 24: 진행/완료 세그먼트
  segWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: 9,
    overflow: 'hidden',
  },
  segCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  segCellOn: { backgroundColor: COLORS.INK },
  segText: { fontFamily: FONT.Bold, fontSize: 11.5, color: COLORS.GREY },
  segTextOn: { color: COLORS.SURFACE },

  // 상단 G-스코어 · 포인트 카드
  topRow: { flexDirection: 'row', gap: 10, margin: 16 },
  topCard: { flex: 1 },
  topLabel: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.GREY },
  gValue: { fontFamily: LATIN.ExtraBold, fontSize: 30, color: COLORS.INK, letterSpacing: -0.6 },
  gBar: { marginTop: 7 },
  topNote: { ...TYPE.XS, marginTop: 6 },
  pointValue: {
    fontFamily: LATIN.ExtraBold,
    fontSize: 30,
    color: COLORS.AMBER_DEEP,
    letterSpacing: -0.6,
  },

  section: {
    fontFamily: FONT.Bold,
    fontSize: 14,
    color: COLORS.INK,
    letterSpacing: -0.1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  // 진행 카드
  mission: { marginBottom: 10 },
  dDayBadge: { alignSelf: 'flex-start', marginBottom: 8 },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionTitle: { ...TYPE.CARD_TITLE, flex: 1, marginRight: 10 },
  subInfo: { ...TYPE.SUB, marginTop: 8 },
  actionGap: { marginTop: 10 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rowBtn: { flex: 1 },
  dday: {
    marginTop: 10,
    fontFamily: FONT.ExtraBold,
    fontSize: 13,
    color: COLORS.GREEN,
    fontVariant: ['tabular-nums'],
  },
  ddayDanger: { color: COLORS.RED },
  feedbackCard: {
    marginTop: 10,
    backgroundColor: COLORS.AMBER_FAINT,
    borderRadius: RADIUS.FIELD,
    padding: 12,
  },
  cancelBtn: { marginTop: 10, alignSelf: 'flex-start' },
  cancelledCard: { opacity: 0.75 },
  cancelledNote: { ...TYPE.XS, marginTop: 8 },
  feedbackText: { ...TYPE.SUB, fontSize: 12.5, color: COLORS.INK, marginTop: 4, lineHeight: 18 },

  // 빈 상태
  emptyWrap: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { fontFamily: FONT.Bold, fontSize: 14.5, color: COLORS.INK },

  // 추천 코드 카드
  fgiBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: RADIUS.FIELD,
    backgroundColor: COLORS.AMBER_FAINT,
    gap: 3,
  },
  fgiTitle: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP },
  fgiSelected: { color: COLORS.GREEN, fontFamily: FONT.Bold },
  fgiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  consentCard: { marginHorizontal: 16, marginBottom: 14 },
  consentTitle: { ...TYPE.CARD_TITLE, fontSize: 13.5 },
  consentDesc: { ...TYPE.BODY, marginTop: 6, color: COLORS.GREY },
  consentBtn: { marginTop: 10, alignSelf: 'flex-start' },
  incCta: { fontFamily: FONT.Bold, fontSize: 12, color: COLORS.AMBER_DEEP, marginTop: 8 },
  referralCard: { marginHorizontal: 16, marginBottom: 14 },
  referralTitle: { ...TYPE.CARD_TITLE, fontSize: 13.5 },
  referralCodes: { flexDirection: 'row', marginTop: 10, gap: 8 },
  referralCode: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.AMBER,
    borderRadius: 9,
    backgroundColor: COLORS.AMBER_FAINT,
    paddingVertical: 8,
    alignItems: 'center',
  },
  referralCodeText: {
    fontFamily: FONT.ExtraBold,
    fontSize: 13,
    color: COLORS.AMBER_DEEP,
    letterSpacing: 2,
  },
  referralNote: { ...TYPE.XS, marginTop: 8 },
});
