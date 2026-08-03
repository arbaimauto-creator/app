import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Constants from './Constants';
import { CommonButtonModal } from './Views/CommonButtonModal';
import Strings from './Strings';

const REVENUE_GUIDE_TITLE_1 = Strings.REVENUE_GUIDE_TITLE_1;
const REVENUE_GUIDE_TITLE_2 = Strings.REVENUE_GUIDE_TITLE_2;
const REVENUE_GUIDE_TITLE_3 = Strings.REVENUE_GUIDE_TITLE_3;
const REVENUE_GUIDE_BODY_1_1 = Strings.REVENUE_GUIDE_BODY_1_1;
const REVENUE_GUIDE_BODY_2_1 = Strings.REVENUE_GUIDE_BODY_2_1;
const REVENUE_GUIDE_BODY_3_1 = Strings.REVENUE_GUIDE_BODY_3_1;
const REVENUE_GUIDE_BODY_3_2 = Strings.REVENUE_GUIDE_BODY_3_2;
const REVENUE_GUIDE_BODY_3_3 = Strings.REVENUE_GUIDE_BODY_3_3;
const REVENUE_GUIDE_BODY_3_4 = Strings.REVENUE_GUIDE_BODY_3_4;

const RevenueGuideModal = ({ navigation, visible, onCancel }) => {
  return (
    <CommonButtonModal
      visible={visible}
      onCancel={onCancel}
      buttonArray={[
        {
          title: Strings.GO_TO_POST_REVIEW,
          onPress: () => {
            navigation.navigate('AddingNewVideo', {});
            onCancel();
          },
        },
      ]}
    >
      <View style={styles.guideMessageContainer}>
        <View style={styles.guideTitleContainer}>
          {REVENUE_GUIDE_TITLE_1.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideTitle}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <View style={styles.guideWapper}>
          {REVENUE_GUIDE_BODY_1_1.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideMessage}>
              {word}{' '}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.guideMessageContainer}>
        <View style={styles.guideTitleContainer}>
          {REVENUE_GUIDE_TITLE_2.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideTitle}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <View style={styles.guideWapper}>
          {REVENUE_GUIDE_BODY_2_1.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideMessage}>
              {word}{' '}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.guideMessageContainer}>
        <View style={styles.guideTitleContainer}>
          {REVENUE_GUIDE_TITLE_3.split(' ').map((word, idx) => (
            <Text key={word + '_' + idx} style={styles.guideTitle}>
              {word}{' '}
            </Text>
          ))}
        </View>
        <View style={styles.guideMessageWapper}>
          <View>
            <Text style={styles.guideMessage}>{'1. '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {REVENUE_GUIDE_BODY_3_1.split(' ').map((word, idx) => (
              <Text key={word + '_' + idx} style={styles.guideMessage}>
                {word}{' '}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideMessageWapper}>
          <View>
            <Text style={styles.guideMessage}>{'2. '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {REVENUE_GUIDE_BODY_3_2.split(' ').map((word, idx) => (
              <Text key={word + '_' + idx} style={styles.guideMessage}>
                {word}{' '}
              </Text>
            ))}
          </View>
        </View>
        {REVENUE_GUIDE_BODY_3_3 && (
          <View style={styles.guideMessageWapper}>
            <View>
              <Text style={styles.guideMessage}>{'3. '}</Text>
            </View>
            <View style={styles.guideTextWapper}>
              {REVENUE_GUIDE_BODY_3_3.split(' ').map((word, idx) => (
                <Text key={word + '_' + idx} style={styles.guideMessage}>
                  {word}{' '}
                </Text>
              ))}
            </View>
          </View>
        )}
        {REVENUE_GUIDE_BODY_3_4 && (
          <View style={styles.guideMessageWapper}>
            <View>
              <Text style={styles.guideMessage}>{'4. '}</Text>
            </View>
            <View style={styles.guideTextWapper}>
              {REVENUE_GUIDE_BODY_3_4.split(' ').map((word, idx) => (
                <Text key={word + '_' + idx} style={styles.guideMessage}>
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
  guideMessageContainer: {
    width: '100%',
    marginBottom: 20,
    marginTop: 20,
  },
  guideTitleContainer: {
    paddingHorizontal: 25,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  guideTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 19,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  guideWapper: {
    paddingHorizontal: 30,
    marginVertical: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  guideMessageWapper: {
    paddingHorizontal: 25,
    marginVertical: 5,
    flexDirection: 'row',
  },
  guideMessage: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  guideColoredMessageContainer: {
    width: '100%',
    backgroundColor: '#FFD68A',
  },
  guideColoredTitle: {
    color: 'black',
    paddingHorizontal: 25,
    fontSize: 24,
    lineHeight: 33,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  guideColoredWapper: {
    marginVertical: 5,
    paddingHorizontal: 25,
    flexDirection: 'row',
  },
  guideTextWapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 20,
  },
});

export default RevenueGuideModal;
