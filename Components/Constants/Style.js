import { Dimensions, Platform, StyleSheet } from 'react-native';
import Strings from '../Strings';
// 주의: 여기서 './index'(Constants)를 import하면 순환 참조가 된다.
// index.js가 이 파일을 `...Style`로 펼쳐 쓰므로, 로드 순서에 따라 Constants가
// 빈 객체가 되어 `Constants.TIER_COLORS.X` 접근이 릴리스에서 터진다.

const COLOR_MAIN = '#FFB731';
//const COLOR_MAIN_DARK = '#B07003'
const COLOR_MAIN_DARK = 'rgb(174, 125, 35)';
const COLOR_MAIN_LIGHT = '#FDD590';
const COLOR_SUB = '#B07003';
const COLOR_GREY = '#48453D';
const COLOR_RED = '#FF3700';
// const COLOR_BACKGROUND_DARK = '#0E0E0E';
// const COLOR_BACKGROUND_DARK = '#3A3A3A';
const COLOR_BACKGROUND_DARK = '#F4F4F4';
const COLOR_USER_CLASS_1 = '#FF6174';
const COLOR_USER_CLASS_2 = '#FF6174';
const COLOR_USER_CLASS_3 = '#FF6174';
const COLOR_USER_CLASS_0 = '#999';

const PRODUCT_LIST_MARGIN = 20;
const PRODUCT_LIST_SPACING = 10;
const PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_WIDTH = 100;
const PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT = 100;
const PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_DESCRIPTION_HEIGHT = 114;
const PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH =
  Dimensions.get('window').width / 2 - PRODUCT_LIST_SPACING - PRODUCT_LIST_MARGIN - 40;
const PRODUCT_GRID_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT = PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH;
const PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT =
  PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH + PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_DESCRIPTION_HEIGHT;
const PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_WIDTH = PRODUCT_GRID_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT * 1;
const PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT =
  PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_WIDTH + PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_DESCRIPTION_HEIGHT;
const VIDEO_LIST_MARGIN = 20;
const VIDEO_LIST_SPACING = 10;
const VIDEO_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_WIDTH = 100;
const VIDEO_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT = 150;
const VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT = 94;
const VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH =
  (Dimensions.get('window').width / 2 - VIDEO_LIST_SPACING - VIDEO_LIST_MARGIN) * 0.9;
const VIDEO_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT = VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH * 1.5;
const VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT =
  VIDEO_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT + VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT;
const VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_3 = Dimensions.get('window').width / 3 - 3;
const VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_3 =
  (VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_3 / 2) * 3 + VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT;
const VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2 =
  Dimensions.get('window').width / 2 - VIDEO_LIST_SPACING - VIDEO_LIST_MARGIN;
const VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 =
  (VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2 / 2) * 3 + VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT;
const USER_LIST_MARGIN = 20;
const USER_LIST_SPACING = 10;
const USER_GRID_LIST_ITEM_VIEW_WIDTH =
  Dimensions.get('window').width / 2 - USER_LIST_SPACING - USER_LIST_MARGIN - 40;

