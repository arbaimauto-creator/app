import { CommonActions } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
// import codePush from 'react-native-code-push';
import Preference from 'react-native-default-preference';
import DeviceCountry from 'react-native-device-country';
import FastImage from 'react-native-fast-image';
import SplashScreen from 'react-native-splash-screen';
import { requestTrackingPermission } from 'react-native-tracking-transparency';
import { connect } from 'react-redux';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { Wordmark } from '../../Components/UI';
import Utils, { menuLogout } from '../../Components/utils';
import { LoadingView } from '../../Components/Views';
import { setGuest } from '../../slices/user';
import {
  appleLogin,
  facebookLogin,
  googleLogin,
  guestUser,
  kakaoLogin,
  resetToMain,
} from './commonHelperFunction';
import LoginButtons, { GuestLoginButton } from './LoginButton';
import styles from './styles';
import FEATURES from '../../Components/Constants/Features';
// import { ChannelIO } from 'react-native-channel-plugin';
import APIprovider from '../../Components/APIprovider';
import { pushNotifications } from '../../Components/services';
import deviceInfoModule from 'react-native-device-info';
import { Platform } from 'react-native';

class SignInScreen extends React.Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      isLoggingIn: props.isLoggingIn ? props.isLoggingIn : false,
      location: 'kr',
      isAppReady: true, //false,
      codePushStatus: '',
      codePushProgress: '0%',
      kakao: {
        refreshTokenExpiresAt: '',
        accessTokenExpiresAt: '',
        refreshToken: '',
        accessToken: '',
        profile: {
          id: '',
          profile_image_url: '',
          email: '',
        },
      },
    };
  }

  componentDidMount() {
    if (Platform.OS !== 'ios') {
      StatusBar.setBackgroundColor(Constants.COLOR_BACKGROUND_DARK);
      StatusBar.setBarStyle('dark-content', true);
    }

    this.props.navigation.setOptions({
      headerShown: false,
    });

    this._isMounted = true;

    Utils.checkUpdateAndAlert();

    // codePush.sync(
    //   {
    //     updateDialog: false,
    //     checkFrequency: codePush.CheckFrequency.ON_APP_START,
    //     mandatoryInstallMode: codePush.InstallMode.IMMEDIATE,
    //     installMode: codePush.InstallMode.ON_NEXT_RESTART,
    //     rollbackRetryOptions: {
    //       delayInHours: 3,
    //       maxRetryAttempts: 1,
    //     },
    //   },
    //   (status) => {
    //     switch (status) {
    //       case codePush.SyncStatus.CHECKING_FOR_UPDATE:
    //         this.setState({
    //           codePushStatus: Strings.CODEPUSH_CHECKING_FOR_UPDATE,
    //         });
    //         break;
    //       case codePush.SyncStatus.UP_TO_DATE:
    //         this.setState({ isAppReady: true });
    //         this.setState({ codePushStatus: Strings.CODEPUSH_UP_TO_DATE });
    //         break;
    //       case codePush.SyncStatus.DOWNLOADING_PACKAGE:
    //         this.setState({
    //           codePushStatus: Strings.CODEPUSH_DOWNLOADING_PACKAGE,
    //         });
    //         break;
    //       case codePush.SyncStatus.INSTALLING_UPDATE:
    //         this.setState({ codePushStatus: Strings.CODEPUSH_INSTALLING_UPDATE });
    //         break;
    //       case codePush.SyncStatus.UPDATE_INSTALLED:
    //         this.setState({ isAppReady: true });
    //         this.setState({ codePushStatus: Strings.CODEPUSH_UPDATE_INSTALLED });
    //         break;
    //       case codePush.SyncStatus.SYNC_IN_PROGRESS:
    //         this.setState({ isAppReady: true });
    //         break;
    //       case codePush.SyncStatus.AWAITING_USER_ACTION:
    //       case codePush.SyncStatus.UNKNOWN_ERROR:
    //       default:
    //         if (__DEV__) {
    //           this.setState({ isAppReady: true });
    //           break;
    //         }
    //         this.setState({ isAppReady: true });
    //         break;
    //     }
    //   },
    //   ({ receivedBytes, totalBytes }) => {
    //     this.setState({
    //       codePushProgress: `${Math.round((100 * receivedBytes) / totalBytes)}%`,
    //     });
    //   },
    // );

    // const getPermissionAndInitSingular = async function () {
    //   const trackingStatus = await requestTrackingPermission();
    //   // console.log(trackingStatus);
    //   if (trackingStatus === 'denied') {
    //   }
    // };
    // getPermissionAndInitSingular();

    Preference.get('userId').then(async (value) => {
      if (value) {
        // userName 확인을 await하지 않으면 게스트 로그아웃(NotSignedIn 리셋)과
        // 아래 MainBottom 리셋이 경쟁해 비결정적으로 동작한다.
        const userName = await Preference.get('userName');
        // 게스트는 원래 부팅 때마다 로그아웃시킨다(클로즈드 앱 원칙 — 계정 없이 상태가
        // 쌓이면 안 된다). 문제는 menuLogout이 로컬 데이터까지 지운다는 것: 테스트
        // 빌드에서 게스트로 신청해 두고 앱을 재시작하면 진행 중인 미션이 통째로 사라져
        // 수령·업로드 단계를 확인할 수 없었다. TEST_GUEST_ENTRY가 켜진 동안만 유지한다.
        if (
          userName &&
          (userName === 'greyd.guest' || userName === 'Guest') &&
          !FEATURES.TEST_GUEST_ENTRY
        ) {
          return menuLogout(this.props);
        }
        this.props.changeGuestStatus(false);

        console.log('SignInScreen() - You signed up');
        // D28: 기로그인 부팅도 게이트/온보딩 미완 분기를 태운다 (로그인 성공과 동일 경로)
        await resetToMain(this.props.navigation);
      }

      if (!__DEV__) {
        const uniqueId = await deviceInfoModule.getUniqueId();
        APIprovider.getChannelIOMemberHash({ memberId: uniqueId }).then(async (result) => {
          if (result && result.success) {
            const userAgent = await deviceInfoModule.getUserAgent();
            const userfbToken = await pushNotifications.getDeviceToken();

            // ChannelIO.boot({
            //   pluginKey: Constants.CHANNEL_IO_PLUGIN_KEY,
            //   memberId: uniqueId,
            //   memberHash: result.hash,
            //   profile: {
            //     name: uniqueId,
            //     userfbToken,
            //     userAgent,
            //   },
            // }).then(() => console.log('ChannelIO initial booted!'));
          }
        });
      }
    });
    DeviceCountry.getCountryCode().then((value) => {
      if (this._isMounted) {
        this.setState({
          location: value.code.toLowerCase() === 'kr' ? 'kr' : 'us',
        });
      }
    });
    SplashScreen.hide();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.flex4} />
          <FastImage
            source={require('../../Resources/img/icGreydSplashSymbol126.png')}
            style={styles.symbol}
          />
          <Wordmark size={32} center />
          <Text style={styles.heroTitle}>{Strings.SIGNIN_TITLE}</Text>
          <Text style={styles.heroSub}>{Strings.SIGNIN_SUB}</Text>
          <View style={styles.flex4} />
        </View>

        <View style={{ flex: 9 }}>
          {this.state.isAppReady ? (
            <View>
              {/* <Text style={styles.signinText}>{Strings.SNS_SIGN_IN}</Text> */}
              <View style={styles.signInButtonsContainer}>
                <LoginButtons
                  location={this.state.location}
                  appleLogin={() =>
                    appleLogin(this.props, (value) => this.setState({ isLoggingIn: value }))
                  }
                  kakaoLogin={() =>
                    kakaoLogin(
                      this.props,
                      (auth) => {
                        this.setState({
                          'kakao.refreshTokenExpiresAt': auth.refreshTokenExpiresAt,
                          'kakao.accessTokenExpiresAt': auth.accessTokenExpiresAt,
                          'kakao.refreshToken': auth.refreshToken,
                          'kakao.accessToken': auth.accessToken,
                        });
                      },
                      (value) => this.setState({ isLoggingIn: value }),
                    )
                  }
                  facebookLogin={() =>
                    facebookLogin(this.props, (value) => this.setState({ isLoggingIn: value }))
                  }
                  googleLogin={() =>
                    googleLogin(this.props, (value) => this.setState({ isLoggingIn: value }))
                  }
                />
              </View>

              {/* Greyd 1단계: 클로즈드 앱 — 게스트 입장은 INVITE_GATE가 켜지면 숨긴다.
                  __DEV__ 또는 TEST_GUEST_ENTRY(테스트 배포)에서만 유지 —
                  TestFlight에서 소셜 로그인 없이 전 플로우를 확인하기 위한 경로 */}
              {(!FEATURES.INVITE_GATE || __DEV__ || FEATURES.TEST_GUEST_ENTRY) && (
                <View style={styles.guestButtonsContainer}>
                  <GuestLoginButton
                    onPress={() =>
                      guestUser(this.props, (value) => this.setState({ isLoggingIn: value }))
                    }
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.checkingUpdateContainer}>
              <Text style={styles.checkingUpdate}>{this.state.codePushStatus}</Text>
              {this.state.codePushStatus === Strings.CODEPUSH_DOWNLOADING_PACKAGE && (
                <Text style={styles.checkingUpdate}>{this.state.codePushProgress}</Text>
              )}
              <ActivityIndicator size="large" color={Constants.COLOR_MAIN} />
            </View>
          )}
        </View>

        <Text style={styles.arbaimFooter}>{Strings.ARBAIM_INC}</Text>

        {this.state.isLoggingIn && <LoadingView message={''} opacity={0.5} />}
      </View>
    );
  }
}
export default connect(null, (dispatch) => ({
  changeGuestStatus: (isGuest) => dispatch(setGuest({ isGuest })),
}))(SignInScreen);
