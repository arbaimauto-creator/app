import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { logout as KakaoLogout } from '@react-native-seoul/kakao-login';
import { CommonActions } from '@react-navigation/routers';
import React, { PureComponent } from 'react';
import {
  Alert,
  Keyboard,
  NativeModules,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import Toast from 'react-native-easy-toast';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import { getStatusBarHeight } from 'react-native-safearea-height';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import { moderateScale } from './utils/scailing';

let toastRef;

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function WithdrawalDescription({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.CANCEL_MEMBERSHIP_REASON_SECTION_TITLE}</Text>
        <Text style={styles.dataLength}>
          {context.state.description.length}/{Constants.MAX_LENGTH_REVIEW_DESCRIPTION}
        </Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={{
          ...styles.textInput,
          textAlignVertical: 'top',
          paddingHorizontal: 10,
          paddingVertical: 5,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: Constants.TIER_COLORS.STRIVER,
          minHeight: 100,
        }}
        borderRadius={5}
        multiline={true}
        scrollEnabled={false}
        placeholder={Strings.CANCEL_MEMBERSHIP_REASON_SECTION_PLACEHOLDER}
        placeholderTextColor={Constants.TIER_COLORS.OPERATOR}
        onChangeText={(description) => context.setState({ description })}
        value={context.state.description}
        maxLength={Constants.MAX_LENGTH_REVIEW_DESCRIPTION}
      />
    </View>
  );
}

function SubmitButton({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <Button
        containerStyle={{
          marginHorizontal: 20,
        }}
        buttonStyle={{
          backgroundColor: Constants.COLOR_POINT_BLUE,
          height: 45,
        }}
        titleStyle={{
          color: Constants.COLOR_BACKGROUND_DARK,
          fontSize: 18,
          fontWeight: 'bold',
        }}
        title={Strings.CANCEL_MEMBERSHIP_SUBMIT_BUTTON}
        onPress={context.onPressSubmitButton.bind(context)}
      />
    </View>
  );
}

export default class MembershipWithdrawalPage extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      description: '',
      isSubmitting: false,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.CANCEL_MEMBERSHIP_REASON_PAGE_TITLE,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });
  }

  onPressSubmitButton() {
    Keyboard.dismiss();
    if (this.state.isSubmitting) {
      return;
    }
    const validation = (condition, message) => {
      if (!condition) {
        Alert.alert('', Strings.CANCEL_MEMBERSHIP_REASON_SECTION_ALERT, [{ text: Strings.OK }], {
          cancelable: true,
        });
        return false;
      }
      return true;
    };
    if (!validation(this.state.description !== '', Strings.INPUT_REVIEW_DESCRIPTION)) {
      return false;
    }
    // Submit, navigation pop 등
    // this.props.route.params.logonUserId
    Alert.alert(
      Strings.CANCEL_MEMBERSHIP_CHECK_ALERT_TITLE,
      Strings.CANCEL_MEMBERSHIP_CHECK_ALERT_BODY,
      [
        {
          text: Strings.CANCEL,
          onPress: () => {
            console.log('Cancel Pressed');
          },
          style: 'cancel',
        },
        {
          text: Strings.CANCEL_MEMBERSHIP_CHECK_ALERT_SUBMIT_BUTTON,
          onPress: () => {
            APIprovider.cancelMembership(
              this.props.route.params.logonUserId,
              this.state.description,
            )
              .then((result) => {
                if (result.success === true) {
                  Alert.alert(
                    Strings.CANCEL_MEMBERSHIP_SUCCESS_TITLE,
                    Strings.CANCEL_MEMBERSHIP_SUCCESS_BODY,
                    [
                      {
                        text: Strings.OK,
                        onPress: () => {
                          const authType = Preference.get('userAuthType').then(() => {
                            if (authType === 'kakao') {
                              KakaoLogout();
                            } else if (authType === 'facebook') {
                            } else if (authType === 'google') {
                              GoogleSignin.signOut();
                            } else if (authType === 'apple') {
                            }
                          });
                          APIprovider.clearRequester();
                          Preference.set('userId', null);
                          Preference.set('userName', '');
                          Preference.set('userProfilePicUrl', '');
                          // Preference.set('userIsSeller', 'false');
                          Preference.set('userIsSeller', '');
                          Preference.set('userAccessToken', null);
                          Preference.set('userAuthType', null);
                          Preference.set('makeOrderBuyerName', null);
                          Preference.set('makeOrderBuyerPhone', null);
                          Preference.set('makeOrderBuyerEmail', null);
                          Preference.set('makeOrderBuyerMemo', null);
                          Preference.set('makeOrderReceiverName', null);
                          Preference.set('makeOrderReceiverPhone', null);
                          Preference.set('makeOrderAddress', null);
                          this.props.route.params.setLogonUserId(null);
                          this.props.route.params.setLogonUserName('');
                          this.props.route.params.setLogonUserProfilePicUrl('');
                          // this.props.route.params.setLogonUserIsSeller('false');
                          this.props.route.params.setLogonUserIsSeller('');
                          this.props.navigation.navigate('NotSignedIn');
                          this.props.navigation.dispatch(
                            CommonActions.reset({
                              index: 0,
                              routes: [{ name: 'NotSignedIn' }],
                            }),
                          );
                        },
                      },
                    ],
                  );
                } else {
                  Alert.alert(
                    Strings.CANCEL_MEMBERSHIP_FAIL_TITLE,
                    Strings.CANCEL_MEMBERSHIP_FAIL_BODY,
                    [
                      {
                        text: Strings.OK,
                        onPress: () => {},
                      },
                    ],
                  );
                }
              })
              .catch((err) => {
                console.log(err);
                Alert.alert(
                  Strings.CANCEL_MEMBERSHIP_FAIL_TITLE,
                  Strings.CANCEL_MEMBERSHIP_FAIL_BODY,
                  [
                    {
                      text: Strings.OK,
                      onPress: () => {},
                    },
                  ],
                );
              });
          },
        },
      ],
      { cancelable: false },
    );
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            enableResetScrollToCoords={false}
            style={styles.container}
          >
            <View style={{ marginTop: Platform.OS === 'ios' ? 0 : 20 }} />
            <WithdrawalDescription context={this} />
            <SubmitButton context={this} />
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
        <Toast
          ref={(ref) => {
            toastRef = ref;
          }}
          fadeInDuration={100}
          fadeOutDuration={1900}
          position={'bottom'}
          style={{
            backgroundColor: Constants.TIER_COLORS.ARTISAN,
            borderRadius: 20,
            paddingHorizontal: 20,
            bottom: getStatusBarHeight(),
          }}
          opacity={0.9}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 16,
  },
  dataLength: {
    marginLeft: 6,
    fontSize: 12,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  textInput: {
    paddingHorizontal: 10,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
    marginHorizontal: 20,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginLeft: 4,
  },
});
