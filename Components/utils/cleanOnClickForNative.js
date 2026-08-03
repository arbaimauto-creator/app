// cleanOnClickForNative.js
import React from 'react';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  const origCreate = React.createElement;
  React.createElement = (type, props, ...children) => {
    if (props && 'onClick' in props) {
      // 네이티브에선 전역적으로 onClick 제거
      const { onClick, ...rest } = props;
      return origCreate(type, rest, ...children);
    }
    return origCreate(type, props, ...children);
  };
}
