// greyd Phase 1 디자인 시스템 토큰 — 화면 설계 v2 시안(artifact 69ef62ce) 확정값.
// 앱 화면 리스타일의 단일 소스. 웹(web/src/styles.css)과 값이 일치해야 한다.
import { Platform, StatusBar } from 'react-native';

// 상태바 겹침 방지용 상단 인셋 — 자체 헤더를 그리는 화면의 루트 paddingTop에 사용
// iOS는 각 화면의 SafeAreaView가 노치 인셋을 처리하므로 여백만 더한다
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 8;

const COLORS = {
  // 브랜드
  AMBER: '#FFB731', // CTA·강조 (= Style.COLOR_MAIN)
  AMBER_DEEP: '#8A5D00', // 앰버 위 텍스트 강조
  AMBER_SOFT: '#FFF3D9', // 앰버 배지·노트 배경
  AMBER_FAINT: '#FFF9EC', // 앰버 입력 포커스 배경
  ON_AMBER: '#231B05', // 앰버 버튼 위 텍스트

  // 앱 그라운드
  BG: '#F4F4F4',
  SURFACE: '#FFFFFF',
  INK: '#171717',
  GREY: '#8A857B',
  LINE: '#EAE7E1',
  DARK: '#3A3A3A',

  // 시맨틱
  RED: '#E53400',
  RED_SOFT: '#FCE9E2',
  GREEN: '#1F8A4C',
  GREEN_SOFT: '#E4F3E9',

  // 상태 pill (상태머신 8종과 1:1)
  ST_APPLIED_BG: '#EDEBE6',
  ST_APPLIED_FG: '#6E675C',
  ST_APPROVED_BG: '#FFF3D9',
  ST_APPROVED_FG: '#8A5D00',
  ST_SHIPPED_BG: '#E3EDF7',
  ST_SHIPPED_FG: '#2B5E8E',
  ST_RECEIVED_BG: '#E4F3E9',
  ST_RECEIVED_FG: '#1F8A4C',
  ST_REVIEW_BG: '#F0E9F7',
  ST_REVIEW_FG: '#6A4E8E',
  ST_DONE_BG: '#E4F3E9',
  ST_DONE_FG: '#1F8A4C',
  ST_NOSHOW_BG: '#FCE9E2',
  ST_NOSHOW_FG: '#E53400',
  ST_CANCELLED_BG: '#EDEBE6',
  ST_CANCELLED_FG: '#6E675C',

  // 진행바 트랙
  TRACK: '#E8E5DF',
};

const RADIUS = {
  CARD: 18, // 2026-09-16 컨셉: 더 둥글게(14→18)
  BTN: 14,
  BTN_SM: 8,
  FIELD: 10,
  BADGE: 5,
  PILL: 999,
  SHEET: 18,
};

// Pretendard 패밀리명을 직접 정의한다 — Style.js를 import하면 Constants 순환 참조에
// 새 진입점이 생겨 로드 순서에 따라 초기화 실패가 난다 (릴리스 흰 화면 원인이었음).
const FONT = {
  Black: 'Pretendard-Black',
  Bold: 'Pretendard-Bold',
  ExtraBold: 'Pretendard-ExtraBold',
  ExtraLight: 'Pretendard-ExtraLight',
  Light: 'Pretendard-Light',
  Medium: 'Pretendard-Medium',
  Regular: 'Pretendard-Regular',
  SemiBold: 'Pretendard-SemiBold',
  Thin: 'Pretendard-Thin',
};

// 라틴·숫자 전용 패밀리 (2026-09-16).
// Onest는 제목·수치처럼 "읽는 것보다 보는 것"에 가까운 자리, Inter Tight는 라벨·버튼·표 같은 좁은 자리에 쓴다.
// 둘 다 한글 글리프가 없다 — 한글이 섞이는 본문·버튼 문구는 반드시 Pretendard(FONT)를 유지한다.
const DISPLAY = {
  Regular: 'Onest-Regular',
  Medium: 'Onest-Medium',
  SemiBold: 'Onest-SemiBold',
  Bold: 'Onest-Bold',
  ExtraBold: 'Onest-ExtraBold',
};

