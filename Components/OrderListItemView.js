import React, { Component, useContext, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
// import FastImage from 'react-native-fast-image';
import FastImage from './utils/SafeFastImage.tsx';
import { Context } from '../Contexts';
import APIprovider from './APIprovider';
import Constants from './Constants';
import CourierCompanySelectionModal from './CourierCompanySelectionModal';
import ModalMenuButton from './ModalMenuButton';
import Strings from './Strings';
import Utils from './utils';
import CourierTrackingLinkUrls from './utils/CourierTrackingLinkUrls';

function CourierSelector({ onChangeText, disabled, initialCourier = '' }) {
  const [courierName, setCourierName] = useState(initialCourier);
  const initialCourierCodeCandidate = Constants.COURIER_LIST.filter(
    (item) => item.title === initialCourier,
  );
  const initialCourierCode =
    initialCourierCodeCandidate.length === 0 ? undefined : initialCourierCodeCandidate[0];
  const [courierCode, setCourierCode] = useState(initialCourierCode);
  const courierList = Constants.COURIER_LIST.map((item) => {
    return {
      key: item.key,
      name: item.title,
      onClicked: () => {
        const courierName = item.key !== 'etc' ? item.title : '';
        setCourierCode(item.key);
        setCourierName(courierName);
        if (onChangeText) {
          onChangeText(item.title);
        }
      },
    };
  });
  return (
    <View
      style={{
        marginBottom: courierCode === 'etc' ? 3 : 0,
        marginTop: 1,
        marginLeft: 5,
      }}
    >
      {disabled ? (
        <Text style={{ ...styles.textInput, fontSize: 15, minWidth: 80 }}>{courierName}</Text>
      ) : courierCode === 'etc' ? (
        <TextInput
          style={{
            ...styles.textInput,
            minHeight: 25,
            paddingHorizontal: 5,
            fontSize: 13,
            minWidth: 70,
            borderColor: 'rgba(255,255,255,0.5)',
            borderWidth: 1,
            borderRadius: 5,
          }}
          placeholder={Strings.ENTER_COURIER}
          placeholderTextColor={'rgba(255, 255, 255, 0.3)'}
          onChangeText={(value) => {
            setCourierName(value);
            if (onChangeText) {
              onChangeText(value);
            }
          }}
          value={courierName}
        />
      ) : (
        <ModalMenuButton
          title={Strings.SELECT_COURIER}
          type={'bottomScrollableSelection'}
          menu={courierList}
          buttonView={
            <View style={styles.backNameSelectContainer}>
              <Text style={{ color: Constants.TIER_COLORS.ARTISAN, fontSize: 15 }}>
                {courierCode ? courierName : Strings.SELECT_COURIER}
              </Text>
              <FastImage
                style={{ width: 15, height: 15, marginLeft: 5 }}
                source={require('../Resources/img/icCommonSelect20.png')}
              />
            </View>
          }
        />
      )}
      {courierCode !== 'etc' && !disabled && <View style={styles.divider} />}
    </View>
  );
}

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

function CartItem({ cartItem, context, region, KRWPerUSD }) {
  return (
    <View style={styles.buyerBodyContainer}>
      <TouchableWithoutFeedback
        onPress={() => {
          context.props.navigation.push('ProductPage', {
            productId: cartItem.product.productId,
            fetchData: () => {},
          });
        }}
      >
        <FastImage
          style={styles.productThumbnail}
          source={{ uri: cartItem.product.thumbnailUrl }}
        />
      </TouchableWithoutFeedback>
      <View style={styles.descriptionContainer}>
        <Text style={[styles.productTitle]} numberOfLines={1}>
          {cartItem.product.title}
        </Text>
        <OrderOptions options={cartItem.options} />
        <Text style={styles.optionName}>
          {context.props?.isB2BInquiry ? 'Inquire' : `${Strings.NUMBER_PRODUCTS}: ${cartItem.number}`}
        </Text>
        <Text style={styles.price}>
          {Utils.displayPrice(cartItem.price, region, context?.props?.KRWPerUSD)}
        </Text>
      </View>
    </View>
  );
}

function BuyerPaidHeader({ order }) {
  const payDate = new Date(order.paidAt);
  const payDateYear = payDate.getFullYear();
  const payDateMonth = ('0' + (1 + payDate.getMonth())).slice(-2);
  const payDateDate = ('0' + payDate.getDate()).slice(-2);
  const payDateString = `${payDateYear}.${payDateMonth}.${payDateDate}`;
  const status = Constants.ORDER_STATUS_TITLE(order.statusCode);

  return (
    <View style={styles.buyerPaidHeaderContainer}>
      <Text style={styles.paidDate} numberOfLines={1}>
        <Text
          style={{
            fontSize: 18,
            color: Constants.TIER_COLORS.ARTISAN,
            fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.ExtraBold,
          }}
        >
          {status}
        </Text>{' '}
        <Text style={{ fontSize: 14, color: Constants.TIER_COLORS.OPERATOR }}>{payDateString}</Text>
      </Text>
      <TouchableWithoutFeedback onPress={() => {}}>
        <FastImage
          style={styles.moveButton}
          source={require('../Resources/img/icCommonNext18.png')}
        />
      </TouchableWithoutFeedback>
    </View>
  );
}

function ShippingTrackingHyperLink({ company, invoice }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Text style={styles.status}>{'('}</Text>
      <Pressable
        onPress={() => {
          Linking.openURL(`${CourierTrackingLinkUrls.get(company)}${invoice}`);
        }}
      >
        <Text
          style={{
            ...styles.status,
            color: '#77f',
            textDecorationLine: 'underline',
          }}
        >
          {`${company}, ${invoice}`}
        </Text>
      </Pressable>
      <Text style={styles.status}>{')'}</Text>
    </View>
  );
}

