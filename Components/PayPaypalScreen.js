import { StackActions } from '@react-navigation/native';
import React from 'react';
import { Alert, Linking, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import Preference from 'react-native-default-preference';
import { WebView } from 'react-native-webview';
import APIprovider, { API_ROOT_URL } from './APIprovider';
import Constants from './Constants';
import Strings from './Strings';
import Utils, { purchaseFBPixel } from './utils';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import { Text } from 'react-native';
import { moderateScale } from './utils/scailing';
import * as Sentry from '@sentry/react-native';

// const ENDPOINT_GREYD_API = 'https://api.greyd.app';
// const ENDPOINT_GREYD_API = 'http://172.30.1.10:3340';
const ENDPOINT_GREYD_PAYPAL = 'https://greyd.app';
// const ENDPOINT_GREYD_PAYPAL = 'http://localhost:3000';

// const paypalHTML = require('./paypalTest.html');

function HeaderRight({ navigation, checkOrder }) {
  return (
    <TouchableOpacity
      style={{ marginRight: 10 }}
      onPress={async () => {
        const orderResult = await checkOrder();

        if (orderResult !== Constants.ORDER_STATUS_CODE.NOT_ACCEPTED) {
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

export default class PayPaypalScreen extends React.Component {
  webview = null;

  constructor(props) {
    super(props);

    this.state = {
      cookie: '',
      bodyData: null,
      currencyRate: 0,
      price: 0,
      currency: '',
    };

    Linking.addEventListener('url', this.linkingCallback);
  }

  async checkOrder() {
    const { order, onSucceedToPay } = this.props.route.params;
    const userId = await Preference.get('userId');
    // check if the payment transaction is completed on server
    return APIprovider.getOrder(order.orderId, userId, null);
  }

  componentDidMount() {
    const { navigation } = this.props;
    navigation.setOptions({
      title: Strings.MAKE_ORDER,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerRight: () => HeaderRight({ navigation, checkOrder: () => this.checkOrder() }),
    });

    APIprovider.getCurrencyRate('USD').then((res) => {
      this.setState({
        currencyRate: res.currencyRate,
        currency: 'USD',
        price: Utils.convertKrwToUsd(this.props.route.params.order.totalPrice, res.currencyRate),
      });
    });
  }

  linkingCallback(data) {
    console.log('linkingCallback', data);
    if (data.includes('payOrderFinished')) {
      //this.onSucceedToPay()
    }
  }

  onFailedToPay() {
    Alert.alert(Strings.FAILED_TO_PAY);
    this.props.navigation.pop();
  }

  async onSucceedToPay() {
    const { order, onSucceedToPay } = this.props.route.params;
    const userId = await Preference.get('userId');
    // check if the payment transaction is completed on server
    APIprovider.getOrder(order.orderId, userId, null)
      .then((_order) => {
        if (_order.statusCode !== Constants.ORDER_STATUS_CODE.NOT_ACCEPTED) {
          throw Strings.FAILED_TO_PAY;
          // return;
        }

        // if success
        if (onSucceedToPay) {
          onSucceedToPay();
        }
        Alert.alert(Strings.SUCCEED_TO_PAY);
        // this.props.navigation.dispatch(StackActions.pop(2));

        purchaseFBPixel({ price: this.state.price, order: _order, currency: this.state.currency });
        this.props.navigation.dispatch(StackActions.pop(1));

        this.props.navigation.replace('MyOrderList');
      })
      .catch(() => {
        //      Alert.alert(Strings.FAILED_TO_GET_PAYMENT_INFO, err.toString())
        //      this.props.navigation.pop()
      });
  }

  handleWebViewNavigationStateChange = (newNavState) => {
    console.log('handleWebViewNavigationStateChange', newNavState);

    const { url, loading } = newNavState;
    if (!url) {
      return;
    }

    if (url.includes(`${API_ROOT_URL}/orders/`) && url.includes('pay') && !loading) {
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
    //    console.log('onShouldStartLoadWithRequest()', event)
    this.webview.source = { url: event.url };
    return true;
  };

  onApprovePayment(paypalResult) {
    const { order } = this.props.route.params;
    paypalResult = JSON.parse(paypalResult);
    APIprovider.payWithPaypal(order._id, paypalResult)
      .then((result) => {
        console.log('payWithPaypal', result);
        this.onSucceedToPay();
      })
      .catch((err) => {
        console.log('onApprovePayment error!', err);
        this.onFailedToPay();
      });
  }

  render() {
    const { price, currency } = this.state;

    if (price && currency) {
      return (
        <SafeAreaView style={{ height: '100%' }}>
          <WebView
            ref={(ref) => (this.webview = ref)}
            source={{
              uri: `${ENDPOINT_GREYD_PAYPAL}/paypal?price=${price}&currency=${currency}`,
            }}
            javaScriptCanOpenWindowsAutomatically={true}
            sharedCookiesEnabled={true}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
            onMessage={(event) => {
              console.log('onMessage()', event.nativeEvent.data);
              this.onApprovePayment(event.nativeEvent.data);
            }}
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
            style={styles.webview}
          />
        </SafeAreaView>
      );
    }

    return null;
  }
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