const LATIN = {
  Regular: 'InterTight-Regular',
  Medium: 'InterTight-Medium',
  SemiBold: 'InterTight-SemiBold',
  Bold: 'InterTight-Bold',
  ExtraBold: 'InterTight-ExtraBold',
};

const TYPE = {
  H_TITLE: { fontFamily: FONT.ExtraBold, fontSize: 20, color: COLORS.INK, letterSpacing: -0.2 },
  CARD_TITLE: { fontFamily: FONT.Bold, fontSize: 14, color: COLORS.INK, letterSpacing: -0.1 },
  BODY: { fontFamily: FONT.Regular, fontSize: 13, color: COLORS.INK },
  SUB: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  XS: { fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY },
  LABEL: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.INK },
  BTN: { fontFamily: FONT.ExtraBold, fontSize: 13.5, color: COLORS.ON_AMBER },
  BADGE: { fontFamily: FONT.ExtraBold, fontSize: 10 },
  KPI: { fontFamily: FONT.ExtraBold, fontSize: 19, color: COLORS.INK },

  // 라틴·숫자 전용 (2026-09-16) — 한글이 섞이지 않는 자리에만 쓴다
  DISPLAY_XL: {
    fontFamily: DISPLAY.ExtraBold,
    fontSize: 30,
    color: COLORS.INK,
    letterSpacing: -0.6,
  },
  DISPLAY_L: { fontFamily: DISPLAY.Bold, fontSize: 22, color: COLORS.INK, letterSpacing: -0.4 },
  NUM_XL: { fontFamily: LATIN.ExtraBold, fontSize: 26, color: COLORS.INK, letterSpacing: -0.5 },
  NUM: { fontFamily: LATIN.Bold, fontSize: 15, color: COLORS.INK, letterSpacing: -0.2 },
  EYEBROW: { fontFamily: LATIN.Bold, fontSize: 10, letterSpacing: 1.4, color: COLORS.AMBER_DEEP },
};

const SHADOW_CARD = {
  shadowColor: '#140F05',
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 2,
  elevation: 1,
};

const SHADOW_SHEET = {
  shadowColor: '#140F05',
  shadowOpacity: 0.14,
  shadowOffset: { width: 0, height: -6 },
  shadowRadius: 22,
  elevation: 12,
};

// 2026-09-16 컨셉 반영 — 세 시안의 공통점: 둥근 면이 살짝 떠 있고(뉴모피즘), 광택이 있는 버튼(글라스),
// 은은한 앰버 글로우(따뜻한 빛). 그림자는 넓고 옅게, 모서리는 더 둥글게.
const SHADOW_SOFT = {
  shadowColor: '#140F05',
  shadowOpacity: 0.07,
  shadowOffset: { width: 0, height: 8 },
  shadowRadius: 18,
  elevation: 4,
};

const SHADOW_GLOW = {
  shadowColor: '#FFB731',
  shadowOpacity: 0.35,
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 14,
  elevation: 5,
};

// 광택 버튼 그라데이션(위 밝음 → 아래 본색) + 상단 하이라이트 띠
const GRADIENT = {
  AMBER: ['#FFD37A', '#FFB731', '#F5A51C'],
  AMBER_GLOW: ['rgba(255,183,49,0)', 'rgba(255,183,49,0.55)', 'rgba(255,150,20,0.85)'],
  GLOSS: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.0)'],
  INK: ['#3A3A3A', '#171717'],
};

export default {
  COLORS,
  RADIUS,
  FONT,
  DISPLAY,
  LATIN,
  TYPE,
  GRADIENT,
  SHADOW_CARD,
  SHADOW_SOFT,
  SHADOW_GLOW,
  SHADOW_SHEET,
  TOP_INSET,
};
