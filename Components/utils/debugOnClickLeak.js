// debugOnClickLeak.js
import React from 'react';

if (__DEV__) {
  const origClone = React.cloneElement;
  React.cloneElement = (element, props, ...children) => {
    if (props && 'onClick' in props) {
      // 어떤 엘리먼트에 onClick을 꽂았는지, 어디서 왔는지 추적
      // FastImage만 보고 싶으면: if ((element?.type?.displayName || element?.type?.name) === 'FastImage') { ... }
      // 또는 element?.props?.source 있는 경우만 찍기
      // eslint-disable-next-line no-console
      console.warn('[onClick leak via cloneElement]', element?.type?.name || element?.type, props);
      // eslint-disable-next-line no-console
      console.trace();
    }
    return origClone(element, props, ...children);
  };

  const origCreate = React.createElement;
  React.createElement = (type, props, ...children) => {
    if (props && 'onClick' in props &&
        (type?.displayName === 'FastImage' || type?.name === 'FastImage')) {
      // eslint-disable-next-line no-console
      console.warn('[onClick leak via createElement]', props);
      // eslint-disable-next-line no-console
      console.trace();
    }
    return origCreate(type, props, ...children);
  };
}
