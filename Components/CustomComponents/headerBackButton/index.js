import React from 'react';
import FastImage from 'react-native-fast-image';
import Constants from '../../Constants';

const headerBackButton = {
  headerShown: true,
  headerBackImage: () => (
    <FastImage
      style={{ marginLeft: 20 }}
      source={require('../../../Resources/img/icHeaderNaviPrev22.png')}
    />
  ),
  // BackTitleVisible: false,
  headerBackTitleVisible: false,
  headerTitleContainerStyle: {
    alignItems: 'center',
    overflow: 'visible',
  },
  headerStyle: {
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    shadowOpacity: 0,
  },
  headerLeftContainerStyle: {
    flex: 1,
  },
};

export default headerBackButton;
