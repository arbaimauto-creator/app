import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserListItemView from '../screens/UserPageScreen/UserListItemView.js';
import ProductListItemView from './ProductListItemView.js';
import Strings from './Strings';

export default class StoreListItemView extends Component {
  static defaultProps = {
    userId: '',
    userName: '',
    userProfilePicUrl: '',
    productList: [],
  };

  constructor(props) {
    super(props);
  }

  menuShareClicked = function () {
    console.log('menuShareClicked is called');
  };

  menuReportClicked = function () {
    console.log('menuReportClicked is called');
  };

  menu = [
    {
      key: 1,
      name: Strings.SHARE_SHORT,
      icon: <IconMaterialIcons name="share" color={'#000'} size={20} />,
      onClicked: this.menuShareClicked,
    },
    {
      key: 2,
      name: Strings.REPORT,
      icon: <IconMaterialIcons name="report" color={'#000'} size={20} />,
      onClicked: this.menuReportClicked,
    },
  ];

  renderProducts({ item }) {
    return (
      <ProductListItemView
        navigation={this.props.navigation}
        data={item}
        width={200}
        type={'list_horizontal'}
      />
    );
  }

  render() {
    return (
      <View>
        <UserListItemView
          navigation={this.props.navigation}
          userId={this.props.userId}
          userName={this.props.userName}
          userProfilePicUrl={this.props.userProfilePicUrl}
        />
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          horizontal={true}
          data={this.props.productList}
          renderItem={this.renderProducts.bind(this)}
          keyExtractor={(item) => item.id}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({});
