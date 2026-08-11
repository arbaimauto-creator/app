import React, { PureComponent } from 'react';
import T from './Constants/DesignTokens';
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
import Toast from 'react-native-easy-toast';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import { getStatusBarHeight } from 'react-native-safearea-height';
import APIprovider from './APIprovider';
import Constants from './Constants';
import Strings from './Strings';
import { moderateScale } from './utils/scailing';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';

let toastRef;

const { UIManager } = NativeModules;
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function ReasonDescription({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.PURCHASE_CANCELLATION_TITLE}</Text>
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
          borderColor: T.COLORS.GREY,
          minHeight: 100,
        }}
        borderRadius={5}
        multiline={true}
        scrollEnabled={false}
        placeholder={Strings.PURCHASE_CANCELLATION_PLACEHOLDER}
        placeholderTextColor={T.COLORS.GREY}
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
          backgroundColor: Constants.COLOR_MAIN,
          height: 45,
        }}
        titleStyle={{
          color: 'black',
          fontSize: 18,
          fontWeight: 'bold',
        }}
        title={Strings.PURCHASE_CANCELLATION_SUBMIT}
        onPress={context.onPressSubmitButton.bind(context)}
      />
    </View>
  );
}

export default class PurchaseCancellationPage extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      description: '',
      isSubmitting: false,
    };
    props.navigation.setOptions({
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
      headerTintColor: T.COLORS.INK,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      title: Strings.PURCHASE_CANCELLATION_SUBMIT,
    });
  }

  onPressSubmitButton() {
    Keyboard.dismiss();
    if (this.state.isSubmitting) {
      return;
    }
    const validation = (condition, message) => {
      if (!condition) {
        Alert.alert('', Strings.PURCHASE_CANCELLATION_PLACEHOLDER, [{ text: Strings.OK }], {
          cancelable: true,
        });
        return false;
      }
      return true;
    };
    if (!validation(this.state.description !== '', '')) {
      return false;
    }
    // Submit, navigation pop 등
    // this.props.route.params.logonUserId
    Alert.alert(
      Strings.PURCHASE_CANCELLATION_CHECK_TITLE,
      Strings.PURCHASE_CANCELLATION_CHECK_BODY,
      [
        {
          text: Strings.CANCEL,
          onPress: () => {
            console.log('Cancel Pressed');
          },
          style: 'cancel',
        },
        {
          text: Strings.PURCHASE_CANCELLATION_SUBMIT,
          onPress: () => {
            // 취소 API 완료 후에만 목록을 갱신한다 (취소 전 조회와의 race로 stale 목록 방지)
            this.setState({ isSubmitting: true });
            APIprovider.actionOrder(
              this.props.route.params.orderId,
              Constants.ORDER_STATUS_CODE.BUYER_CANCEL_REQUEST,
              undefined,
              this.state.description,
              undefined,
            )
              .then((result) => {
                this.setState({ isSubmitting: false });
                if (APIprovider.isFailure(result)) {
                  Alert.alert(
                    Strings.PURCHASE_CANCELLATION_FAIL_TITLE,
                    Strings.PURCHASE_CANCELLATION_FAIL_BODY,
                    [{ text: Strings.OK }],
                    { cancelable: true },
                  );
                  return;
                }
                Alert.alert(
                  Strings.PURCHASE_CANCELLATION_SUCCESS_TITLE,
                  Strings.PURCHASE_CANCELLATION_SUCCESS_BODY,
                  [
                    {
                      text: Strings.OK,
                      onPress: () => {
                        this.props.navigation.pop();
                      },
                    },
                  ],
                );
                this.props.route.params?.getOrderList();
              })
              .catch((err) => {
                this.setState({ isSubmitting: false });
                Alert.alert(
                  Strings.PURCHASE_CANCELLATION_FAIL_TITLE,
                  Strings.PURCHASE_CANCELLATION_FAIL_BODY,
                  [{ text: Strings.OK }],
                  { cancelable: true },
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
            <ReasonDescription context={this} />
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
            backgroundColor: 'rgba(255,255,255,0.3)',
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
    color: T.COLORS.INK,
    fontSize: 16,
  },
  dataLength: {
    marginLeft: 6,
    fontSize: 12,
    color: T.COLORS.INK,
  },
  textInput: {
    paddingHorizontal: 10,
    color: T.COLORS.INK,
    fontSize: 18,
    marginHorizontal: 20,
  },
  requiredIcon: {
    width: 8,
    height: 10,
    marginLeft: 4,
  },
});