const styles = StyleSheet.create({
  tabviewTab: {
    width: 'auto',
    padding: 0,
    marginHorizontal: 12.5,
  },
  tabviewIndicator: {
    backgroundColor: COLOR_BACKGROUND_DARK,
    height: 3,
  },
  tabviewIndicatorContainer: {
    marginHorizontal: 10,
    backgroundColor: COLOR_BACKGROUND_DARK,
  },
  tabview: {
    backgroundColor: COLOR_BACKGROUND_DARK,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchBarCloseButton: {
    width: 24,
    height: 24,
  },
  searchBarContainer: {
    backgroundColor: COLOR_BACKGROUND_DARK,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 0,
    marginRight: 20,
  },
  searchBarInputContainer: {
    backgroundColor: COLOR_BACKGROUND_DARK,
    marginVertical: 0,
    height: 60,
    paddingVertical: 0,
    paddingLeft: 6,
  },
  searchBarInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});

const TAB_VIEW_STYLE_PROPS = {
  tabStyle: styles.tabviewTab,
  indicatorStyle: styles.tabviewIndicator,
  indicatorContainerStyle: styles.tabviewIndicatorContainer,
  style: styles.tabview,
};

const SEARCH_BAR_COMMON_PROPS = {
  containerStyle: styles.searchBarContainer,
  inputContainerStyle: styles.searchBarInputContainer,
  inputStyle: styles.searchBarInput,
  cancelButtonProps: { color: 'black' },
  cancelButtonTitle: Strings.CLOSE,
  clearIcon: {
    iconProps: {
      color: 'black',
    },
  },
  placeholder: Strings.SEARCH,
  platform: Platform.OS,
};

const TIER_COLORS = {
  GIVER: '#FFB731',
  ARTISAN: '#3a3a3a',
  OPERATOR: '#6a6a6a',
  STRIVER: '#a0a0a0',
  EXPLORER: '#d5d5d5',
  PIONEER: 'white',
};

const COLOR_POINT_BLUE = '#FFB731'; //'#192BC2';

const CUSTOM_FONTS = {
  // SUIT: {
  //   LIGHT: 'SUIT-Light',
  //   REGULAR: 'SUIT-Regular',
  //   MEDIUM: 'SUIT-Medium',
  //   SEMIBOLD: 'SUIT-SemiBold',
  //   BOLD: 'SUIT-Bold',
  //   EXTRABOLD: 'SUIT-ExtraBold',
  // },
  // SCDREAM: {
  //   EXTRALIGHT_2: Platform.OS === 'ios' ? 'S-CoreDream-2ExtraLight' : 'SCDream2',
  //   LIGHT_3: Platform.OS === 'ios' ? 'S-CoreDream-3Light' : 'SCDream3',
  //   REGULAR_4: Platform.OS === 'ios' ? 'S-CoreDream-4Regular' : 'SCDream4',
  //   MEDIUM_5: Platform.OS === 'ios' ? 'S-CoreDream-5Medium' : 'SCDream5',
  //   SEMIBOLD_6: Platform.OS === 'ios' ? 'S-CoreDream-6bold' : 'SCDream6',
  //   BOLD_7: Platform.OS === 'ios' ? 'S-CoreDream-7ExtraBold' : 'SCDream7',
  //   HEAVY_8: Platform.OS === 'ios' ? 'S-CoreDream-8Heavy' : 'SCDream8',
  //   BLACK_9: Platform.OS === 'ios' ? 'S-CoreDream-9Black' : 'SCDream9',
  // },
  SUIT: {
    LIGHT: 'Pretendard-Light',
    REGULAR: 'Pretendard-Regular',
    MEDIUM: 'Pretendard-Medium',
    SEMIBOLD: 'Pretendard-SemiBold',
    BOLD: 'Pretendard-Bold',
    EXTRABOLD: 'Pretendard-ExtraBold',
  },
  SCDREAM: {
    EXTRALIGHT_2: 'Pretendard-ExtraLight',
    LIGHT_3: 'Pretendard-Light',
    REGULAR_4: 'Pretendard-Regular',
    MEDIUM_5: 'Pretendard-Medium',
    SEMIBOLD_6: 'Pretendard-SemiBold',
    BOLD_7: 'Pretendard-Bold',
    HEAVY_8: 'Pretendard-ExtraBold',
    BLACK_9: 'Pretendard-ExtraBold',
  },
  PRETENDARD: {
    Black: 'Pretendard-Black',
    Bold: 'Pretendard-Bold',
    ExtraBold: 'Pretendard-ExtraBold',
    ExtraLight: 'Pretendard-ExtraLight',
    Light: 'Pretendard-Light',
    Medium: 'Pretendard-Medium',
    Regular: 'Pretendard-Regular',
    SemiBold: 'Pretendard-SemiBold',
    Thin: 'Pretendard-Thin',
  },
};

export default {
  COLOR_MAIN,
  COLOR_MAIN_DARK,
  COLOR_MAIN_LIGHT,
  COLOR_BACKGROUND_DARK,
  COLOR_SUB,
  COLOR_GREY,
  COLOR_RED,
  COLOR_USER_CLASS_0,
  COLOR_USER_CLASS_1,
  COLOR_USER_CLASS_2,
  COLOR_USER_CLASS_3,
  PRODUCT_LIST_MARGIN,
  PRODUCT_LIST_SPACING,
  PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_WIDTH,
  PRODUCT_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
  PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_DESCRIPTION_HEIGHT,
  PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
  PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT,
  PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH,
  PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT,
  PRODUCT_GRID_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
  VIDEO_LIST_MARGIN,
  VIDEO_LIST_SPACING,
  VIDEO_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_WIDTH,
  VIDEO_VERTICAL_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
  VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT,
  VIDEO_LIST_ITEM_VIEW_THUMBNAIL_HEIGHT,
  VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
  VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT,
  VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_3,
  VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2,
  VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_3,
  VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2,
  USER_LIST_SPACING,
  USER_GRID_LIST_ITEM_VIEW_WIDTH,
  TAB_VIEW_STYLE_PROPS,
  SEARCH_BAR_COMMON_PROPS,
  TIER_COLORS,
  COLOR_POINT_BLUE,
  CUSTOM_FONTS,
};
