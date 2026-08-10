import React from 'react';
import { Alert, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import { KeyboardAwareScrollView as KeyboardAvoidingView } from 'react-native-keyboard-aware-scroll-view';
import { connect } from 'react-redux';
import { Context } from '../Contexts';
import { setCurrencyRate } from '../slices/user';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import OrderListItemView from './OrderListItemView';
import Strings from './Strings';
import Utils from './utils';
import { CheckBox } from './Views';
import { StackActions } from '@react-navigation/native';
import RewardUse from '../screens/MakeOrderScreen/RewardUse';
import PromotionCode from '../screens/MakeOrderScreen/PromotionCode';
import PaymentMethods from '../screens/MakeOrderScreen/PaymentMethods';
import { moderateScale } from './utils/scailing';

class MakeOrderScreen extends React.Component {
  static contextType = Context;
  constructor(props) {
    super(props);
    const {
      onSucceedToPay,
      cartItems,
      totalPrice,
      shipmentCost,
      shipmentCostUS,
      lowestOrderPriceForFreeDeliveryKR,
      lowestOrderPriceForFreeDeliveryUS,
      shippingRegion,
      KRWPerUSD,
      // 해외(global) 주문에서만 전달되는 공동구매 할인액. 국내 주문에서는 undefined → 0.
      globalGroupBuyingDiscountAmount,
    } = this.props.route.params;

    this.state = {
      address: '',
      buyerMemo: '',
      buyerName: '',
      buyerEmail: '',
      buyerPhone: '',
      receiverName: '',
      receiverPhone: '',
      lowestOrderPriceForFreeDeliveryKR,
      lowestOrderPriceForFreeDeliveryUS,
      price: totalPrice - shipmentCost,
      shipmentCostKR:
        lowestOrderPriceForFreeDeliveryKR !== 0 &&
        totalPrice - shipmentCost >= lowestOrderPriceForFreeDeliveryKR
          ? 0
          : shipmentCost,
      shipmentCostUS:
        lowestOrderPriceForFreeDeliveryUS !== 0 &&
        totalPrice - shipmentCost >= lowestOrderPriceForFreeDeliveryUS
          ? 0
          : shipmentCostUS,
      shippingRegion: shippingRegion || Constants.COUNTRY.KOREA,
      isFreeShippingKR:
        lowestOrderPriceForFreeDeliveryKR !== 0 &&
        totalPrice - shipmentCost >= lowestOrderPriceForFreeDeliveryKR,
      isFreeShippingUS:
        lowestOrderPriceForFreeDeliveryUS !== 0 &&
        totalPrice - shipmentCost >= lowestOrderPriceForFreeDeliveryUS,
      isSameInfoToOrderer: false,
      KRWPerUSD,
      isUseReward: false,
      rewardUse: 0,
      finalPrice: 0,
      discountCode: '',
      promotionDiscount: 0,
      kovanPayGroup: Constants.KOVAN_PAY_GROUP.CREDIT_CARD,
      kovanPayMethod: Constants.KOVAN_PAY_METHOD.CREDIT_CARD,
      certifiedReviewerRewardUse: 0,
      rewardAvailable: true,
      globalGroupBuyingDiscountAmount: globalGroupBuyingDiscountAmount || 0,
    };

    // props.navigation.setOptions({
    //   title: Strings.MAKE_ORDER,
    // });
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
    });

    //        APIprovider.getRevenueDetails(this.getRevenueDetailsListCallback.bind(this))
    this.loadLastInputData();
  }

  async loadLastInputData() {
    let buyerName = await Preference.get('makeOrderBuyerName');
    let buyerPhone = await Preference.get('makeOrderBuyerPhone');
    let buyerEmail = await Preference.get('makeOrderBuyerEmail');
    let buyerMemo = await Preference.get('makeOrderBuyerMemo');
    let receiverName = await Preference.get('makeOrderReceiverName');
    let receiverPhone = await Preference.get('makeOrderReceiverPhone');
    let address = await Preference.get('makeOrderAddress');
    buyerName = buyerName ? buyerName : '';
    buyerPhone = buyerPhone ? buyerPhone : '';
    buyerEmail = buyerEmail ? buyerEmail : '';
    buyerMemo = buyerMemo ? buyerMemo : '';
    receiverName = receiverName ? receiverName : '';
    receiverPhone = receiverPhone ? receiverPhone : '';
    address = address ? address : '';

    const result = await APIprovider.getCurrencyRate();

    if (result && result.success) {
      this.setState({ KRWPerUSD: result.currencyRate });
      this.props.setKRWPerUSD(result.currencyRate);
    }

    this.setState({
      buyerName,
      buyerPhone,
      buyerEmail,
      buyerMemo,
      receiverName,
      receiverPhone,
      address,
      // 장바구니에서 넘어온 배송 리전을 존중한다 (기존엔 무조건 국내 배송비였음)
      finalPrice: this.state.price + this.getShipmentCostForRegion(this.state.shippingRegion),
    });
  }

  // 리전별 배송비 단일 산정처: 판매자 설정(무료배송 임계 반영된 state 값) 우선,
  // 해외는 값이 없을 때만 기존 $20 폴백을 유지한다.
  getShipmentCostForRegion(region) {
    const KRWPerUSD =
      this.state.KRWPerUSD || this.props?.route?.params?.KRWPerUSD || Constants.KRW_PER_USD;
    if (region === Constants.COUNTRY.US) {
      return this.state.shipmentCostUS ?? 20 * KRWPerUSD;
    }
    return this.state.shipmentCostKR ?? this.props.route.params.shipmentCost;
  }

  onPressSubmitButton() {
    const { cartItems, productId, KRWPerUSD } = this.props.route.params;
    const isGlobal = !!this.props.isGlobal;

    // 가격 정보 로딩 전(finalPrice=0)에 제출하면 "결제액 0원" 경로로 무료 주문이
    // 생성될 수 있고, 응답 대기 중 연타하면 중복 주문이 생성된다.
    if (!this.state.finalPrice || this.state.finalPrice <= 0) {
      Alert.alert(Strings.MAKE_ORDER, Strings.RETRY_GUIDELINES, [{ text: Strings.OK }], {
        cancelable: true,
      });
      return false;
    }
    if (this._isSubmittingOrder) {
      return false;
    }

    const validation = (condition, message) => {
      if (!condition) {
        Alert.alert(Strings.MAKE_ORDER, message, [{ text: Strings.OK }], {
          cancelable: true,
        });
        return false;
      }
      return true;
    };

    if (this.props.route.params?.categoryCode === 'service') {
      if (
        !validation(this.state.buyerName !== '', Strings.INPUT_BUYER_NAME) ||
        !validation(this.state.buyerPhone !== '', Strings.INPUT_PHONE_TO_CONTRACT)
      ) {
        return false;
      }
    } else {
      if (
        !validation(this.state.buyerName !== '', Strings.INPUT_BUYER_NAME) ||
        !validation(this.state.buyerPhone !== '', Strings.INPUT_PHONE_TO_CONTRACT) ||
        !validation(this.state.address !== '', Strings.INPUT_ADDRESS_TO_RECEIVE_PRODUCT) ||
        !validation(this.state.receiverName !== '', Strings.INPUT_RECEIVER_NAME) ||
        !validation(this.state.receiverPhone !== '', Strings.INPUT_RECEIVER_PHONE)
      ) {
        return false;
      }
    }

    const buyernm = this.state.buyerName.trim();
    const buyerEmail = this.state.buyerEmail.trim();

    const {
      address,
      buyerName,
      buyerPhone,
      buyerMemo,
      receiverName,
      receiverPhone,
      shippingRegion,
      isFreeShippingKR,
      isFreeShippingUS,
      rewardUse,
      certifiedReviewerRewardUse,
      discountCode,
      promotionDiscount,
      finalPrice,
      kovanPayGroup,
      kovanPayMethod,
      globalGroupBuyingDiscountAmount,
    } = this.state;

    const params = {
      cartItems,
      buyerName,
      buyerPhone,
      buyerEmail,
      buyerMemo,
      receiverName,
      receiverPhone,
      address,
      isAbroad: shippingRegion === Constants.COUNTRY.US ? true : false,
      isFreeShippingKR,
      isFreeShippingUS,
      rewardUse,
      certifiedReviewerRewardUse,
      discountCode,
      promotionDiscount,
    };

    this._isSubmittingOrder = true;
    APIprovider.newOrder(params)
      .then((order) => {
        this._isSubmittingOrder = false;
        // APIprovider는 실패도 resolve하므로 성공 가정 전에 판정한다
        if (APIprovider.isFailure(order) || !order.orderId) {
          Alert.alert(Strings.FAILED_TO_MAKE_ORDER, order?.errorMsg || '');
          return;
        }
        if (
          finalPrice -
            rewardUse -
            promotionDiscount -
            certifiedReviewerRewardUse -
            globalGroupBuyingDiscountAmount <=
          0
        ) {
          APIprovider.payWithReward({
            orderId: order.orderId,
            rewardUse,
            certifiedReviewerRewardUse,
          })
            .then((res) => {
              console.log('payWithReward', res);

              if (
                this.props.route.params?.fetchData &&
                typeof this.props.route.params?.fetchData === 'function'
              ) {
                this.props.route.params?.fetchData();
              }

              if (res?.success) {
                Alert.alert(Strings.SUCCEED_TO_PAY);
                // return this.props.navigation.dispatch(StackActions.pop(1));
                return this.props.navigation.replace('MyOrderList');
              }

              Alert.alert(Strings.FAILED_TO_GET_PAYMENT_INFO);
              return this.props.navigation.dispatch(StackActions.pop(1));
            })
            .catch((err) => {
              console.log('payWithReward error', err);
              Alert.alert(Strings.FAILED_TO_GET_PAYMENT_INFO, err?.errorMsg || '');
            });
          return;
        }

        if (this.state.shippingRegion === Constants.COUNTRY.KOREA) {
          this.props.navigation.navigate('Pay', {
            onSucceedToPay: this.props.route.params.onSucceedToPay,
            order: order,
            buyItemnm: Strings.A_PRODUCT_AND_OTHERS({
              title: cartItems[0].product.title,
              otherCount: cartItems.length - 1,
            }),
            // 해외 주문 경로는 널 안전 접근을 쓰고 buyernm/buyerEmail/productId를 넘기지 않는다.
            ...(isGlobal
              ? {
                  buyItemcd: cartItems[0]?.product?.productId?.substring(0, 9),
                  buyerid: order?.buyer?.userId?.substring(0, 19),
                  orderno: order?.orderId?.substring(0, 19) || '',
                }
              : {
                  buyItemcd: cartItems[0].product.productId.substring(0, 9),
                  buyerid: order.buyer.userId.substring(0, 19),
                  buyernm,
                  buyerEmail,
                  orderno: order.orderId.substring(0, 19),
                  productId,
                }),
            fetchData: () => this.props.route.params?.fetchData(),
            buyReqamt:
              finalPrice -
              rewardUse -
              promotionDiscount -
              certifiedReviewerRewardUse -
              globalGroupBuyingDiscountAmount,
            rewardUse: rewardUse,
            certifiedReviewerRewardUse: certifiedReviewerRewardUse,
            kovanPayGroup,
            kovanPayMethod,
          });
        } else {
          this.props.navigation.push('PayPaypal', {
            onSucceedToPay: this.props.route.params.onSucceedToPay,
            order: {
              ...order,
              shipmentCost: this.getShipmentCostForRegion(Constants.COUNTRY.US),
              fetchData: () => this.props.route.params?.fetchData(),
              totalPrice:
                finalPrice -
                rewardUse -
                promotionDiscount -
                certifiedReviewerRewardUse -
                globalGroupBuyingDiscountAmount,
              rewardUse: rewardUse,
              certifiedReviewerRewardUse: certifiedReviewerRewardUse,
            },
          });
        }
      })
      .catch((err) => {
        this._isSubmittingOrder = false;
        console.log('FAILED_TO_MAKE_ORDER', err);
        Alert.alert(
          Strings.FAILED_TO_MAKE_ORDER,
          err.errorMsg ? err.errorMsg : '',
          [
            {
              text: Strings.OK,
              onPress: () => {
                this.props.navigation.pop();
              },
            },
          ],
          { cancelable: true },
        );
      });
  }
  render() {
    const { navigation } = this.props;
    const { cartItems, totalPrice, shipmentCost, shipmentCostUS } = this.props.route.params;
    // route.params가 없으면 20 * undefined = NaN으로 총액 전체가 NaN이 된다 —
    // API로 갱신된 state 값 → 파라미터 → 상수 순으로 폴백
    const KRWPerUSD =
      this.state.KRWPerUSD || this.props?.route?.params?.KRWPerUSD || Constants.KRW_PER_USD;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.container}
        >
          <View>
            <Text style={styles.sectionTitle}>{Strings.PRODUCT_DETAILS_TO_MAKE_ORDER}</Text>
            <OrderListItemView
              navigation={this.props.navigation}
              data={{ cartItems }}
              mode={'making_order'}
              style={{ marginBottom: 10 }}
              KRWPerUSD={KRWPerUSD}
            />
            <Text style={styles.sectionTitle}>{Strings.ORDERER_INFO}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={Strings.NAME}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              onChangeText={(value) => {
                this.setState({ buyerName: value });
                Preference.set('makeOrderBuyerName', value);
              }}
              value={this.state.buyerName}
              maxLength={Constants.MAX_LENGTH_USER_NAME}
            />
            <View style={styles.divider} />
            <TextInput
              style={styles.textInput}
              keyboardType={'number-pad'}
              placeholder={Strings.PHONE}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              onChangeText={(value) => {
                this.setState({ buyerPhone: value });
                Preference.set('makeOrderBuyerPhone', value);
              }}
              onFocus={() => {
                const buyerPhone = this.state.buyerPhone;
                const value = buyerPhone ? buyerPhone.match(/\d+/g).join('') : '';
                this.setState({ buyerPhone: value });
                Preference.set('makeOrderBuyerPhone', value);
              }}
              onEndEditing={() => {
                const buyerPhone = this.state.buyerPhone;
                // const value = buyerPhone
                //   ? buyerPhone
                //       .match(/\d+/g)
                //       .join('')
                //       .replace(/(\d{3})\-?(\d{4})\-?(\d{1})/, '$1-$2-$3')
                //   : '';
                this.setState({ buyerPhone: buyerPhone });
                Preference.set('makeOrderBuyerPhone', buyerPhone);
              }}
              value={this.state.buyerPhone}
              maxLength={Constants.MAX_LENGTH_USER_PHONE}
            />
            <View style={styles.divider} />
            <TextInput
              style={styles.textInput}
              keyboardType={'email-address'}
              placeholder={Strings.EMAIL}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              onChangeText={(value) => {
                this.setState({ buyerEmail: value });
                Preference.set('makeOrderBuyerEmail', value);
              }}
              value={this.state.buyerEmail}
              maxLength={Constants.MAX_LENGTH_USER_EMAIL}
            />
            <View style={styles.divider} />

            {this.props.route.params?.categoryCode === 'service' ? (
              <TextInput
                multiline={true}
                numberOfLines={10}
                style={{
                  ...styles.textInput,
                  height: 200,
                  // textAlignVertical: 'top',
                  marginTop: 10,
                }}
                placeholder={Strings.MEMO}
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                onChangeText={(value) => {
                  this.setState({ buyerMemo: value });
                  Preference.set('makeOrderBuyerMemo', value);
                }}
                value={this.state.buyerMemo}
                maxLength={Constants.MAX_LENGTH_ORDER_MEMO}
              />
            ) : (
              <TextInput
                style={styles.textInput}
                placeholder={Strings.MEMO}
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                onChangeText={(value) => {
                  this.setState({ buyerMemo: value });
                  Preference.set('makeOrderBuyerMemo', value);
                }}
                value={this.state.buyerMemo}
                maxLength={Constants.MAX_LENGTH_ORDER_MEMO}
              />
            )}
            <View style={styles.divider} />
            <View style={{ marginTop: 10 }} />

            {this.props.route.params?.categoryCode === 'service' ? null : (
              <>
                <Text style={styles.sectionTitle}>{Strings.SHIPPING_INFO}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={Strings.ADDRESS}
                  placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                  onChangeText={(value) => {
                    this.setState({ address: value });
                    Preference.set('makeOrderAddress', value);
                  }}
                  value={this.state.address}
                  maxLength={Constants.MAX_LENGTH_ADDRESS}
                />
                <View style={styles.divider} />
                <TextInput
                  style={styles.textInput}
                  placeholder={Strings.NAME}
                  placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                  onChangeText={(value) => {
                    this.setState({ receiverName: value });
                    Preference.set('makeOrderReceiverName', value);
                  }}
                  value={this.state.receiverName}
                  maxLength={Constants.MAX_LENGTH_USER_NAME}
                />
                <View style={styles.divider} />
                <TextInput
                  style={styles.textInput}
                  keyboardType={'number-pad'}
                  placeholder={Strings.PHONE}
                  placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                  onChangeText={(value) => {
                    this.setState({ receiverPhone: value });
                    Preference.set('makeOrderReceiverPhone', value);
                  }}
                  onFocus={() => {
                    const receiverPhone = this.state.receiverPhone;
                    const value = receiverPhone ? receiverPhone.match(/\d+/g).join('') : '';
                    this.setState({ receiverPhone: value });
                    Preference.set('makeOrderReceiverPhone', value);
                  }}
                  onEndEditing={() => {
                    const receiverPhone = this.state.receiverPhone;
                    const value = receiverPhone
                      ? receiverPhone
                          .match(/\d+/g)
                          .join('')
                          .replace(/(\d{3})-?(\d{4})-?(\d{1})/, '$1-$2-$3')
                      : '';
                    this.setState({ receiverPhone: value });
                    Preference.set('makeOrderReceiverPhone', value);
                  }}
                  value={this.state.receiverPhone}
                  maxLength={Constants.MAX_LENGTH_USER_PHONE}
                />
                <View style={styles.divider} />

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    marginTop: 10,
                  }}
                >
                  <CheckBox
                    onChanged={(value) => {
                      this.setState({
                        isSameInfoToOrderer: !this.state.isSameInfoToOrderer,
                        receiverPhone: !this.state.isSameInfoToOrderer ? this.state.buyerPhone : '',
                        receiverName: !this.state.isSameInfoToOrderer ? this.state.buyerName : '',
                      });

                      Preference.set(
                        'makeOrderReceiverName',
                        !this.state.isSameInfoToOrderer ? this.state.buyerName : '',
                      );
                      Preference.set(
                        'makeOrderReceiverPhone',
                        !this.state.isSameInfoToOrderer ? this.state.buyerPhone : '',
                      );
                    }}
                    value={this.state.isSameInfoToOrderer}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.ARTISAN,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
                    }}
                  >
                    {Strings.SAME_AS_ORDERER}
                  </Text>
                </View>
              </>
            )}

            <View style={{ marginTop: 10 }} />
            <Text style={styles.sectionTitle}>{Strings.PRICE_TO_PAY}</Text>
            <View style={styles.amountItemContainer}>
              <Text style={styles.amountTitle}>{Strings.ORDER_AMOUNT}</Text>
              <Text style={styles.amount}>
                {Utils.displayPrice(
                  totalPrice - shipmentCost,
                  this?.context?.state?.region,
                  KRWPerUSD,
                )}
              </Text>
            </View>
            <>
              <Text
                style={{
                  color: Constants.TIER_COLORS.ARTISAN,
                  marginBottom: 10,
                  fontSize: 15,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
                }}
              >
                {Strings.SHIPPING_REGION}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
                  <CheckBox
                    key={'checkoption_korea'}
                    onChanged={(value) => {
                      this.setState({
                        shippingRegion: Constants.COUNTRY.KOREA,
                        finalPrice:
                          this.state.price +
                          this.getShipmentCostForRegion(Constants.COUNTRY.KOREA),
                      });
                    }}
                    value={this.state.shippingRegion === Constants.COUNTRY.KOREA}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.KR}</Text>
                </View>
                {shipmentCostUS ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckBox
                      key={'checkoption_us'}
                      onChanged={(value) => {
                        this.setState({
                          shippingRegion: Constants.COUNTRY.US,
                          finalPrice:
                            this.state.price + this.getShipmentCostForRegion(Constants.COUNTRY.US),
                        });
                      }}
                      value={this.state.shippingRegion === Constants.COUNTRY.US}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: Constants.TIER_COLORS.ARTISAN }}>{Strings.US}</Text>
                  </View>
                ) : null}
              </View>
            </>
            <View style={styles.amountItemContainer}>
              <Text style={styles.amountTitle}>{Strings.SHIPMENT_COST}</Text>
              <Text style={styles.amount}>
                +
                {Utils.displayPrice(
                  this.getShipmentCostForRegion(this.state.shippingRegion),
                  this?.context?.state?.region,
                  KRWPerUSD,
                )}
              </Text>
            </View>

            {/*  */}
            <View style={styles.divider} />
            <PromotionCode context={this} cartItems={this.props.route.params.cartItems} />
            {/*  */}

            {/*  */}
            {this.state.rewardAvailable ? (
              <>
                <View style={styles.divider} />
                <RewardUse context={this} KRWPerUSD={KRWPerUSD} />
              </>
            ) : null}
            {/*  */}

            {/*  */}
            {this.state.shippingRegion === Constants.COUNTRY.KOREA &&
            this.state.finalPrice -
              this.state.rewardUse -
              this.state.promotionDiscount -
              this.state.certifiedReviewerRewardUse !==
              0 ? (
              <>
                <View style={styles.divider} />
                <PaymentMethods context={this} />
              </>
            ) : null}
            {/*  */}

            <View style={{ ...styles.divider, marginBottom: 4 }} />

            <View style={{ ...styles.amountItemContainer, paddingVertical: 4 }}>
              <Text style={styles.amountTitle}>{Strings.PRICE_TO_PAY}</Text>
              <Text style={styles.amount}>
                {Utils.displayPrice(this.state.finalPrice, this?.context?.state?.region, KRWPerUSD)}
              </Text>
            </View>

            {/* 할인코드 사용 */}
            {this.state.promotionDiscount ? (
              <View style={{ ...styles.amountItemContainer, paddingVertical: 4 }}>
                <Text style={styles.amountTitle}>{Strings.DISCOUNT_CODE}</Text>
                <Text style={styles.amount}>
                  {this.state.promotionDiscount ? '-' : ''}{' '}
                  {Utils.displayPrice(
                    this.state.promotionDiscount,
                    this?.context?.state?.region,
                    KRWPerUSD,
                  )}
                </Text>
              </View>
            ) : null}

            {/* 리워드 사용 */}
            {this.state.rewardUse || this.state.certifiedReviewerRewardUse ? (
              <View style={{ ...styles.amountItemContainer, paddingVertical: 4 }}>
                <Text style={styles.amountTitle}>{Strings.USING_REWARDS}</Text>
                <Text style={styles.amount}>
                  {this.state.rewardUse || this.state.certifiedReviewerRewardUse ? '-' : ''}{' '}
                  {Utils.displayPrice(
                    +this.state.rewardUse + +this.state.certifiedReviewerRewardUse,
                    this?.context?.state?.region,
                    KRWPerUSD,
                  )}
                </Text>
              </View>
            ) : null}

            {/* 글로벌 공구 할인 (해외 주문에서만 값이 들어온다) */}
            {this.state.globalGroupBuyingDiscountAmount ? (
              <View style={{ ...styles.amountItemContainer, paddingVertical: 4 }}>
                <Text style={styles.amountTitle}>{Strings.GLOBAL_GROUP_BUYING_DISCOUNT}</Text>
                <Text style={styles.amount}>
                  -{' '}
                  {Utils.displayPrice(
                    this.state.globalGroupBuyingDiscountAmount,
                    this?.context?.state?.region,
                    KRWPerUSD,
                  )}
                </Text>
              </View>
            ) : null}

            <View style={{ ...styles.amountItemContainer, paddingVertical: 4 }}>
              <Text style={styles.amountTitle}>{Strings.TOTAL_PRICE}</Text>
              <Text style={styles.amount}>
                {Utils.displayPrice(
                  this.state.finalPrice -
                    this.state.rewardUse -
                    this.state.promotionDiscount -
                    this.state.certifiedReviewerRewardUse -
                    this.state.globalGroupBuyingDiscountAmount,
                  this?.context?.state?.region,
                  KRWPerUSD,
                )}
              </Text>
            </View>
          </View>

          <Button
            containerStyle={styles.bottomButtonContainer}
            buttonStyle={{
              backgroundColor: Constants.COLOR_MAIN,
              height: 54,
            }}
            titleStyle={styles.bottomButtonTitle}
            title={Strings.PROCEED_TO_PAY(
              Utils.displayPrice(
                this.state.finalPrice -
                  this.state.rewardUse -
                  this.state.promotionDiscount -
                  this.state.certifiedReviewerRewardUse -
                  this.state.globalGroupBuyingDiscountAmount,
                this?.context?.state?.region,
                KRWPerUSD,
              ),
            )}
            onPress={this.onPressSubmitButton.bind(this)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 6,
    color: 'black',
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  textInput: {
    paddingVertical: 17,
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  amountItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  amountTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  amount: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  bottomButtonContainer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 44 : 20,
    marginHorizontal: 20,
  },
  bottomButtonTitle: {
    color: 'black',
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  divider: {
    height: 1,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
  },
});

export default connect(null, (dispatch) => ({
  setKRWPerUSD: (currencyRate) => dispatch(setCurrencyRate({ currencyRate })),
}))(MakeOrderScreen);