function BuyerPaidFooter({ order, context }) {
  // const status = Constants.ORDER_STATUS_TITLE(order.statusCode);
  return (
    <View style={styles.buyerFooterContainer}>
      <View style={{ flexDirection: 'row' }}>
        {/* <View style={styles.buyerPaidStatusContainer}>
          <FastImage
            style={styles.statusIcon}
            source={require('../Resources/img/icCommonOptionRe12W.png')}
          />
          <Text style={styles.status}>{status}</Text>
        </View> */}
        {order.statusCode === Constants.ORDER_STATUS_CODE.SHIPPING &&
        context.state.courierCompany !== '' ? (
          ShippingTrackingHyperLink({
            company: context.state.courierCompany,
            invoice: context.state.courierInvoice,
          })
        ) : (
          <View style={styles.buyerPaidFooterContainer}>
            <UserActionButtons order={order} context={context} />
          </View>
        )}
      </View>
      {(order.actionMemoBuyer !== '' || order.actionMemoSeller !== '') &&
        (context.props.mode === 'myorder_detail' || context.props.mode === 'mystore_detail') && (
          <View style={{ ...styles.buyerPaidStatusContainer, marginTop: 10 }}>
            <Text style={styles.optionName}>{order.actionMemoBuyer || order.actionMemoSeller}</Text>
          </View>
        )}
    </View>
  );
}

function CourierInvoice({ context, disable = false }) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' && !disable ? 5 : 0,
        marginBottom: disable === false ? 3 : 0,
        marginLeft: 5,
        marginRight: 3,
        paddingHorizontal: 5,
      }}
    >
      {disable === false ? (
        <TextInput
          keyboardType={'decimal-pad'}
          textContentType={'telephoneNumber'}
          style={styles.textInputWithBottomLine}
          placeholder={Strings.COURIER_NUMBER}
          placeholderTextColor={Constants.TIER_COLORS.STRIVER}
          value={context.state.courierInvoice}
          onChangeText={(value) => {
            context.setState({ courierInvoice: value });
          }}
        />
      ) : (
        <Text
          style={{ ...styles.textInput, fontSize: 14 }}
          onChangeText={(value) => {
            context.setState({ courierInvoice: value });
          }}
        >
          {context.state.courierInvoice}
        </Text>
      )}
    </View>
  );
}

