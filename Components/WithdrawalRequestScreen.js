import React from 'react';
import {
  Alert,
  Keyboard,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { launchImageLibrary } from 'react-native-image-picker';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import { Context } from '../Contexts';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import ModalMenuButton from './ModalMenuButton';
import Strings from './Strings';
import Utils from './utils';
import { LoadingView } from './Views';
import { moderateScale } from './utils/scailing';

const withdrawalAmount = 30000;

function UserFullName({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.USER_FULLNAME}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={styles.textInput}
        borderRadius={5}
        placeholder={Strings.USER_FULLNAME_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.OPERATOR}
        onChangeText={(fullName) => context.setState({ fullName })}
        value={context.state.fullName}
        maxLength={100}
        // keyboardType={Platform.OS === 'iOS' ? 'numbers-and-punctuation' : 'numeric'}
      />
    </View>
  );
}
function AvailableRewards({ amount }) {
  return (
    <View style={styles.totalAmountContainer}>
      <Text style={styles.totalAmountTitle}>{Strings.AVAILABLE_BALANCE}</Text>
      <Text style={styles.totalAmountValue}>{Utils.displayPrice(amount)}</Text>
    </View>
  );
}

function UserIdentification({ context }) {
  const idImage = context.state.identification || context.state.identificationImageUri;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.WITHDRAWAL_USER_ID}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      {idImage ? (
        <View key={'coverImage'} style={{ marginHorizontal: 20 }}>
          <FastImage source={{ uri: idImage }} style={styles.attachmentImage} />
          <TouchableNativeFeedback
            style={{ paddingHorizontal: 5 }}
            onPress={() => {
              context.setState({
                identificationImageUri: null,
                identification: null,
              });
              LayoutAnimation.easeInEaseOut();
            }}
          >
            <FastImage
              style={styles.removeAttachmentButton}
              source={require('../Resources/img/icHeaderSearchCancle16W.png')}
            />
          </TouchableNativeFeedback>
        </View>
      ) : (
        <View style={{ marginHorizontal: 20 }}>
          <TouchableNativeFeedback
            onPress={() => {
              launchImageLibrary({
                mediaType: 'photo',
              }).then((res) => {
                console.log('launchImageLibrary', res.assets[0]);

                const image = res.assets[0];
                Utils.compressImage(image.uri).then((imagePath) => {
                  context.setState({
                    identificationImageUri: imagePath,
                  });
                  LayoutAnimation.easeInEaseOut();
                });
              });
            }}
          >
            <View style={styles.addImageAttachmentButton}>
              <FastImage
                style={styles.addImageAttachmentIcon}
                source={require('../Resources/img/icSettingImage24.png')}
              />
              <Text style={styles.count}>{`${
                context.state.identificationImageUri ? 1 : 0
              }/1`}</Text>
            </View>
          </TouchableNativeFeedback>
        </View>
      )}
    </View>
  );
}

function AgencyBusinessLicense({ context }) {
  const AgencyBusinessLicenseImage =
    context.state.agencyBusinessLicense || context.state.agencyBusinessLicenseUri;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.WITHDRAWAL_USER_AGENCY_LICENSE}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      {AgencyBusinessLicenseImage ? (
        <View key={'coverImage'} style={{ marginHorizontal: 20 }}>
          <FastImage source={{ uri: AgencyBusinessLicenseImage }} style={styles.attachmentImage} />
          <TouchableNativeFeedback
            style={{ paddingHorizontal: 5 }}
            onPress={() => {
              context.setState({
                identificationImageUri: null,
                identification: null,
              });
              LayoutAnimation.easeInEaseOut();
            }}
          >
            <FastImage
              style={styles.removeAttachmentButton}
              source={require('../Resources/img/icHeaderSearchCancle16W.png')}
            />
          </TouchableNativeFeedback>
        </View>
      ) : (
        <View style={{ marginHorizontal: 20 }}>
          <TouchableNativeFeedback
            onPress={() => {
              launchImageLibrary({
                mediaType: 'photo',
              }).then((res) => {
                console.log('launchImageLibrary', res.assets[0]);

                const image = res.assets[0];
                Utils.compressImage(image.uri).then((imagePath) => {
                  context.setState({
                    identificationImageUri: imagePath,
                  });
                  LayoutAnimation.easeInEaseOut();
                });
              });
            }}
          >
            <View style={styles.addImageAttachmentButton}>
              <FastImage
                style={styles.addImageAttachmentIcon}
                source={require('../Resources/img/icSettingImage24.png')}
              />
              <Text style={styles.count}>{`${
                context.state.identificationImageUri ? 1 : 0
              }/1`}</Text>
            </View>
          </TouchableNativeFeedback>
        </View>
      )}
    </View>
  );
}

