import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Constants from './Constants';
import { CommonButtonModal } from './Views/CommonButtonModal';
import Strings from './Strings';

const ReviewFirstUploadedModal = ({ navigation, userName, visible, onCancel }) => {
  return (
    <CommonButtonModal
      visible={visible}
      onCancel={onCancel}
      buttonArray={[
        {
          title: Strings.GO_TO_SHOPPING,
          onPress: () => {
            navigation.navigate('Store');
            onCancel();
          },
        },
        {
          title: Strings.GO_TO_HOME,
          onPress: () => {
            navigation.navigate('MainBottom');
            onCancel();
          },
        },
      ]}
    >
      <View style={styles.guideMessageContainer}>
        <Text style={styles.guideTitle}>{Strings.REVIEW_FIRST_UPLOADED_GUIDE_TITLE(userName)}</Text>
        <View style={styles.guideWapper}>
          <Text style={styles.guideMessage}>{Strings.REVIEW_FIRST_UPLOADED_GUIDE_BODY}</Text>
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
    color: Constants.COLOR_MAIN,
    paddingHorizontal: 25,
    fontSize: 24,
    lineHeight: 33,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  guideWapper: {
    paddingHorizontal: 25,
    marginVertical: 5,
    flexDirection: 'row',
  },
  guideMessage: {
    color: 'white',
    fontSize: 18,
    lineHeight: 26,
  },
});

export default ReviewFirstUploadedModal;
