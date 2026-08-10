// greyd Phase 1 디자인 시스템 토큰 — 화면 설계 v2 시안(artifact 69ef62ce) 확정값.
// 앱 화면 리스타일의 단일 소스. 웹(web/src/styles.css)과 값이 일치해야 한다.
import { Platform, StatusBar } from 'react-native';
import Style from './Style';

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
  CARD: 14,
  BTN: 11,
  BTN_SM: 8,
  FIELD: 10,
  BADGE: 5,
  PILL: 999,
  SHEET: 18,
};

const FONT = Style.CUSTOM_FONTS.PRETENDARD;

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

export default { COLORS, RADIUS, FONT, TYPE, SHADOW_CARD, SHADOW_SHEET, TOP_INSET };
