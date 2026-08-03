import React, { Component } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import Preference from 'react-native-default-preference';
import { Badge } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import APIprovider from './APIprovider';
import Constants from './Constants';
import Strings from './Strings';

function MoveButton() {
  return (
    <FastImage
      style={{
        width: 10,
        height: 18,
      }}
      resizeMode={'contain'}
      source={require('../Resources/img/icCommonNext18.png')}
    />
  );
}

function RefreshButton({ context }) {
  return (
    <TouchableNativeFeedback
      background={TouchableNativeFeedback.Ripple('#777', true)}
      onPress={() => {
        APIprovider.getMystoreDashboard()
          .then((data) => {
            context.setState({
              ...data,
            });
          })
          .catch((err) => {
            Alert.alert(
              Strings.FAILED_TO_LOAD_DATA,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
      }}
    >
      <View style={styles.floatingButtonContainer}>
        <FastImage
          style={styles.floatingButton}
          resizeMode={'contain'}
          source={require('../Resources/img/icBtnCircle68Y.png')}
        />
        <FastImage
          style={styles.floatingButtonIcon}
          resizeMode={'contain'}
          source={require('../Resources/img/icProductReload34B.png')}
        />
      </View>
    </TouchableNativeFeedback>
  );
}

export default class MyStoreDashboardView extends Component {
  constructor(props) {
    super(props);
    // this.props = props.parentProps;
    this.state = {
      isVisibleMystoreDashboard: true,
      newOrderCount: 0,
      preparingOrderCount: 0,
      shippingOrderCount: 0,
      shipmentCompletedOrderCount: 0,
      purchaseCompletedOrderCount: 0,
      claimOrderCount: 0,
      customerInquiryOrderCount: 0,

      uncheckedNewOrderCount: 0,
      uncheckedPreparingOrderCount: 0,
      uncheckedShippingOrderCount: 0,
      uncheckedShipmentCompletedOrderCount: 0,
      uncheckedPurchaseCompletedOrderCount: 0,
      uncheckedClaimOrderCount: 0,
      uncheckedCustomerInquiryCount: 0,
      buyerCancelOrderCount: 0,
      sellerCancelOrderCount: 0,
      acceptedCancelOrderCount: 0,
      finishedCancelOrderCount: 0,

      recentProductList: [],
      storeUserId: null,
    };
  }

  componentDidMount() {
    this.loadData();
    Preference.get('userId').then((value) => {
      this.setState({
        storeUserId: value,
      });
    });

    this._unsubscribe = this.props.parentProps.navigation.addListener('focus', () => {
      this.loadData();
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  loadData() {
    APIprovider.getMystoreDashboard()
      .then((data) => {
        this.setState({
          ...data,
        });
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  renderFoldIcon(isExpanded) {
    return isExpanded ? (
      <IconMaterialIcons
        size={20}
        name="keyboard-arrow-down"
        color={Constants.TIER_COLORS.ARTISAN}
      />
    ) : (
      <IconMaterialIcons size={20} name="keyboard-arrow-up" color={Constants.TIER_COLORS.ARTISAN} />
    );
  }

  renderMystoreOrders() {
    const { navigation } = this.props.parentProps;
    if (this.state.isVisibleMystoreDashboard) {
      return (
        <View>
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.NOT_ACCEPTED,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.NEW_ORDERS}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.newOrderCount}</Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.PREPARING,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.PREPARING_SHIPPING}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.preparingOrderCount}</Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.SHIPPING,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.SHIPPING}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.shippingOrderCount}</Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.SHIPMENT_COMPLETED,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.SHIPMENT_COMPLETED}</Text>
              <Text style={styles.dashboardItemValue}>
                {this.state.shipmentCompletedOrderCount}
              </Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.PURCHASE_COMPLETED,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.PURCHASE_COMPLETED}</Text>
              <Text style={styles.dashboardItemValue}>
                {this.state.purchaseCompletedOrderCount}
              </Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.BUYER_CANCEL_REQUEST,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.BUYER_CANCEL_REQUEST}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.buyerCancelOrderCount}</Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.SELLER_CANCEL_REQUEST,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.SELLER_CANCEL_REQUEST}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.sellerCancelOrderCount}</Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.REFUND_PENDING,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.REFUND_PENDING}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.acceptedCancelOrderCount}</Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
          <View style={styles.divider} />
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('OrderList', {
                orderStatusCode: Constants.ORDER_STATUS_CODE.CANCEL_FINISHED,
                mode: 'mystore',
                sellerId: this.state.storeUserId,
              });
            }}
          >
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.CANCEL_FINISHED}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.finishedCancelOrderCount}</Text>
              <MoveButton />
            </View>
          </TouchableNativeFeedback>
        </View>
      );
    } else {
      return <View />;
    }
  }

  renderMystoreCustomers() {
    if (this.state.isVisibleMystoreDashboard) {
      return (
        <View>
          <View style={styles.divider} />
          <TouchableNativeFeedback onPress={() => {}}>
            <View style={styles.dashboardItemContainer}>
              <Text style={styles.dashboardItemTitle}>{Strings.CUSTOMER_INQUIRIES}</Text>
              <Text style={styles.dashboardItemValue}>{this.state.customerInquiryOrderCount}</Text>
              {this.state.uncheckedCustomerInquiryCount > 0 && (
                <Badge
                  style={styles.dashboardItemBadge}
                  value={'+' + this.state.uncheckedCustomerInquiryCount}
                  status="error"
                />
              )}
            </View>
          </TouchableNativeFeedback>
        </View>
      );
    }
  }

  render() {
    const { navigation } = this.props.parentProps;
    return (
      <View style={{ height: '100%' }}>
        <ScrollView>
          <View style={styles.dashboardContainer}>
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {false && (
                <View style={{ borderRadius: 44, overflow: 'hidden' }}>
                  <TouchableNativeFeedback
                    background={TouchableNativeFeedback.Ripple('#777', true)}
                    onPress={() => {
                      this.setState({
                        isVisibleMystoreDashboard: !this.state.isVisibleMystoreDashboard,
                      });
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 40,
                        width: 44,
                        height: 44,
                        alignSelf: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {this.renderFoldIcon(this.state.isVisibleMystoreDashboard)}
                    </View>
                  </TouchableNativeFeedback>
                </View>
              )}
            </View>
            {this.renderMystoreOrders()}
          </View>

          {false && (
            <View style={styles.dashboardContainer}>
              <View
                style={{
                  padding: 10,
                  paddingVertical: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1 }}>
                  {Strings.CUSTOMERS}
                </Text>
              </View>
              {this.renderMystoreCustomers()}
            </View>
          )}
        </ScrollView>
        <RefreshButton context={this} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  dashboardContainer: {},
  dashboardItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  dashboardItemTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    marginLeft: 10,
    flex: 4,
    fontSize: 18,
  },
  dashboardItemValue: {
    color: Constants.TIER_COLORS.ARTISAN,
    flex: 1,
    fontSize: 18,
  },
  dashboardItemBadge: {
    flex: 1,
  },
  floatingButtonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 20,
    right: 20,
  },
  floatingButton: {
    width: 68,
    height: 68,
  },
  floatingButtonIcon: {
    position: 'absolute',
    width: 34,
    height: 34,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  bigDivider: {
    height: 0,
    backgroundColor: '#999',
  },
});
