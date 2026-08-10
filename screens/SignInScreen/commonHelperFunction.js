import appleAuth, { AppleAuthError } from '@invertase/react-native-apple-authentication';
import firebaseAuth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import {
  login as KakaoLogin,
  logout as KakaoLogout,
  getProfile as getKakaoProfile,
} from '@react-native-seoul/kakao-login';
import { CommonActions } from '@react-navigation/native';
import { Alert } from 'react-native';
import Preference from 'react-native-default-preference';
import { getModel, getSystemName, getSystemVersion, getUniqueId } from 'react-native-device-info';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import FEATURES from '../../Components/Constants/Features';
import Strings, { getLanguage } from '../../Components/Strings';
import { pushNotifications } from '../../Components/services';
import { store } from '../../redux/store';
import { setGuest } from '../../slices/user';
// import { ChannelIO } from 'react-native-channel-plugin';

// 탈퇴 계정 안내 Alert — 5개 로그인 경로에 동일 블록이 복붙돼 있던 것을 통합
const showDeletedAccountAlert = (onConfirm = () => {}) => {
  Alert.alert(Strings.SIGNIN_ALERT_CANCEL_MEMBERSHIP_TITLE, Strings.SIGNIN_ALERT_CANCEL_MEMBERSHIP_BODY, [
    { text: Strings.OK, onPress: onConfirm },
  ]);
};

// 게스트 로그인용 고정 인증 페이로드 — 두 함수에 1.5KB 리터럴이 복붙돼 있던 것을 상수화
const GUEST_AUTH_DATA_JSON =
  '{"idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhjMjdkYjRkMTNmNTRlNjU3ZDI2NWI0NTExMDA4MGI0ODhlYjQzOGEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI5MzkyNjY0NDI2MDAtdWRrNTdrcGhuc2o4NzdpZm43Y2o0aTVhZ2QybTQ2MnAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI5MzkyNjY0NDI2MDAtcGRyNGxjYzAyaGFsZ3R1MDVxbnFkbzY4cGtzZHFubW8uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDYyMDQ4NTMxNTgyMzU5OTE3NzciLCJlbWFpbCI6ImFyYmFpbS5ndWVzdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IjMwNjJ0TkRQQUpqN0d0RzJjX0s5WnciLCJub25jZSI6IklvY0tGRzJjdU1DY2dWeXQzTFZIVU9CQ25sckp6RnNoQVI5cWJoaEtIdDAiLCJuYW1lIjoiZ3Vlc3QgYXJiYWltIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FFZEZUcDd4ZlFFbzZHV0Q1WnY2aFAzeXlOWGdYTmg1WFZSX1d5akFHRDJGPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6Imd1ZXN0IiwiZmFtaWx5X25hbWUiOiJhcmJhaW0iLCJsb2NhbGUiOiJrbyIsImlhdCI6MTY3MTUxOTE5OSwiZXhwIjoxNjcxNTIyNzk5fQ.Y1Oe8q7tePUX83hCFMq1W9n-znECsTe-vyOKmyZbeOPWw9OB7kt5pF_X-oyfZ4NSvMYdhPxqw0taibzvycbOU8sdKCEdzjUdUx58beK6k9MwNW8ae9pbST161ReuJ2GLU859dga9voXYlSEmVMWYvHbNZ8z1giMDr2T9dAmkjjKdJxUrh_8bQfRYgGfB4P0nXKzdGB87yOpOl-YVD_MWK5jC0qQD05XQbQm9DL0xDEDM5yK7Die8C-7rArMScusmhQAJcf-y2PZjTbU_nFhsiMxAstsHyr_nSGtamlonzSOcT8EUQsX08pOJo-AWxjVC-PGMR61xnPIztK0C18dFPA", "scopes": ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile", "openid"], "serverAuthCode": "4/0AWgavddzx2sfd8bxLEje6pN91f-pNi7i7r2IxgDR9vQKZyXiUSMhSWYyghWRmyJNXL2lXA", "user": {"email": "arbaim.guest@gmail.com", "familyName": "arbaim", "givenName": "guest", "id": "106204853158235991777", "name": "guest arbaim", "photo": "https://lh3.googleusercontent.com/a/AEdFTp7xfQEo6GWD5Zv6hP3yyNXgXNh5XVR_WyjAGD2F=s120"}}';

const logCallback = (log, callback) => {
  console.log(log);
  callback;
};

