import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CountryPicker, { DEFAULT_THEME } from 'react-native-country-picker-modal';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import IconFeather from 'react-native-vector-icons/Feather';
import UserProfilePicView from '../screens/UserPageScreen/UserProfilePicView';
import APIprovider from './APIprovider';
import Constants from './Constants';
import T from './Constants/DesignTokens';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import { getLanguage } from './Strings/index';
import Utils from './utils';
import { moderateScale } from './utils/scailing';
import { LoadingView } from './Views';

function ProfilePic({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <TouchableOpacity
        onPress={() => {
          Utils.checkPermissionToAccessGallery()
            .then(() => context.openPicker())
            .catch((err) => Alert.alert(err));
        }}
      >
        <UserProfilePicView
          style={styles.profilePic}
          source={{ uri: context.state.profilePicUri }}
        />
        <Text style={styles.profilePicTitle}>{Strings.CHANGE_PROFILE_IMAGE}</Text>
      </TouchableOpacity>
    </View>
  );
}

function UserId({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_ID}</Text>
        <Text style={styles.count}>
          {context.state.name.length}/{Constants.MAX_LENGTH_USER_ID}
        </Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.ID_GUIDELINES}</Text>
      {context.state.warningUserId && (
        <Text style={styles.fieldTitleError}>
          <IconFeather name={'alert-circle'} size={14} color={T.COLORS.RED} />
          <Text />
          <Text>{context.state.wrongIdReason}</Text>
        </Text>
      )}
      <TextInput
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_ID}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(name) => {
          context.setState({ name });
          if (context.state.warningUserId) {
            const result = Utils.checkTextFormat({ type: 'id', value: name });
            if (result.code === 'success') {
              context.setState({ warningUserId: false });
            }
          }
        }}
        onEndEditing={async (e) => {
          if (context.state.initialName.toLowerCase() === context.state.name.toLowerCase()) {
            return;
          }

          const result = Utils.checkTextFormat({
            type: 'id',
            value: context.state.name,
          });

          const { success } = await APIprovider.checkDuplicateId(context.state.name);

          if (result.code === 'fail' || !success) {
            if (!success) {
              context.setState({ warningUserId: true, wrongIdReason: Strings.USER_ID_DUPLICATED });
            } else {
              context.setState({ warningUserId: true, wrongIdReason: Strings.CHECK_USER_ID });
            }
          } else {
            context.setState({ warningUserId: false });
          }
        }}
        value={context.state.name}
        maxLength={Constants.MAX_LENGTH_USER_ID}
      />
    </View>
  );
}

function Introduction({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.PROFILE_DESCRIPTION}</Text>
        <Text style={styles.count}>
          {context?.state?.introduction?.length ?? 0}/{Constants.MAX_LENGTH_USER_INTRODUCTION}
        </Text>
      </View>
      <TextInput
        multiline
        style={styles.textInput}
        placeholder={Strings.ADD_PROFILE_DESCRIPTION}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(introduction) => context.setState({ introduction })}
        value={context.state.introduction}
        maxLength={Constants.MAX_LENGTH_USER_INTRODUCTION}
      />
    </View>
  );
}

function Email({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_EMAIL}</Text>
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.EMAIL_GUIDELINES}</Text>
      {context.state.warningEmail && (
        <Text style={styles.fieldTitleError}>
          <IconFeather name={'alert-circle'} size={14} color={T.COLORS.RED} />
          <Text />
          <Text>{Strings.CHECK_USER_EMAIL}</Text>
        </Text>
      )}
      <TextInput
        keyboardType={'email-address'}
        textContentType={'emailAddress'}
        autoComplete={'email'}
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_EMAIL}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(email) => {
          context.setState({ email });
          if (context.state.warningEmail) {
            const result = Utils.checkTextFormat({ type: 'email', value: email });
            if (result.code === 'success') {
              context.setState({ warningEmail: false });
            }
          }
        }}
        onEndEditing={(e) => {
          const result = Utils.checkTextFormat({
            type: 'email',
            value: context.state.email,
          });
          if (result.code === 'fail') {
            context.setState({ warningEmail: true });
          } else {
            context.setState({ warningEmail: false });
          }
        }}
        value={context.state.email}
      />
    </View>
  );
}

