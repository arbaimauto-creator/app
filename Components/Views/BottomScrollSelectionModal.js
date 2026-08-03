import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, TouchableWithoutFeedback, Modal, Text, View } from 'react-native';
import { isIphoneX, getBottomSpace } from 'react-native-iphone-x-helper';
import SmoothPicker from 'react-native-smooth-picker';
import Strings from '../Strings';
import Constants from '../Constants';

export function BottomScrollSelectionModal({
  visible,
  title,
  contents,
  height = undefined,
  cancelTitle = Strings.OK,
  onSelect,
  onCancel,
}) {
  const [selected, setSelected] = useState(0);
  const deemedColor = 'rgba(0, 0, 0, 0.5)';
  const opacities = { 0: 1, 1: 0.4, 2: 0.2, 3: 0.1, 4: 0.1 };
  if (height === undefined) {
    height = (isIphoneX() ? 400 : 370) + getBottomSpace();
  }

  const handleChange = (index) => {
    setSelected(index);
  };
  const Item = React.memo(({ opacity, _selected, name }) => {
    return (
      <View
        style={[
          styles.optionWrapper,
          { opacity, backgroundColor: _selected ? '#252525' : 'transparent' },
        ]} //dimension
      >
        <Text style={styles.selectModalText}>{name}</Text>
      </View>
    );
  });
  const ItemToRender = ({ item, index }, indexSelected) => {
    const itemSelected = index === indexSelected;
    const gap = Math.abs(index - indexSelected);
    let opacity = opacities[gap];
    if (gap > 3) {
      opacity = opacities[4];
    }
    return <Item opacity={opacity} selected={itemSelected} name={item.name} />;
  };
  useEffect(() => {
    setSelected(0);
  }, [visible]);
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onCancel();
      }}
    >
      <View style={{ backgroundColor: deemedColor, ...styles.centeredView }}>
        <View style={{ ...styles.bottomModalContainer, maxHeight: height }}>
          <View style={styles.bottomModalHeaderContainer}>
            <Text style={{ ...styles.bottomModalHeaderButton, opacity: 0 }}>{cancelTitle}</Text>
            <Text style={styles.bottomModalHeaderTitle}>{title}</Text>
            <TouchableWithoutFeedback
              onPress={() => {
                if (onSelect) {
                  onSelect(contents[selected]);
                }
                if (onCancel) {
                  onCancel();
                }
              }}
            >
              <Text style={styles.bottomModalHeaderButton}>{cancelTitle}</Text>
            </TouchableWithoutFeedback>
          </View>
          <View style={styles.wrapperVertical}>
            <SmoothPicker
              style={{ width: Dimensions.get('window').width - 40 }}
              onScrollToIndexFailed={() => {}}
              keyExtractor={(_, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              data={contents}
              onSelected={({ item, index }) => {
                handleChange(index);
              }}
              renderItem={(option) => ItemToRender(option, selected, true)}
            />
          </View>
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
  bottomModalContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderRadius: 6,
    marginTop: 'auto',
  },
  bottomModalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  bottomModalHeaderTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 20,
  },
  bottomModalHeaderButton: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 16,
    marginHorizontal: 15,
  },
  bottomModalTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  selectModalText: {
    color: Constants.TIER_COLORS.ARTISAN,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 22,
  },
  optionWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 10,
  },
  wrapperVertical: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