function UserContact({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.WITHDRAWAL_USER_CONTACT}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={styles.textInput}
        borderRadius={5}
        placeholder={Strings.INPUT_PHONE_TO_CONTRACT}
        placeholderTextColor={Constants.TIER_COLORS.OPERATOR}
        onChangeText={(phone) => context.setState({ phone })}
        value={context.state.phone}
        keyboardType={'decimal-pad'}
      />
    </View>
  );
}

function BankSelector({ context }) {
  // let bankName = '';
  let bankName = context.state.bankName;
  for (let i = 0; i < Constants.BANK_LIST.length; i++) {
    if (Constants.BANK_LIST[i].key === context.state.bankCode) {
      bankName = Constants.BANK_LIST[i].title;
      break;
    }
  }
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.SELLER_BANK_NAME}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <ModalMenuButton
        title={Strings.SELLER_BANK_NAME}
        type={'bottomScrollableSelection'}
        menu={context.bankList}
        buttonView={
          <View style={styles.backNameSelectContainer}>
            <Text
              style={{
                color: Constants.TIER_COLORS.OPERATOR,
                fontSize: 18,
                fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
              }}
            >
              {bankName || context.state.bankCode ? bankName : Strings.SELECT_BANK}
            </Text>
            <FastImage
              style={{ width: 20, height: 20 }}
              source={require('../Resources/img/icCommonSelect20.png')}
            />
          </View>
        }
      />
      {context.state.bankCode !== 'etc' && <View style={styles.divider} />}
      {context.state.bankCode === 'etc' && (
        <TextInput
          style={{
            ...styles.textInput,
            marginTop: 7,
          }}
          borderRadius={5}
          placeholder={Strings.INPUT_SELLER_BANK_NAME}
          placeholderTextColor={Constants.TIER_COLORS.OPERATOR}
          onChangeText={(bankName) => context.setState({ bankName })}
          value={context.state.bankName}
          maxLength={100}
        />
      )}
    </View>
  );
}

function BankAccountNo({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.SELLER_BANK_ACCOUNT}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={styles.textInput}
        borderRadius={5}
        placeholder={Strings.SELLER_BANK_ACCOUNT_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.OPERATOR}
        onChangeText={(bankAccount) => context.setState({ bankAccount })}
        value={context.state.bankAccount}
        maxLength={100}
        keyboardType={Platform.OS === 'iOS' ? 'numbers-and-punctuation' : 'numeric'}
      />
    </View>
  );
}

function BankAccountHolder({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.SELLER_BANK_ACCOUNT_HOLDER}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={styles.textInput}
        borderRadius={5}
        placeholder={Strings.SELLER_BANK_ACCOUNT_NAME_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.OPERATOR}
        onChangeText={(accountHolderName) => context.setState({ accountHolderName })}
        value={context.state.accountHolderName}
        maxLength={100}
      />
    </View>
  );
}

function BottomButton({ context }) {
  return (
    <Button
      containerStyle={styles.bottomButtonContainer}
      buttonStyle={{
        backgroundColor: Constants.COLOR_POINT_BLUE,
        height: 54,
      }}
      titleStyle={styles.bottomButtonTitle}
      title={Strings.NEXT}
      onPress={() => {
        context.onPressSubmitButton();
      }}
    />
  );
}

function WithdrawalAmount({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.WITHDRAWAL_AMOUNT}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 20,
          borderWidth: 1,
          borderRadius: 5,
          borderColor: Constants.TIER_COLORS.STRIVER,
        }}
      >
        <Text
          style={{
            color: Constants.TIER_COLORS.ARTISAN,
            fontSize: 17,
            paddingLeft: 10,
            fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
          }}
        >
          ￦{' '}
        </Text>
        <TextInput
          style={{
            ...styles.costTextInput,
            flex: 1,
            paddingVertical: 5,
          }}
          placeholder="0"
          placeholderTextColor={Constants.TIER_COLORS.OPERATOR}
          onChangeText={(price) => context.setState({ withdrawalAmount: price })}
          value={context.state.withdrawalAmount}
          keyboardType={'decimal-pad'}
        />
      </View>
    </View>
  );
}

