import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Constants from './Constants';
import Preference from 'react-native-default-preference';
import { CommonButtonModal } from './Views/CommonButtonModal';
import Strings from './Strings';
import APIprovider from './APIprovider';

const RECEIVING_PRIZES_GUIDE_TITLE_1 = '경품 수령 안내';
const RECEIVING_PRIZES_GUIDE_BODY_1_1 =
  '회원정보에 기입된 이메일주소를 통해 경품수령 안내 메일을 전송하고 있습니다. 연락이 가능한 이메일 주소로 확인/변경부탁드립니다. (경품수령 안내메일 전송은 평일기준 1~2일 소요됩니다.)';
const RECEIVING_PRIZES_GUIDE_BODY_1_2 =
  '이메일 안내에 따라 연락처, 경품수령장소 등 물품수령을 위한 간단한 정보 입력 부탁드립니다.';
const RECEIVING_PRIZES_GUIDE_BODY_1_3 =
  '일부 경품의 경우 상품 수령을 위한 제세 공과금(경품 가액 22%)을 부담해야 합니다. 자세한 내용은 안내 메일을 통해 전달됩니다.';
const RECEIVING_PRIZES_GUIDE_BODY_1_4 =
  '22년 1월 5일까지 정보 입력 부탁드리며, 미 입력 시 재추첨을 통해 다른 회원님들에게 당첨 기회를 드리고 있습니다.';
const RECEIVING_PRIZES_GUIDE_BODY_1_5 =
  '제공받은 메일이 잘못되어 경품 발송이 잘못된 경우 당사가 책임지지 않습니다.';
const RECEIVING_PRIZES_GUIDE_BODY_1_6 = '확인 후 배송에 다소 시간이 소요될 수 있습니다.';
// const RECEIVING_PRIZES_GUIDE_TITLE_1 = Strings.RECEIVING_PRIZES_GUIDE_TITLE_1;
// const RECEIVING_PRIZES_GUIDE_BODY_1 = Strings.RECEIVING_PRIZES_GUIDE_BODY_1;

const EventReceivingPrizesGuideModal = ({ navigation, visible, onCancel }) => {
  return (
    <CommonButtonModal
      visible={visible}
      type={'full'}
      onCancel={onCancel}
      buttonArray={[
        {
          //title: Strings.GO_TO_POST_REVIEW,
          title: '이메일 수정하기',
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
