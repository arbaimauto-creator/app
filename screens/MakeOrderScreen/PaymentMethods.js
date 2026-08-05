import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from '../../Components/Constants';
import { CheckBox } from '../../Components/Views';
import Strings from '../../Components/Strings';

export default function PaymentMethods({ context }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{Strings.PAY_METHODS}</Text>
      </View>
      <View style={styles.checkboxContainer}>
        <View style={styles.checkbox}>
          <CheckBox
            key={'checkoption_credit_card'}
            onChanged={(value) => {
              context.setState({
                kovanPayGroup: Constants.KOVAN_PAY_GROUP.CREDIT_CARD,
                kovanPayMethod: Constants.KOVAN_PAY_METHOD.CREDIT_CARD,
              });
            }}
            value={
              context.state.kovanPayGroup === Constants.KOVAN_PAY_GROUP.CREDIT_CARD &&
              context.state.kovanPayMethod === Constants.KOVAN_PAY_METHOD.CREDIT_CARD
            }
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.CREDIT_CARD}</Text>
        </View>
        <View style={styles.checkbox}>
          <CheckBox
            key={'checkoption_kakao_pay_credit_card'}
            onChanged={(value) => {
              context.setState({
                kovanPayGroup: Constants.KOVAN_PAY_GROUP.KAKAO_PAY,
                kovanPayMethod: Constants.KOVAN_PAY_METHOD.CREDIT_CARD,
              });
            }}
            value={
              context.state.kovanPayGroup === Constants.KOVAN_PAY_GROUP.KAKAO_PAY &&
              context.state.kovanPayMethod === Constants.KOVAN_PAY_METHOD.CREDIT_CARD
            }
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>
            {Strings.KAKAO_PAY_CREDIT_CARD}
          </Text>
        </View>
        <View style={styles.checkbox}>
          <CheckBox
            key={'checkoption_kakao_pay_money'}
            onChanged={(value) => {
              context.setState({
                kovanPayGroup: Constants.KOVAN_PAY_GROUP.KAKAO_PAY,
                kovanPayMethod: Constants.KOVAN_PAY_METHOD.SIMPLE_PAY,
              });
            }}
            value={
              context.state.kovanPayGroup === Constants.KOVAN_PAY_GROUP.KAKAO_PAY &&
              context.state.kovanPayMethod === Constants.KOVAN_PAY_METHOD.SIMPLE_PAY
            }
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.KAKAO_PAY_MONEY}</Text>
        </View>
        {/*  */}
        <View style={styles.checkbox}>
          <CheckBox
            key={'checkoption_naver_pay_credit_card'}
            onChanged={(value) => {
              context.setState({
                kovanPayGroup: Constants.KOVAN_PAY_GROUP.NAVER_PAY,
                kovanPayMethod: Constants.KOVAN_PAY_METHOD.CREDIT_CARD,
              });
            }}
            value={
              context.state.kovanPayGroup === Constants.KOVAN_PAY_GROUP.NAVER_PAY &&
              context.state.kovanPayMethod === Constants.KOVAN_PAY_METHOD.CREDIT_CARD
            }
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>
            {Strings.NAVER_PAY_CREDIT_CARD}
          </Text>
        </View>
        <View style={styles.checkbox}>
          <CheckBox
            key={'checkoption_naver_pay_simple_pay'}
            onChanged={(value) => {
              context.setState({
                kovanPayGroup: Constants.KOVAN_PAY_GROUP.NAVER_PAY,
                kovanPayMethod: Constants.KOVAN_PAY_METHOD.SIMPLE_PAY,
              });
            }}
            value={
              context.state.kovanPayGroup === Constants.KOVAN_PAY_GROUP.NAVER_PAY &&
              context.state.kovanPayMethod === Constants.KOVAN_PAY_METHOD.SIMPLE_PAY
            }
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.NAVER_PAY_POINT}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  header: { flexDirection: 'row', marginBottom: 10 },
  headerText: { color: Constants.TIER_COLORS.ARTISAN, fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM, fontSize: 15 },
  checkboxContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  checkbox: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 10 },
});