function PaypalCaution({ context }) {
  return (
    <View style={{}}>
      <View style={styles.sectionTitleContainer}>
        <Text
          style={{
            fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Light,
            color: 'red',
            fontSize: 12,
          }}
        >
          PayPal is available only for users residing outside of Korea
        </Text>
      </View>
    </View>
  );
}

export default class WithdrawalRequestScreen extends React.Component {
  static contextType = Context;
  constructor(props) {
    super(props);

    const user = props.route.params.user;

    this.state = {
      user,
      bankName: user.bankName || '',
      bankAccount: user.bankAccount || '',
      accountHolderName: user.accountHolderName || '',
      withdrawalAmount: undefined,
      isShowActivityIndicator: false,
      bankCode: '',
      phone: user.phone || '',
      identificationImageUri: null,
      identification: user.identificationImageUrl,
      rewards: 0,
      userId: '',
      agencyBusinessLicenseUri: null,
      agencyBusinessLicense: user.agencyBusinessLicenseUrl,
    };

    props.navigation.setOptions({
      title: Strings.REWARD_SETTLEMENT,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
    });

    this.bankList = [];
    Constants.BANK_LIST.forEach((item) => {
      this.bankList.push({
        key: item.key,
        name: item.title,
        onClicked: () => {
          const bankName = item.key !== 'etc' ? item.title : '';
          this.setState({
            bankCode: item.key,
            bankName: bankName,
          });
        },
      });
    });
  }

  componentDidMount() {
    const { rewards, user } = this.props.route.params;

    if (
      !user.bankName ||
      !user.bankAccount ||
      !user.accountHolderName ||
      !user.phone ||
      !user.identificationImageUrl
    ) {
      // APIprovider.getUserDetails(user._id).then((userDetail) => {
      APIprovider.getWithdrawalUserDetails(user._id).then((userDetail) => {
        this.setState({
          bankName: userDetail.bankName,
          bankAccount: userDetail.bankAccount,
          accountHolderName: userDetail.accountHolderName,
          phone: userDetail.phone,
          identificationImageUri: userDetail.identificationImageUrl,
          identification: userDetail.identificationImageUrl,
          rewards,
          userId: user._id,
          fullName: userDetail?.fullName,
        });
      });
    } else {
      this.setState({
        rewards,
        userId: user._id,
      });
    }
  }

