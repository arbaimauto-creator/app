import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Strings, { getLanguage } from '../../Components/Strings';
import Constants from '../../Components/Constants';
import T from '../../Components/Constants/DesignTokens';

const LoginButtons = (props) => {
  const { kakaoLogin, facebookLogin, googleLogin, appleLogin } = props;

  const KakaoLoginButton = (
    <TouchableWithoutFeedback key={'KakaoLoginButton'} onPress={() => kakaoLogin()}>
      <View style={styles.kakaoContainer}>
        <FastImage source={require('./kakao-logo.png')} style={styles.kakaoLogo} />
        <Text style={styles.kakaoLoginText}>{Strings.SIGN_IN_WITH_KAKAO}</Text>
      </View>
    </TouchableWithoutFeedback>
  );

  const FacebookLoginButton = (
    <TouchableWithoutFeedback key={'FacebookLoginButton'} onPress={() => facebookLogin()}>
      <View style={styles.fbContainer}>
        {/* iOS 26: FastImage tintColor가 크기 0 이미지에서 예외를 던져 첫 화면이 비었다 — 틴트는 RN Image로 (2026-09-15) */}
        <Image
          source={require('../../Resources/img/icLoginFacebook30.png')}
          style={styles.fbLogo}
        />
        <Text style={styles.fbLoginText}>{Strings.SIGN_IN_WITH_FACEBOOK}</Text>
      </View>
    </TouchableWithoutFeedback>
  );

  const GoogleLoginButton = (
    <TouchableWithoutFeedback
      key={'GoogleLoginButton'}
      onPress={() => {
        googleLogin();
      }}
    >
      <View style={styles.googleContainer}>
        <FastImage source={require('./google-logo.png')} style={styles.googleLogo} />
        <Text style={styles.googleLoginText}>{Strings.SIGN_IN_WITH_GOOGLE}</Text>
      </View>
    </TouchableWithoutFeedback>
  );

  const AppleLoginButton =
    Platform.OS === 'ios' ? (
      <TouchableWithoutFeedback key={'OS'} onPress={() => appleLogin()}>
        <View style={styles.appleContainer}>
          <FastImage
            source={require('../../Resources/img/icLoginApple30.png')}
            style={styles.appleLogo}
          />
          <Text style={styles.appleLoginText}>{Strings.SIGN_IN_WITH_APPLE}</Text>
        </View>
      </TouchableWithoutFeedback>
    ) : null;

  // return props.location === 'kr'
  return getLanguage() === 'ko'
    ? [KakaoLoginButton, GoogleLoginButton, FacebookLoginButton, AppleLoginButton]
    : [GoogleLoginButton, FacebookLoginButton, AppleLoginButton, KakaoLoginButton];
};

export function GuestLoginButton({ onPress }) {
  return (
    <TouchableWithoutFeedback key={'GuestLoginButton'} onPress={() => onPress()}>
      {/* <View style={styles.signInButtonContainer}>
        <FastImage
          source={require('../../Resources/img/guest.png')}
          style={{ ...styles.signInButton, width: 21, height: 21 }}
        />
      </View> */}
      <Text style={styles.guestLoginText}>{Strings.SIGN_IN_WITH_GUEST}</Text>
    </TouchableWithoutFeedback>
  );
}

// 신규 디자인 토큰 기반 리스타일 — 브랜드 컬러(카카오/FB)는 각사 가이드 유지,
// 라운드·높이·타이포만 게이트/홈 버튼과 통일
const btnBase = {
  height: 52,
  width: '84%',
  marginBottom: 10,
  borderRadius: T.RADIUS.BTN,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
};
const btnText = {
  fontSize: 15,
  fontFamily: T.FONT.SemiBold,
  lineHeight: 20,
};

const styles = StyleSheet.create({
  // 카카오도 고스트로 통일 — 브랜드 식별은 말풍선 글리프가 담당 (원색 노랑이 앰버 포인트와 충돌)
  kakaoContainer: {
    ...btnBase,
    backgroundColor: T.COLORS.SURFACE,
    borderWidth: 1,
    borderColor: T.COLORS.LINE,
  },
  kakaoLogo: { position: 'absolute', left: 20, width: 20, height: 18, marginRight: 10 },
  kakaoLoginText: { ...btnText, color: T.COLORS.DARK },
  // FB 파랑이 화면에서 과하게 튀어 고스트로 톤다운 — 로고 색으로만 브랜드 식별
  fbContainer: {
    ...btnBase,
    backgroundColor: T.COLORS.SURFACE,
    borderWidth: 1,
    borderColor: T.COLORS.LINE,
  },
  // 원본 로고가 흰색이라 고스트 배경에선 FB 브랜드 파랑으로 틴트
  fbLogo: {
    position: 'absolute',
    left: 20,
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#1877F2',
  },
  fbLoginText: { ...btnText, color: T.COLORS.DARK },
  googleContainer: {
    ...btnBase,
    backgroundColor: T.COLORS.SURFACE,
    borderWidth: 1,
    borderColor: T.COLORS.LINE,
  },
  googleLogo: { position: 'absolute', left: 20, width: 20, height: 20, marginRight: 10 },
  googleLoginText: { ...btnText, color: T.COLORS.DARK },
  appleContainer: { ...btnBase, backgroundColor: T.COLORS.INK },
  appleLogo: { position: 'absolute', left: 20, width: 20, height: 20, marginRight: 10 },
  appleLoginText: { ...btnText, color: 'white' },
  guestLoginText: {
    marginTop: Platform.OS !== 'ios' ? 20 : 0,
    fontSize: 13.5,
    fontFamily: T.FONT.SemiBold,
    color: T.COLORS.GREY,
    lineHeight: 20,
  },
});

export default LoginButtons;
