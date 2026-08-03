import * as React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import Constants from './Constants';
import OrderListView from './OrderListView.js';
import Strings from './Strings';

const CartTabScene = (props) => (
  <View>
    <OrderListView
      navigation={props.navigation}
      orderStatusCode={Constants.ORDER_STATUS_CODE.OUTSTANDING}
      buyerId={props.logonUserId}
      viewMode={'buyer'}
    />
  </View>
);

const WaitingTabScene = (props) => (
  <View>
    <OrderListView
      navigation={props.navigation}
      orderStatusCode={Constants.ORDER_STATUS_CODE.WAITING}
      buyerId={props.logonUserId}
      viewMode={'buyer'}
    />
  </View>
);

const ReceivedTabScene = (props) => (
  <View>
    <OrderListView
      navigation={props.navigation}
      orderStatusCode={Constants.ORDER_STATUS_CODE.SHIPMENT_COMPLETED}
      buyerId={props.logonUserId}
      viewMode={'buyer'}
    />
  </View>
);

const initialLayout = { width: Dimensions.get('window').width };

export default function MyOrderTabView(props) {
  const [index, setIndex] = React.useState(0);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  let tabs = [];
  tabs.push({ key: 'cart', title: Strings.CART });
  tabs.push({ key: 'waiting', title: Strings.WAITING });
  tabs.push({ key: 'received', title: Strings.RECEIVED });
  const [routes] = React.useState(tabs);

  const renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
      case 'cart':
        return CartTabScene(props);
      case 'waiting':
        return WaitingTabScene(props);
      case 'received':
        return ReceivedTabScene(props);
    }
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={(idx) => {
        setIndex(idx);
        forceUpdate();
      }}
      initialLayout={initialLayout}
      style={styles.container}
      lazy={true}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: Constants.COLOR_MAIN }}
          labelStyle={styles.tabLabelStyle}
          indicatorContainerStyle={{ backgroundColor: 'white' }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  scene: {
    flex: 1,
  },
  tabLabelStyle: {
    color: Constants.COLOR_BACKGROUND_DARK,
  },
  divider: {
    height: 0,
    backgroundColor: '#ccc',
    marginTop: 10,
  },
});
