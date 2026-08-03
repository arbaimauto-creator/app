import React from 'react';
import {
  Dimensions,
  Linking,
  NativeModules,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Constants';
import Strings from '../../Strings';
import { CommonButtonModal } from '../../Views/CommonButtonModal';

const ScaledImage = (props) => {
  const source = props.source;
  const originSize = props.originSize;
  let size = originSize;

  if (props.width && !props.height) {
    size = {
      width: props.width,
      height: originSize.height * (props.width / originSize.width),
    };
  } else if (!props.width && props.height) {
    size = {
      width: originSize.width * (props.height / originSize.height),
      height: props.height,
    };
  } else {
  }

  return (
    <FastImage
      resizeMode={'contain'}
      // source={source}
      source={{ uri: source }}
      // style={{ height: size.height, width: size.width }}
      style={{ height: Dimensions.get('window').width, width: Dimensions.get('window').width }}
    />
  );
};

const EventPageModal = ({ navigation, visible, onCancel, popupImage }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const eventImageKor = [
    {
      uri: popupImage.ko, //require('../../../Resources/img/promotion/ko-refund-popup.png'),
      width: 616,
      height: 569,
    },
  ];

  const eventImageEng = [
    // TODO: 영문 페이지 버튼 수정 및 언어에 따른 선택 가능하도록 변경
    {
      uri: popupImage.en, //require('../../../Resources/img/promotion/en-refund-popup.png'),
      width: 616,
      height: 569,
    },
  ];

  const deviceLanguage = (
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
      : NativeModules.I18nManager.localeIdentifier
  ).substring(0, 2);

  const eventImages = deviceLanguage === 'ko' ? eventImageKor : eventImageEng;

  return (
    <CommonButtonModal
      title={popupImage.title}
      visible={isOpen}
      type={'full'}
      mode={'full-screen'}
      onCancel={() => {
        setIsOpen(false);
      }}
      buttonArray={[
        {
          title: popupImage.buttonText,
          disabled: false,
          onPress: async () => {
            await Linking.openURL(popupImage.url);
            // navigation.navigate('Store');
            // setIsOpen(false);
          },
        },
      ]}
      scrollEnable={false}
    >
      <TouchableOpacity
        style={styles.guideImageContainer}
        onPress={async () => {
          await Linking.openURL(popupImage.url);
          // navigation.navigate('Store');
          // setIsOpen(false);
        }}
      >
        {eventImages.map((item, index) => (
          <View style={{ position: 'relative' }} key={index}>
            <ScaledImage
              width={Dimensions.get('window').width}
              originSize={{ width: item.width, height: item.height }}
              source={item.uri}
            />
          </View>
        ))}
      </TouchableOpacity>
    </CommonButtonModal>
  );
};

const styles = StyleSheet.create({
  guideImageContainer: {
    flex: 1,
  },
  guideMessageContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 40,
    flex: 1,
    flexDirection: 'column',
  },
  guideTitle: {
    color: Constants.COLOR_MAIN,
    paddingHorizontal: 25,
    fontSize: 24,
    lineHeight: 33,
    marginBottom: 20,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  guideWapper: {
    marginHorizontal: 25,
    marginVertical: 5,
    flexDirection: 'row',
  },
  guideTextWapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 20,
  },
  guideMessage: {
    color: 'white',
    fontSize: 18,
    lineHeight: 26,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
});

export default EventPageModal;
