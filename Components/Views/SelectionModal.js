import React from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
  Modal,
  Text,
  ScrollView,
  View,
} from 'react-native';
import Strings from '../Strings';

//contents : [{actionTitle, onAction}, {actionTitle, onAction}, ...]
export function SelectionModal({
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
            <View style={{ maxHeight: localHeight, ...styles.selectModalContainer }}>
              <View style={styles.selectModalTitleContainer}>
                <Text style={styles.selectModalTitle}>{title}</Text>
              </View>
              <ScrollView>
                {contents.map((item, index) => (
                  <TouchableNativeFeedback key={index} onPress={item.onAction}>
                    <View style={styles.selectModalTextContainer}>
                      <Text style={styles.selectModalText}>{item.actionTitle}</Text>
                    </View>
                  </TouchableNativeFeedback>
                ))}
              </ScrollView>
              <TouchableNativeFeedback
                onPress={() => {
                  onCancel();
                }}
              >
                <View style={styles.selectModalCancelContainer}>
                  <Text style={styles.selectModalCancel}>{cancelTitle}</Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export function GridButtonSelectionModal({
  visible,
  deemed = false,
  title,
  contents,
  width,
  height,
  cancelTitle = Strings.CANCEL,
  onCancel,
}) {
  const localHeight = height ? height : ((contents.length - 1) / 3 + 2.5) * 60 + 60;
  const deemedColor = deemed ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)';
  const rowButtons = [];
  const GridButtons = (props) => {
    for (let i = 0; i < contents.length; i = i + 3) {
      rowButtons.push(
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableNativeFeedback key={i} onPress={contents[i].onAction}>
            <View
              style={{
                ...styles.gridButtonContainer,
                width: (Dimensions.get('window').width - 50) / 3 - 10,
              }}
            >
              <Text style={styles.selectModalTitle}>{contents[i].actionTitle}</Text>
            </View>
          </TouchableNativeFeedback>
          {i + 1 < contents.length ? (
            <TouchableNativeFeedback key={i + 1} onPress={contents[i + 1].onAction}>
              <View
                style={{
                  ...styles.gridButtonContainer,
                  width: (Dimensions.get('window').width - 50) / 3 - 10,
                }}
              >
                <Text style={styles.selectModalTitle}>{contents[i + 1].actionTitle}</Text>
              </View>
            </TouchableNativeFeedback>
          ) : (
            <View
              style={{
                ...styles.gridButtonContainer,
                width: (Dimensions.get('window').width - 50) / 3 - 10,
                borderWidth: 0,
              }}
            />
          )}
          {i + 2 < contents.length ? (
            <TouchableNativeFeedback key={i + 2} onPress={contents[i + 2].onAction}>
              <View
                style={{
                  ...styles.gridButtonContainer,
                  width: (Dimensions.get('window').width - 50) / 3 - 10,
                }}
              >
                <Text style={styles.selectModalTitle}>{contents[i + 2].actionTitle}</Text>
              </View>
            </TouchableNativeFeedback>
          ) : (
            <View
              style={{
                ...styles.gridButtonContainer,
                width: (Dimensions.get('window').width - 50) / 3 - 10,
                borderWidth: 0,
              }}
            />
          )}
        </View>,
      );
    }
    return rowButtons;
  };
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
            <View style={{ maxHeight: localHeight, ...styles.selectModalContainer }}>
              <View style={styles.gridButtonModalTitleContainer}>
                <Text style={{ ...styles.selectModalText, fontSize: 20 }}>{title}</Text>
              </View>
              <ScrollView>
                <GridButtons />
              </ScrollView>
              <TouchableNativeFeedback
                onPress={() => {
                  onCancel();
                }}
              >
                <View style={styles.selectModalCancelContainer}>
                  <Text style={styles.selectModalCancel}>{cancelTitle}</Text>
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
  selectModalContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 5,
    backgroundColor: '#1b1b1b',
    borderRadius: 6,
  },
  selectModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 30,
    marginBottom: 20,
  },
  gridButtonModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 20,
    marginBottom: 10,
  },
  selectModalTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  gridButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    margin: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  selectModalCancelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 10,
  },
  selectModalTitle: {
    color: 'white',
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
  },
  selectModalText: {
    color: '#7A5C2E',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
  },
  selectModalCancel: {
    color: '#999',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
  },
});