function CourierModificationButton({ context, isModifying }) {
  const courier = {
    company: context.state.courierCompany,
    invoice: context.state.courierInvoice,
  };
  return (
    <View style={styles.userActionContainer}>
      <Pressable
        onPress={() => {
          if (isModifying) {
            APIprovider.actionOrder(context.props.data.orderId, undefined, courier)
              .then((result) => {
                this.props?.getOrderList();
                context.props.onOrderAction(
                  Constants.ORDER_ACTION_CODE.START_SHIPMENT,
                  context.data,
                );
              })
              .catch((err) => {
                if (err.errorCode === 0) {
                  Alert.alert(
                    Strings.FAILED_TO_ACTION_ORDER,
                    err.errorMsg ? err.errorMsg : '',
                    [{ text: Strings.OK }],
                    { cancelable: true },
                  );
                }
              });
          }
          context.setState({ isCourierModifying: !isModifying });
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 60,
            borderRadius: 4,
            marginRight: 5,
            backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            paddingHorizontal: 8,
          }}
        >
          <Text style={styles.textInput}>
            {isModifying === false ? Strings.EDIT : Strings.SAVE}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function UserActionButtons({ order, context, disable = false }) {
  let actionData = {
    title1: '',
    message1: '',
    onAction1: () => {},
    title2: '',
    message2: '',
    onAction2: () => {},
  };
  if (
    order.statusCode === Constants.ORDER_STATUS_CODE.OUTSTANDING &&
    context.props.mode === 'cart'
  ) {
    actionData.title1 = Strings.MAKE_ORDER;
    //      actionData.title1 = ""
    actionData.onAction1 = () => {
      // insert address and pay
      APIprovider.getOrder(order.orderId, order.buyer.userId, null).then((order) => {
        context.props.navigation.navigate('MakeOrder', {
          order: order,
          onSucceedToPay: () => {
            order.statusCode = Constants.ORDER_STATUS_CODE.NOT_ACCEPTED;
            this.props?.getOrderList();
            context.props.onOrderAction(Constants.ORDER_ACTION_CODE.PAY, order);
          },
        });
      });
    };
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.SHIPMENT_COMPLETED &&
    context.props.mode === 'myorder'
  ) {
    actionData.title1 = Strings.CONFIRM_PURCHASE;
    actionData.message1 = Strings.SURE_TO_CONFIRM_PURCHASE;
    actionData.onAction1 = () => {
      APIprovider.actionOrder(order.orderId, Constants.ORDER_STATUS_CODE.PURCHASE_COMPLETED)
        .then((updatedOrder) => {
          updatedOrder.product = order.product; // no product data on updatedOrder
          this.props?.getOrderList();
          context.props.onOrderAction(Constants.ORDER_ACTION_CODE.CONFIRM_PURCHASE, updatedOrder);
        })
        .catch((err) => {
          if (err.errorCode === 0) {
            Alert.alert(
              Strings.FAILED_TO_ACTION_ORDER,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          }
        });
    };
    //    actionData.title2 = Strings.CANCEL_PURCHASE
    actionData.title2 = '';
    actionData.message2 = Strings.SURE_TO_CANCEL_PURCHASE;
    actionData.onAction2 = () => {
      APIprovider.actionOrder(order.orderId, Constants.ORDER_STATUS_CODE.PURCHASE_CANCELED)
        .then((result) => {
          this.props?.getOrderList();
          context.props.onOrderAction(Constants.ORDER_ACTION_CODE.CANCEL_PURCHASE, order);
        })
        .catch((err) => {
          if (err.errorCode === 0) {
            Alert.alert(
              Strings.FAILED_TO_ACTION_ORDER,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          }
        });
    };
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.NOT_ACCEPTED &&
    context.props.mode === 'mystore'
  ) {
    actionData.title1 = Strings.ACCEPT;
    actionData.message1 = Strings.RECEIVE_ORDER_AND_PREPARE_PRODUCT;
    actionData.onAction1 = () => {
      APIprovider.actionOrder(order.orderId, Constants.ORDER_STATUS_CODE.PREPARING)
        .then((result) => {
          this.props?.getOrderList();
          context.props.onOrderAction(Constants.ORDER_ACTION_CODE.ACCEPT, order);
        })
        .catch((err) => {
          if (err.errorCode === 0) {
            Alert.alert(
              Strings.FAILED_TO_ACTION_ORDER,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          }
        });
    };
    actionData.title2 = Strings.REJECT;
    actionData.message2 = Strings.SURE_TO_REJECT_ORDER;
    actionData.onAction2 = () => {
      context.props.navigation.navigate('OrderRejection', {
        userId: context.props.data.seller.userId,
        orderId: order.orderId,
      });
    };
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.NOT_ACCEPTED &&
    context.props.mode === 'myorder'
  ) {
    actionData.title1 = Strings.CANCEL_PURCHASE;
    actionData.message1 = Strings.SURE_TO_CANCEL_PURCHASE;
    actionData.onAction1 = () => {
      context.props.navigation.navigate('PurchaseCancellation', {
        userId: context.props.data.buyer.userId,
        orderId: order.orderId,
        getOrderList: () => context.props?.getOrderList(),
      });
    };
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.PREPARING &&
    context.props.mode === 'mystore'
  ) {
    // 배송 준비중 일 때, 주문 카드
    const courier = {
      company: context.state.courierCompany,
      invoice: context.state.courierInvoice,
    };
    actionData.title1 = Strings.SHIPMENT_STARTED;
    actionData.message1 = Strings.NOTICE_TO_BUYER_SHIPMENT_STARTED;
    actionData.onAction1 = () => {
      APIprovider.actionOrder(order.orderId, Constants.ORDER_STATUS_CODE.SHIPPING, courier)
        .then((result) => {
          this.props?.getOrderList();
          context.props.onOrderAction(Constants.ORDER_ACTION_CODE.START_SHIPMENT, order);
        })
        .catch((err) => {
          if (err.errorCode === 0) {
            Alert.alert(
              Strings.FAILED_TO_ACTION_ORDER,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          }
        });
    };
    actionData.title2 = Strings.REJECT;
    actionData.message2 = Strings.SURE_TO_REJECT_ORDER;
    actionData.onAction2 = () => {
      context.props.navigation.navigate('OrderRejection', {
        userId: context.props.data.seller.userId,
        orderId: order.orderId,
      });
    };
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.SHIPPING &&
    context.props.mode === 'mystore'
  ) {
    actionData.title1 = Strings.SHIPMENT_COMPLETED;
    actionData.message1 = Strings.NOTICE_TO_BUYER_SHIPMENT_COMPLETED;
    actionData.onAction1 = () => {
      APIprovider.actionOrder(order.orderId, Constants.ORDER_STATUS_CODE.SHIPMENT_COMPLETED)
        .then((result) => {
          this.props?.getOrderList();
          context.props.onOrderAction(Constants.ORDER_ACTION_CODE.END_SHIPMENT, order);
        })
        .catch((err) => {
          if (err.errorCode === 0) {
            Alert.alert(
              Strings.FAILED_TO_ACTION_ORDER,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          }
        });
    };
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.BUYER_CANCEL_REQUEST &&
    context.props.mode === 'mystore'
  ) {
    actionData.title1 = Strings.PURCHASE_CANCELLATION_CHECK;
    actionData.message1 = Strings.BUYER_CANCEL_REQUEST;
    actionData.onAction1 = () => {
      APIprovider.actionOrder(order.orderId, Constants.ORDER_ACTION_CODE.ACCEPT_CANCEL_REQUEST)
        .then((result) => {
          this.props?.getOrderList();
          context.props.onOrderAction(Constants.ORDER_ACTION_CODE.ACCEPT_CANCEL_REQUEST, order);
        })
        .catch((err) => {
          if (err.errorCode === 0) {
            Alert.alert(
              Strings.PURCHASE_CANCELLATION_CHECK_FAILED_MESSAGE,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          }
        });
    };
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.SHIPMENT_COMPLETED &&
    context.props.mode === 'mystore'
  ) {
  } else if (
    order.statusCode === Constants.ORDER_STATUS_CODE.PURCHASE_COMPLETED &&
    context.props.mode === 'mystore'
  ) {
  }

  if (!actionData.title1 && !actionData.title2) {
    return <View />;
  }

  return (
    <View style={styles.userActionContainer}>
      {actionData.title1 !== '' && (
        <Pressable
          disabled={disable}
          style={styles.userActionButton}
          onPress={() => {
            if (actionData.message1 !== '') {
              Alert.alert(
                actionData.title1,
                actionData.message1,
                [
                  {
                    text: Strings.CANCEL,
                    style: 'cancel',
                  },
                  {
                    text: Strings.OK,
                    onPress: () => {
                      actionData.onAction1();
                    },
                  },
                ],
                { cancelable: false },
              );
            } else {
              actionData.onAction1();
            }
          }}
        >
          <Text style={styles.userActionButtonTitle}>{actionData.title1}</Text>
        </Pressable>
      )}
      {actionData.title2 !== '' && (
        <Pressable
          disabled={disable}
          style={styles.userActionButton}
          onPress={() => {
            if (actionData.message2 !== '') {
              Alert.alert(
                actionData.title2,
                actionData.message2,
                [
                  {
                    text: Strings.CANCEL,
                    style: 'cancel',
                  },
                  {
                    text: Strings.OK,
                    onPress: () => {
                      actionData.onAction2();
                    },
                  },
                ],
                { cancelable: false },
              );
            } else {
              actionData.onAction2();
            }
          }}
        >
          <Text style={styles.userActionButtonTitle}>{actionData.title2}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default class OrderListItemView extends Component {
  static contextType = Context;
  static defaultProps = {
    navigation: null,
    data: {
      orderId: null,
      cartItems: [
        {
          product: {
            productId: null,
            title: '',
            thumbnailUrl: '',
          },
          number: 0,
          options: null,
          price: 0,
        },
      ],
      buyer: {
        userId: '',
        name: '',
        thumbnailUrl: '',
      },
      email: '',
      phone: '',
      address: '',
      statusCode: 0,
      orderAt: 10,
      preparingAt: 0,
      shippingAt: 0,
      shipmentCompletedAt: 0,
      purchaseCompletedAt: 0,
    },
    /* mode can be set by value of
     * 'cart' - 장바구니
     * 'making_order' - 주문하기
     * 'myorder' - 주문내역
     * 'myorder_detail' - 주문내역 상세
     * 'mystore' - 마이스토어
     * 'mystore_detail' - 마이스토어 상세
     */
    mode: '',
    onOrderAction: (code, data) => {},
  };

  constructor(props) {
    super(props);
    this.state = {
      isExpanded: false,
      isCourierModifying: false,
      courierInvoice: props.data.shipmentCourierNO ? props.data.shipmentCourierNO : '',
      courierCompany: props.data.shipmentCourierCO ? props.data.shipmentCourierCO : '',
      courierCompanySelectionModalVisible: 'false',
    };
  }

  render() {
    const { data, navigation } = this.props;
    if (this.props.mode === 'mystore') {
      return (
        <TouchableWithoutFeedback
          onPress={() => {
            navigation.push('OrderPage', {
              orderId: data.orderId,
              sellerId: data.seller.userId,
              KRWPerUSD: this.props?.KRWPerUSD,
            });
          }}
        >
          <View style={[styles.buyerContainer, { marginTop: 20 }, this.props.style]}>
            {data.cartItems.map((cartItem, idx) => (
              <View key={cartItem._id + '_' + idx}>
                {idx > 0 && <View style={styles.divider} />}
                <CartItem cartItem={cartItem} context={this} region={this.context?.state?.region} />
              </View>
            ))}
            <View style={styles.userActionContainerMystore}>
              {data.statusCode === Constants.ORDER_STATUS_CODE.PREPARING ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                    marginTop: 10,
                    marginBottom: 5,
                  }}
                >
                  <CourierSelector
                    initialCourier={this.state.courierCompany}
                    onChangeText={(value) => {
                      this.setState({ courierCompany: value });
                    }}
                    disabled={false}
                  />
                  <CourierInvoice context={this} />
                  <CourierCompanySelectionModal
                    visible={this.state.courierCompanySelectionModalVisible}
                    onSelect={(value) => {
                      this.setState({ courierCompany: value });
                    }}
                    onCancel={() => {
                      this.setState({
                        courierCompanySelectionModalVisible: false,
                      });
                    }}
                  />
                </View>
              ) : data.statusCode === Constants.ORDER_STATUS_CODE.SHIPPING ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                    marginTop: 10,
                    marginBottom: 5,
                  }}
                >
                  <CourierSelector
                    initialCourier={this.state.courierCompany}
                    onChangeText={(value) => {
                      this.setState({ courierCompany: value });
                    }}
                    disabled={!this.state.isCourierModifying}
                  />
                  <CourierInvoice context={this} disable={!this.state.isCourierModifying} />
                  <CourierModificationButton
                    context={this}
                    isModifying={this.state.isCourierModifying}
                  />
                  <CourierCompanySelectionModal
                    visible={this.state.courierCompanySelectionModalVisible}
                    onSelect={(value) => {
                      this.setState({ courierCompany: value });
                    }}
                    onCancel={() => {
                      this.setState({
                        courierCompanySelectionModalVisible: false,
                      });
                    }}
                  />
                </View>
              ) : (
                <View />
              )}
              <View style={{ alignSelf: 'flex-end' }}>
                <UserActionButtons
                  order={data}
                  context={this}
                  disable={this.state.isCourierModifying}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      );
    } else if (this.props.mode === 'mystore_detail') {
      return (
        <View style={[styles.buyerContainer, this.props.style]}>
          {data.cartItems.map((cartItem, idx) => (
            <View key={cartItem._id + '_' + idx}>
              {idx > 0 && <View style={styles.divider} />}
              <CartItem cartItem={cartItem} context={this} region={this.context?.state?.region} />
            </View>
          ))}
          <BuyerPaidFooter order={data} context={this} />
        </View>
      );
    } else if (this.props.mode === 'making_order') {
      return (
        <View style={[styles.buyerContainer, this.props.style]}>
          {data.cartItems.map((cartItem, idx) => (
            <View key={cartItem.product.productId + '_' + idx}>
              {idx > 0 && <View style={styles.divider} />}
              <CartItem cartItem={cartItem} context={this} region={this.context?.state?.region} />
            </View>
          ))}
        </View>
      );
    } else if (this.props.mode === 'myorder') {
      return (
        <View style={[styles.buyerContainer, this.props.style]}>
          <TouchableWithoutFeedback
            onPress={() => {
              navigation.push('OrderPage', {
                orderId: data.orderId,
                buyerId: data.buyer.userId,
                KRWPerUSD: this.props?.KRWPerUSD,
              });
            }}
          >
            <View>
              <BuyerPaidHeader order={data} />
              {data.cartItems.map((cartItem, idx) => (
                <View key={idx}>
                  {idx > 0 && <View style={styles.divider} />}
                  <CartItem
                    cartItem={cartItem}
                    context={this}
                    region={this.context?.state?.region}
                  />
                </View>
              ))}
              <BuyerPaidFooter order={data} context={this} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      );
    } else if (this.props.mode === 'myorder_detail') {
      return (
        <View style={[styles.buyerContainer, this.props.style]}>
          {data.cartItems.map((cartItem, idx) => (
            <View key={idx}>
              {idx > 0 && <View style={styles.divider} />}
              <CartItem cartItem={cartItem} context={this} region={this.context?.state?.region} />
            </View>
          ))}
          <BuyerPaidFooter order={data} context={this} />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  buyerContainer: {
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    borderRadius: 10,
    width: Dimensions.get('window').width - 40,
    alignSelf: 'center',
  },
  mystoreBodyContainer: {
    padding: 20,
    flexDirection: 'row',
  },
  buyerCartHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 6,
  },
  buyerPaidHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  buyerBodyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    color: Constants.TIER_COLORS.OPERATOR,
  },
  productTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    fontSize: 15,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  price: {
    fontSize: 15,
    color: 'black',
  },
  userActionButtonTitle: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  buyerFooterContainer: {
    flexDirection: 'column',
    marginHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: Constants.TIER_COLORS.STRIVER,
  },
  buyerCartFooterContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  buyerPaidFooterContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userActionContainerMystore: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: -20,
  },
  userActionButton: {
    flexDirection: 'row',
    height: 30,
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    color: '#666',
  },
  paidDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Constants.TIER_COLORS.ARTISAN,
  },
  textInputWithBottomLine: {
    minWidth: 80,
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 14,
    flex: 1,
    overflow: 'visible',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomColor: Constants.TIER_COLORS.STRIVER,
    borderBottomWidth: 1,
  },
  textInput: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 13,
    overflow: 'visible',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  deleteButton: {
    width: 12,
    height: 12,
    marginLeft: 20,
  },
  moveButton: {
    width: 10,
    height: 18,
  },
  descriptionContainer: {
    flex: 1,
  },
  buyerPaidStatusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 15,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  statusIcon: {
    width: 12,
    height: 12,
    marginRight: 8,
  },
  optionItemContainer: {},
  divider: {
    height: 1,
    marginTop: Platform.OS === 'ios' ? 0 : 3,
    marginRight: 3,
    backgroundColor: Constants.TIER_COLORS.ARTISAN,
  },
  backNameSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
