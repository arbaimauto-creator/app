import React from 'react';
import { Dimensions, LayoutAnimation, Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import SideTouchCoverView from './SideTouchCoverView';

function SliderImage({ context, url }) {
  const MemoizedSliderImage = (
    <View>
      <Pressable
        style={{ width: Dimensions.get('window').width }}
        onPress={() => {
          context.setState({ isShowingVideoInfo: true });
          if (context.videoInfoTimer !== undefined) {
            clearTimeout(context.videoInfoTimer);
          }
          context.videoInfoTimer = setTimeout(() => {
            LayoutAnimation.linear();
            context.setState({ isShowingVideoInfo: false });
          }, 5000);
        }}
      >
        <FastImage source={{ uri: url }} style={context.getPlayerStyle()} resizeMode={'contain'} />
      </Pressable>
      <SideTouchCoverView
        context={context}
        onPress={context.onPressRightSide.bind(context)}
        onPressLeftSide={context.onPressLeftSide.bind(context)}
        onPressRightSide={context.onPressRightSide.bind(context)}
      />
    </View>
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => MemoizedSliderImage, [url, context.getPlayerStyle()]);
}

export default SliderImage;
