// 토스 빌링(카드 등록) 웹뷰 (2026-09-30)
// ops가 토스 SDK(requestBillingAuth)를 띄우는 자기 페이지를 연다. 카드 정보는 앱이 만지지 않는다.
// 끝나면 ops가 <ops>/portal/groupbuy-billing/done?result=success|fail&orderId=… 로 보내고, 앱은 그 주소를 잡아 닫는다.
import React, { useRef } from 'react';
import { Alert, Linking, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { trackEvent } from '../../api/experiments';
import { billingResultFromUrl, isBillingStartUrl } from '../../api/groupBuys';
import { externalAppTarget } from '../../Components/utils/paymentSchemes';
import { Failure, dateLabel, s } from './common';
import { gbCopy } from './strings';

export default function GroupBuyBillingScreen({ navigation, route }) {
  const c = gbCopy();
  const { url, code, endsAt } = route.params || {};
  const handled = useRef(false);

  const finish = (result) => {
    if (handled.current) {
      return;
    }
    handled.current = true;
    trackEvent('groupbuy.billing', { ok: result.ok });
    if (result.ok) {
      Alert.alert(c.joinedTitle, c.joinedBody(dateLabel(endsAt)), [
        { text: c.yes, onPress: () => navigation.navigate('GroupBuy', { code }) },
      ]);
    } else {
      Alert.alert(c.billingFailed, '', [{ text: c.yes, onPress: () => navigation.goBack() }]);
    }
  };

  const onShouldStart = (req) => {
    const result = billingResultFromUrl(req.url);
    if (result) {
      finish(result);
      return false;
    }
    const external = externalAppTarget(req.url);
    if (external) {
      const open = external.url
        ? Linking.openURL(external.url)
        : Promise.reject(new Error('no app url'));
      open
        .catch(() => (external.fallback ? Linking.openURL(external.fallback) : null))
        .catch(() => {});
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[s.backBtn, { width: 56 }]}
        >
          <Text style={s.link}>{c.billingClose}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{c.billingTitle}</Text>
        <View style={[s.backBtn, { width: 56 }]} />
      </View>
      {isBillingStartUrl(url) ? (
        <WebView
          source={{ uri: url }}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={onShouldStart}
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
        />
      ) : (
        <Failure text={c.billingFailed} />
      )}
    </SafeAreaView>
  );
}
