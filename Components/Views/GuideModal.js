import React from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
  Modal,
  Text,
  ScrollView,
  View,
} from 'react-native';
import Strings from '../Strings';

//contents : [{actionTitle, onAction}, {actionTitle, onAction}, ...]
export function GuideModal({
  visible,
  deemed = false,
  title,
  contents,
  width,
  height,
  cancelTitle = Strings.CANCEL,
  onCancel,
}) {
  const localHeight = height ? height : (contents.length + 2) * 50 + 60;
  const deemedColor = deemed ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)';
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onCancel();
      }}
    >
      <TouchableWithoutFeedback onPress={() => onCancel()}>
        <View style={{ backgroundColor: deemedColor, ...styles.centeredView }}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={{ maxHeight: localHeight, ...styles.guideModalContainer }}>
              <View style={styles.guideModalTitleContainer}>
                <Text style={styles.guideModalTitle}>{title}</Text>
              </View>
              <ScrollView />
              <TouchableNativeFeedback
                onPress={() => {
                  onCancel();
                }}
              >
                <View style={styles.guideModalCancelContainer}>
                  <Text style={styles.guideModalCancel}>{cancelTitle}</Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
  },
  guideModalContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 50,
    backgroundColor: 'rgb(31, 31, 31)',
    borderRadius: 6,
  },
  guideModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 30,
    marginBottom: 20,
  },
  guideModalTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  guideModalCancelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 10,
  },
  guideModalTitle: {
    color: 'white',
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
  },
  guideModalText: {
    color: 'rgba(255, 183, 49, 1)',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
  },
  guideModalCancel: {
    color: '#999',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
  },
});
