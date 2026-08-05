import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Dimensions,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import APIprovider from '../../APIprovider';
import Constants from '../../Constants';
import Strings from '../../Strings';
import { moderateScale } from '../../utils/scailing';
import { shareLink } from '../../utils/share';
import HeaderLeftBackButton from '../headerBackButton/headerLeftBackButton';

const width = Dimensions.get('window').width;

function ShareButton(shareEvent) {
  return (
    <TouchableOpacity onPress={() => shareEvent()} style={{ marginRight: 10 }}>
      <Text>{Strings.SHARE}</Text>
    </TouchableOpacity>
  );
}

export default function NoticeDetail({ title = '' }) {
  const navigation = useNavigation();
  const { params } = useRoute();

  const [height, setHeight] = useState(0);
  const [ratio, setRatio] = useState(1 / 5);

  useEffect(() => {
    navigation.setOptions({
      title: params.title,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
        color: Constants.TIER_COLORS.ARTISAN,
      },
      headerRight: () => ShareButton(eventShareWithDynamicLink),
    });
    // Image.getSize(params.imageUri, (_width, _height) => {
    //   setRatio(width / _width);
    //   setHeight(_height);
    // });

    if (params.imageRatio) {
      setRatio(params.imageRatio)
    }
    // 마운트 시 1회만 실행하는 의도된 초기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventShareWithDynamicLink = function () {
    const { shortImageUri, title: eventTitle, description } = params;

    console.log(description);

    APIprovider.getEventDynamicLink(null, eventTitle, description, shortImageUri).then((res) => {
      const url = res?.shortLink;
      const message = Strings.SHARE_EVENT_MESSAGE;

      shareLink({ url, message, description });
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        <FastImage
          source={{ uri: params.imageUri, cache: 'web' }}
          style={{
            width,
            aspectRatio: ratio,
          }}
        />
      </ScrollView>
      {params.navigationParams ? (
        <TouchableNativeFeedback
          onPress={() => {
            const { page, params: pageParams } = params.navigationParams;

            navigation.navigate(page, pageParams);
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: width * 0.8,
              backgroundColor: Constants.TIER_COLORS.GIVER,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 10,
              borderRadius: 20,
              bottom: 50,
              alignSelf: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
                fontSize: 20,
                color: Constants.TIER_COLORS.PIONEER,
              }}
            >
              참여하기
            </Text>
          </View>
        </TouchableNativeFeedback>
      ) : null}

      {params.eventUrl ? (
        <TouchableNativeFeedback
          onPress={() => {
            const eventUrl = params.eventUrl;

            Linking.openURL(eventUrl);
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: width * 0.8,
              backgroundColor: Constants.TIER_COLORS.GIVER,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 10,
              borderRadius: 20,
              bottom: 50,
              alignSelf: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
                fontSize: 20,
                color: Constants.TIER_COLORS.PIONEER,
              }}
            >
              참여하기
            </Text>
          </View>
        </TouchableNativeFeedback>
      ) : null}
    </SafeAreaView>
  );
}
