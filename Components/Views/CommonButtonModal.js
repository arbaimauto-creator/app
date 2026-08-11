import React, { useEffect } from 'react';
import T from '../Constants/DesignTokens';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { KeyboardAwareScrollView as ScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from '../Constants';
import Strings from '../Strings';

function BottomButton({ title, onButtonPress, disabled = true }) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onButtonPress}>
      <View style={disabled ? styles.bottomDisabledButtonContainer : styles.bottomButtonContainer}>
        <Text
          style={{
            color: T.COLORS.INK,
            fontSize: 18,
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          }}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ModalWapper({ style, mode, children }) {
  return mode === 'full-screen' ? (
    <View style={style} mode={mode}>
      {children}
    </View>
  ) : (
    <SafeAreaView style={style} mode={mode}>
      {children}
    </SafeAreaView>
  );
}

export function CommonButtonModal({
  title,
  children,
  visible,
  onCancel,
  buttonArray = null, //{title, onPress}
  type = 'cropped', // full, cropped
  mode = 'default',
  heightRate = 0.7,
  scrollEnable = true,
  cancelAlertEnable = false,
  cancelAlertTitle = '',
  cancelAlertMessage = '',
}) {
  const deemedColor = 'rgba(0, 0, 0, 0.5)';
  useEffect(() => {}, []);
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onCancel();
      }}
    >
      {/* <ModalWapper mode={mode} style={styles.centeredView}> */}
      {/* <View style={{ backgroundColor: deemedColor, ...styles.centeredView }}> */}
      <View
        style={{
          ...(type === 'full' ? styles.modalFullView : styles.modalCroppedView),
          height: scrollEnable ? Dimensions.get('window').height * heightRate : undefined,
        }}
      >
        <View
          style={{
            ...styles.modalHeaderContainer,
            marginBottom: title ? 25 : 0,
          }}
        >
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableWithoutFeedback
            onPress={() => {
              if (cancelAlertEnable) {
                Alert.alert(cancelAlertTitle, cancelAlertMessage, [
                  {
                    text: Strings.BACK_BUTTON_TITLE,
                    onPress: () => {},
                    style: 'cancel',
                  },
                  {
                    text: Strings.EXIT,
                    onPress: () => {
                      if (onCancel) {
                        onCancel();
                      }
                    },
                  },
                ]);
              } else {
                if (onCancel) {
                  onCancel();
                }
              }
            }}
          >
            <FastImage
              source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
              style={styles.closeIcon}
            />
          </TouchableWithoutFeedback>
        </View>
        <ScrollView scrollEnabled={scrollEnable} style={{ marginBottom: 5 }}>
          {children}
        </ScrollView>
        {buttonArray &&
          buttonArray.map((button, idx) => (
            <BottomButton
              title={button.title}
              onButtonPress={() => {
                button.onPress();
              }}
              disabled={button.disabled}
              key={button.title + '_' + idx}
            />
          ))}
        {buttonArray?.length === 1 && <View style={{ marginTop: 10 }} />}
      </View>
      {/* </View> */}
      {/* </ModalWapper> */}
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  modalCroppedView: {
    backgroundColor: Constants.COLOR_BACKGROUND_DARK, //'#2a2a2a',
    marginHorizontal: 25,
    paddingBottom: 10,
    borderRadius: 4,
  },
  modalFullView: {
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderRadius: 4,
    paddingBottom: 10,
    height: '100%',
    width: '100%',
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 10,
  },
  modalTitle: {
    color: T.COLORS.INK,
    paddingHorizontal: 25,
    fontSize: 20,
    lineHeight: 33,
    fontWeight: 'bold',
  },
  closeIcon: {
    marginHorizontal: 15,
    marginRight: 15,
    width: 28,
    height: 28,
  },
  bottomButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: Constants.COLOR_MAIN,
    height: 40,
  },
  bottomDisabledButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: Constants.COLOR_MAIN_DARK,
    height: 40,
  },
});
