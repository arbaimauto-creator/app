import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, NativeModules, Platform, Pressable } from 'react-native';
import Constants from './Constants';
import { CommonButtonModal } from './Views/CommonButtonModal';
import FastImage from 'react-native-fast-image';
import Strings from './Strings';
import EventReceivingPrizesGuideModal from './EventReceivingPrizesGuideModal';
import { Linking } from 'react-native';

const eventImageKor = [
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-1.png',
    width: 616,
    height: 570,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-2.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-3.png',
    width: 616,
    height: 715,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-4.png',
    width: 616,
    height: 726,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-5.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-6.png',
    width: 616,
    height: 782,
  },
];

const eventImageEng = [
  // TODO: 영문 페이지 버튼 수정 및 언어에 따른 선택 가능하도록 변경
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-1.png',
    width: 616,
    height: 569,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-2.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-3.png',
    width: 616,
    height: 715,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-4.png',
    width: 616,
    height: 726,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-5.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResult1-6.png',
    width: 616,
    height: 782,
  },
];

const eventButtonImage = [
  {
    uri: 'https://intro.greyd.app/resources/giftEventResultButton1-1.png',
    width: 828,
    height: 317,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResultButton1-2.png',
    width: 952,
    height: 373,
  },
];

const eventButtonImageEng = [
  // TODO: 영문 페이지 버튼 수정 및 언어에 따른 선택 가능하도록 변경
  {
    uri: 'https://intro.greyd.app/resources/giftEventResultButton1-1.png',
    width: 828,
    height: 317,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventResultButton1-2.png',
    width: 952,
    height: 373,
  },
];

const surveyUrl = 'https://forms.gle/dbs4Av5CKp9wRBG89';

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
      source={source}
      style={{ height: size.height, width: size.width }}
    />
  );
};

const EventPageModal = ({ navigation, visible, onCancel }) => {
  const [subGuideModalVisible, setSubGuideModalVisible] = useState(false);
  const deviceLanguage = (
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
      : NativeModules.I18nManager.localeIdentifier
  ).substring(0, 2);
  const eventImages = deviceLanguage === 'ko' ? eventImageKor : eventImageEng;
  const buttonWidth = (Dimensions.get('window').width - 90) / 2;
  const buttonWidthWithIcon = (Dimensions.get('window').width - 40) / 2;
  const buttonHeight =
    (((Dimensions.get('window').width - 85) / 2) * eventButtonImage[1].height) /
    eventButtonImage[1].width;
  return (
    <CommonButtonModal
      title={Strings.EVENT_PAGE_TITLE1}
      visible={visible}
      type={'full'}
      mode={'full-screen'}
      onCancel={onCancel}
      buttonArray={
        [
          // {
          //     title: Strings.GO_TO_POST_REVIEW,
          //     onPress: () => {
          //         navigation.navigate('AddingNewVideo',{});
          //         onCancel();
          //     }
          // },
        ]
      }
    >
      <View
        style={{
          ...styles.guideImageContainer,
          marginBottom: -buttonHeight * 2,
        }}
      >
        {eventImages.map((item, index) => (
          <View style={{ position: 'relative', top: -1 * index }}>
            <ScaledImage
              width={Dimensions.get('window').width - 30}
              originSize={{ width: item.width, height: item.height }}
              source={{ uri: item.uri }}
            />
          </View>
        ))}
        <View
          style={{
            position: 'relative',
            top: -1.8 * buttonHeight,
            left: -buttonWidthWithIcon / 2,
          }}
        >
          <Pressable
            onPress={() => {
              // 경품수령안내 페이지 네비게이트
              setSubGuideModalVisible(true);
            }}
          >
            <ScaledImage
              width={buttonWidth}
              originSize={{
                width: eventButtonImage[1].width,
                height: eventButtonImage[1].height,
              }}
              source={{ uri: eventButtonImage[0].uri }}
            />
          </Pressable>
        </View>
        <View
          style={{
            position: 'relative',
            top: -2.78 * buttonHeight,
            left: buttonWidthWithIcon / 2,
          }}
        >
          <Pressable
            onPress={() => {
              // 설문지 페이지 링크
              Linking.openURL(surveyUrl);
            }}
          >
            <ScaledImage
              width={buttonWidthWithIcon}
              originSize={{
                width: eventButtonImage[1].width,
                height: eventButtonImage[1].height,
              }}
              source={{ uri: eventButtonImage[1].uri }}
            />
          </Pressable>
        </View>
      </View>
      <EventReceivingPrizesGuideModal
        navigation={navigation}
        visible={subGuideModalVisible}
        onCancel={(parentClose = false) => {
          setSubGuideModalVisible(false);
          if (parentClose) {
            onCancel();
          }
        }}
      />
    </CommonButtonModal>
  );
};

const styles = StyleSheet.create({
  guideImageContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
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
    fontWeight: 'bold',
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
  },
});

export default EventPageModal;
