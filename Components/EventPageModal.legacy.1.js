import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Text, Dimensions, NativeModules, Platform } from 'react-native';
import Constants from './Constants';
import { CommonButtonModal } from './Views/CommonButtonModal';
import { CommonActions } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Strings from './Strings';

const EVENT_NOTICE_STRING1 = Strings.EVENT_NOTICE_STRING1;
const EVENT_NOTICE_STRING2 = Strings.EVENT_NOTICE_STRING2;
const EVENT_NOTICE_STRING3 = Strings.EVENT_NOTICE_STRING3;
const EVENT_NOTICE_STRING4 = Strings.EVENT_NOTICE_STRING4;
const EVENT_NOTICE_STRING5 = Strings.EVENT_NOTICE_STRING5;
const EVENT_NOTICE_STRING6 = Strings.EVENT_NOTICE_STRING6;

const eventImageKor = [
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-1.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-2.png',
    width: 616,
    height: 730,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-3.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-4.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-5.png',
    width: 616,
    height: 359,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-6.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-7.png',
    width: 616,
    height: 611,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEvent1-8.png',
    width: 616,
    height: 782,
  },
];

const eventImageEng = [
  {
    uri: 'https://intro.greyd.app/resources/giftEventEng1-1.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventEng1-2.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventEng1-3.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventEng1-4.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventEng1-5.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventEng1-6.png',
    width: 616,
    height: 782,
  },
  {
    uri: 'https://intro.greyd.app/resources/giftEventEng1-7.png',
    width: 616,
    height: 782,
  },
];

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
  const deviceLanguage = (
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
      : NativeModules.I18nManager.localeIdentifier
  ).substring(0, 2);
  const eventImages = deviceLanguage === 'ko' ? eventImageKor : eventImageEng;
  return (
    <CommonButtonModal
      title={Strings.EVENT_PAGE_TITLE1}
      visible={visible}
      type={'full'}
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
      <View style={styles.guideImageContainer}>
        {eventImages.map((item, index) => (
          <View style={{ position: 'relative', top: -1 * index }}>
            <ScaledImage
              width={Dimensions.get('window').width - 30}
              originSize={{ width: item.width, height: item.height }}
              source={{ uri: item.uri }}
            />
          </View>
        ))}
      </View>
      <View style={{ ...styles.guideMessageContainer, position: 'relative' }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.guideTitle}>{Strings.EVENT_PAGE_WARNING}</Text>
        </View>
        <View style={styles.guideWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {EVENT_NOTICE_STRING1.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {EVENT_NOTICE_STRING2.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {EVENT_NOTICE_STRING3.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {EVENT_NOTICE_STRING4.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {EVENT_NOTICE_STRING5.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        {EVENT_NOTICE_STRING6 && (
          <View style={styles.guideWapper}>
            <View>
              <Text style={styles.guideMessage}>{'▪ '}</Text>
            </View>
            <View style={styles.guideTextWapper}>
              {EVENT_NOTICE_STRING6.split(' ').map((word, index) => (
                <Text key={`eventNotice6WordsKey${index}`} style={styles.guideMessage}>
                  {word}{' '}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
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
