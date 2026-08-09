import { CommonActions } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Keyboard,
  LayoutAnimation,
  NativeModules,
  Platform,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import ImagePicker from 'react-native-image-crop-picker';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { moderateScale } from '../../Components/utils/scailing';
import BottomButton from './BottomButton';
import Country from './Country';
import SetEmail from './SetEmail';
import SetIntroduction from './SetIntroduction';
import SetName from './SetName';
import SetProfilePic from './SetProfilePic';
import SetUserInstagramId from './SetUserInstagramId';
import styles from './styles';
import { accountRegistrationFBPixel } from '../../Components/utils';

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function DescriptionTitle({ context }) {
  return <Text style={styles.descriptionTitle}>{Strings.SIGN_UP_TO_GREYD}</Text>;
}

export default class SignUpScreen extends React.Component {
  constructor(props) {
    super(props);
    const { authType, authData, email, phone } = this.props.route.params;
    this.state = {
      instagramId: undefined,
      countryCode: undefined,
      email: email,
      phone: phone,
      name: '',
      profilePicUri: this.props.route.params.profilePicUrl,
      profilePicType: null,
      introduction: '',
      authType: authType,
      authData: authData,
      isSubmitting: false,
      isCompleted: false,
      wrongIdReason: Strings.CHECK_USER_ID,
    };

    props.navigation.setOptions({
      title: Strings.SET_PROFILE,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });
  }

  componentDidMount() {}

  async onPressSubmitButton() {
    const result = await APIprovider.checkDuplicateId(this.state.name);
    if (this.props.route.params.name !== this.state.name) {
      if (result && !result.success) {
        Alert.alert(result.message);
        return;
      }
    }

    const {
      email,
      phone,
      name,
      age,
      authType,
      authData,
      profilePicUri,
      profilePicType,
      countryCode,
      instagramId,
    } = this.state;
    this.setState({ isSubmitting: true });

    let value = phone ? phone.match(/\d+/g).join('') : '';
    value = value
      ? value.length > 10
        ? value
            .match(/\d+/g)
            .join('')
            .replace(/(\d{3})\-?(\d{4})\-?(\d{1})/, '$1-$2-$3')
        : value
            .match(/\d+/g)
            .join('')
            .replace(/(\d{3})\-?(\d{3})\-?(\d{1})/, '$1-$2-$3')
      : '';

    const profile = {
      phone: value,
      email: email,
      name: name,
      age: age,
      authType: authType,
      authData: authData,
      profilePicUri: profilePicUri,
      profilePicType: profilePicType,
      countryCode: countryCode,
      instagramId: instagramId,
    };

    APIprovider.signUp(profile)
      .then(async (result) => {
        // 실패도 resolve되므로 세션 기록 전에 판정 (실패 시 유령 로그인 방지)
        if (APIprovider.isFailure(result) || !result._id) {
          if (result?.errorCode === 2) {
            Alert.alert(Strings.EXIST_ID, Strings.TRY_OTHER_ID, [{ text: Strings.OK }], {
              cancelable: true,
            });
          } else {
            Alert.alert(
              Strings.FAILED_TO_EDIT_PROFILE,
              result?.errorMsg || result?.message || '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          }
          this.setState({ isSubmitting: false });
          return;
        }
        await Preference.set('userId', result._id);
        Preference.set('userName', result.name);
        // Preference.set('userIsSeller', 'false');
        Preference.set('userIsSeller', '');
        Preference.set('userAccessToken', authData.requesterToken);
        this.props.route.params.setLogonUserId(result._id);
        this.props.route.params.setLogonUserName(result.name);
        // this.props.route.params.setLogonUserIsSeller('false');
        this.props.route.params.setLogonUserIsSeller('');
        this.setState({
          isSubmitting: false,
          isCompleted: true,
        });
        LayoutAnimation.easeInEaseOut();
        Keyboard.dismiss();

        accountRegistrationFBPixel(profile);

        this.props.navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'MainBottom' }],
          }),
        );
      })
      .catch((err) => {
        if (err.errorCode === 2) {
          Alert.alert(Strings.EXIST_ID, Strings.TRY_OTHER_ID, [{ text: Strings.OK }], {
            cancelable: true,
          });
        } else {
          Alert.alert(
            Strings.FAILED_TO_EDIT_PROFILE,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        }
        this.setState({ isSubmitting: false });
      });
  }

  openPicker() {
    ImagePicker.openPicker({
      multiple: false,
      mediaType: 'photo',
    })
      .then((image) => {
        this.setState({
          profilePicUri: image.path,
          profilePicType: image.mime,
        });
      })
      .catch((err) => console.log(err.toString()));
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          <Text style={styles.fieldProfileGuidelines}>{Strings.PROFILE_GUIDELINES}</Text>
          <DescriptionTitle context={this} />
          <SetProfilePic context={this} />
          <SetName context={this} />
          <View style={styles.divider} />
          <Country context={this} />
          <View style={styles.divider} />
          <SetIntroduction context={this} />
          <View style={styles.divider} />
          <SetEmail context={this} />
          <View style={styles.divider} />
          <SetUserInstagramId context={this} />
          <View style={styles.divider} />
          <View style={{ marginBottom: 100 }} />
        </KeyboardAvoidingView>
        <BottomButton context={this} />
      </SafeAreaView>
    );
  }
}