function Phone({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_PHONE}</Text>
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.PHONE_GUIDELINES}</Text>
      {context.state.warningPhone && (
        <Text style={styles.fieldTitleError}>
          <IconFeather name={'alert-circle'} size={14} color={T.COLORS.RED} />
          <Text />
          <Text>{Strings.CHECK_USER_PHONE}</Text>
        </Text>
      )}
      <TextInput
        keyboardType={'decimal-pad'}
        textContentType={'telephoneNumber'}
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_PHONE}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(phone) => {
          context.setState({ phone });
          if (context.state.warningPhone) {
            const value = phone
              ? phone.length > 10
                ? phone
                    .match(/\d+/g)
                    .join('')
                    .replace(/(\d{3})\-?(\d{4})\-?(\d{1})/, '$1-$2-$3')
                : phone
                    .match(/\d+/g)
                    .join('')
                    .replace(/(\d{3})\-?(\d{3})\-?(\d{1})/, '$1-$2-$3')
              : '';
            const result = Utils.checkTextFormat({ type: 'phone', value: value });
            if (result.code === 'success') {
              context.setState({ warningPhone: false });
            }
          }
        }}
        onEndEditing={(e) => {
          const phone = context.state.phone;
          const value = phone
            ? phone.length > 10
              ? phone
                  .match(/\d+/g)
                  .join('')
                  .replace(/(\d{3})\-?(\d{4})\-?(\d{1})/, '$1-$2-$3')
              : phone
                  .match(/\d+/g)
                  .join('')
                  .replace(/(\d{3})\-?(\d{3})\-?(\d{1})/, '$1-$2-$3')
            : '';
          context.setState({ phone: value });
          const result = Utils.checkTextFormat({ type: 'phone', value: value });
          if (result.code === 'fail') {
            context.setState({ warningPhone: true });
          } else {
            context.setState({ warningPhone: false });
          }
        }}
        onFocus={() => {
          const phone = context.state.phone;
          const value = phone ? phone.match(/\d+/g).join('') : '';
          context.setState({ phone: value });
        }}
        value={context.state.phone}
        maxLength={Constants.MAX_LENGTH_USER_PHONE}
      />
    </View>
  );
}

function Country({ context }) {
  const [countrySelectorVisible, setCountrySelectorVisible] = useState(false);
  const onSelect = (country) => {
    setCountrySelectorVisible(false);
    context.setState({
      countryCode: country.cca2,
      country: country,
    });
  };
  const onClose = () => {
    setCountrySelectorVisible(false);
  };
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_ORIGIN}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.USER_ORIGIN_GUIDELINES}</Text>
      <View style={{ marginVertical: Platform.OS === 'android' ? 10 : -5 }}>
        {!countrySelectorVisible && !context.state.countryCode ? (
          <Pressable
            onPress={() => {
              setCountrySelectorVisible(true);
            }}
          >
            <View style={styles.selectButtonContainer}>
              <Text style={{ color: T.COLORS.INK, fontSize: 16 }}>
                {Strings.USER_ORIGIN_SELECTION}
              </Text>
              <FastImage
                style={{ width: 20, height: 20 }}
                source={require('../Resources/img/icCommonSelect20.png')}
              />
            </View>
          </Pressable>
        ) : (
          <CountryPicker
            filterProps={{
              style: { marginVertical: 3, color: T.COLORS.INK },
              placeholder: Strings.ENTER_USER_ORIGIN,
            }}
            containerButtonStyle={styles.textInput}
            withCountryNameButton={true}
            countryCode={context.state.countryCode}
            withFlag={true}
            withFilter={true}
            onSelect={onSelect}
            onClose={onClose}
            theme={DEFAULT_THEME}
            visible={countrySelectorVisible}
            closeButtonImage={require('../Resources/img/iconRenewal/icHeaderClose22.png')}
            closeButtonImageStyle={{ width: 25, height: 25 }}
            translation={getLanguage() === 'ko' ? 'kor' : 'common'}
          />
        )}
      </View>
    </View>
  );
}