// 5개 로그인 경로에 반복되던 성공 처리 공통부.
// accessToken은 provider별 토큰 필드(apple=authorizationCode, kakao/google=requesterToken 등)를 호출부에서 넘긴다.
const persistLoginSession = async (result, { authType, accessToken }) => {
  APIprovider.setRequester(accessToken, result._id);
  // 정식 로그인 성공 시 게스트 플래그를 반드시 해제한다 (isGuestUser 판정에 사용됨)
  store.dispatch(setGuest({ isGuest: false }));
  await Preference.set('userId', result._id);
  await Preference.set('userName', result.name);
  await Preference.set('userProfilePicUrl', result.profilePicUrl);
  await Preference.set('userIsSeller', result.sellerStatus?.toString() ?? '');
  await Preference.set('userAccessToken', accessToken);
  await Preference.set('userAuthType', authType);
  await Preference.set(
    'agreementToTermsOfService',
    result.agreementToTermsOfService?.toString() ?? 'false',
  );
  const currency = await APIprovider.getCurrencyRate('USD');
  // 환율 조회 실패가 로그인 실패로 이어지지 않도록 방어 (기존: currencyRate.toString() TypeError)
  if (currency?.currencyRate) {
    await Preference.set('KRW/USD', currency.currencyRate.toString());
  }
};

const applyLogonUser = (
  result,
  { setLogonUserId, setLogonUserName, setLogonUserProfilePicUrl, setLogonUserIsSeller },
) => {
  setLogonUserId(result._id);
  setLogonUserName(result.name);
  setLogonUserProfilePicUrl(result.profilePicUrl);
  setLogonUserIsSeller(result.sellerStatus.toString());
};

const resetToMain = async (navigation) => {
  // Greyd 1단계(v2 §3-②): 초대 역할이 없으면 메인 대신 게이트로 — 기존 계정도 1회 통과
  if (FEATURES.INVITE_GATE) {
    const inviteRole = await Preference.get('inviteRole');
    if (!inviteRole) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'InviteGate' }],
        }),
      );
      return;
    }
  }
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'MainBottom' }],
    }),
  );
};

// export const bootChannelIO = async (result) => {
//   const hashResult = await APIprovider.getChannelIOMemberHash({
//     memberId: result.memberId || result.name,
//   });

//   if (hashResult && hashResult.success) {
//     const userfbToken = await pushNotifications.getDeviceToken();

//     ChannelIO.boot({
//       pluginKey: Constants.CHANNEL_IO_PLUGIN_KEY,
//       memberId: result.memberId || result.name,
//       memberHash: hashResult.hash,
//       profile: { userfbToken, ...result },
//     }).then((bootResult) => console.log('booted success!'));
//   }
// };

export const appleLogin = async (props, setLoggingIn) => {
  const navigation = props.navigation;
  const { setLogonUserId, setLogonUserName, setLogonUserProfilePicUrl, setLogonUserIsSeller } =
    props.route.params;
  try {
    // performs login request
    let authData = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
    // user is authenticated
    // (선언 전 접근 TDZ 버그 수정 — 애플 로그인이 조용히 실패하던 원인)
    const requesterToken = authData.authorizationCode;
    authData.requesterToken = requesterToken;
    setLoggingIn(true);
    APIprovider.login('apple', authData)
      .then(async (result) => {
        if (result.statusCode === Constants.USER_STATUS_CODE.NOT_MEMBER_YET) {
          navigation.navigate('AgreementToSignUp', {
            authType: 'apple',
            authData: authData,
            email: authData.email,
          });
        } else if (result.isDeleted) {
          showDeletedAccountAlert(() => {});
        } else {
          await persistLoginSession(result, { authType: 'apple', accessToken: requesterToken });
          applyLogonUser(result, {
            setLogonUserId,
            setLogonUserName,
            setLogonUserProfilePicUrl,
            setLogonUserIsSeller,
          });

          if (!__DEV__) {
            // await bootChannelIO({ ...result, memberId: getUniqueIdSync() });
          }

          resetToMain(navigation);
        }
        setLoggingIn(false);
      })
      .catch((err) => {
        setLoggingIn(false);
        Alert.alert(Strings.LOGIN_FAILED, Strings.RETRY_GUIDELINES, [{ text: Strings.OK }], {
          cancelable: true,
        });
        console.error(err);
      });
    //        }
  } catch (error) {
    console.log('apple login error: ', error);
    if (error.code === AppleAuthError.CANCELED) {
      // user cancelled Apple Sign-in
    } else {
      // other unknown error
    }
  }
};

