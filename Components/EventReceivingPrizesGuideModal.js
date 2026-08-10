import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Constants from './Constants';
import Preference from 'react-native-default-preference';
import { CommonButtonModal } from './Views/CommonButtonModal';
import Strings from './Strings';
import APIprovider from './APIprovider';

const RECEIVING_PRIZES_GUIDE_TITLE_1 = Strings.RECEIVING_PRIZES_GUIDE_TITLE_1;
const RECEIVING_PRIZES_GUIDE_BODY_1_1 = Strings.RECEIVING_PRIZES_GUIDE_BODY_1_1;
const RECEIVING_PRIZES_GUIDE_BODY_1_2 = Strings.RECEIVING_PRIZES_GUIDE_BODY_1_2;
const RECEIVING_PRIZES_GUIDE_BODY_1_3 = Strings.RECEIVING_PRIZES_GUIDE_BODY_1_3;
const RECEIVING_PRIZES_GUIDE_BODY_1_4 = Strings.RECEIVING_PRIZES_GUIDE_BODY_1_4;
const RECEIVING_PRIZES_GUIDE_BODY_1_5 = Strings.RECEIVING_PRIZES_GUIDE_BODY_1_5;
const RECEIVING_PRIZES_GUIDE_BODY_1_6 = Strings.RECEIVING_PRIZES_GUIDE_BODY_1_6;

const EventReceivingPrizesGuideModal = ({ navigation, visible, onCancel }) => {
  return (
    <CommonButtonModal
      visible={visible}
      type={'full'}
      onCancel={onCancel}
      buttonArray={[
        {
          //title: Strings.GO_TO_POST_REVIEW,
          title: Strings.EDIT_EMAIL,
          onPress: async () => {
            const userId = await Preference.get('userId');
            const user = await APIprovider.getUserDetails(userId);
            navigation.navigate('EditProfile', {
              profilePicPath: user.profilePicPath,
              profilePicUrl: user.profilePicUrl,
              introduction: user.introduction,
              name: user.name,
              email: user.email,
              phone: user.phone,
            });
            onCancel(true);
          },
        },
      ]}
    >
      <View style={styles.guideMessageContainer}>
        <View style={styles.guideTitleContainer}>
          {RECEIVING_PRIZES_GUIDE_TITLE_1.split(' ').map((word) => (
            <Text style={styles.guideTitle}>{word} </Text>
          ))}
        </View>
        <View style={styles.guideMessageWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {RECEIVING_PRIZES_GUIDE_BODY_1_1.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideMessageWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {RECEIVING_PRIZES_GUIDE_BODY_1_4.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideMessageWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {RECEIVING_PRIZES_GUIDE_BODY_1_5.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
        <View style={styles.guideMessageWapper}>
          <View>
            <Text style={styles.guideMessage}>{'▪ '}</Text>
          </View>
          <View style={styles.guideTextWapper}>
            {RECEIVING_PRIZES_GUIDE_BODY_1_6.split(' ').map((word) => (
              <Text style={styles.guideMessage}>{word} </Text>
            ))}
          </View>
        </View>
      </View>
    </CommonButtonModal>
  );
};

const styles = StyleSheet.create({
  guideMessageContainer: {
    width: '100%',
    marginBottom: 40,
  },
  guideTitleContainer: {
    paddingHorizontal: 25,
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  guideTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 24,
    lineHeight: 33,
    fontWeight: 'bold',
  },
  guideWapper: {
    paddingHorizontal: 25,
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
    fontSize: 18,
    lineHeight: 26,
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

export default EventReceivingPrizesGuideModal;
