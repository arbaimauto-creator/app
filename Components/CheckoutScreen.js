// 결제 화면 (2026-09-16) — docs/commerce-and-seller-2026-09-16.md P1
// 서버가 만든 Stripe Checkout URL을 웹뷰로 연다. 카드정보는 앱이 만지지 않는다.
// 복귀 주소(success/cancel)를 감지해 결과를 확정하고, 확정은 서버가 Stripe에 직접 조회해 검증한다.
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import APIprovider from './APIprovider';
import T from './Constants/DesignTokens';
import Strings from './Strings';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import { CHECKOUT_RESULT, classifyCheckoutUrl } from './utils/checkout';
import { markPromptShown, recordHit, wasPromptShown } from '../api/regulars';

const { COLORS } = T;

export default class CheckoutScreen extends React.Component {
  state = { isConfirming: false };
  _done = false;

  componentDidMount() {
    this.props.navigation.setOptions?.({
      headerLeft: () => <HeaderLeftBackButton navigation={this.props.navigation} />,
    });
  }

  finishWithSuccess = async (orderId, sessionId) => {
    if (this._done) {
      return;
    }
    this._done = true;
    this.setState({ isConfirming: true });

    // 웹훅이 먼저 처리했을 수 있다. 그 경우 서버가 중복으로 막으므로 실패로 보지 않는다.
    const result = await APIprovider.confirmStripePayment(orderId, sessionId).catch((e) => e);
    const alreadyDone =
      result && result.errorMsg && String(result.errorMsg).indexOf('already processed') >= 0;

    if (APIprovider.isFailure(result) && !alreadyDone) {
      this.setState({ isConfirming: false });
      Alert.alert(Strings.FAILED_TO_PAY, result?.errorMsg || '', [
        { text: Strings.OK, onPress: () => this.props.navigation.goBack() },
      ]);
      return;
    }

    const onPaid = this.props.route.params?.onPaid;
    Alert.alert(Strings.SUCCEED_TO_PAY, '', [
      {
        text: Strings.OK,
        onPress: () => {
          if (onPaid) {
            onPaid(orderId);
          }
          this.props.navigation.goBack();
          this.maybePromptPurchaseHit();
        },
      },
    ]);
  };

  // 단골 적중 (2026-09-17): 리뷰 출발 구매(hitContext)면 결제 성공 후 리뷰당 한 번만
  // "리뷰대로였나요?"를 묻고 응답을 적중 원장에 기록한다.
  maybePromptPurchaseHit = async () => {
    const hitContext = this.props.route.params?.hitContext;
    if (!hitContext?.reviewerId || !hitContext?.videoId) {
      return;
    }
    if (await wasPromptShown(hitContext.videoId)) {
      return;
    }
    await markPromptShown(hitContext.videoId);
    Alert.alert(Strings.REGULAR_PROMPT_PURCHASE_TITLE, '', [
      { text: Strings.REGULAR_PROMPT_LATER, style: 'cancel' },
      {
        text: Strings.REGULAR_PROMPT_HELPFUL_YES,
        onPress: () =>
          recordHit(hitContext.reviewerId, hitContext.videoId, 'purchase').catch(() => {}),
      },
    ]);
  };

  onNavigationStateChange = (navState) => {
    const { returnBase } = this.props.route.params || {};
    const { result, orderId, sessionId } = classifyCheckoutUrl(navState.url, returnBase);

    if (result === CHECKOUT_RESULT.SUCCESS) {
      this.finishWithSuccess(orderId || this.props.route.params?.orderId, sessionId);
    } else if (result === CHECKOUT_RESULT.CANCEL && !this._done) {
      this._done = true;
      this.props.navigation.goBack();
    }
  };

  render() {
    const { checkoutUrl } = this.props.route.params || {};

    if (!checkoutUrl) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.AMBER} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={this.onNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.AMBER} />
            </View>
          )}
          // 결제창은 외부 사이트다 — 파일 접근·새 창을 막는다
          allowFileAccess={false}
          setSupportMultipleWindows={false}
          javaScriptEnabled
        />
        {this.state.isConfirming ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={COLORS.AMBER} />
          </View>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.SURFACE },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BG },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.35)',
  },
});