export const kakaoLogin = (props, onSucces, setLoggingIn) => {
  const navigation = props?.navigation;
  const { setLogonUserId, setLogonUserName, setLogonUserProfilePicUrl, setLogonUserIsSeller } =
    props?.route?.params;

  KakaoLogin()
    .then((auth) => {
      onSucces(auth);

      getKakaoProfile()
        .then((profile) => {
          const authData = {
            ...auth,
            ...profile,
            requesterToken: auth.accessToken,
          };
          setLoggingIn(true);
          APIprovider.login('kakao', authData)
            .then(async (result) => {
              if (result.statusCode === Constants.USER_STATUS_CODE.NOT_MEMBER_YET) {
                navigation.navigate('AgreementToSignUp', {
                  authType: 'kakao',
                  authData: authData,
                  email: profile.email,
                  profilePicUrl: profile.profile_image_url,
                });
              } else if (result.isDeleted) {
                showDeletedAccountAlert(() => {
                        KakaoLogout();
                      });
              } else {
                await persistLoginSession(result, {
                  authType: 'kakao',
                  accessToken: authData.requesterToken,
                });
                applyLogonUser(result, {
                  setLogonUserId,
                  setLogonUserName,
                  setLogonUserProfilePicUrl,
                  setLogonUserIsSeller,
                });

                if (!__DEV__) {
                  // await bootChannelIO({ ...result, memberId: getUniqueIdSync() });
                }

                resetToMain(navigation);
              }
              setLoggingIn(false);
            })
            .catch((err) => {
              setLoggingIn(false);
              Alert.alert(Strings.LOGIN_FAILED, Strings.RETRY_GUIDELINES, [{ text: Strings.OK }], {
                cancelable: true,
              });
            });
        })
        .catch((err) => {
          logCallback(`Get Profile Failed:${err.code} ${err.message}`);
        });
    })
    .catch((err) => {
      if (err.code === 'E_CANCELLED_OPERATION') {
        console.log(`Login Cancelled:${err.message}`);
      } else {
        console.log(`Login Failed:${err.code} ${err.message}`);
      }
    });
};

export const facebookLogin = (props, setLoggingIn) => {
  const navigation = props.navigation;
  const { setLogonUserId, setLogonUserName, setLogonUserProfilePicUrl, setLogonUserIsSeller } =
    props.route.params;
  LoginManager.logInWithPermissions(['public_profile', 'email']).then(
    function (result) {
      if (result.isCancelled) {
        console.log('Login cancelled');
      } else {
        console.log('Login success with permissions: ' + result.grantedPermissions.toString());

        AccessToken.getCurrentAccessToken().then((authData) => {
          const requesterToken = authData.accessToken;
          setLoggingIn(true);
          APIprovider.login('facebook', authData)
            .then(async (loginResult) => {
              if (loginResult.statusCode === Constants.USER_STATUS_CODE.NOT_MEMBER_YET) {
                navigation.navigate('AgreementToSignUp', {
                  authType: 'facebook',
                  authData: { ...authData, requesterToken: requesterToken },
                  email: authData.email,
                  profilePicUrl: authData.profilePic,
                });
              } else if (loginResult.isDeleted) {
                showDeletedAccountAlert(() => {});
              } else {
                await persistLoginSession(loginResult, {
                  authType: 'facebook',
                  accessToken: requesterToken,
                });
                applyLogonUser(loginResult, {
                  setLogonUserId,
                  setLogonUserName,
                  setLogonUserProfilePicUrl,
                  setLogonUserIsSeller,
                });

                if (!__DEV__) {
                  // await bootChannelIO({ ...result, memberId: getUniqueIdSync() });
                }

                resetToMain(navigation);
              }
              setLoggingIn(false);
            })
            .catch((err) => {
              setLoggingIn(false);
              Alert.alert(Strings.LOGIN_FAILED, Strings.RETRY_GUIDELINES, [{ text: Strings.OK }], {
                cancelable: true,
              });
              console.error(err);
            });
        });
      }
    },
    function (error) {
      console.log('Login fail with error: ' + error);
      if (AccessToken.getCurrentAccessToken() != null) {
        LoginManager.logOut();
        Alert.alert(Strings.LOGIN_FAILED, Strings.RETRY_GUIDELINES, [{ text: Strings.OK }], {
          cancelable: true,
        });
      }
    },
  );
};

export const googleAnonymousSignIn = async () => {
  const result = await firebaseAuth().signInAnonymously();

  console.log(result, result.user.providerData, result.user.metadata);
  // TODO: change guest login logic sync with backend
};

