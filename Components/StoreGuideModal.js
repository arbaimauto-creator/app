import React from 'react';
import T from './Constants/DesignTokens';
import { StyleSheet, View, Text } from 'react-native';
import Constants from './Constants';
import { CommonButtonModal } from './Views/CommonButtonModal';
import Strings from './Strings';

const STORE_SUBTITLE_1 = Strings.STORE_SUBTITLE_1;
const STORE_SUBTITLE_2 = Strings.STORE_SUBTITLE_2;
const STORE_SUBTITLE_3 = Strings.STORE_SUBTITLE_3;
const STORE_BODY_1 = Strings.STORE_BODY_1;
const STORE_BODY_2 = Strings.STORE_BODY_2;
const STORE_BODY_3 = Strings.STORE_BODY_3;

const StoreGuideModal = ({ navigation, visible, onCancel }) => {
  return (
    <CommonButtonModal visible={visible} onCancel={onCancel} heightRate={0.55}>
      <View style={styles.guideMessageContainer}>
        <Text style={styles.guideTitle}>{Strings.STORE_TITLE}</Text>
        <View style={styles.guideSubTitleContainer}>
          {STORE_SUBTITLE_1.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideSubTitle}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <View style={styles.guideWapper}>
          {STORE_BODY_1.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideMessage}>
              {word}{' '}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.guideMessageContainer}>
        <View style={styles.guideSubTitleContainer}>
          {STORE_SUBTITLE_2.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideSubTitle}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <View style={styles.guideWapper}>
          {STORE_BODY_2.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideMessage}>
              {word}{' '}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.guideMessageContainer}>
        <View style={styles.guideSubTitleContainer}>
          {STORE_SUBTITLE_3.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideSubTitle}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <View style={styles.guideWapper}>
          {STORE_BODY_3.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideMessage}>
              {word}{' '}
            </Text>
          ))}
        </View>
      </View>
    </CommonButtonModal>
  );
};

const styles = StyleSheet.create({
  guideMessageContainer: {
    width: '100%',
  },
  guideTitle: {
    color: T.COLORS.INK,
    paddingHorizontal: 25,
    fontSize: 20,
    lineHeight: 33,
    marginBottom: 25,
    fontWeight: 'bold',
  },
  guideSubTitleContainer: {
    paddingHorizontal: 10,
    marginHorizontal: 25,
    marginLeft: 25,
    marginRight: 35,
    paddingVertical: 3,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: Constants.COLOR_MAIN,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  guideSubTitle: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 15,
    fontWeight: 'bold',
  },
  guideWapper: {
    paddingHorizontal: 30,
    marginBottom: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  guideMessage: {
    color: T.COLORS.INK,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default StoreGuideModal;
