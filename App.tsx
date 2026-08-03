/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import { LogBox, Platform, StatusBar } from 'react-native';
import { ThemeProvider } from 'react-native-elements';
import 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import Constants from './Components/Constants';
import { ContextProvider } from './Contexts/index';
import Root from './navigation/root';
import { store } from './redux/store';
import { Text } from 'react-native';
import * as Sentry from '@sentry/react-native';

// TODO: change navigation function params to redux state management
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);
LogBox.ignoreLogs(['Warning: ReactNative.createElement']);
LogBox.ignoreAllLogs(true);

StatusBar.setBarStyle('default', true);
if (Platform.OS !== 'ios') {
	StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
}

if ((Text as any).defaultProps == null) {
	(Text as any).defaultProps = {};
}
(Text as any).defaultProps.allowFontScaling = false;

if (!__DEV__) {
	Sentry.init({
		dsn: 'https://bb60dfe5b5b04c7b8d68124efbec49ed@o4505594125025280.ingest.sentry.io/4505594127319040',
		tracesSampleRate: 1.0,
	});
}

function App(): JSX.Element {
	return (
		<Provider store={store}>
			<ThemeProvider>
				<ContextProvider>
					<Root />
				</ContextProvider>
			</ThemeProvider>
		</Provider>
	);
}

export default Sentry.wrap(App);
