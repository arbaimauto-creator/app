import React from 'react';
import FastImage, { FastImageProps } from 'react-native-fast-image';

type WebOnly = { onClick?: any; role?: any; tabIndex?: any };


export default function SafeFastImage(props: FastImageProps & WebOnly) {
  // console.log('SafeFastImage', props);
  if ('onClick' in props) {
    console.warn('[FastImage] onClick detected!', { source: props.source, style: props.style });
  }
  const { onClick, role, tabIndex, ...rest } = props;
  return <FastImage {...rest} />;
}