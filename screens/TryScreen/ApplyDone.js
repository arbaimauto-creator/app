// 신청 완료 (시안 화면 11) — 신청 직후 타임라인 안내.
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Card, Btn, StatusPill, NoteBox } from '../../Components/UI';
import Strings from '../../Components/Strings';

const { COLORS, FONT, TYPE } = T;

export default function ApplyDone({ navigation, route }) {
  const { campaignTitle, applyMode, usedCount, limit, autoConfirmed } = route.params || {};

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.APPLYDONE_TITLE}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🙌</Text>
          <Text style={styles.title}>
            {autoConfirmed ? Strings.APPLYDONE_HERO_CONFIRMED : Strings.APPLYDONE_HERO}
          </Text>
          <Text style={styles.sub}>
            {campaignTitle} · {Strings.APPLYDONE_TRACK(applyMode === 'curated' ? 'Curated' : 'Open')}
          </Text>
        </View>

        <Card>
          {!autoConfirmed ? (
            <>
              <View style={styles.timelineRow}>
                <StatusPill status="applied" label={Strings.CAMPAIGN_STATUS_APPLIED} />
                <Text style={styles.xs}>{Strings.APPLYDONE_NOW}</Text>
              </View>
              <View style={styles.divider} />
            </>
          ) : null}
          <View style={styles.timelineRow}>
            <StatusPill status="approved" label={Strings.CAMPAIGN_STATUS_APPROVED} />
            <Text style={styles.xs}>
              {autoConfirmed ? Strings.APPLYDONE_AUTO_CONFIRM_NOTE : Strings.APPLYDONE_APPROVAL_NOTE}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.timelineRow}>
            <StatusPill status="shipped" label={Strings.CAMPAIGN_STATUS_SHIPPED} />
            <Text style={styles.xs}>{Strings.APPLYDONE_SHIP_NOTE}</Text>
          </View>
        </Card>

        <NoteBox tone="amber">
          <Text style={styles.noteText}>
            {Strings.APPLYDONE_LIMIT_PRE}
            <Text style={styles.noteBold}>{Strings.APPLYDONE_LIMIT_COUNT(limit)}</Text>
            {Strings.APPLYDONE_LIMIT_MID}
            <Text style={styles.noteBold}>{Strings.APPLYDONE_LIMIT_COUNT(usedCount)}</Text>
            {Strings.APPLYDONE_LIMIT_POST}
          </Text>
        </NoteBox>

        <Btn
          variant="ghost"
          title={Strings.APPLYDONE_MORE_CTA}
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG, paddingTop: T.TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  back: { fontFamily: FONT.Bold, fontSize: 26, color: COLORS.INK, lineHeight: 28 },
  headerTitle: { fontFamily: FONT.ExtraBold, fontSize: 18, color: COLORS.INK },
  scroll: { padding: 16, paddingTop: 4, paddingBottom: 32, gap: 9 },
  hero: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  emoji: { fontSize: 34 },
  title: { fontFamily: FONT.Black, fontSize: 19, color: COLORS.INK },
  sub: { fontFamily: FONT.Regular, fontSize: 13, color: COLORS.GREY, textAlign: 'center' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { height: 1, backgroundColor: COLORS.LINE, marginVertical: 10 },
  xs: { ...TYPE.XS, flex: 1 },
  noteText: { fontFamily: FONT.Regular, fontSize: 11, lineHeight: 16.5, color: COLORS.AMBER_DEEP },
  noteBold: { fontFamily: FONT.Bold },
});
