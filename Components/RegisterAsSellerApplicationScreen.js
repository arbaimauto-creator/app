import React, { useMemo } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import APIprovider from './APIprovider';
import Constants from './Constants';
import ModalMenuButton from './ModalMenuButton';
import Strings from './Strings';
import { LoadingView } from './Views';

function BankSelector({ context }) {
  let bankName = '';
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
            <Text style={{ color: Constants.TIER_COLORS.ARTISAN, fontSize: 18 }}>
              {context.state.bankCode ? bankName : Strings.SELECT_BANK}
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
            flex: 1,
            fontSize: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            paddingVertical: 6,
            marginTop: 7,
          }}
          borderRadius={5}
          placeholder={Strings.INPUT_SELLER_BANK_NAME}
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
          onChangeText={(bankName) => context.setState({ bankName })}
          value={context.state.bankName}
          maxLength={100}
        />
      )}
    </View>
  );
}

function CertificationNo({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.BUSINESS_CERTIFICATION_NO}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={{
          ...styles.textInput,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          paddingVertical: 6,
        }}
        borderRadius={5}
        placeholder={'ex) 123-45-67890'}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(certificationNo) => context.setState({ certificationNo })}
        onFocus={() => {
          const certificationNo = context.state.certificationNo;
          const value = certificationNo ? certificationNo.match(/\d+/g).join('') : '';
          context.setState({ certificationNo: value });
        }}
        onEndEditing={() => {
          const certificationNo = context.state.certificationNo;
          const value = certificationNo
            ? certificationNo
                .match(/\d+/g)
                .join('')
                .replace(/(\d{3})\-?(\d{2})\-?(\d{1})/, '$1-$2-$3')
            : '';
          context.setState({ certificationNo: value });
        }}
        value={context.state.certificationNo}
        maxLength={Constants.MAX_LENGTH_SELLER_CERTIFICATION_NO}
        keyboardType={Platform.OS === 'iOS' ? 'numbers-and-punctuation' : 'numeric'}
      />
    </View>
  );
}

function CertificationImage({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.BUSINESS_CERTIFICATION}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      {context.state.certificationUri ? (
        <View
          key={'certificationImage'}
          style={{
            ...styles.attachmentItemListContainer,
            flex: 1,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          }}
        >
          <FastImage
            resizeMode={'contain'}
            source={{ uri: context.state.certificationUri }}
            style={styles.attachmentImage}
          />
          <TouchableWithoutFeedback
            onPress={() => {
              context.setState({ certificationUri: null });
            }}
          >
            <FastImage
              style={styles.removeAttachmentButton}
              source={require('../Resources/img/icHeaderSearchCancle16W.png')}
            />
          </TouchableWithoutFeedback>
        </View>
      ) : (
        <Button
          title={Strings.SELECT_IMAGE_FROM_GALLERY}
          type="clear"
          titleStyle={{ color: Constants.COLOR_MAIN, fontSize: 15 }}
          containerStyle={{
            width: Dimensions.get('window').width - 42,
            marginHorizontal: 20,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            alignSelf: 'flex-start',
          }}
          disabled={context.props.route.params.isShowActivityIndicator}
          onPress={() => {
            ImagePicker.openPicker({
              multiple: false,
              mediaType: 'photo',
            })
              .then((image) => {
                context.setState({
                  certificationUri: image.path,
                  certificationType: image.mime,
                });
              })
              .catch((err) => console.log(err.toString()));
          }}
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
        style={{
          ...styles.textInput,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          paddingVertical: 6,
        }}
        borderRadius={5}
        placeholder={Strings.SELLER_BANK_ACCOUNT_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
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
        style={{
          ...styles.textInput,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          paddingVertical: 6,
        }}
        borderRadius={5}
        placeholder={Strings.SELLER_BANK_ACCOUNT_NAME_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(bankAccountHolder) => context.setState({ bankAccountHolder })}
        value={context.state.bankAccountHolder}
        maxLength={100}
      />
    </View>
  );
}

function SellerEmail({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.SELLER_EMAIL}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={{
          ...styles.textInput,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          paddingVertical: 6,
        }}
        borderRadius={5}
        placeholder={Strings.SELLER_EMAIL_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(value) => context.setState({ sellerEmail: value })}
        value={context.state.sellerEmail}
        keyboardType={'email-address'}
      />
    </View>
  );
}

function SellerPhone({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.SELLER_PHONE}</Text>
        <FastImage
          source={require('../Resources/img/icCommonNe10.png')}
          style={styles.requiredIcon}
        />
      </View>
      <TextInput
        style={{
          ...styles.textInput,
          flex: 1,
          fontSize: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          paddingVertical: 6,
        }}
        borderRadius={5}
        placeholder={Strings.SELLER_PHONE_GUIDE}
        placeholderTextColor={Constants.TIER_COLORS.STRIVER}
        onChangeText={(value) => context.setState({ sellerPhone: value })}
        onFocus={() => {
          const phone = context.state.sellerPhone;
          const value = phone ? phone.match(/\d+/g).join('') : '';
          context.setState({ sellerPhone: value });
        }}
        onEndEditing={() => {
          const phone = context.state.sellerPhone;
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
          context.setState({ sellerPhone: value });
        }}
        value={context.state.sellerPhone}
        keyboardType={Platform.OS === 'iOS' ? 'numbers-and-punctuation' : 'numeric'}
      />
    </View>
  );
}

