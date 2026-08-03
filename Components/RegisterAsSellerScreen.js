import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { isIphoneX } from 'react-native-iphone-x-helper';
import APIprovider from './APIprovider';
import Constants from './Constants';
import Strings from './Strings';
import { CheckBox } from './Views';

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

export default class RegisterAsSellerScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      allAgreed: false,
      isAgreed1: false,
      isAgreed2: false,
      isAgreed3: false,
      isAgreed4: false,
      modalVisible: false,
      modalTitle: null,
      modalContent: null,
    };

    // props.navigation.setOptions({
    //   title: Strings.REGISTER_SELLER,
    // });
  }

  componentDidMount() {
    this.props.navigation.setOptions({
      title: Strings.REGISTER_SELLER,
    });

    //        APIprovider.getRevenueDetails(this.getRevenueDetailsListCallback.bind(this))
    //        .then(this.getProductDetailsCallback.bind(this))
    //        .catch((err) => {
    //            Alert.alert(
    //                "Failed to load product",
    //                err.errorMsg ? err.errorMsg : "",
    //                [ { text: Strings.OK }],
    //                { cancelable: true }
    //            )
    //        })
  }

  onSucceedToLoadTerms(title, result) {
    this.setState({
      modalVisible: true,
      modalTitle: title,
      modalContent: result,
    });
  }

  onFailedToLoadTerms(err) {
    console.log(err);
    Alert.alert(Strings.FAILED_TO_LOAD_TERMS, err, [{ text: Strings.OK }], {
      cancelable: true,
    });
  }

  onPressSubmitButton() {
    if (
      !this.state.isAgreed1 ||
      !this.state.isAgreed2 ||
      !this.state.isAgreed3 ||
      !this.state.isAgreed4
    ) {
      Alert.alert(Strings.NO_AGREEMENT_ALL_TO_REGISTER_SELLER);
      return;
    }

    this.props.navigation.push('RegisterAsSellerApplication');
  }

  render() {
    const { navigation } = this.props;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.descriptionTitle}>
            - {Strings.MESSAGE_RECOMMEND_COMPANY_ACCOUNT}
            {'\n\n'}- {Strings.MESSAGE_NEED_ALL_AGREEMENT_TO_REGISTER_SELLER}
          </Text>
          <View style={styles.divider} />

          <View style={styles.agreeItemContainer}>
            <CheckBox
              onChanged={(isChecked) => this.setState({ isAgreed1: isChecked })}
              value={this.state.isAgreed1}
              style={{ marginLeft: 5 }}
            />
            {Platform.OS === 'android' ? (
              <TouchableNativeFeedback
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.SELLER)
                    .then((result) => this.onSucceedToLoadTerms(Strings.TERMS_OF_SELLER, result))
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
              >
                <View style={styles.agreementItemLinkContainer}>
                  <Text style={styles.agreeItemTitle}>{Strings.AGREE_TERMS_OF_SELLER}</Text>
                  <FastImage
                    source={require('../Resources/img/icCommonNext18.png')}
                    style={styles.moveIcon}
                  />
                </View>
              </TouchableNativeFeedback>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.SELLER)
                    .then((result) => this.onSucceedToLoadTerms(Strings.TERMS_OF_SELLER, result))
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
                activeOpacity={0.7}
                style={styles.agreementItemLinkContainer}
              >
                <Text style={styles.agreeItemTitle}>{Strings.AGREE_TERMS_OF_SELLER}</Text>
                <FastImage
                  source={require('../Resources/img/icCommonNext18.png')}
                  style={styles.moveIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.agreeItemContainer}>
            <CheckBox
              onChanged={(isChecked) => this.setState({ isAgreed2: isChecked })}
              value={this.state.isAgreed2}
              style={{ marginLeft: 5 }}
            />
            {Platform.OS === 'android' ? (
              <TouchableNativeFeedback
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.DIGITAL_FINANCE)
                    .then((result) =>
                      this.onSucceedToLoadTerms(
                        Strings.TERMS_OF_ELECTRONIC_FINANCIAL_SERVICE,
                        result,
                      ),
                    )
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
              >
                <View style={styles.agreementItemLinkContainer}>
                  <Text style={styles.agreeItemTitle}>
                    {Strings.AGREE_TERMS_OF_ELECTRONIC_FINANCIAL_SERVICE}
                  </Text>
                  <FastImage
                    source={require('../Resources/img/icCommonNext18.png')}
                    style={styles.moveIcon}
                  />
                </View>
              </TouchableNativeFeedback>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.DIGITAL_FINANCE)
                    .then((result) =>
                      this.onSucceedToLoadTerms(
                        Strings.TERMS_OF_ELECTRONIC_FINANCIAL_SERVICE,
                        result,
                      ),
                    )
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
                activeOpacity={0.7}
                style={styles.agreementItemLinkContainer}
              >
                <Text style={styles.agreeItemTitle}>
                  {Strings.AGREE_TERMS_OF_ELECTRONIC_FINANCIAL_SERVICE}
                </Text>
                <FastImage
                  source={require('../Resources/img/icCommonNext18.png')}
                  style={styles.moveIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.agreeItemContainer}>
            <CheckBox
              onChanged={(isChecked) => this.setState({ isAgreed3: isChecked })}
              value={this.state.isAgreed3}
              style={{ marginLeft: 5 }}
            />
            {Platform.OS === 'android' ? (
              <TouchableNativeFeedback
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.PRIVACY_POLICY)
                    .then((result) =>
                      this.onSucceedToLoadTerms(Strings.TERMS_OF_PRIVACY_POLICY, result),
                    )
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
              >
                <View style={styles.agreementItemLinkContainer}>
                  <Text style={styles.agreeItemTitle}>{Strings.AGREE_TERMS_OF_PRIVACY_POLICY}</Text>
                  <FastImage
                    source={require('../Resources/img/icCommonNext18.png')}
                    style={styles.moveIcon}
                  />
                </View>
              </TouchableNativeFeedback>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.PRIVACY_POLICY)
                    .then((result) =>
                      this.onSucceedToLoadTerms(Strings.TERMS_OF_PRIVACY_POLICY, result),
                    )
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
                activeOpacity={0.7}
                style={styles.agreementItemLinkContainer}
              >
                <Text style={styles.agreeItemTitle}>{Strings.AGREE_TERMS_OF_PRIVACY_POLICY}</Text>
                <FastImage
                  source={require('../Resources/img/icCommonNext18.png')}
                  style={styles.moveIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.agreeItemContainer}>
            <CheckBox
              onChanged={(isChecked) => this.setState({ isAgreed4: isChecked })}
              value={this.state.isAgreed4}
              style={{ marginLeft: 5 }}
            />
            {Platform.OS === 'android' ? (
              <TouchableNativeFeedback
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.PRIVACY_POLICY_FOR_SELLER)
                    .then((result) =>
                      this.onSucceedToLoadTerms(Strings.TERMS_OF_PRIVACY_POLICY_FOR_BUYER, result),
                    )
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
              >
                <View style={styles.agreementItemLinkContainer}>
                  <Text style={styles.agreeItemTitle}>
                    {Strings.AGREE_TERMS_OF_PRIVACY_POLICY_FOR_BUYER}
                  </Text>
                  <FastImage
                    source={require('../Resources/img/icCommonNext18.png')}
                    style={styles.moveIcon}
                  />
                </View>
              </TouchableNativeFeedback>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.PRIVACY_POLICY_FOR_SELLER)
                    .then((result) =>
                      this.onSucceedToLoadTerms(Strings.TERMS_OF_PRIVACY_POLICY_FOR_BUYER, result),
                    )
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
                activeOpacity={0.7}
                style={styles.agreementItemLinkContainer}
              >
                <Text style={styles.agreeItemTitle}>
                  {Strings.AGREE_TERMS_OF_PRIVACY_POLICY_FOR_BUYER}
                </Text>
                <FastImage
                  source={require('../Resources/img/icCommonNext18.png')}
                  style={styles.moveIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              onPress={() => {
                const isAllAgreed =
                  this.state.isAgreed1 &&
                  this.state.isAgreed2 &&
                  this.state.isAgreed3 &&
                  this.state.isAgreed4;
                this.setState({
                  isAgreed1: !isAllAgreed,
                  isAgreed2: !isAllAgreed,
                  isAgreed3: !isAllAgreed,
                  isAgreed4: !isAllAgreed,
                });
              }}
            >
              <View style={styles.agreeItemContainer}>
                <CheckBox
                  onChanged={(isChecked) => {
                    const isAllAgreed =
                      this.state.isAgreed1 &&
                      this.state.isAgreed2 &&
                      this.state.isAgreed3 &&
                      this.state.isAgreed4;
                    this.setState({
                      isAgreed1: !isAllAgreed,
                      isAgreed2: !isAllAgreed,
                      isAgreed3: !isAllAgreed,
                      isAgreed4: !isAllAgreed,
                    });
                  }}
                  value={
                    this.state.isAgreed1 &&
                    this.state.isAgreed2 &&
                    this.state.isAgreed3 &&
                    this.state.isAgreed4
                  }
                  style={{ marginLeft: 5 }}
                />
                <Text style={styles.agreeItemTitle}>{Strings.AGREE_ALL}</Text>
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const isAllAgreed =
                  this.state.isAgreed1 &&
                  this.state.isAgreed2 &&
                  this.state.isAgreed3 &&
                  this.state.isAgreed4;
                this.setState({
                  isAgreed1: !isAllAgreed,
                  isAgreed2: !isAllAgreed,
                  isAgreed3: !isAllAgreed,
                  isAgreed4: !isAllAgreed,
                });
              }}
              activeOpacity={0.7}
              style={styles.agreeItemContainer}
            >
              <CheckBox
                onChanged={(isChecked) => {
                  const isAllAgreed =
                    this.state.isAgreed1 &&
                    this.state.isAgreed2 &&
                    this.state.isAgreed3 &&
                    this.state.isAgreed4;
                  this.setState({
                    isAgreed1: !isAllAgreed,
                    isAgreed2: !isAllAgreed,
                    isAgreed3: !isAllAgreed,
                    isAgreed4: !isAllAgreed,
                  });
                }}
                value={
                  this.state.isAgreed1 &&
                  this.state.isAgreed2 &&
                  this.state.isAgreed3 &&
                  this.state.isAgreed4
                }
                style={{ marginLeft: 5 }}
              />
              <Text style={styles.agreeItemTitle}>{Strings.AGREE_ALL}</Text>
            </TouchableOpacity>
          )}

          <View style={{ marginBottom: 40 }} />

          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.modalVisible}
            onRequestClose={() => {
              this.setState({ modalVisible: false });
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <View style={styles.modalHeaderContainer}>
                  <Text style={styles.modalTitle}>{this.state.modalTitle}</Text>
                  <TouchableWithoutFeedback
                    onPress={() => {
                      this.setState({ modalVisible: !this.state.modalVisible });
                    }}
                  >
                    <FastImage
                      source={require('../Resources/img/iconRenewal/icHeaderClose22.png')}
                      style={styles.closeIcon}
                    />
                  </TouchableWithoutFeedback>
                </View>
                <ScrollView>
                  <Text style={styles.modalText}>{this.state.modalContent}</Text>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </ScrollView>
        <BottomButton context={this} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  agreementContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  descriptionTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
  },
  agreeItemContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 20,
  },
  agreementItemLinkContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  agreeItemTitle: {
    flex: 1,
    fontSize: 17,
    color: 'white',
    marginLeft: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: isIphoneX() ? 60 : 30,
  },
  modalView: {
    marginHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  moveIcon: {
    width: 10,
    height: 18,
  },
  closeIcon: {
    width: 22,
    height: 22,
  },
  textStyle: {
    color: 'white',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
    // fontWeight: 'bold',
    textAlign: 'center',
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
    // fontWeight: 'bold',
    fontSize: 17,
    lineHeight: 26,
    color: 'white',
    marginVertical: 20,
  },
  modalText: {
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    marginBottom: 15,
    color: '#a0a0a0', //rgba(255, 255, 255, 0.5)
    fontSize: 14,
    lineHeight: 20,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
    marginHorizontal: 20,
  },
});
