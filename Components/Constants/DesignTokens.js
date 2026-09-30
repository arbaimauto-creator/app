// greyd 디자인 시스템 토큰 — 앱 화면 스타일의 단일 소스. 웹(web/src/styles.css)과 값이 일치해야 한다.
//
// 2026-09-30 고도화 "Maison" — 고급스럽고 세련된 톤으로 전면 조정 (docs/design-refresh-2026-09-30.md)
//  · 그라운드: 노란 크림 → 포슬린 아이보리. 잉크: 순검정 → 따뜻한 에스프레소 블랙.
//  · 포인트: 채도 높은 앰버(#FFB731) → 샴페인 브론즈 골드. 금색은 "면"이 아니라 "선·점·작은 강조"에만.
//  · 주 버튼: 광택 앰버 → 에스프레소 무광 알약 + 아이보리 글자.
//  · 서체: 한글은 Pretendard를 한 단계 가볍게, 로고·큰 숫자·가격은 세리프(Cormorant Garamond).
//  · 그림자: 넓고 아주 옅게. 앰버 글로우 그림자 제거.
// 토큰 이름(AMBER 등)은 163개 화면 호환을 위해 유지한다 — 값만 바뀐다. AMBER = "브랜드 골드"로 읽는다.
import { Platform, StatusBar } from 'react-native';

// 상태바 겹침 방지용 상단 인셋 — 자체 헤더를 그리는 화면의 루트 paddingTop에 사용
// iOS는 각 화면의 SafeAreaView가 노치 인셋을 처리하므로 여백만 더한다
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 8;

const COLORS = {
  // 브랜드 골드 (이름은 호환용 AMBER)
  AMBER: '#B08D57', // 샴페인 브론즈 — 진행바·선택·아이콘·작은 강조
  AMBER_DEEP: '#7A5C2E', // 골드 계열 글자(아이보리 위 대비 6:1 이상)
  AMBER_SOFT: '#F1E9DA', // 골드 배지·노트 배경
  AMBER_FAINT: '#F8F4EC', // 입력 포커스·옅은 하이라이트
  ON_AMBER: '#1B1814', // 골드 면 위 글자
  CHAMPAGNE: '#D9C6A5', // 골드 헤어라인·테두리
  ON_INK: '#F7F2EA', // 에스프레소 면 위 글자(아이보리)

  // 그라운드
  BG: '#F6F3EE', // 포슬린 아이보리
  SURFACE: '#FFFFFF',
  IVORY: '#FBF9F5', // 카드 안 한 단계 밝은 면
  GLASS: 'rgba(255,255,255,0.78)', // 프로스티드 카드 면
  GLASS_BORDER: 'rgba(255,255,255,0.92)',
  INK: '#1B1814', // 에스프레소 블랙
  GREY: '#8C8377', // 토프 그레이(보조 글자)
  LINE: '#E6DFD3', // 헤어라인
  HAIRLINE: 'rgba(27,24,20,0.08)',
  DARK: '#3B3530',

  // 시맨틱 — 채도를 낮춘 벽돌·세이지
  RED: '#B2452F',
  RED_SOFT: '#F6E7E2',
  GREEN: '#3F6B50',
  GREEN_SOFT: '#E6EEE7',

  // 상태 pill (상태머신 8종과 1:1) — 같은 명도대의 뮤트 톤
  ST_APPLIED_BG: '#EEEBE5',
  ST_APPLIED_FG: '#6B6358',
  ST_APPROVED_BG: '#F1E9DA',
  ST_APPROVED_FG: '#7A5C2E',
  ST_SHIPPED_BG: '#E6ECF1',
  ST_SHIPPED_FG: '#3D5A74',
  ST_RECEIVED_BG: '#E6EEE7',
  ST_RECEIVED_FG: '#3F6B50',
  ST_REVIEW_BG: '#EEE9F1',
  ST_REVIEW_FG: '#5E4D72',
  ST_DONE_BG: '#E6EEE7',
  ST_DONE_FG: '#3F6B50',
  ST_NOSHOW_BG: '#F6E7E2',
  ST_NOSHOW_FG: '#B2452F',
  ST_CANCELLED_BG: '#EEEBE5',
  ST_CANCELLED_FG: '#6B6358',

  // 진행바 트랙
  TRACK: '#E8E2D7',
};

const RADIUS = {
  CARD: 20,
  BTN: 26, // 알약 버튼
  BTN_SM: 18,
  FIELD: 12,
  BADGE: 4, // 배지는 각을 살린다 — 둥근 배지보다 정제돼 보인다
  PILL: 999,
  SHEET: 24,
};

// Pretendard 패밀리명을 직접 정의한다 — Style.js를 import하면 Constants 순환 참조에
// 새 진입점이 생겨 로드 순서에 따라 초기화 실패가 난다 (릴리스 흰 화면 원인이었음).
//
// 2026-09-30: 굵기 한 단계 낮춤. 화면 250여 곳이 ExtraBold/Black을 제목에 쓰고 있어 전체가 무거웠다.
// 이름은 "그 자리의 가장 강한 강조"라는 의미로 유지하고 실제 파일만 한 단계 가볍게 매핑한다.
const FONT = {
  Black: 'Pretendard-ExtraBold',
  ExtraBold: 'Pretendard-Bold',
  Bold: 'Pretendard-SemiBold',
  SemiBold: 'Pretendard-SemiBold',
  Medium: 'Pretendard-Medium',
  Regular: 'Pretendard-Regular',
  Light: 'Pretendard-Light',
  ExtraLight: 'Pretendard-ExtraLight',
  Thin: 'Pretendard-Thin',
};