function UserInstagramId({ context }) {
  let instagramLogin = null;
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>{Strings.USER_INSTAGRAM_ID}</Text>
      </View>
      <Text style={styles.fieldTitleGuidelines}>{Strings.INSTAGRAM_ID_GUIDELINES}</Text>
      {/* <View style={{marginVertical: Platform.OS==='android'?10:5}}>
        {context.state.instagramId ?
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
            <Text style={styles.textInput}>{context.state.instagramId}</Text>
            <Pressable onPress={()=>{instagramLogin?.show();}}>
              <Text style={styles.textPressible}>{Strings.INSTAGRAM_ACCOUNT_CHANGE}</Text>
            </Pressable>
          </View>
          : <Pressable onPress={()=>{instagramLogin?.show();}}>
            <Text style={styles.textPressible}>{context.state.instagramId??Strings.INSTAGRAM_ACCOUNT_CONNECT}</Text>
          </Pressable>
        }
      </View> */}
      <TextInput
        style={styles.textInput}
        placeholder={Strings.CONDITION_USER_INSTAGRAM_ID}
        placeholderTextColor={T.COLORS.GREY}
        onChangeText={(value) => {
          context.setState({ instagramId: value });
        }}
        value={context.state.instagramId}
      />
      {/* <InstagramLogin
        ref={ref => (instagramLogin = ref)}
        appId={Constants.INSTAGRAM_APP_ID}
        redirectUrl={Constants.INSTAGRAM_REDIRECT_URI}
        scopes={['user_profile']}
        onLoginSuccess={ async (data) => {
          try {
            const authInfo = await APIprovider.getInstagramAthentication(data);
            if(authInfo.username === undefined) {
              Alert.alert(Strings.INSTAGRAM_ACCOUNT_CONNECTION_FAILED, Strings.INSTAGRAM_ACCOUNT_CONNECTION_FAILED_GUIDE);
              return;
            }
            context.setState({instagramId:authInfo.username})
          } catch(err) {
            Alert.alert(Strings.INSTAGRAM_ACCOUNT_CONNECTION_FAILED, Strings.INSTAGRAM_ACCOUNT_CONNECTION_FAILED_GUIDE);
          }
        }}
        onLoginFailure={(data) => {Alert.alert(Strings.INSTAGRAM_ACCOUNT_CONNECTION_FAILED, Strings.INSTAGRAM_ACCOUNT_CONNECTION_FAILED_GUIDE);}}
      /> */}
    </View>
  );
}

function SelectExposeContribution({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={{ ...styles.moveButtonContainer, marginTop: -5 }}>
        <Text style={{ ...styles.contributionTextInput, paddingHorizontal: 0 }}>
          {Strings.HIDE_CONTRIBUTION_REVENUE}
        </Text>
        <Switch
          trackColor={{
            false: T.COLORS.TRACK,
            true: T.COLORS.AMBER,
          }}
          thumbColor={
            context.state.isHideContributionRevenue
              ? '#FFFFFF'
              : T.COLORS.TRACK
          }
          ios_backgroundColor={T.COLORS.INK}
          onValueChange={(isExpose) => {
            if (isExpose) {
              context.setState({ isHideContributionRevenue: true });
            } else {
              context.setState({ isHideContributionRevenue: false });
            }
          }}
          value={context.state.isHideContributionRevenue}
        />
      </View>
    </View>
  );
}

function SubmitButton({ isShowActivityIndicator, onPressSubmitButton }) {
  return (
    <Button
      title={Strings.OK}
      titleStyle={{ color: T.COLORS.AMBER_DEEP }}
      type="clear"
      containerStyle={{ marginRight: 10 }}
      disabled={isShowActivityIndicator}
      onPress={() => onPressSubmitButton()}
    />
  );
}

