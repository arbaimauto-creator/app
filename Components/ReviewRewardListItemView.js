import React, { Component } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Constants from './Constants';
import Strings, { getLanguage } from './Strings';
import Utils from './utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

function RewardedDate({ data }) {
  const rewardedDate = new Date(
    data.order.purchaseCompletedAt ? data.order.purchaseCompletedAt : data.order.paidAt,
  );
  const dateYear = rewardedDate.getFullYear();
  const dateMonth = ('0' + (1 + rewardedDate.getMonth())).slice(-2);
  const dateDate = ('0' + rewardedDate.getDate()).slice(-2);
  const dateString = `${dateYear}.${dateMonth}.${dateDate}`;
  return (
    <View>
      <Text style={styles.rewardedDateTitle}>
        {data.order.purchaseCompletedAt
          ? Strings.ORDER_CONFIRM + ': ' + dateString
          : `${Strings.UNREALIZED_REVENUE} (${Strings.PAY}: ${dateString})`}
      </Text>
    </View>
  );
}

function ReviewTitle({ data }) {
  return (
    <View style={styles.amountContainer}>
      <Text style={styles.amountTitle}>{Strings.REVIEW}</Text>
      <Text style={styles.reviewTitle} numberOfLines={1}>
        {data.video?.title}
      </Text>
    </View>
  );
}

function SalesAmount({ data, region, currencyRate }) {
  return (
    <View style={styles.amountContainer}>
      <Text style={styles.amountTitle}>{Strings.CONTRIBUTED_SALES}</Text>
      <Text style={styles.amountValue}>
        {Utils.displayPrice(data.revenueAmount, region, currencyRate)}
      </Text>
    </View>
  );
}

function ContributionRate({ data }) {
  return (
    <View style={styles.amountContainer}>
      <Text style={styles.amountTitle}>{Strings.CONTRIBUTION}</Text>
      <Text style={styles.amountValue}>{(data.contributionRate * 100).toFixed(2)}%</Text>
    </View>
  );
}

function ReviewReward({ data, region, currencyRate }) {
  const profitAmount = +data.profitAmount.toFixed(0);
  const certifiedReviewerReward = +data.certifiedReviewerReward.toFixed(0);

  return (
    <View style={styles.amountContainer}>
      <Text style={styles.amountTitle}>{Strings.REVIEW_REWARDS}</Text>
      <Text style={styles.rewardAmount}>
        {Utils.displayPrice(profitAmount + certifiedReviewerReward, region, currencyRate)}
      </Text>
    </View>
  );
}

function AccumulatedDate({ data }) {
  let comment = '';

  if (data.revenueType === Constants.REWARD_TYPE.POINT.ATTENDANCE && getLanguage() === 'ko') {
    comment = `(UTC +0 기준 ${dayjs(data.createdAt).utc().format('YYYY.MM.DD')})`;
  }

  const accumulatedDate = new Date(data.createdAt);
  const dateYear = accumulatedDate.getFullYear();
  const dateMonth = ('0' + (1 + accumulatedDate.getMonth())).slice(-2);
  const dateDate = ('0' + accumulatedDate.getDate()).slice(-2);
  const dateString = `${dateYear}.${dateMonth}.${dateDate}`;
  return (
    <View>
      <Text style={styles.rewardedDateTitle}>
        {dateString} {comment}
      </Text>
    </View>
  );
}

function ExpiredDate({ data }) {
  if (!data.expiredAt) {
    return null;
  }

  const expiredDate = new Date(data.expiredAt);
  const dateYear = expiredDate.getFullYear();
  const dateMonth = ('0' + (1 + expiredDate.getMonth())).slice(-2);
  const dateDate = ('0' + expiredDate.getDate()).slice(-2);
  const dateString = `${dateYear}.${dateMonth}.${dateDate}`;

  return (
    <View style={styles.amountContainer}>
      <Text style={styles.amountTitle}>{Strings.EXPIRED_DATE}</Text>
      <Text style={styles.reviewTitle} numberOfLines={1}>
        {dateString}
      </Text>
    </View>
  );
}

function RewardType({ data }) {
  // TODO: 리워드가 마이너스일 경우 삭제 혹은 결제취소등 이름을 바꿔줘야 함
  return (
    <View style={styles.amountContainer}>
      <Text style={styles.amountTitle}>{Strings.REWARD_TYPE}</Text>
      <Text style={styles.reviewTitle} numberOfLines={1}>
        {Strings.POINT_TYPE[data.revenueType]}
      </Text>
    </View>
  );
}

function Remark() {
  return (
    <View style={styles.amountContainer}>
      <Text style={styles.amountTitle}>비고</Text>
      <Text style={styles.reviewTitle} numberOfLines={1}>
        {Strings.EARNED_UPON_PURCHASE_CONFIRMATION}
      </Text>
    </View>
  );
}

export default class ReviewRewardListItemView extends Component {
  static defaultProps = {
    navigation: null,
    data: {
      user: null,
      product: {
        productId: null,
        title: '',
        thumbnailUrl: '',
      },
      order: null,
      video: null,
      contributionRate: 0,
      revenueAmount: 0,
      profitAmount: 0,
      isSeller: false,
      isValid: false,
      updatedAt: 0,
    },
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, region, currencyRate } = this.props;

    return (
      <View style={styles.blockContainer}>
        {data.order && !data.order.rewardUse && !data.order?.certifiedReviewerRewardUse ? (
          <View>
            <RewardedDate data={data} />
            <ReviewTitle data={data} />
            <SalesAmount data={data} region={region} currencyRate={currencyRate} />
            <ContributionRate data={data} />
            <ReviewReward data={data} region={region} currencyRate={currencyRate} />
          </View>
        ) : (
          <View>
            <AccumulatedDate data={data} />
            <RewardType data={data} />
            <ReviewReward data={data} region={region} currencyRate={currencyRate} />
            <ExpiredDate data={data} />
            {(data.revenueType === Constants.REWARD_TYPE.BUY_REWARD ||
              data.revenueType === Constants.REWARD_TYPE.REWARD) &&
              !data.isValid ? (
              <Remark data={data} />
            ) : null}
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  blockContainer: {
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    alignSelf: 'center',
    justifyContent: 'center',
    // borderWidth: 0.2,
    borderRadius: 14,
    width: Dimensions.get('window').width - 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 3,
    marginBottom: 7,
  },
  rewardedDateTitle: {
    paddingVertical: 5,
    // color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  reviewTitle: {
    flex: 1,
    // color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  amountTitle: {
    flex: 1,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    width: 120,
  },
  amountValue: {
    flex: 1,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  rewardAmount: {
    flex: 1,
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
});
