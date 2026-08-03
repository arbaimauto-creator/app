import React, { Component } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import OrderListView from './OrderListView';
import Strings from './Strings';
import { moderateScale } from './utils/scailing';

export default class MyOrderListScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.MY_ORDER_LIST,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
  }

  render() {
    return (
      <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
        <OrderListView
          navigation={this.props.navigation}
          orderStatusCode={Constants.ORDER_STATUS_CODE.AFTER_PAY}
          buyerId={this.props.route.params.logonUserId}
          mode={'myorder'}
          KRWPerUSD={this.props.route.params.KRWPerUSD}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
});
