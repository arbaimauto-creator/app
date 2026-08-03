import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import Constants from '../../Constants';
import { horizontalScale, moderateScale } from '../../utils/scailing';
import HeaderLeftBackButton from '../headerBackButton/headerLeftBackButton';
import Strings, { getLanguage } from '../../Strings';
import APIprovider from '../../APIprovider';

const width = Dimensions.get('window').width - horizontalScale(40);

export default function NoticeList() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const [eventBanner, setEventBanner] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: Strings.EVENTS,
      headerLeft: () => HeaderLeftBackButton({ navigation }),
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
        color: Constants.TIER_COLORS.ARTISAN,
      },
    });
  }, [navigation]);

  useEffect(() => {
    if (!params || !params.eventBanner) {
      APIprovider.getEvents().then((res) => {
        if (res.success) {
          setEventBanner(res.eventBanner);
          setLoading(false);
        }
      });
    } else {
      setEventBanner(params.eventBanner);
      setLoading(false);
    }
  }, [params]);

  if (isLoading) {
    return null;
  }

  return (
    <View>
      <Animated.FlatList
        data={eventBanner}
        keyExtractor={(item, idx) => item.imageUri + '_' + idx}
        renderItem={({ item, idx }) => (
          <TouchableNativeFeedback
            onPress={() => {
              if (item.title && item.description) {
                navigation.push('NoticeDetail', {
                  title: item.title[getLanguage()],
                  description: item.description[getLanguage()],
                  shortImageUri: item[getLanguage()],
                  imageUri: item.imageUri[getLanguage()],
                  navigationParams: item.navigationParams,
                  eventUrl: item.eventUrl,
                  imageRatio: item.imageRatio,
                });
              }
            }}
          >
            <View
              style={{
                width: '100%',
                marginVertical: 10,
                alignItems: 'center',
              }}
            >
              <FastImage
                source={{ uri: item[getLanguage()] }}
                style={{ width: width, height: width * 0.5, borderRadius: 9 }}
              />
            </View>
          </TouchableNativeFeedback>
        )}
      />
    </View>
  );
}