  showActivityIndicator() {
    Keyboard.dismiss();
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

  onPressSubmitButton() {
    const user = this.context.state.user;
    const reward = this.props.route.params.rewards;

    if (this.state.withdrawalAmount > reward) {
      Alert.alert(
        Strings.WITHDRAWAL_GUIDE_EXCESS_AMOUNT,
        Strings.WITHDRAWAL_GUIDE_CHECK_AGAIN,
        [{ text: Strings.OK }],
        { cancelable: true },
      );
      return;
    } else if (this.state.withdrawalAmount < withdrawalAmount) {
      Alert.alert(
        Strings.WITHDRAWAL_GUIDE_MORE_AMOUNT(Utils.displayPrice(withdrawalAmount)),
        Strings.WITHDRAWAL_GUIDE_CHECK_AGAIN,
        [{ text: Strings.OK }],
        { cancelable: true },
      );
      return;
    } else if (
      this.state.fullName === '' ||
      this.state.bankName === '' ||
      this.state.bankAccount === '' ||
      this.state.accountHolderName === '' ||
      this.state.withdrawalAmount === undefined ||
      this.state.phone === '' ||
      (!this.state.identification && !this.state.identificationImageUri)
    ) {
      if (
        this.state.bankCode === 'agency' &&
        !this.state.agencyBusinessLicense &&
        !this.state.agencyBusinessLicenseUri
      ) {
        Alert.alert(
          Strings.WITHDRAWAL_GUIDE_FAILED,
          Strings.WITHDRAWAL_GUIDE_CHECK_LICENSE_INFO,
          [{ text: Strings.OK }],
          { cancelable: true },
        );

        return;
      }

      Alert.alert(
        Strings.WITHDRAWAL_GUIDE_FAILED,
        Strings.WITHDRAWAL_GUIDE_CHECK_INFO,
        [{ text: Strings.OK }],
        { cancelable: true },
      );
      return;
    } else if (
      isNaN(this.state.withdrawalAmount) ||
      typeof +this.state.withdrawalAmount !== 'number'
    ) {
      Alert.alert(
        Strings.WITHDRAWAL_INPUT_ERROR_TITLE,
        Strings.WITHDRAWAL_INPUT_ERROR_CONTENT,
        [{ text: Strings.OK }],
        { cancelable: true },
      );
      return;
    }
    this.showActivityIndicator();

    APIprovider.requestWithdrawal({
      userId: this.state.userId || user.userId,
      accountHolderName: this.state.accountHolderName,
      bankName: this.state.bankName,
      bankAccount: this.state.bankAccount,
      requestedAmount: Number(this.state.withdrawalAmount),
      phone: this.state.phone.replace(/-/gi, ''),
      identificationImageUrl: this.state.identificationImageUri,
      identification: this.state.identification,
      agencyBusinessLicenseUrl: this.state.agencyBusinessLicenseUri,
      agencyBusinessLicense: this.state.agencyBusinessLicense,
      fullName: this.state.fullName,
    })
      .then((result) => {
        this.hideActivityIndicator();
        // 실패도 resolve되므로 성공 처리 전에 판정 — 실패를 조용히 성공으로 표시하지 않는다
        if (APIprovider.isFailure(result) || !result.withdrawalRequest) {
          Alert.alert('', result?.errorMsg || Strings.WITHDRAWAL_REQUEST_FAILED_MESSAGE);
          return;
        }
        if (this.props.route.params.onAddedNewRequest) {
          this.props.route.params.onAddedNewRequest(result.withdrawalRequest);
        }
        this.props.navigation.pop();
      })
      .catch((err) => {
        this.hideActivityIndicator();
        console.log('requestWithdrawal failed', err);
        Alert.alert('', Strings.WITHDRAWAL_REQUEST_FAILED_MESSAGE);
      });
  }

  renderActivityIndicator() {
    if (this.state.isShowActivityIndicator) {
      return <LoadingView />;
    }
  }

  render() {
    // const user = this.context.state.user;
    const { user } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          {/* <AvailableRewards amount={user.profitAmount - user?.certifiedReviewerReward} /> */}
          <AvailableRewards amount={this.state.rewards} />
          <View style={styles.descriptionTitleContainer}>
            <Text style={styles.descriptionTitle}>
              {Strings.WITHDRAWAL_REQUEST_GUIDE(Utils.displayPrice(withdrawalAmount))}
            </Text>
          </View>
          <ScrollView>
            <UserFullName context={this} />
            <BankSelector context={this} />
            {this.state.bankCode === 'paypal' ? <PaypalCaution /> : null}
            <BankAccountNo context={this} />
            <BankAccountHolder context={this} />
            <UserContact context={this} />
            <UserIdentification context={this} />
            {this.state.bankCode === 'agency' ? <AgencyBusinessLicense context={this} /> : null}
            <WithdrawalAmount context={this} />
          </ScrollView>
          <BottomButton context={this} />
        </KeyboardAvoidingView>
        {this.renderActivityIndicator()}
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
    marginTop: 35,
    marginBottom: 5,
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
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  textInput: {
    paddingHorizontal: 10,
    color: 'black',
    // fontSize: 18,
    marginHorizontal: 20,
    flex: 1,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    borderWidth: 1,
    borderColor: Constants.TIER_COLORS.STRIVER,
    paddingVertical: 6,
  },
  bottomButtonContainer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 44 : 20,
    marginHorizontal: 20,
  },
  bottomButtonTitle: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    backgroundColor: Constants.TIER_COLORS.OPERATOR,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  totalAmountTitle: {
    // color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    marginRight: 6,
  },
  totalAmountValue: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  descriptionTitleContainer: {
    paddingHorizontal: 20,
  },
  descriptionTitle: {
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    alignItems: 'center',
    color: Constants.TIER_COLORS.ARTISAN,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginLeft: 4,
  },
  backNameSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  costTextInput: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },

  addImageAttachmentButton: {
    width: 80,
    height: 80,
    borderRadius: 4,
    borderColor: Constants.TIER_COLORS.STRIVER,
    borderWidth: 1,
    marginTop: 6,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addImageAttachmentIcon: {
    width: 24,
    height: 24,
  },
  count: {
    fontSize: 12,
    lineHeight: 20,
    color: 'rgb(136, 136, 136)',
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderColor: Constants.TIER_COLORS.OPERATOR,
    borderWidth: 1,
  },
  removeAttachmentButton: {
    position: 'absolute',
    left: 75,
    top: 5,
    width: 18,
    height: 18,
  },
});
