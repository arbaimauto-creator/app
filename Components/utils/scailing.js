import { Dimensions } from 'react-native';
import { getBottomSpace, getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');

// 내가 개발 테스트 한 모바일의 실제 가로 세로 상수값 기입
// const guidelineBaseWidth = 414; //390
// const guidelineBaseHeight = 896; //844

const guidelineBaseWidth = 390; //390
const guidelineBaseHeight = 844; //844

const guideScale = Math.sqrt(guidelineBaseWidth * guidelineBaseHeight);

const scale = Math.sqrt(width * height) / guideScale;
const horiPer = width / guidelineBaseWidth;
const vertiPer = height / guidelineBaseHeight;

const verticalScale = (size) => horiPer * size;
const horizontalScale = (size) => vertiPer * size;
const moderateScale = (size) => scale * size;

function getDeviceHeight(isSafe = false) {
  if (isIphoneX()) {
    // return Dimensions.get('window').height - getStatusBarHeight(isSafe) - 14;
    return Dimensions.get('window').height - getStatusBarHeight(isSafe) - getBottomSpace();
  }

  return Dimensions.get('window').height - getStatusBarHeight(isSafe);
}

function getResponsiveScreenWidth(w) {
  const draftWidth = 390;
  const percentage = (w / draftWidth) * 100;

  return responsiveScreenWidth(percentage);
}

function getResponsiveScreenHeight(h) {
  const draftHeight = 844;
  const percentage = (h / draftHeight) * 100;

  return responsiveScreenHeight(percentage);
}

function getResponsiveFontSize(size) {
  const percentage = size * 0.135;

  return responsiveFontSize(percentage);
}

export {
  moderateScale,
  verticalScale,
  horizontalScale,
  getDeviceHeight,
  getResponsiveScreenWidth,
  getResponsiveScreenHeight,
  getResponsiveFontSize,
};
