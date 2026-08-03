import React, { useEffect, useState } from 'react';
import { TouchableNativeFeedback, View } from 'react-native';

const originButtonStyle = {
  borderRadius: 40,
  alignSelf: 'center',
  justifyContent: 'center',
  alignItems: 'center',
};

function ActionButton({ renderItem, onPress = () => {}, style, isHeaderRight }) {
  const [buttonStyle, setButtonStyle] = useState(originButtonStyle);

  useEffect(() => {
    if (!isHeaderRight) {
      setButtonStyle((prev) => ({ ...prev, width: 44, height: 44 }));
    } else {
      setButtonStyle(originButtonStyle);
    }
  }, [isHeaderRight]);

  return (
    <View style={style}>
      <TouchableNativeFeedback
        onPress={() => onPress()}
        background={TouchableNativeFeedback.Ripple('#777', true)}
      >
        <View style={buttonStyle}>{renderItem}</View>
      </TouchableNativeFeedback>
    </View>
  );
}

export default ActionButton;
