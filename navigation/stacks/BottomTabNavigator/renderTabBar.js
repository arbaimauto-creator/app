import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import IconFeather from 'react-native-vector-icons/Feather';
import Strings from '../../../Components/Strings';
import { moderateScale } from '../../../Components/utils/scailing';
import Constants from '../../../Components/Constants';

const _renderIcon = (routeName, selectedTab) => {
  let iconName;
  let size = 22;
  const focused = routeName === selectedTab;
  const color = focused ? 'white' : 'lightgray';
  if (routeName === 'Home') {
    if (focused) {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/3.1.png')} />
      );
    } else {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/4.1.png')} />
      );
    }
  } else if (routeName === 'Reviews') {
    if (focused) {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/3.2.png')} />
      );
    } else {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/4.2.png')} />
      );
    }
  } else if (routeName === 'New') {
    return (
      <FastImage style={styles.gradeIcon} source={require('../../../Resources/newIcon/7.2.png')} />
    );
  } else if (routeName === 'Profile') {
    if (focused) {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/3.4.png')} />
      );
    } else {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/4.4.png')} />
      );
    }
  } else if (routeName === 'Store') {
    if (focused) {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/3.3.png')} />
      );
    } else {
      return (
        <FastImage style={styles.iconSize} source={require('../../../Resources/newIcon/4.3.png')} />
      );
    }
  }

  // You can return any component that you like here!
  return (
    <View>
      <IconFeather name={iconName} size={size} color={color} style={styles.shadow} />
    </View>
  );
};

const renderTabBar = ({ routeName, selectedTab, navigate }) => {
  return (
    <TouchableOpacity
      onPress={() => navigate(routeName)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopColor: 'rgba(50, 50, 50, 1)',
        borderTopWidth: 2,
      }}
    >
      {_renderIcon(routeName, selectedTab)}
    </TouchableOpacity>
  );
};

export const tabBarIcon = ({ focused, color, route }) => {
  let iconName;
  let size = 22;
  color = focused ? 'white' : 'lightgray';
  if (route.name === 'Home') {
    return (
      <View style={{ width: 100, alignItems: 'center' }}>
        <FastImage
          style={styles.iconSize}
          source={
            focused
              ? require('../../../Resources/img/iconRenewal/home-on.png') //require('../../../Resources/newIcon/3.1.png')
              : require('../../../Resources/img/iconRenewal/home.png')
          }
        />
        <Text style={styles.iconName}>{Strings.BOTTOM_ICON_HOME}</Text>
      </View>
    );
  } else if (route.name === 'Reviews') {
    return (
      <View style={{ width: 100, alignItems: 'center' }}>
        <FastImage
          style={styles.iconSize}
          source={
            focused
              ? require('../../../Resources/img/iconRenewal/view-review-on.png')
              : require('../../../Resources/img/iconRenewal/view-review.png')
          }
        />
        <Text style={styles.iconName}>{Strings.BOTTOM_ICON_VIEW_REVIEW}</Text>
      </View>
    );
  } else if (route.name === 'B2B') {
    return (
      <View style={{ width: 100, alignItems: 'center' }}>
        <FastImage
          style={styles.iconSize}
          source={
            focused
              ? require('../../../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')
              : require('../../../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')
          }
        />
        <Text style={styles.iconName}>{Strings.B2B}</Text>
      </View>
    );
  } else if (route.name === 'New') {
    return (
      <View style={{ width: 100, alignItems: 'center' }}>
        <FastImage
          style={styles.iconSize}
          source={require('../../../Resources/img/iconRenewal/new.png')}
        />
        <Text style={styles.iconName}>{Strings.DO_REVIEW}</Text>
      </View>
    );
  } else if (route.name === 'Profile') {
    return (
      <View style={{ width: 100, alignItems: 'center' }}>
        <FastImage
          style={styles.iconSize}
          source={
            focused
              ? require('../../../Resources/img/iconRenewal/mypage-on.png')
              : require('../../../Resources/img/iconRenewal/mypage.png')
          }
        />
        <Text style={styles.iconName}>{Strings.MY_PAGE}</Text>
      </View>
    );
  } else if (route.name === 'Store') {
    return (
      <View style={{ width: 100, alignItems: 'center' }}>
        <FastImage
          style={styles.iconSize}
          source={
            focused
              ? require('../../../Resources/img/iconRenewal/shopping-on.png')
              : require('../../../Resources/img/iconRenewal/shopping.png')
          }
        />
        <Text style={styles.iconName}>{Strings.BOTTOM_ICON_SHOPPING}</Text>
      </View>
    );
  }

  // You can return any component that you like here!
  return (
    <View>
      <IconFeather name={iconName} size={size} color={color} style={styles.shadow} />
    </View>
  );
};

export const tabBarLabel = ({ focused, color, route }) => {
  color = focused ? Constants.COLOR_MAIN : '#AEAEAE';
  let name = '';
  if (route.name === 'Home') {
    name = Strings.HOME;
  } else if (route.name === 'Reviews') {
    name = Strings.REVIEWS;
  } else if (route.name === 'Profile') {
    name = Strings.PROFILE;
  } else if (route.name === 'B2B') {
    name = Strings.PROFILE;
  } else if (route.name === 'Store') {
    name = Strings.STORE;
  }
  return (
    <Text
      style={{
        alignSelf: 'center',
        color: color,
        fontSize: 10,
        marginTop: 4,
        fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
      }}
    >
      {name}
    </Text>
  );
};

const styles = StyleSheet.create({
  iconSize: {
    width: moderateScale(24),
    height: moderateScale(24),
    marginTop: moderateScale(-4),
  },
  gradeIcon: {
    width: moderateScale(33),
    height: moderateScale(33),
    marginTop: moderateScale(-11),
  },
  iconName: {
    color: 'rgba(0,0,0,.8)',
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    fontSize: moderateScale(10),
    textAlign: 'center',
    marginTop: moderateScale(4),
  },
});
export default renderTabBar;
