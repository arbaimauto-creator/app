import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import IconEntypo from 'react-native-vector-icons/Entypo';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import RevenueListItemView from './RevenueListItemView.js';
import Strings from './Strings';
import Utils from './utils';

export default class RevenueScreen extends React.Component {
  headerMenuWidthdraw() {
    Alert.alert(Strings.WITHDRAW, Strings.NOT_SUPPORTED_YET, [{ text: Strings.OK }], {
      cancelable: true,
    });
  }

  headerMenu = [
    {
      name: Strings.WITHDRAW,
      icon: (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconFontAwesome size={20} name="dollar" color="#000" />
          <IconEntypo size={10} name="arrow-bold-right" color="#000" />
        </View>
      ),
      onClicked: this.headerMenuWidthdraw,
    },
  ];

  constructor(props) {
    super(props);

    this.state = {
      balance: 0,
      total: 0,
      revenueList: [],
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.REVENUE,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });

    APIprovider.getRevenueDetails()
      .then(this.getRevenueDetailsListCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
    APIprovider.getUserDetails(this.props.route.params.logonUserId)
      .then(this.getUserDetailsCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  getRevenueDetailsListCallback(data) {
    this.setState({
      revenueList: data,
    });
  }

  getUserDetailsCallback(data) {
    this.setState({
      total: data.profitAmount,
      balance: data.balance,
    });
  }

  renderRevenueDetailsTabView() {
    if (this.state.revenueList) {
      return (
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          data={this.state.revenueList}
          renderItem={({ item, index }) => (
            <RevenueListItemView
              key={item._id + index}
              navigation={this.props.navigation}
              data={item}
            />
          )}
          keyExtractor={(item) => item.purchaseId}
        />
      );
    }
  }

  render() {
    const { navigation } = this.props;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={{ padding: 30 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.revenueTitle}>{Strings.BALANCE}</Text>
                <Text style={styles.reveunueValue}>
                  ￦ {Utils.numberWithCommas(this.state.balance)}
                </Text>
              </View>
              <Text
                style={{
                  color: '#ccc',
                  marginHorizontal: 10,
                  fontSize: 24,
                  marginTop: 10,
                }}
              >
                |
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.revenueTitle}>{Strings.TOTAL}</Text>
                <Text style={styles.reveunueValue}>
                  ￦ {Utils.numberWithCommas(this.state.total)}
                </Text>
              </View>
            </View>
          </View>

          {this.renderRevenueDetailsTabView()}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  revenueTitle: {
    flex: 1,
    fontWeight: 'normal',
    fontSize: 16,
    alignSelf: 'center',
    color: 'white',
  },
  reveunueValue: {
    flex: 1,
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgb(128, 128, 128)',
  },
});
