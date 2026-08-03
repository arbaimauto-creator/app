import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import FastImage from 'react-native-fast-image';
import Constants from '../Constants';
import Strings from '../Strings';
import { CheckBox } from './../Views';

function BottomButton({ title, subTitle, onButtonPress }) {
  return (
    <Pressable onPress={onButtonPress}>
      <View
        style={{
          ...styles.bottomButtonContainer,
          backgroundColor: Constants.COLOR_MAIN,
          height: 54,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: 'black',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        {!subTitle === false && (
          <Text
            style={{
              color: 'black',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {subTitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export function NoticeImageModal({
  imageWidth,
  imageHeight,
  onButtonPress = null,
  skipEnable = true,
  noticeObject = {},
}) {
  const [visible, setVisible] = React.useState(false);
  const [checkStatus, setCheckStatus] = React.useState(false);
  const { id, contentImage, buttonTitle = '', buttonSubTitle = '' } = noticeObject;
  const contentImageHeight =
    (imageHeight / imageWidth) * (Dimensions.get('window').width - 100 - 20);
  useEffect(() => {
    const setVisibleWithTime = async () => {
      const noticeSkipNumber = await Preference.get('noticeSkipNumber');
      if (!noticeSkipNumber || (noticeSkipNumber && noticeSkipNumber * 1 < id)) {
        setVisible(true);
      }
    };
    setVisibleWithTime();
  }, [id]);
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        setVisible(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeaderContainer}>
            <Text style={styles.modalTitle} />
            <TouchableWithoutFeedback
              onPress={() => {
                setVisible(false);
              }}
            >
              <FastImage
                source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
                style={styles.closeIcon}
              />
            </TouchableWithoutFeedback>
          </View>
          <FastImage
            source={contentImage}
            resizeMode={'contain'}
            style={[styles.contentImage, { height: contentImageHeight }]}
          />
          {buttonTitle !== '' && (
            <BottomButton
              title={buttonTitle}
              subTitle={buttonSubTitle}
              onButtonPress={() => {
                onButtonPress();
                setVisible(false);
              }}
            />
          )}
          {skipEnable === true && (
            <View style={styles.checkTextBox}>
              <CheckBox
                key={'skipCheckBox'}
                onChanged={(isChecked) => {
                  if (isChecked === false) {
                    setCheckStatus(false);
                    Preference.set('noticeSkipNumber', String(id * 1 - 1));
                  } else {
                    setCheckStatus(true);
                    Preference.set('noticeSkipNumber', String(id));
                    setTimeout(() => {
                      setVisible(false);
                    }, 500);
                  }
                }}
                value={checkStatus}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalSubText}>{Strings.NO_NOTICE_FORWARD}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function NoticeModal({ title, content, buttonTitle = '', onButtonPress = null }) {
  const [visible, setVisible] = React.useState(true);
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        setVisible(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeaderContainer}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableWithoutFeedback
              onPress={() => {
                setVisible(false);
              }}
            >
              <FastImage
                source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
                style={styles.closeIcon}
              />
            </TouchableWithoutFeedback>
          </View>
          <ScrollView>
            <Text style={styles.modalText}>{content}</Text>
          </ScrollView>
          {buttonTitle !== '' && (
            <BottomButton
              title={buttonTitle}
              onButtonPress={() => {
                onButtonPress();
                setVisible(false);
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalView: {
    marginHorizontal: 50,
    backgroundColor: 'rgb(31, 31, 31)',
    paddingHorizontal: 10,
    borderRadius: 4,
    paddingBottom: 10,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    lineHeight: 26,
    color: 'white',
    marginVertical: 10,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 18,
    lineHeight: 20,
  },
  modalSubText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
  },
  closeIcon: {
    width: 22,
    height: 22,
  },
  contentImage: {
    width: 'auto',
    borderRadius: 2,
  },
  bottomButtonContainer: {
    marginTop: 10,
  },
  checkTextBox: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