export default class EditProfileScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      country: undefined,
      countryCode: props.route.params.countryCode,
      profilePicUri: props.route.params.profilePicUrl,
      introduction: props.route.params.introduction,
      initialName: props.route.params.name,
      name: props.route.params.name,
      email: props.route.params.email,
      phone: props.route.params.phone,
      instagramId: props.route.params.instagramId,
      profilePicType: null,
      isShowActivityIndicator: false,
      warningUserId: false,
      warningEmail: false,
      warningPhone: false,
      isHideContributionRevenue: props.route.params.isHideContributionRevenue || false,
      wrongIdReason: Strings.CHECK_USER_ID,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.EDIT_PROFILE,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerTintColor: T.COLORS.INK,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: T.FONT.Bold,
      },
      headerRight: () =>
        SubmitButton({
          isShowActivityIndicator: this.state.isShowActivityIndicator,
          onPressSubmitButton: this.onPressSubmitButton.bind(this),
        }),
    });
  }

  showActivityIndicator() {
    this.setState({ isShowActivityIndicator: true });
    this.props.navigation.setParams({
      isShowActivityIndicator: true,
    });
  }

  hideActivityIndicator() {
    this.setState({
      isShowActivityIndicator: false,
    });
    this.props.navigation.setParams({
      isShowActivityIndicator: false,
    });
    this.forceUpdate();
  }

  async onPressSubmitButton() {
    const result = await APIprovider.checkDuplicateId(this.state.name);
    if (this.props.route.params.name !== this.state.name) {
      if (result && !result.success) {
        Alert.alert(result.message);
        return;
      }
    }

    Keyboard.dismiss();
    this.showActivityIndicator();

    const phone = this.state.phone;
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

    let profile = {
      userId: this.props.route.params.logonUserId,
      introduction: this.state.introduction,
      name: this.state.name,
      email: this.state.email,
      countryCode: this.state.countryCode,
      instagramId: this.state.instagramId,
      phone: value,
      isHideContributionRevenue: this.state.isHideContributionRevenue,
    };

    if (this.props.route.params.profilePicUrl !== this.state.profilePicUri) {
      profile.profilePicUri = this.state.profilePicUri;
      profile.profilePicType = this.state.profilePicType;
    } else {
      profile.profilePicUri = null;
    }

    if (
      Utils.checkTextFormat({ type: 'email', value: this.state.email }).code === 'fail' ||
      Utils.checkTextFormat({ type: 'id', value: this.state.name }).code === 'fail' ||
      Utils.checkTextFormat({ type: 'phone', value: value }).code === 'fail'
    ) {
      this.hideActivityIndicator();
      return;
    }

    APIprovider.editProfile(profile)
      .then((profile) => {
        Preference.set('userProfilePicUrl', profile.profilePicUrl);
        this.props.route.params.setLogonUserProfilePicUrl(profile.profilePicUrl);
        this.props.route.params.onProfileChanged(profile);
        this.hideActivityIndicator();
        this.props.navigation.pop();
      })
      .catch((err) => {
        console.log('editProfile err', err);
        Alert.alert(
          Strings.FAILED_TO_EDIT_PROFILE,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.hideActivityIndicator();
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
          oldProfilePicUrl: this.props.route.params.profilePicUrl,
          profilePicType: image.mime,
        });
      })
      .catch((err) => console.log(err.toString()));
  }

  renderActivityIndicator() {
    if (this.state.isShowActivityIndicator) {
      return <LoadingView />;
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          <ProfilePic context={this} />
          <UserId context={this} />
          <View style={styles.divider} />
          <Introduction context={this} />
          <View style={styles.divider} />
          <Email context={this} />
          <View style={styles.divider} />
          <Country context={this} />
          <View style={styles.divider} />
          <Text style={{ ...styles.fieldTitleGuidelines, color: 'red' }}>
            {Strings.REQUIRE_RESTART}
          </Text>
          <UserInstagramId context={this} />
          <View style={styles.divider} />
          <SelectExposeContribution context={this} />
          <View style={{ marginBottom: 100 }} />
        </KeyboardAvoidingView>
        {this.renderActivityIndicator()}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.COLORS.BG,
  },
  fieldContainer: {
    marginTop: 20,
  },
  fieldTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  fieldTitle: {
    color: T.COLORS.INK,
    fontSize: 15,
    lineHeight: 18,
    marginRight: 6,
    fontWeight: 'bold',
  },
  fieldTitleGuidelines: {
    color: T.COLORS.GREY,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 3,
    paddingHorizontal: 20,
  },
  fieldTitleError: {
    color: T.COLORS.RED,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 3,
    paddingHorizontal: 20,
  },
  textInput: {
    color: T.COLORS.INK,
    fontSize: 16,
    marginHorizontal: 20,
  },
  textPressible: {
    color: T.COLORS.AMBER_DEEP,
    fontSize: 16,
    marginHorizontal: 20,
  },
  profilePic: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 120,
  },
  profilePicTitle: {
    color: T.COLORS.AMBER_DEEP,
    fontSize: 15,
    alignSelf: 'center',
    marginTop: 10,
  },
  count: {
    fontSize: 15,
    color: T.COLORS.GREY,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: T.COLORS.GREY,
    marginHorizontal: 20,
  },
  selectButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  moveButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  contributionTextInput: {
    paddingHorizontal: 10,
    color: T.COLORS.INK,
    fontSize: 18,
    marginHorizontal: 20,
  },
  sectionContainer: {
    marginTop: 35,
    marginBottom: 5,
  },
});
