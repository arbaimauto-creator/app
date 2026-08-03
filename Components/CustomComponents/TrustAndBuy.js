import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../Constants';
import Strings from '../Strings';

export default function TrustAndBuy({ product, videoId }) {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('ProductPage', {
      productId: product._id,
      videoId,
    });
  };

  return (
    <TouchableNativeFeedback onPress={() => handlePress()}>
      <View
        style={{
          width: 'auto',
          alignItems: 'center',
        }}
      >
        <FastImage
          source={require('../../Resources/img/iconRenewal/linked-product.png')}
          style={{ width: 40, height: 40 }}
        />
        <Text
          style={{
            marginTop: 5,
            // fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
            fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
            fontSize: 13,
            color: Constants.TIER_COLORS.PIONEER,
            textAlign: 'center',
          }}
        >
          {Strings.LINK_PRODUCT_ICON_CONTENT}
        </Text>
      </View>
    </TouchableNativeFeedback>
  );
}
