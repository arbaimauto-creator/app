/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import StartupErrorScreen, {
  reportStartupError,
  subscribeStartupError,
} from './Components/StartupErrorScreen';

// 시작 단계의 어떤 오류도 흰 화면으로 끝나지 않게 한다 —
// import·초기화·렌더 어디서 터지든 화면에 원인을 띄운다.
if (global.ErrorUtils?.setGlobalHandler) {
  const previousHandler = global.ErrorUtils.getGlobalHandler?.();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportStartupError(error, isFatal ? 'fatal' : 'global');
    if (previousHandler) {
      previousHandler(error, isFatal);
    }
  });
}

let App = null;
try {
  App = require('./App.tsx').default;
  require('./Components/services').pushNotifications.configure();
  if (__DEV__) {
    require('./Components/utils/cleanOnClickForNative');
    require('./Components/utils/debugOnClickLeak');
  }
} catch (e) {
  reportStartupError(e, 'import');
}

function RootWithGuard() {
  const [error, setError] = React.useState(null);
  React.useEffect(() => subscribeStartupError(setError), []);

  if (error || !App) {
    return (
      <StartupErrorScreen error={error || { phase: 'import', message: 'App 모듈 로드 실패' }} />
    );
  }
  return <App />;
}

AppRegistry.registerComponent(appName, () => RootWithGuard);
