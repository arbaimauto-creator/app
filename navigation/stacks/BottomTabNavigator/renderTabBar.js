import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import IconFeather from 'react-native-vector-icons/Feather';
import IconMCI from 'react-native-vector-icons/MaterialCommunityIcons';
import Strings from '../../../Components/Strings';
import { moderateScale } from '../../../Components/utils/scailing';
import Constants from '../../../Components/Constants';
import T from '../../../Components/Constants/DesignTokens';

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
  } else if (routeName === 'Try') {
    return <IconFeather name="gift" size={26} color={focused ? Constants.COLOR_MAIN : 'gray'} />;
  } else if (routeName === 'Activity') {
    return <IconFeather name="award" size={24} color={focused ? Constants.COLOR_MAIN : 'gray'} />;
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

// 탭 아이콘 통일 (2026-09-17 피드백): PNG·Feather가 섞여 선 굵기·크기가 제각각이었다.
// MaterialCommunityIcons 한 세트로 — 평소엔 아웃라인, 선택 시 채움 + 앰버. 크기는 전부 24.
const TAB_ICONS = {
  Home: { off: 'home-variant-outline', on: 'home-variant', label: () => Strings.HOME },
  Reviews: { off: 'play-box-outline', on: 'play-box', label: () => Strings.BOTTOM_ICON_VIEW_REVIEW },
  Try: { off: 'gift-outline', on: 'gift', label: () => Strings.TRY_TAB },
  Activity: { off: 'medal-outline', on: 'medal', label: () => Strings.ACTIVITY_TAB },
  Profile: { off: 'account-circle-outline', on: 'account-circle', label: () => Strings.MY_PAGE },
  Store: { off: 'shopping-outline', on: 'shopping', label: () => Strings.PRODUCTS_TAB },
  BrandDashboard: { off: 'chart-box-outline', on: 'chart-box', label: () => Strings.BRAND_TAB_DASH },
  BrandReview: {
    off: 'clipboard-check-outline',
    on: 'clipboard-check',
    label: () => Strings.BRAND_TAB_REVIEW,
  },
};

export const tabBarIcon = ({ focused, color, route }) => {
  const icon = TAB_ICONS[route.name];
  const tint = focused ? T.COLORS.AMBER_DEEP : T.COLORS.GREY;
  if (!icon) {
    return (
      <View>
        <IconMCI name="circle-outline" size={24} color={tint} />
      </View>
    );
  }
  return (
    <View style={{ width: 100, alignItems: 'center' }}>
      <IconMCI name={focused ? icon.on : icon.off} size={24} color={tint} />
      <Text style={[styles.iconName, focused && styles.iconNameOn]}>{icon.label()}</Text>
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
  } else if (route.name === 'Store') {
    name = Strings.PRODUCTS_TAB;
  } else if (route.name === 'Try') {
    name = Strings.TRY_TAB;
  } else if (route.name === 'Activity') {
    name = Strings.ACTIVITY_TAB;
  } else if (route.name === 'BrandDashboard') {
    name = Strings.BRAND_TAB_DASH;
  } else if (route.name === 'BrandReview') {
    name = Strings.BRAND_TAB_REVIEW;
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
    color: T.COLORS.GREY,
    fontFamily: T.FONT.Medium,
    fontSize: moderateScale(10),
    textAlign: 'center',
    marginTop: moderateScale(3),
  },
  iconNameOn: {
    color: T.COLORS.AMBER_DEEP,
    fontFamily: T.FONT.Bold,
  },
});
export default renderTabBar;
