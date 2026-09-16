// 2차 가공 동의 화면 (2026-09-16) — docs/secondary-use-and-groupbuy-2026-09-16.md P1
// 작성자가 하는 일은 둘뿐이다: 범위를 확인하고, 동의할지 정하고, 동의하면 혜택 하나를 고른다.
// 제작·유통·배송·정산은 브랜드·greyd·3PL이 처리한다.
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CONSENT_BENEFIT, agreeConsent, declineConsent, describeScope } from '../api/consents';
import T from './Constants/DesignTokens';
import Strings from './Strings';
import { Btn, Card } from './UI';

const { COLORS, FONT, RADIUS } = T;

const BENEFITS = [
  {
    key: CONSENT_BENEFIT.SALES_INCENTIVE,
    title: () => Strings.CONSENT_BENEFIT_SALES,
    desc: () => Strings.CONSENT_BENEFIT_SALES_DESC,
  },
  {
    key: CONSENT_BENEFIT.GROUP_BUY,
    title: () => Strings.CONSENT_BENEFIT_GROUP,
    desc: () => Strings.CONSENT_BENEFIT_GROUP_DESC,
  },
];

export default class SecondaryUseConsentScreen extends React.Component {
  state = { benefit: null, isSubmitting: false };

  get consent() {
    return this.props.route.params?.consent || {};
  }

  done = (message) => {
    const onDone = this.props.route.params?.onDone;
    Alert.alert(message, '', [
      {
        text: Strings.OK,
        onPress: () => {
          if (onDone) {
            onDone();
          }
          this.props.navigation.goBack();
        },
      },
    ]);
  };

  fail = () => {
    this.setState({ isSubmitting: false });
    Alert.alert(Strings.CONSENT_FAILED, '', [{ text: Strings.OK }]);
  };

  onAgree = async () => {
    const { benefit } = this.state;
    if (!benefit) {
      Alert.alert(Strings.CONSENT_NEED_BENEFIT, '', [{ text: Strings.OK }]);
      return;
    }

    this.setState({ isSubmitting: true });
    try {
      await agreeConsent(this.consent.id, benefit);
      this.done(Strings.CONSENT_AGREED_DONE);
    } catch (e) {
      this.fail();
    }
  };

  onDecline = async () => {
    this.setState({ isSubmitting: true });
    try {
      await declineConsent(this.consent.id);
      this.done(Strings.CONSENT_DECLINED_DONE);
    } catch (e) {
      this.fail();
    }
  };

  render() {
    const consent = this.consent;
    const { benefit, isSubmitting } = this.state;
    const scopeLines = describeScope(consent.scope, Strings);

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{Strings.CONSENT_TITLE}</Text>
          <Text style={styles.intro}>{Strings.CONSENT_INTRO(consent.brandName || 'greyd')}</Text>
          {consent.note ? <Text style={styles.note}>{consent.note}</Text> : null}

          <Text style={styles.sectionTitle}>{Strings.CONSENT_SCOPE_TITLE}</Text>
          <Card style={styles.scopeCard}>
            {scopeLines.map((line) => (
              <Text key={line} style={styles.scopeLine}>
                {line}
              </Text>
            ))}
          </Card>

          <Text style={styles.sectionTitle}>{Strings.CONSENT_BENEFIT_TITLE}</Text>
          {BENEFITS.map((b) => {
            const selected = benefit === b.key;
            return (
              <TouchableOpacity
                key={b.key}
                onPress={() => this.setState({ benefit: b.key })}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.benefitCard, selected && styles.benefitCardOn]}
              >
                <Text style={[styles.benefitTitle, selected && styles.benefitTitleOn]}>
                  {b.title()}
                </Text>
                <Text style={styles.benefitDesc}>{b.desc()}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.help}>{Strings.CONSENT_BENEFIT_HELP}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <Btn
            title={Strings.CONSENT_AGREE}
            onPress={this.onAgree}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
          <Btn
            title={Strings.CONSENT_DECLINE}
            onPress={this.onDecline}
            variant="ghost"
            disabled={isSubmitting}
            style={styles.declineBtn}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingBottom: 28, gap: 10 },
  title: { fontFamily: FONT.ExtraBold, fontSize: 20, color: COLORS.INK },
  intro: { fontFamily: FONT.Regular, fontSize: 13.5, lineHeight: 20, color: COLORS.INK },
  note: { fontFamily: FONT.Regular, fontSize: 12.5, lineHeight: 18, color: COLORS.GREY },
  sectionTitle: { fontFamily: FONT.Bold, fontSize: 13, color: COLORS.INK, marginTop: 10 },
  scopeCard: { padding: 14, gap: 6 },
  scopeLine: { fontFamily: FONT.Regular, fontSize: 12.5, lineHeight: 18, color: COLORS.INK },
  benefitCard: {
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.CARD,
    backgroundColor: COLORS.SURFACE,
    padding: 14,
    gap: 4,
  },
  benefitCardOn: { borderColor: COLORS.AMBER, backgroundColor: COLORS.AMBER_SOFT },
  benefitTitle: { fontFamily: FONT.Bold, fontSize: 14, color: COLORS.INK },
  benefitTitleOn: { color: COLORS.AMBER_DEEP },
  benefitDesc: { fontFamily: FONT.Regular, fontSize: 12.5, lineHeight: 18, color: COLORS.GREY },
  help: { fontFamily: FONT.Regular, fontSize: 11.5, lineHeight: 17, color: COLORS.GREY },
  footer: {
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
  },
  declineBtn: { marginTop: 2 },
});
