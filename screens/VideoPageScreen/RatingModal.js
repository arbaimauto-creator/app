import React from 'react';
import { Dimensions, TouchableWithoutFeedback, View } from 'react-native';
import RatingModalView from './RatingModalView';

function RatingModal({ context }) {
  const bottom = context.state.isShowingGreyding ? 0 : -Dimensions.get('window').height;
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        context.setState({ isShowingGreyding: false });
      }}
    >
      <View
        style={{
          position: 'absolute',
          bottom: bottom,
          width: '100%',
          height: '100%',
        }}
      >
        <RatingModalView context={context} />
      </View>
    </TouchableWithoutFeedback>
  );
}

export default RatingModal;
