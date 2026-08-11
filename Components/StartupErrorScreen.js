// 릴리스 빌드에서 시작 오류가 나면 흰 화면 대신 원인을 보여준다.
// (개발 빌드는 RN 레드박스가 담당 — 이 화면은 릴리스 진단·사용자 안내 겸용)
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

let listener = null;
let captured = null;

export function reportStartupError(error, phase) {
  captured = {
    phase: phase || 'unknown',
    message: (error && (error.message || String(error))) || 'unknown error',
    stack: (error && error.stack) || '',
  };
  if (listener) {
    listener(captured);
  }
}

export function subscribeStartupError(fn) {
  listener = fn;
  if (captured) {
    fn(captured);
  }
  return () => {
    listener = null;
  };
}

export default function StartupErrorScreen({ error }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>앱을 시작하지 못했어요</Text>
      <Text style={styles.sub}>
        아래 내용을 캡처해 개발자에게 보내주세요 (단계: {error?.phase})
      </Text>
      <ScrollView style={styles.box} contentContainerStyle={styles.boxInner}>
        <Text selectable style={styles.message}>
          {error?.message}
        </Text>
        {error?.stack ? (
          <Text selectable style={styles.stack}>
            {String(error.stack).split('\n').slice(0, 14).join('\n')}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4', padding: 22, paddingTop: 80 },
  title: { fontSize: 20, fontWeight: '800', color: '#171717' },
  sub: { fontSize: 12.5, color: '#8A857B', marginTop: 8, marginBottom: 16 },
  box: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12 },
  boxInner: { padding: 14 },
  message: { fontSize: 13, color: '#E53400', fontWeight: '700' },
  stack: { fontSize: 10.5, color: '#6E675C', marginTop: 10, lineHeight: 15 },
});