export const googleLogin = async (props, setLoggingIn) => {
  const navigation = props.navigation;
  const { setLogonUserId, setLogonUserName, setLogonUserProfilePicUrl, setLogonUserIsSeller } =
    props.route.params;
  GoogleSignin.configure({
    webClientId: '939266442600-pdr4lcc02halgtu05qnqdo68pksdqnmo.apps.googleusercontent.com',
  });

  try {
    await GoogleSignin.hasPlayServices();
    let authData = await GoogleSignin.signIn();

    authData.requesterToken = authData.idToken;
    setLoggingIn(true);
    APIprovider.login('google', authData)
      .then(async (result) => {
        if (result.statusCode === Constants.USER_STATUS_CODE.NOT_MEMBER_YET) {
          navigation.navigate('AgreementToSignUp', {
            authType: 'google',
            authData: authData,
            email: authData.user.email,
            profilePicUrl: authData.user.photo,
          });
        } else if (result.isDeleted) {
          showDeletedAccountAlert(() => {
                  GoogleSignin.signOut();
                });
        } else {
          await persistLoginSession(result, {
            authType: 'google',
            accessToken: authData.requesterToken,
          });
          applyLogonUser(result, {
            setLogonUserId,
            setLogonUserName,
            setLogonUserProfilePicUrl,
            setLogonUserIsSeller,
          });

          if (!__DEV__) {
            // await bootChannelIO({ ...result, memberId: getUniqueIdSync() });
          }

          resetToMain(navigation);
        }
        setLoggingIn(false);
      })
      .catch((err) => {
        setLoggingIn(false);
        console.error(err);
        Alert.alert(Strings.LOGIN_FAILED, Strings.RETRY_GUIDELINES, [{ text: Strings.OK }], {
          cancelable: true,
        });
      });
  } catch (error) {
    console.error('google signin err', error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled the login flow
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // operation (e.g. sign in) is in progress already
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // play services not available or outdated
    } else {
      // some other error happened
    }
  }
};

export const guestUser = async (props, setLoggingIn, isDynamicLink = false) => {
  const navigation = props.navigation;
  const { setLogonUserId, setLogonUserName, setLogonUserProfilePicUrl, setLogonUserIsSeller } =
    props.route.params;
  GoogleSignin.configure({
    webClientId: '939266442600-pdr4lcc02halgtu05qnqdo68pksdqnmo.apps.googleusercontent.com',
  });

  try {
    setLoggingIn(true);

    const authData = JSON.parse(GUEST_AUTH_DATA_JSON);
    // console.log('AUTH_data_PROVIDER', authData);
    APIprovider.login('google', authData)
      .then(async (result) => {
        // console.log('IS_DELETED', result);
        if (result.statusCode === Constants.USER_STATUS_CODE.NOT_MEMBER_YET) {
          navigation.navigate('AgreementToSignUp', {
            authType: 'google',
            authData: authData,
            email: authData.user.email,
            profilePicUrl: authData.user.photo,
          });
        } else if (result.isDeleted) {
          showDeletedAccountAlert(() => {
                  GoogleSignin.signOut();
                });
        } else {
          await persistLoginSession(result, { authType: 'google', accessToken: authData.idToken });
          applyLogonUser(result, {
            setLogonUserId,
            setLogonUserName,
            setLogonUserProfilePicUrl,
            setLogonUserIsSeller,
          });

          if (!__DEV__) {
            // await bootChannelIO({ name: getUniqueIdSync() });
          }

          if (!isDynamicLink) {
            resetToMain(navigation);
          }
        }
        setLoggingIn(false);
        store.dispatch(setGuest({ isGuest: true }));

        setGuestDeviceInfo();
      })
      .catch((err) => {
        setLoggingIn(false);
        console.error(err);
        Alert.alert(Strings.LOGIN_FAILED, Strings.RETRY_GUIDELINES, [{ text: Strings.OK }], {
          cancelable: true,
        });
      });
  } catch (error) {
    console.error('google signin err', error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled the login flow
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // operation (e.g. sign in) is in progress already
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // play services not available or outdated
    } else {
      // some other error happened
    }
  }
};

export const loginWithGuest = async () => {
  GoogleSignin.configure({
    webClientId: '939266442600-pdr4lcc02halgtu05qnqdo68pksdqnmo.apps.googleusercontent.com',
  });

  const authData = JSON.parse(GUEST_AUTH_DATA_JSON);

  const loginResult = await APIprovider.login('google', authData);

  APIprovider.setRequester(authData.idToken, loginResult._id);
  await Preference.set('userId', loginResult._id);
  await Preference.set('userName', loginResult.name);
  await Preference.set('userProfilePicUrl', loginResult.profilePicUrl);
  await Preference.set('userIsSeller', loginResult.sellerStatus.toString());
  await Preference.set('userAccessToken', authData.idToken);
  await Preference.set('userAuthType', 'google');
  const currency = await APIprovider.getCurrencyRate('USD');
  await Preference.set('KRW/USD', currency.currencyRate.toString());

  store.dispatch(setGuest({ isGuest: true }));

  if (!__DEV__) {
    // await bootChannelIO({ name: getUniqueIdSync() });
  }

  setGuestDeviceInfo();
};

async function setGuestDeviceInfo() {
  const os = await getSystemName();
  const osVersion = await getSystemVersion();
  const model = await getModel();
  const uniqueId = await getUniqueId();
  const deviceToken = await pushNotifications.getDeviceToken();

  await APIprovider.setGuestDeviceInfo({
    os,
    osVersion,
    model,
    deviceToken,
    uniqueId,
    locale: getLanguage(),
  });
}
