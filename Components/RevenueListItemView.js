import React, { Component } from 'react';
import T from './Constants/DesignTokens';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from './Constants';
import Strings from './Strings';
import Utils from './utils';

function OrderOptions({ options }) {
  const { checks, lists } = options;
  return (
    <View>
      {checks &&
        checks.length > 0 &&
        checks.map((check, idx) => (
          <View key={'key' + idx} style={styles.optionItemContainer}>
            <Text style={styles.optionName}>{check.name}</Text>
          </View>
        ))}
      {lists &&
        lists.length > 0 &&
        lists.map((list, idx) => (
          <View key={'key' + idx} style={styles.optionItemContainer}>
            <Text style={styles.optionName}>
              {list.name}: {list.selectedItemName}
            </Text>
          </View>
        ))}
    </View>
  );
}

function RevenueHeader({ revenue }) {
  const { order } = revenue;
  const payDate = new Date(order.purchaseCompletedAt);
  const payDateYear = payDate.getFullYear();
  const payDateMonth = ('0' + (1 + payDate.getMonth())).slice(-2);
  const payDateDate = ('0' + payDate.getDate()).slice(-2);
  const payDateString = `${payDateYear}.${payDateMonth}.${payDateDate}`;

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.paidDate} numberOfLines={1}>
        {payDateString}
      </Text>
      <FastImage
        style={styles.moveButton}
        source={require('../Resources/img/icCommonNext18.png')}
      />
    </View>
  );
}

function CartItem({ cartItem }) {}

function RevenueBody({ cartItem, context }) {
  return (
    <View style={styles.bodyContainer}>
      <TouchableWithoutFeedback
        onPress={() => {
          context.props.navigation.push('ProductPage', {
            productId: cartItem.product.productId,
          });
        }}
      >
        <FastImage
          style={styles.productThumbnail}
          source={{ uri: cartItem.product.thumbnailUrl }}
        />
      </TouchableWithoutFeedback>
      <View style={styles.descriptionContainer}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {cartItem.product.title}
        </Text>
        <OrderOptions options={cartItem.options} />
        <Text style={styles.optionName}>
          {Strings.NUMBER_PRODUCTS}: {cartItem.number}
        </Text>
      </View>
    </View>
  );
}

function RevenueFooter({ revenue, context }) {
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.profitAmount}>{Utils.displayPrice(revenue.profitAmount)}</Text>
    </View>
  );
}

export default class RevenueListItemView extends Component {
  static defaultProps = {
    navigation: null,
    data: {
      seller: null,
      order: {
        cartItems: [
          {
            number: 0,
            options: null,
            product: {
              productId: null,
              title: '',
              thumbnailUrl: '',
            },
          },
        ],
      },
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
    const { data, navigation, sellerId } = this.props;
    return (
      <View style={styles.revenueContainer}>
        <TouchableWithoutFeedback
          onPress={() => {
            navigation.push('OrderPage', {
              orderId: data.order.orderId,
              sellerId: sellerId,
            });
          }}
        >
          <View>
            <RevenueHeader revenue={data} />
            {data.order.cartItems.map((cartItem) => (
              <RevenueBody cartItem={cartItem} context={this} key={cartItem._id} />
            ))}
            <RevenueFooter revenue={data} context={this} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  revenueContainer: {
    backgroundColor: 'rgb(37, 37, 37)',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  profitAmount: {
    color: T.COLORS.RED,
    fontSize: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 18,
  },
  bodyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
  },
  productThumbnail: {
    borderRadius: 4,
    width: 80,
    height: 80,
    marginRight: 13,
  },
  optionName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  paidDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  descriptionContainer: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    //    flex: 1,
    fontSize: 15,
    color: 'white',
    marginBottom: 6,
  },
  moveButton: {
    width: 10,
    height: 18,
  },
});
