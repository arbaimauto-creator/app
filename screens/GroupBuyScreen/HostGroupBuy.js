// 공동구매 호스트(인플루언서) 화면 (2026-09-30)
// 브랜드·아르바임이 지정한 인플루언서가 제안을 수락하고, 한마디를 쓰고, 자기 리뷰 영상을 공동구매 페이지에 붙이고, 링크를 공유한다.
// 가격·물량·배송·CS는 호스트가 만지지 않는다.
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Text, View } from 'react-native';
import APIprovider from '../../Components/APIprovider';
import { Btn, Card, NoteBox } from '../../Components/UI';
import { prefGetSafe } from '../../api/prefSafe';
import {
  GB_STATE,
  attachHostVideo,
  detachHostVideo,
  listHostedGroupBuys,
  respondHostInvite,
  setHostNote,
} from '../../api/groupBuys';
import { HostCard, VideoRail, shareGroupBuy } from './GroupBuyDetail';
import { Failure, Field, Frame, StateBadge, dateLabel, money, s, useFocusLoad } from './common';
import { gbCopy } from './strings';

async function loadMyVideos() {
  const userId = await prefGetSafe('userId');
  if (!userId) {
    return [];
  }
  const res = await APIprovider.getUserUploadVideoList(userId, '', 0, 30).catch(() => null);
  return (res?.videoList || []).map((v) => ({
    videoId: String(v._id),
    thumbnailUrl: v.thumbnailUrl || v?.relayedVideo?.thumbnailUrl || null,
    caption: v.title || v.productName || '',
  }));
}

export default function HostGroupBuyScreen({ navigation, route }) {
  const c = gbCopy();
  const code = route.params?.code;
  const {
    data: gb,
    loading,
    error,
    reload,
  } = useFocusLoad(async () => {
    const list = await listHostedGroupBuys();
    return list.find((x) => x.code === code) || null;
  }, code);
  const [myVideos, setMyVideos] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // 새 영상을 올리고 돌아오면 후보에 바로 보이도록 포커스마다 다시 읽는다
  useFocusEffect(
    useCallback(() => {
      loadMyVideos().then(setMyVideos);
    }, []),
  );
  useEffect(() => {
    if (gb) {
      setNote(gb.host.note || '');
    }
  }, [gb]);

  const run = async (fn, done) => {
    setBusy(true);
    try {
      await fn();
      if (done) {
        Alert.alert(done);
      }
      await reload();
    } catch (e) {
      Alert.alert(c.error.generic);
    } finally {
      setBusy(false);
    }
  };

  if (!gb) {
    return (
      <Frame navigation={navigation} title={c.hostTitle} onRefresh={reload} refreshing={loading}>
        {!loading ? (
          <Failure text={error === 'network' ? c.loadError : c.notFound} retry={reload} />
        ) : null}
      </Frame>
    );
  }

  const pending = gb.state === GB_STATE.PENDING_HOST;
  const editable = [GB_STATE.PENDING_HOST, GB_STATE.SCHEDULED, GB_STATE.OPEN].includes(gb.state);
  const attached = new Set(gb.videos.map((v) => v.videoId));
  const candidates = myVideos.filter((v) => !attached.has(v.videoId));

  return (
    <Frame navigation={navigation} title={c.hostTitle} onRefresh={reload} refreshing={loading}>
      <View style={{ gap: 6 }}>
        <View style={s.between}>
          <Text style={s.eyebrow}>{gb.brand.name.toUpperCase()}</Text>
          <StateBadge state={gb.state} />
        </View>
        <Text style={s.h1}>{gb.title}</Text>
        <Text style={s.sub}>
          {gb.product.name} · {money(gb.price, gb.currency)} · {dateLabel(gb.startsAt)} ~{' '}
          {dateLabel(gb.endsAt)}
        </Text>
      </View>

      {pending ? (
        <Card style={{ padding: 14, gap: 10 }}>
          <Text style={s.h2}>{c.invite(gb.brand.name)}</Text>
          <Text style={s.body}>{c.inviteBody}</Text>
          <Btn
            title={c.accept}
            loading={busy}
            onPress={() => run(() => respondHostInvite(gb.code, true))}
          />
          <Btn
            variant="ghost"
            title={c.decline}
            disabled={busy}
            onPress={() =>
              Alert.alert(c.declineConfirm, '', [
                { text: c.no, style: 'cancel' },
                { text: c.yes, onPress: () => run(() => respondHostInvite(gb.code, false)) },
              ])
            }
          />
        </Card>
      ) : (
        <Card style={{ padding: 14, gap: 4 }}>
          <Text style={s.h2}>{c.stats(gb.reservedQuantity, gb.orderCount)}</Text>
          {gb.minQuantity ? (
            <Text style={s.sub}>{c.progress(gb.reservedQuantity, gb.minQuantity)}</Text>
          ) : null}
        </Card>
      )}

      {editable ? (
        <Card style={{ padding: 14, gap: 10 }}>
          <Field
            label={c.note}
            value={note}
            onChangeText={setNote}
            placeholder={c.notePlaceholder}
            multiline
            maxLength={300}
          />
          <Btn
            small
            variant="ghost"
            title={c.saveNote}
            disabled={busy || note === gb.host.note}
            onPress={() => run(() => setHostNote(gb.code, note), c.saved)}
          />
        </Card>
      ) : (
        <HostCard gb={gb} />
      )}

      <View style={{ gap: 8 }}>
        <Text style={s.h2}>{c.videos}</Text>
        <Text style={s.sub}>{c.videosHint}</Text>
        {gb.videos.length ? (
          <VideoRail
            videos={gb.videos}
            onOpen={(v) => navigation.navigate('VideoPage', { videoId: v.videoId })}
            renderAction={
              editable
                ? (v) => (
                    <Text
                      style={[s.link, { color: '#8A857B' }]}
                      accessibilityRole="button"
                      onPress={() => run(() => detachHostVideo(gb.code, v.videoId))}
                    >
                      {c.detach}
                    </Text>
                  )
                : null
            }
          />
        ) : null}
        {editable ? (
          candidates.length ? (
            <VideoRail
              videos={candidates}
              onOpen={(v) => navigation.navigate('VideoPage', { videoId: v.videoId })}
              renderAction={(v) => (
                <Text
                  style={s.link}
                  accessibilityRole="button"
                  onPress={() => run(() => attachHostVideo(gb.code, v))}
                >
                  + {c.attach}
                </Text>
              )}
            />
          ) : (
            <Text style={s.sub}>{c.noVideos}</Text>
          )
        ) : null}
        {editable ? (
          <Btn
            small
            variant="ghost"
            title={c.upload}
            onPress={() => navigation.navigate('Camera')}
          />
        ) : null}
      </View>

      {!pending && gb.state !== GB_STATE.CANCELLED ? (
        <Card style={{ padding: 14, gap: 8 }}>
          <Text style={s.h2}>{c.shareKit}</Text>
          <Text style={s.body}>https://greyd.app/groupbuy/{gb.code}</Text>
          <NoteBox text={c.shareHint} />
          <Btn small title={c.copyLink} onPress={() => shareGroupBuy(gb)} />
          <Btn
            small
            variant="ghost"
            title={c.preview}
            onPress={() => navigation.navigate('GroupBuy', { code: gb.code })}
          />
        </Card>
      ) : null}
    </Frame>
  );
}
