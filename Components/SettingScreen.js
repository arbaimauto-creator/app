import Clipboard from '@react-native-clipboard/clipboard';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { logout as KakaoLogout } from '@react-native-seoul/kakao-login';
import { CommonActions } from '@react-navigation/native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import Preference from 'react-native-default-preference';
import Toast from 'react-native-easy-toast';
import { getStatusBarHeight } from 'react-native-safearea-height';
import APIprovider from './APIprovider';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Strings from './Strings';
import { menuLogout } from './utils/index';
import { moderateScale } from './utils/scailing';

let toastRef;
export default class SettingScreen extends React.Component {
  menuRegisterSeller = function () {
    this.props.navigation.navigate('RegisterAsSeller');
  };

  menuBlockedUserList = function () {
    this.props.navigation.navigate('BlockedUserList');
  };

  menuEditProfile = function () {
    this.props.navigation.pop();
    this.props.navigation.navigate('EditProfile', {
      ...this.props.route.params, // expected user data
    });
  };

  menuOrderList = function () {
    this.props.navigation.pop();
    this.props.navigation.navigate('MyOrderList');
  };

  menuHelp = function () {
    this.props.navigation.pop();
    this.props.navigation.navigate('Help');
  };

  menuCancelMembership = function () {
    this.props.navigation.pop();
    this.props.navigation.navigate('MembershipWithdrawal');
  };

  // menuQRCode = function() {
  //   this.props.navigation.navigate('QRCode');
  // };

  constructor(props) {
    super(props);

    this.state = {
      isSeller: this.props.route.params.logonUserIsSeller,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    navigation.setOptions({
      title: Strings.SETTINGS,
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
      headerLeft: () => HeaderLeftBackButton({ navigation }),
    });
    Preference.get('userIsSeller').then((value) => {
      this.setState({
        isSeller: value,
      });
    });
  }

  getMenuList() {
    const list = [];
    list.push({
      title: Strings.EDIT_PROFILE,
      //      icon: <IconFontAwesome5 size={18} name={"user-edit"} color={'#000'} style={{}} />,
      onPress: this.menuEditProfile.bind(this),
    });
    list.push({
      title: Strings.COPY_PROFILE_LINK,
      onPress: async () => {
        const { userId, name, introduction, profilePicUrl } = this.props.route.params;
        const result = await APIprovider.getUserProfileDynamicLink(
          userId,
          name,
          introduction,
          profilePicUrl,
        );

        console.log(result);

        if (result.success) {
          Clipboard.setString(result.shortLink);
          toastRef.show(Strings.COMPLETE_COPY_PROFILE_LINK);
        }
      },
    });
    // list.push({
    //   title: Strings.QR_CODE,
    //   onPress: this.menuQRCode.bind(this),
    // });
    list.push({
      title: Strings.MY_ORDER_LIST,
      //      icon: <IconFontAwesome5 size={18} name={"user-edit"} color={'#000'} style={{}} />,
      onPress: this.menuOrderList.bind(this),
    });
    if (this.state.isSeller === 'false') {
      list.push({
        title: Strings.REGISTER_SELLER,
        //        icon: <IconFontAwesome5 size={20} name="user-tie" color="#000" style={{marginRight:4}}/>,
        onPress: this.menuRegisterSeller.bind(this),
      });
    }
    list.push({
      title: Strings.BLOCKED_ACCOUNT,
      //      icon: <IconFontAwesome5 size={18} name={"user-edit"} color={'#000'} style={{}} />,
      onPress: this.menuBlockedUserList.bind(this),
    });
    list.push({
      title: Strings.HELP,
      //      icon: <IconFontAwesome5 size={18} name={"user-edit"} color={'#000'} style={{}} />,
      onPress: this.menuHelp.bind(this),
    });
    list.push({
      title: Strings.SETTING_MENU_CANCEL_MEMBERSHIP,
      //      icon: <IconMaterialCommunityIcons size={22} name={"logout"} color={'#000'} style={{}} />,
      onPress: this.menuCancelMembership.bind(this),
    });
    list.push({
      title: Strings.LOGOUT,
      color: Constants.COLOR_POINT_BLUE,
      //      icon: <IconMaterialCommunityIcons size={22} name={"logout"} color={'#000'} style={{}} />,
      // onPress: this.menuLogout.bind(this),
      onPress: () => menuLogout(this.props),
    });
    return list;
  }

  render() {
    return (
      <View style={styles.container}>
        {this.getMenuList().map((item, idx) => (
          <View key={item.title + '_' + idx}>
            <TouchableNativeFeedback onPress={item.onPress}>
              <View style={styles.itemContainer}>
                <Text
                  style={[
                    styles.itemLabel,
                    { color: item.color ? item.color : Constants.TIER_COLORS.ARTISAN },
                  ]}
                >
                  {item.title}
                </Text>
              </View>
            </TouchableNativeFeedback>
            <View style={styles.divider} />
          </View>
        ))}
        <Toast
          ref={(ref) => {
            toastRef = ref;
          }}
          fadeInDuration={100}
          fadeOutDuration={1900}
          position={'bottom'}
          positionValue={Platform.OS === 'ios' ? 200 : 150}
          style={{
            backgroundColor: Constants.TIER_COLORS.ARTISAN,
            borderRadius: 20,
            paddingHorizontal: 20,
            bottom: getStatusBarHeight(),
          }}
          opacity={0.9}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    height: '100%',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  itemContainer: {
    paddingVertical: 18,
  },
  itemLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  divider: {
    height: 1,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
  },
});
