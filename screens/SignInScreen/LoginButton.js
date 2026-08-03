import React from 'react';
import { Platform, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Strings, { getLanguage } from '../../Components/Strings';
import Constants from '../../Components/Constants';

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
        <FastImage
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

const styles = StyleSheet.create({
  kakaoContainer: {
    height: 50,
    width: '80%',
    marginBottom: 10,
    backgroundColor: '#fee500',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  kakaoLogo: { position: 'absolute', left: 20, width: 20, height: 18, marginRight: 10 },
  kakaoLoginText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, .85)',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    lineHeight: 20,
  },
  fbContainer: {
    height: 50,
    width: '80%',
    marginBottom: 10,
    backgroundColor: '#1877F2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fbLogo: { position: 'absolute', left: 20, width: 20, height: 20, marginRight: 10 },
  fbLoginText: {
    fontSize: 16,
    color: 'white',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    lineHeight: 20,
  },

  googleContainer: {
    height: 50,
    width: '80%',
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLogo: { position: 'absolute', left: 20, width: 20, height: 20, marginRight: 10 },
  googleLoginText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, .54)',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    lineHeight: 20,
  },
  appleContainer: {
    height: 50,
    width: '80%',
    marginBottom: 10,
    backgroundColor: 'black',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleLogo: { position: 'absolute', left: 20, width: 20, height: 20, marginRight: 10 },
  appleLoginText: {
    fontSize: 16,
    color: 'white',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    lineHeight: 20,
  },
  guestLoginText: {
    marginTop: Platform.OS !== 'ios' ? 20 : 0,
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    color: 'rgba(0, 0, 0, .54)',
    lineHeight: 20,
  },
});

export default LoginButtons;
