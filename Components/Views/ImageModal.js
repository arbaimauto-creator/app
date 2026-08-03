import React from 'react';
import { Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import ImageViewer from 'react-native-image-zoom-viewer';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from '../Constants';

export function ImageModal({ visible, source, sources = [], onClose = () => {}, index }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onClose();
      }}
    >
      <SafeAreaView style={styles.centeredView}>
        <View style={{ ...styles.headerView }}>
          <TouchableWithoutFeedback
            onPress={() => {
              onClose();
            }}
          >
            <FastImage
              source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
              style={styles.closeIcon}
            />
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.contentView}>
          <ImageViewer
            backgroundColor={Constants.COLOR_BACKGROUND_DARK}
            imageUrls={source ? [source] : sources}
            renderIndicator={() => null}
            index={index}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    flexDirection: 'column',
    paddingBottom: 40,
  },
  headerView: {
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    top: 60,
    zIndex: 1,
  },
  contentView: {
    flex: 1,
  },
  closeIcon: {
    width: 30,
    height: 30,
  },
  contentImage: {
    width: '100%',
    height: '100%',
  },
});
