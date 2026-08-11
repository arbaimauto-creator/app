// 부팅이 N초 안에 끝나지 않을 때(= 흰 화면 무한 대기) 원인을 화면에 띄우는 진단 오버레이.
// 예외가 잡히는 경우는 StartupErrorScreen이 담당하고, 여기는 "아무 일도 안 일어남"을 담당한다.
// 이 컴포넌트는 절대 예외를 던지면 안 된다 — 렌더 전체를 try/catch로 감싼다.
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// 디자인 토큰이 어떤 이유로든 로드되지 않아도 오버레이는 떠야 한다.
let COLORS = {
  BG: '#F4F4F4',
  SURFACE: '#FFFFFF',
  INK: '#171717',
  GREY: '#8A857B',
  LINE: '#EAE7E1',
  AMBER: '#FFB731',
  AMBER_SOFT: '#FFF3D9',
  AMBER_DEEP: '#8A5D00',
  ON_AMBER: '#231B05',
};
let FONT = {};
try {
  const tokens = require('./Constants/DesignTokens').default;
  if (tokens && tokens.COLORS) {
    COLORS = { ...COLORS, ...tokens.COLORS };
  }
  if (tokens && tokens.FONT) {
    FONT = tokens.FONT;
  }
} catch (e) {
  // 토큰 없이 기본값으로 렌더
}

const f = (key) => (FONT && FONT[key] ? { fontFamily: FONT[key] } : null);

function formatMs(ms) {
  const n = Number(ms);
  if (!isFinite(n)) {
    return '-';
  }
  return `${(n / 1000).toFixed(2)}s`;
}

// trace 항목의 t는 절대 시각(Date.now)일 수도, 상대 ms일 수도 있다. 첫 항목 기준 상대값으로 보여준다.
function normalizeTrace(trace) {
  if (!Array.isArray(trace) || trace.length === 0) {
    return [];
  }
  let base = 0;
  const first = Number(trace[0] && trace[0].t);
  if (isFinite(first) && first > 1e10) {
    base = first;
  }
  return trace.map((item, i) => {
    const t = Number(item && item.t);
    return {
      key: `${i}`,
      at: isFinite(t) ? formatMs(t - base) : '-',
      step: String((item && item.step) != null ? item.step : item),
    };
  });
}

export default function BootDiagnosticScreen({ elapsedMs, trace, readySignal, onDismiss }) {
  try {
    const rows = normalizeTrace(trace);
    return (
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={[styles.title, f('ExtraBold')]}>부팅 진단</Text>
          <Text selectable style={[styles.elapsed, f('Bold')]}>
            경과 {formatMs(elapsedMs)} — 화면이 뜨지 않았습니다
          </Text>

          <View style={styles.badge}>
            <Text selectable style={[styles.badgeText, f('Bold')]}>
              {readySignal ? `정상 진입 신호: ${readySignal}` : '정상 진입 신호 없음'}
            </Text>
          </View>

          <Text selectable style={[styles.meta, f('Regular')]}>
            {`platform ${Platform.OS} ${String(Platform.Version)} · dev ${__DEV__ ? 'Y' : 'N'} · steps ${rows.length}`}
          </Text>

          <Text style={[styles.sectionTitle, f('Bold')]}>부팅 단계 기록</Text>
          <View style={styles.box}>
            {rows.length === 0 ? (
              <Text selectable style={[styles.empty, f('Regular')]}>
                기록된 단계 없음 (bootTrace 미탑재 또는 첫 단계 이전에 멈춤)
              </Text>
            ) : (
              rows.map((r) => (
                <View key={r.key} style={styles.row}>
                  <Text selectable style={[styles.rowTime, f('Bold')]}>
                    {r.at}
                  </Text>
                  <Text selectable style={[styles.rowStep, f('Regular')]}>
                    {r.step}
                  </Text>
                </View>
              ))
            )}
          </View>

          <Text selectable style={[styles.callout, f('ExtraBold')]}>
            이 화면을 캡처해 보내주세요
          </Text>

          {onDismiss ? (
            <Pressable style={styles.dismiss} onPress={onDismiss} hitSlop={8}>
              <Text style={[styles.dismissText, f('Bold')]}>닫고 앱으로 돌아가기</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    );
  } catch (e) {
    // 진단 화면이 죽으면 다시 흰 화면이 된다 — 최소 형태로라도 띄운다.
    return (
      <View style={styles.overlay}>
        <Text style={styles.title}>부팅 진단</Text>
        <Text selectable style={styles.elapsed}>
          화면이 뜨지 않았습니다. 이 화면을 캡처해 보내주세요.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BG,
  },
  inner: { padding: 22, paddingTop: 72, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.INK, letterSpacing: -0.3 },
  elapsed: { fontSize: 14, fontWeight: '700', color: COLORS.INK, marginTop: 10 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.AMBER_SOFT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: COLORS.AMBER_DEEP },
  meta: { fontSize: 11.5, color: COLORS.GREY, marginTop: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.INK,
    marginTop: 20,
    marginBottom: 8,
  },
  box: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    padding: 12,
  },
  row: { flexDirection: 'row', paddingVertical: 3 },
  rowTime: { width: 66, fontSize: 11.5, fontWeight: '700', color: COLORS.AMBER_DEEP },
  rowStep: { flex: 1, fontSize: 11.5, color: COLORS.INK },
  empty: { fontSize: 12, color: COLORS.GREY },
  callout: { fontSize: 15, fontWeight: '800', color: COLORS.INK, marginTop: 22 },
  dismiss: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.AMBER,
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  dismissText: { fontSize: 13, fontWeight: '700', color: COLORS.ON_AMBER },
});
