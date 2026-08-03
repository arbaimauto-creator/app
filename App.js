/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { LogBox, Platform, StatusBar, Text } from 'react-native';
import { ThemeProvider } from 'react-native-elements';
import 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import Constants from './Components/Constants';
import { theme } from './Components/utils/theme';
import { ContextProvider } from './Contexts/index';
import Root from './navigation/root';
import { store } from './redux/store';
import * as Sentry from '@sentry/react-native';

if (!__DEV__) {
  Sentry.init({
    dsn: 'https://bb60dfe5b5b04c7b8d68124efbec49ed@o4505594125025280.ingest.sentry.io/4505594127319040',
  });
}

// TODO: change navigation function params to redux state management
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);
LogBox.ignoreLogs(['Warning: ReactNative.createElement']);
LogBox.ignoreAllLogs(true);

if (Text.defaultProps == null) {
  Text.defaultProps = { color: 'white' };
  Text.defaultProps.allowFontScaling = false;
}
StatusBar.setBarStyle('default', true);
// StatusBar.setBarStyle('light-content', true);
if (Platform.OS !== 'ios') {
  StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
}
export default function App(props) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ContextProvider>
          <Root />
        </ContextProvider>
      </ThemeProvider>
    </Provider>
  );
}
