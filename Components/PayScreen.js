import { StackActions } from '@react-navigation/native';
import React from 'react';
import { Alert, Linking, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import Preference from 'react-native-default-preference';
import RNSimpleCrypto from 'react-native-simple-crypto';
import { WebView } from 'react-native-webview';
import APIprovider, { API_ROOT_URL } from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import { moderateScale } from './utils/scailing';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import { purchaseFBPixel } from './utils';
import * as Sentry from '@sentry/react-native';

function HeaderRight({ navigation, checkOrder }) {
  return (
    <TouchableOpacity
      style={{ marginRight: 10 }}
      onPress={async () => {
        const orderResult = await checkOrder();

        if (orderResult.statusCode !== Constants.ORDER_STATUS_CODE.NOT_ACCEPTED) {
          Alert.alert('주문이 완료되지 않았습니다.');
          return;
        }

        navigation.dispatch(StackActions.pop(2));
      }}
    >
      <Text
        style={{
          color: Constants.COLOR_POINT_BLUE,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
          fontSize: 16,
          textAlign: 'center',
        }}
      >
        완료
      </Text>
    </TouchableOpacity>
  );
}

export default class PayScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      url: 'https://epay.kovanpay.com/mobilepage/common/mainFrame.pay',
      // url: 'https://dev-epay.kovanpay.com/mobilepage/common/mainFrame.pay',
      cookie: '',
      html: '',
      bodyData: null,
    };
    this.html = '';
  }

  // url 이벤트 인자는 문자열이 아니라 { url } 객체 — 화살표 함수로 this 바인딩도 보장
  linkingCallback = ({ url }) => {
    if (url?.includes('payOrderFinished')) {
      //this.onSucceedToPay()
    }
  };

  onFailedToPay() {
    //    Alert.alert(Strings.FAILED_TO_PAY)
    this.props.navigation.pop();
  }

  componentDidMount() {
    // this.props.route.params?.fetchData();
    // this.props.navigation.dispatch(StackActions.pop(2));

    // 생성자에서 호출하면 마운트 전 setState로 bodyData가 유실될 수 있음
    this.requestPay();
    this._linkingSubscription = Linking.addEventListener('url', this.linkingCallback);

    const { navigation } = this.props;
    navigation.setOptions({
      title: Strings.MAKE_ORDER,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerRight: () => HeaderRight({ navigation, checkOrder: () => this.checkOrder() }),
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });

    Preference.get('userId').then((userId) => {
      const { order, buyReqamt, rewardUse, certifiedReviewerRewardUse } = this.props.route.params;
      APIprovider.getOrder(order.orderId, userId, null).then((res) => {
        if (APIprovider.isFailure(res)) {
          return; // 검증 자체가 불가하면 결제 화면을 막지 않는다 (서버 결제 검증이 최종 방어선)
        }
        const { totalPrice, promotionDiscount, globalGroupBuyingDiscountAmount } = res;

        // 주문 생성부(MakeOrderScreen)의 결제액 산식과 동일해야 한다
        const orderPrice =
          totalPrice -
          (promotionDiscount || 0) -
          (rewardUse || 0) -
          (certifiedReviewerRewardUse || 0) -
          (globalGroupBuyingDiscountAmount || 0);

        if (orderPrice !== buyReqamt) {
          console.log('오류가 발생하였습니다, 주문금액과 결제금액이 일치하지 않습니다.');
          Alert.alert('오류가 발생했습니다.', '앱을 종료 후 다시 실행해주세요');
          this.props.navigation.dispatch(StackActions.pop(1));
        }
      });
    });
  }

  componentWillUnmount() {
    this._linkingSubscription?.remove();
  }

  async checkOrder() {
    const { order, onSucceedToPay } = this.props.route.params;
    const userId = await Preference.get('userId');
    // check if the payment transaction is completed on server
    return APIprovider.getOrder(order.orderId, userId, null);
  }

  async onSucceedToPay() {
    const { order, onSucceedToPay } = this.props.route.params;
    const userId = await Preference.get('userId');
    // check if the payment transaction is completed on server

    APIprovider.getOrder(order.orderId, userId, null)
      .then((_order) => {
        if (_order.statusCode !== Constants.ORDER_STATUS_CODE.NOT_ACCEPTED) {
          throw Strings.FAILED_TO_PAY;
        }

        // if success
        if (onSucceedToPay) {
          onSucceedToPay();
        }
        Alert.alert(Strings.SUCCEED_TO_PAY);

        this.props.route.params?.fetchData();
        purchaseFBPixel({ order: _order, currency: 'KRW' });
        this.props.navigation.dispatch(StackActions.pop(1));
        this.props.navigation.replace('MyOrderList');
      })
      .catch((err) => {
        console.log('err', err);
        Alert.alert(Strings.FAILED_TO_GET_PAYMENT_INFO, err.toString());
        this.props.navigation.pop();
      });
  }

  async requestPay() {
    const {
      buyItemnm,
      buyReqamt,
      buyItemcd,
      buyerid,
      buyernm,
      buyerEmail,
      orderno,
      order,
      kovanPayGroup,
      kovanPayMethod,
    } = this.props.route.params;

    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (1 + now.getMonth())).slice(-2);
    const date = ('0' + now.getDate()).slice(-2);
    const hour = ('0' + now.getHours()).slice(-2);
    const minute = ('0' + now.getMinutes()).slice(-2);
    const second = ('0' + now.getSeconds()).slice(-2);
    const orderdt = `${year}${month}${date}`;
    const ordertm = `${hour}${minute}${second}`;
    const hashInput = orderno + orderdt + ordertm + buyReqamt;
    // const secretkey = '9991798e0bb8dea217f8db169063c37c'; // kakao test
    // const secretkey = '796963983a56e1a28cf62ad564851ef2'; // test
    const secretkey = '8f7302dc6913327e801b6437b7d3efeb'; // operation

    const inputArrayBuffer = RNSimpleCrypto.utils.convertUtf8ToArrayBuffer(hashInput);
    const keyArrayBuffer = RNSimpleCrypto.utils.convertUtf8ToArrayBuffer(secretkey);
    const signatureArrayBuffer = await RNSimpleCrypto.HMAC.hmac256(
      inputArrayBuffer,
      keyArrayBuffer,
    );
    const checkHash = RNSimpleCrypto.utils.convertArrayBufferToBase64(signatureArrayBuffer);

    // TEST
    //    this.setState({ url: `${API_ROOT_URL}:3341/orders/${order.orderId}/pay` })

    let params = {
      // mid: 'M20230413117117', // kakao test
      // mid: 'M20200203113418', // test
      mid: 'M20210707113619', // operation
      rUrl: `${API_ROOT_URL}/orders/${order.orderId}/pay`,
      rMethod: 'POST',
      payGroup: kovanPayGroup,
      payType: kovanPayMethod,
      buyItemnm: buyItemnm,
      buyReqamt: buyReqamt,
      buyItemcd: buyItemcd,
      buyerid: buyerid,
      buyernm: buyernm,
      orderno: orderno,
      orderdt: orderdt,
      ordertm: ordertm,
      checkHash: checkHash,
      reserved01: order.orderId,
      // returnAppUrl: `greyd://payOrderFinished/${order.orderId}`
      returnAppUrl: '',
    };
    if (buyerEmail && buyerEmail !== '') {
      params.buyerEmail = buyerEmail;
    }

    //    this.setState({html: ` \
    //      <html>  \
    //        <head> \
    //            <meta http-equiv="Content-Type" content="text/html;charset=utf-8" > \
    //        </head> \
    //        <body> \
    //          <form action="https://dev-epay.kovanpay.com/mobilepage/common/mainFrame.pay" method="POST"> \
    //            <input type="text" name="mid" value="${params.mid}" /> \
    //            <input type="text" name="rUrl" value="${params.rUrl}" /> \
    //            <input type="text" name="rMethod" value="${params.rMethod}" /> \
    //            <input type="text" name="payGroup" value="${params.payGroup}" /> \
    //            <input type="text" name="payType" value="${params.payType}" /> \
    //            <input type="text" name="buyItemnm" value="${params.buyItemnm}" /> \
    //            <input type="text" name="buyReqamt" value="${params.buyReqamt}" /> \
    //            <input type="text" name="buyItemcd" value="${params.buyItemcd}" /> \
    //            <input type="text" name="buyerid" value="${params.buyerid}" /> \
    //            <input type="text" name="buyernm" value="${params.buyernm}" /> \
    //            <input type="text" name="buyerEmail" value="${params.buyerEmail}" /> \
    //            <input type="text" name="orderno" value="${params.orderno}" /> \
    //            <input type="text" name="orderdt" value="${params.orderdt}" /> \
    //            <input type="text" name="ordertm" value="${params.ordertm}" /> \
    //            <input type="text" name="checkHash" value="${params.checkHash}" /> \
    //            <input type="text" name="reserved01" value="${params.reserved01}" /> \
    //            <input type="submit" value="전송"/> \
    //          </form> \
    //        </body> \
    //      </html> \
    //      `})

    //        this.setState({html: ` \
    //          <html>  \
    //            <head> \
    //                <meta http-equiv="Content-Type" content="text/html;charset=utf-8" > \
    //            </head> \
    //            <body> \
    //              <a href="greyd://1">GO TO GREYD</a> \
    //            </body> \
    //          </html> \
    //          `})

    this.headerObj = { 'Content-Type': 'application/x-www-form-urlencoded' };
    let urlEncodedData = '',
      urlEncodedDataPairs = [],
      key;
    for (key in params) {
      urlEncodedDataPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
    this.setState({
      bodyData: urlEncodedDataPairs.join('&').replace(/%20/g, '+'),
    });
  }

  INJECTED_JAVASCRIPT =
    '(function() { window.ReactNativeWebView.postMessage(JSON.stringify(window.location)); })();';
  webview = null;

  handleWebViewNavigationStateChange = (newNavState) => {
    console.log('handleWebViewNavigationStateChange', newNavState);

    const { url, loading, navigationType } = newNavState;
    if (!url) {
      return;
    }

    // navigationType 이걸로 처리하는건 위험해보인다. 일단 메모해둠
    if (
      url.includes(`${API_ROOT_URL}/orders/`) &&
      url.includes('pay') &&
      !loading &&
      !navigationType
    ) {
      console.log('handleWebViewNavigationStateChange - onSucceedToPay');
      this.onSucceedToPay();
    }

    // redirect somewhere else
    //    if (url.includes('google.com')) {
    //      const newURL = 'https://reactnative.dev/';
    //      const redirectTo = 'window.location = "' + newURL + '"';
    //      this.webview.injectJavaScript(redirectTo);
    //    }
  };

  onShouldStartLoadWithRequest = (event) => {
    console.log('onShouldStartLoadWithRequest', event);
    if (
      event.url.startsWith('http://') ||
      event.url.startsWith('https://') ||
      event.url.startsWith('about:blank')
    ) {
      return true;
    }
    if (Platform.OS === 'android') {
      const SendIntentAndroid = require('react-native-send-intent');
      SendIntentAndroid.openChromeIntent(event.url)
        .then((isOpened) => {
          if (!isOpened) {
            // alert('앱 실행이 실패했습니다');
            Alert.alert(
              Strings.PAY_APP_NOT_INSTALLED,
              Strings.PAY_APP_INSTALL_SUGGEST,
              [
                { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                { text: 'OK', onPress: () => SendIntentAndroid.openAppWithUri(event.url) },
              ],
              { cancelable: false },
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });

      return false;
    } else {
      Linking.openURL(event.url).catch(() => {
        alert('앱 실행이 실패했습니다. 설치가 되어있지 않은 경우 설치 후 재시도해주세요.');
      });
      return false;
    }
  };

  render() {
    if (this.state.bodyData) {
      return (
        <SafeAreaView style={{ height: '100%' }}>
          <WebView
            ref={(ref) => (this.webview = ref)}
            source={{
              uri: this.state.url,
              //              html: this.state.html,
              headers: this.headerObj,
              body: this.state.bodyData,
              method: 'POST',
            }}
            androidHardwareAccelerationDisabled={true}
            sharedCookiesEnabled={true}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
            onMessage={(event) => {}}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              Sentry.captureException(nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              console.log('onHttpError', syntheticEvent);
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView received error status code: ', nativeEvent.statusCode);
              console.warn(nativeEvent);
              Sentry.captureException(nativeEvent);
              if (
                nativeEvent.url.includes(`${API_ROOT_URL}/orders`) &&
                nativeEvent.url.includes('pay')
              ) {
                this.onFailedToPay();
              }
            }}
            onNavigationStateChange={this.handleWebViewNavigationStateChange}
            //        injectedJavaScript={INJECTED_JAVASCRIPT}
            androidLayerType="software"
          />
        </SafeAreaView>
      );
    }
    return <View />;
  }
}
