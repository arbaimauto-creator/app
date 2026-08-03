import React from 'react';
import { Modal, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from './Constants';

function BottomButton({ title, onButtonPress }) {
  return (
    <Button
      containerStyle={styles.bottomButtonContainer}
      buttonStyle={{
        backgroundColor: Constants.COLOR_MAIN,
        height: 40,
      }}
      titleStyle={{
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
      }}
      title={title}
      onPress={onButtonPress}
    />
  );
}

export default function EventNoticeModal({ visible, onCancel, bodyText }) {
  const deemedColor = 'rgba(0, 0, 0, 0.5)';
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onCancel();
      }}
    >
      <SafeAreaView style={styles.centeredView}>
        <View style={{ backgroundColor: deemedColor, ...styles.centeredView }}>
          <View style={styles.modalCroppedView}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalTitle} />
              <Text style={styles.modalTitle}>{''}</Text>
              <TouchableWithoutFeedback
                onPress={() => {
                  if (onCancel) {
                    onCancel();
                  }
                }}
              >
                <FastImage
                  source={require('../Resources/img/iconRenewal/icHeaderClose22.png')}
                  style={styles.closeIcon}
                />
              </TouchableWithoutFeedback>
            </View>
            <View style={styles.guideMessageContainer}>
              <Text style={styles.guideTitle}>{bodyText}</Text>
            </View>
            <BottomButton
              title={'확인'}
              onButtonPress={() => {
                onCancel();
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCroppedView: {
    backgroundColor: 'rgb(31, 31, 31)',
    marginHorizontal: 50,
    paddingBottom: 10,
    borderRadius: 8,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    lineHeight: 26,
    color: 'white',
    marginLeft: 20,
  },
  closeIcon: {
    marginHorizontal: 15,
    marginRight: 15,
    width: 22,
    height: 22,
  },
  bottomButtonContainer: {
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  guideMessageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  guideTitle: {
    color: 'white',
    paddingHorizontal: 25,
    fontSize: 20,
    lineHeight: 30,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  guideWapper: {
    paddingHorizontal: 30,
    marginBottom: 30,
    flexDirection: 'row',
  },
  guideMessage: {
    color: 'white',
    fontSize: 18,
    lineHeight: 26,
  },
});