// 세리프 (2026-09-30) — Cormorant Garamond 정적 인스턴스, 숫자는 높이가 고른 라이닝 숫자로 고정.
// 한글 글리프가 없다 → 로고·영문 제목·숫자·가격 등 "라틴/숫자만 있는 자리"에만 쓴다.
const SERIF = {
  Medium: 'CormorantGaramond-Medium',
  SemiBold: 'CormorantGaramond-SemiBold',
  Bold: 'CormorantGaramond-Bold',
  Italic: 'CormorantGaramond-MediumItalic',
};

// 라틴 디스플레이 — 2026-09-30부터 세리프가 맡는다(기존 Onest 자리는 사용처가 없었다)
const DISPLAY = {
  Regular: SERIF.Medium,
  Medium: SERIF.Medium,
  SemiBold: SERIF.SemiBold,
  Bold: SERIF.SemiBold,
  ExtraBold: SERIF.Bold,
};

// 라틴·숫자 산세리프(Inter Tight) — 표·라벨·작은 수치. 굵기 한 단계 낮춤.
const LATIN = {
  Regular: 'InterTight-Regular',
  Medium: 'InterTight-Medium',
  SemiBold: 'InterTight-SemiBold',
  Bold: 'InterTight-SemiBold',
  ExtraBold: 'InterTight-Bold',
};

const TYPE = {
  H_TITLE: { fontFamily: FONT.Bold, fontSize: 20, color: COLORS.INK, letterSpacing: -0.4 },
  CARD_TITLE: { fontFamily: FONT.SemiBold, fontSize: 14.5, color: COLORS.INK, letterSpacing: -0.2 },
  BODY: { fontFamily: FONT.Regular, fontSize: 13.5, lineHeight: 20, color: COLORS.INK },
  SUB: { fontFamily: FONT.Regular, fontSize: 12, color: COLORS.GREY },
  XS: { fontFamily: FONT.Regular, fontSize: 11, color: COLORS.GREY },
  LABEL: { fontFamily: FONT.SemiBold, fontSize: 11.5, color: COLORS.INK, letterSpacing: 0.1 },
  BTN: { fontFamily: FONT.SemiBold, fontSize: 14, color: COLORS.ON_INK, letterSpacing: 0.3 },
  BADGE: { fontFamily: FONT.SemiBold, fontSize: 10, letterSpacing: 0.4 },
  KPI: { fontFamily: SERIF.SemiBold, fontSize: 26, color: COLORS.INK, letterSpacing: -0.2 },

  // 라틴·숫자 전용 — 한글이 섞이지 않는 자리에만 쓴다
  DISPLAY_XL: { fontFamily: SERIF.SemiBold, fontSize: 36, color: COLORS.INK, letterSpacing: -0.4 },
  DISPLAY_L: { fontFamily: SERIF.SemiBold, fontSize: 26, color: COLORS.INK, letterSpacing: -0.2 },
  NUM_XL: { fontFamily: SERIF.SemiBold, fontSize: 32, color: COLORS.INK, letterSpacing: -0.3 },
  NUM: { fontFamily: SERIF.SemiBold, fontSize: 19, color: COLORS.INK, letterSpacing: -0.1 },
  EYEBROW: { fontFamily: LATIN.Medium, fontSize: 10, letterSpacing: 2.2, color: COLORS.AMBER_DEEP },
};

const SHADOW_CARD = {
  shadowColor: '#2A2016',
  shadowOpacity: 0.04,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 2,
  elevation: 1,
};

const SHADOW_SHEET = {
  shadowColor: '#2A2016',
  shadowOpacity: 0.12,
  shadowOffset: { width: 0, height: -8 },
  shadowRadius: 28,
  elevation: 12,
};

// 면이 아주 살짝 떠 있는 정도 — 넓고 옅게
const SHADOW_SOFT = {
  shadowColor: '#2A2016',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 10 },
  shadowRadius: 24,
  elevation: 3,
};

// 주 버튼 그림자 — 예전 앰버 글로우 대신 에스프레소의 낮고 짧은 그림자
const SHADOW_GLOW = {
  shadowColor: '#2A2016',
  shadowOpacity: 0.18,
  shadowOffset: { width: 0, height: 8 },
  shadowRadius: 16,
  elevation: 4,
};

const GRADIENT = {
  // 골드 버튼(보조 강조)용 — 샴페인 → 브론즈, 광택은 아주 얇게
  AMBER: ['#CFB384', '#B08D57', '#9D7B48'],
  AMBER_GLOW: ['rgba(176,141,87,0)', 'rgba(176,141,87,0.22)', 'rgba(176,141,87,0.38)'],
  GLOSS: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.0)'],
  // 주 버튼 — 에스프레소
  INK: ['#2C2722', '#16130F'],
  SCREEN: ['#F8F6F2', '#F2EEE7'],
  // 배경 오브 — 샴페인 안개. 예전 골드 구체보다 훨씬 옅다.
  ORB: ['#EFE4D1', '#DCC8A6'],
  ORB_SOFT: ['rgba(232,217,190,0.55)', 'rgba(220,200,166,0.08)'],
};

export default {
  COLORS,
  RADIUS,
  FONT,
  SERIF,
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
