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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { Context } from '../Contexts';
import { USER } from '../Contexts/actionTypes';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import { CheckBox } from './Views';
import Preference from 'react-native-default-preference';
import { moderateScale } from './utils/scailing';

function BottomButton({ context }) {
  const { product } = context.state;
  return (
    <Button
      containerStyle={styles.bottomButtonContainer}
      buttonStyle={{
        backgroundColor: Constants.COLOR_POINT_BLUE,
        height: 54,
      }}
      titleStyle={styles.bottomButtonTitle}
      title={Strings.NEXT}
      onPress={() => context.onPressSubmitButton()}
    />
  );
}

export default class AgreementToWithdrawalScreen extends React.Component {
  static contextType = Context;
  constructor(props) {
    super(props);

    this.state = {
      allAgreed: false,
      isAgreed1: false,
      modalVisible: false,
      modalTitle: null,
      modalContent: null,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.AGREE_OF_GREYDER_SERVICE,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
  }

  onPressSubmitButton() {
    if (!this.state.isAgreed1) {
      Alert.alert(Strings.NO_AGREEMENT_ALL_TO_REWARD_SETTLEMENT);
      return;
    }
    const user = this.props.route.params; //this.context.state.user;

    const dispatchContext = this.context.dispatch;
    dispatchContext({ type: USER.UPDATE, value: { isAcceptWithdrawal: true } });
    APIprovider.updateAgreementToTermsOfService(user.logonUserId)
      .then((value) => {
        Preference.set('agreementToTermsOfService', 'true');
        this.props.navigation.navigate('Withdrawal');
      })
      .catch(() => {});
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

  render() {
    // const { navigation } = this.props;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.agreementContainer}>
            <Text style={styles.descriptionTitle}>
              {Strings.MESSAGE_NEED_ALL_AGREEMENT_TO_REGISTER_GREYDER}
            </Text>
            <View style={styles.divider} />

            <View style={styles.agreeItemContainer}>
              <CheckBox
                onChanged={(isChecked) => this.setState({ isAgreed1: isChecked })}
                value={this.state.isAgreed1}
                style={{ paddingHorizontal: 5, paddingVertical: 10 }}
              />
              <TouchableNativeFeedback
                onPress={() => {
                  APIprovider.requestHtml(Strings.TERMS_URL.GREYDER)
                    .then((result) =>
                      this.onSucceedToLoadTerms(Strings.TERMS_OF_GREYDER_SERVICE, result),
                    )
                    .catch(this.onFailedToLoadTerms.bind(this));
                }}
              >
                <View style={styles.agreementItemLinkContainer}>
                  <Text style={styles.agreeItemTitle}>
                    {Strings.AGREE_TERMS_OF_GREYDER_SERVICE}
                  </Text>
                  <FastImage
                    source={require('../Resources/img/icCommonNext18.png')}
                    style={styles.moveIcon}
                  />
                </View>
              </TouchableNativeFeedback>
            </View>

            <View style={styles.divider} />

            <TouchableNativeFeedback
              onPress={() => {
                const isAllAgreed = this.state.isAgreed1;
                this.setState({
                  isAgreed1: !isAllAgreed,
                });
              }}
            >
              <View style={styles.agreeItemContainer}>
                <CheckBox
                  onChanged={(isChecked) => {
                    const isAllAgreed = this.state.isAgreed1;
                    this.setState({
                      isAgreed1: !isAllAgreed,
                    });
                  }}
                  value={this.state.isAgreed1}
                  style={{ paddingHorizontal: 5, paddingVertical: 10 }}
                />
                <Text style={styles.agreeItemTitle}>{Strings.AGREE_ALL}</Text>
              </View>
            </TouchableNativeFeedback>
          </View>

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
    color: Constants.TIER_COLORS.ARTISAN,
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
    alignItems: 'center',
  },
  agreeItemTitle: {
    flex: 1,
    fontSize: 17,
    color: Constants.TIER_COLORS.ARTISAN,
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
    color: Constants.TIER_COLORS.ARTISAN,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    lineHeight: 26,
    color: Constants.TIER_COLORS.ARTISAN,
    marginVertical: 20,
  },
  modalText: {
    marginBottom: 15,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomButtonContainer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 44 : 20,
    marginHorizontal: 20,
  },
  bottomButtonTitle: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
    marginBottom: 10,
    marginHorizontal: 20,
  },
});