function SellerInputForm({ title, placeholder, required, handleChangeValue, value }) {
  return useMemo(
    () => (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {required && (
            <FastImage
              source={require('../Resources/img/icCommonNe10.png')}
              style={styles.requiredIcon}
            />
          )}
        </View>
        <TextInput
          style={{
            ...styles.textInput,
            flex: 1,
            fontSize: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            paddingVertical: 6,
          }}
          borderRadius={5}
          placeholder={placeholder}
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
          onChangeText={(value) => {
            if (handleChangeValue) {
              handleChangeValue(value);
            }
          }}
          value={value}
        />
      </View>
    ),
    [handleChangeValue, placeholder, required, title, value],
  );
}

function BottomButton({ context }) {
  return (
    <Button
      containerStyle={styles.bottomButtonContainer}
      buttonStyle={{
        backgroundColor: Constants.COLOR_MAIN,
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

export default class RegisterAsSellerApplicationScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      certificationUri: null,
      certificationNo: '',
      bankName: '',
      bankAccount: '',
      bankAccountHolder: '',
      bankCode: '',
      isShowActivityIndicator: false,
      sellerEmail: '',
      sellerPhone: '',
      sellerManagerName: '',
      sellerBusinessName: '',
      sellerBrandName: '',
      sellerHomepage: '',
      sellerOfficeAddress: '',
    };

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
    this.props.navigation.setOptions({
      title: Strings.REGISTER_SELLER,
    });
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
    if (this.state.certificationNo === '') {
      Alert.alert(Strings.INPUT_BUSINESS_CERTIFICATION_NO);
      return;
    }
    if (this.state.certificationUri === null) {
      Alert.alert(Strings.ATTACH_BUSINESS_CERTIFICATION_IMAGE);
      return;
    }
    if (this.state.sellerEmail === '') {
      Alert.alert(Strings.INPUT_BUSINESS_EMAIL_ADDRESS);
      return;
    }
    if (this.state.sellerPhone === '') {
      Alert.alert(Strings.INPUT_BUSINESS_PHONE);
      return;
    }
    if (this.state.sellerBusinessName === '') {
      Alert.alert(Strings.INPUT_BUSINESS_NAME);
      return;
    }
    if (this.state.sellerManagerName === '') {
      Alert.alert(Strings.INPUT_BUSINESS_MANAGER_NAME);
      return;
    }

    this.showActivityIndicator();

    let params = {
      sellerCertificationUri: this.state.certificationUri,
      sellerCertificationType: this.state.certificationType,
      sellerCertificationNo: this.state.certificationNo,
      sellerBankName: this.state.bankName,
      sellerBankAccount: this.state.bankAccount,
      sellerBankAccountHolder: this.state.bankAccountHolder,
      sellerManagerEmail: this.state.sellerEmail,
      sellerManagerPhone: this.state.sellerPhone,
      sellerBrandName: this.state.sellerBrandName,
      sellerManagerName: this.state.sellerManagerName,
      sellerBusinessName: this.state.sellerBusinessName,
      sellerOfficeAddress: this.state.sellerOfficeAddress,
      sellerHomepage: this.state.sellerHomepage,
    };

    const { logonUserId, setLogonUserIsSeller } = this.props.route.params;

    APIprovider.registerSeller(logonUserId, params)
      .then((result) => {
        console.log(result.sellerStatus);
        // if (result.isSeller) {
        if (result.sellerStatus === Constants.SELLER_STATUS.APPROVAL_REQUEST) {
          this.hideActivityIndicator();
          // Preference.set('userIsSeller', result.isSeller.toString());
          // setLogonUserIsSeller(result.isSeller.toString());

          Preference.set('userIsSeller', result.sellerStatus.toString());
          setLogonUserIsSeller(result.sellerStatus.toString());
          this.props.navigation.push('RegisterAsSellerSuccess');
        } else {
          throw Strings.FAILED_TO_REGISTER;
        }
      })
      .catch((err) => {
        // 실패 시에도 로딩 오버레이를 해제해야 화면 조작이 가능하다
        this.hideActivityIndicator();
        Alert.alert(
          Strings.FAILED_TO_REGISTER,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
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
          <ScrollView>
            <CertificationNo context={this} />
            <CertificationImage context={this} />
            <SellerInputForm
              title={Strings.BUSINESS_NAME}
              placeholder={Strings.INPUT_BUSINESS_NAME}
              value={this.state.sellerBusinessName}
              handleChangeValue={(value) => {
                this.setState({ sellerBusinessName: value });
              }}
              required
            />
            <SellerInputForm
              title={Strings.BUSINESS_BRAND_NAME}
              placeholder={Strings.INPUT_BRAND_NAME}
              value={this.state.sellerBrandName}
              handleChangeValue={(value) => {
                this.setState({ sellerBrandName: value });
              }}
            />
            <BankSelector context={this} />
            <BankAccountNo context={this} />
            <BankAccountHolder context={this} />
            <SellerInputForm
              title={Strings.BUSINESS_MANAGER_NAME}
              placeholder={Strings.INPUT_BUSINESS_MANAGER_NAME}
              value={this.state.sellerManagerName}
              handleChangeValue={(value) => {
                this.setState({ sellerManagerName: value });
              }}
              required
            />
            <SellerEmail context={this} />
            <SellerPhone context={this} />
            <SellerInputForm
              title={Strings.BUSINESS_HOMEPAGE}
              placeholder={Strings.INPUT_BUSINESS_HOMEPAGE}
              value={this.state.sellerHomepage}
              handleChangeValue={(value) => {
                this.setState({ sellerHomepage: value });
              }}
            />
            <SellerInputForm
              title={Strings.BUSINESS_ADDRESS}
              placeholder={Strings.INPUT_BUSINESS_ADDRESS}
              value={this.state.sellerOfficeAddress}
              handleChangeValue={(value) => {
                this.setState({ sellerOfficeAddress: value });
              }}
            />
            <View style={{ marginTop: 30 }} />
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
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginLeft: 4,
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
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    lineHeight: 18,
    marginRight: 6,
  },
  textInput: {
    paddingHorizontal: 10,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
    marginHorizontal: 20,
  },
  attachmentImage: {
    width: Dimensions.get('window').width - 50,
    height: Dimensions.get('window').width - 50,
  },
  bottomButtonContainer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 44 : 20,
    marginHorizontal: 20,
  },
  bottomButtonTitle: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  attachmentItemListContainer: {
    marginHorizontal: 20,
    paddingHorizontal: 2,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  removeAttachmentButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 18,
    height: 18,
  },
  backNameSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
});
