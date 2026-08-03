import React, { Component } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import APIprovider from './APIprovider';
import Constants from './Constants';
import MyStoreTabView from './MyStoreTabView';
import Strings from './Strings';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import { moderateScale } from './utils/scailing';

export default class MyStoreScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      productList: [],
    };
  }

  componentDidMount() {
    this.props.navigation.setOptions({
      title: Strings.SELLER_PAGE,
      headerLeft: () => HeaderLeftBackButton({ navigation: this.props.navigation }),
      //        headerRight: () =>
      //            <View style={{ borderRadius: 44, overflow: 'hidden', marginRight:6}}>
      //                  <ModalMenuButton
      //                    navigation={props.navigation}
      //                    menu={this.headerMenu}
      //                    headerRight
      //                    buttonView={
      //                        <View style={{borderRadius: 40, width: 44, height: 44, alignSelf:'center', justifyContent: 'center', alignItems:'center',overflow: 'hidden'}}>
      //                            <IconSL size={20} name="menu" color="#000" />
      //                        </View>
      //                    }
      //                  />
      //              </View>,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });
    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.loadData();
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  loadData() {
    APIprovider.getUserUploadProductList(this.props.route.params.logonUserId)
      .then((data) => {
        this.setState({ productList: data.productList });
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_PRODUCTS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  render() {
    return (
      <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
        <MyStoreTabView
          navigation={this.props.navigation}
          productList={this.state.productList}
          props={this.props}
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
