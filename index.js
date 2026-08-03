/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './App.tsx';
import { pushNotifications } from './Components/services';

if (__DEV__) {
  require('./Components/utils/cleanOnClickForNative');
  require('./Components/utils/debugOnClickLeak');
}

pushNotifications.configure();

AppRegistry.registerComponent(appName, () => App);
