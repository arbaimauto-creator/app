import React, { useEffect, useState } from 'react';
import T from '../../Components/Constants/DesignTokens';
import { Platform, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import Reward from '../../Components/Common/Reward';
import ModalMenuButton from '../../Components/ModalMenuButton';
import { getIPhoneHeaderMarginTop } from '../../Components/utils';
import ActionButton from './ActionButton';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Constants from '../../Components/Constants';

export function setStatusColor(routeName) {
  if (routeName === 'MainBottom' || routeName === 'VideoPage') {
    StatusBar.setBackgroundColor(T.COLORS.INK);
    StatusBar.setBarStyle('default', true);
  } else {
    StatusBar.setBackgroundColor(T.COLORS.AMBER);
    StatusBar.setBarStyle('default', true);
  }
}

function Header({ context }) {
  const [previousRouteName, setPreviousRouteName] = useState('');
  const navigation = useNavigation();
  const isGuest = useSelector((state) => state.user.isGuest);

  useEffect(() => {
    const navigationState = navigation.getState().routes;
    // 딥링크로 직접 진입하면 이전 라우트가 없어 undefined.name 크래시
    setPreviousRouteName(navigationState[navigationState.length - 2]?.name ?? '');
  }, [navigation]);

  return (
    <View style={styles.headerBarContainer}>
      {!context.state.isFullScreen && (
        <ActionButton
          renderItem={
            <FastImage
              style={styles.headerButton}
              source={require('../../Resources/img/icCommonNaviPrev22W.png')}
            />
          }
          onPress={() => {
            if (Platform.OS !== 'ios') {
              setStatusColor(previousRouteName);
            }

            context.props.navigation.pop();
          }}
        />
      )}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {!isGuest ? <Reward navigation={context.props.navigation} /> : null}
        <ModalMenuButton
          navigation={context.props.navigation}
          menu={context.isMyVideo() ? context.menuUploader : context.menuVisitor}
          style={{ marginLeft: 10 }}
          buttonView={
            <FastImage
              style={styles.headerButton}
              source={require('../../Resources/img/iconRenewal/white-dots.png')}
            />
          }
        />
      </View>
      {/* <HeaderRight context={context} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBarContainer: {
    width: '100%',
    position: 'absolute',
    marginTop: getIPhoneHeaderMarginTop(),
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 30,
    height: 30,
  },
  buttonContainer: {
    margin: 4,
    justifyContent: 'center',
  },
});

export default Header;
