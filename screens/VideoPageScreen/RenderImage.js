import React from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { styles } from '.';

export default function RenderImage({ context, item, index }) {
  const url = item.type === 'video' ? item.thumbnailUrl : item.url;

  return (
    //
    <TouchableOpacity
      key={item.url + '_' + index}
      onPress={() => {
        context.setState({ activeSlideIndex: index });
        const screenWidth = Dimensions.get('window').width;
        context._carousel.scrollTo({
          x: screenWidth * index,
          y: 0,
          animated: true,
        });
      }}
    >
      <FastImage
        source={{ uri: url }}
        style={item.type === 'video' ? styles.videoSliderImageStyle : styles.SliderImageStyle}
        resizeMode={FastImage.resizeMode.cover}
      />
      {item.type === 'video' && (
        <FastImage
          source={require('../../Resources/img/relayreview_grey666.png')}
          style={{
            position: 'absolute',
            width: 24,
            height: 24,
            top: '25%',
            left: '25%',
            alignItems: 'center',
          }}
          resizeMode={FastImage.resizeMode.contain}
        />
      )}
    </TouchableOpacity>
  );
}
