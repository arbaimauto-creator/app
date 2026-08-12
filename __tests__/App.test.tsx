/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with Jest.
import { it, jest } from '@jest/globals';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: () => undefined,
    signIn: () => undefined,
    signOut: () => undefined,
  },
}));
jest.mock('@react-native-seoul/kakao-login', () => ({ logout: () => undefined }));
jest.mock('../Components/utils', () => ({
  __esModule: true,
  default: { stopVideoProcessing: () => undefined },
}));
jest.mock('../navigation/root', () => () => null);
jest.mock('../redux/store', () => ({ store: {} }));
jest.mock('react-redux', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@sentry/react-native', () => ({
  init: () => undefined,
  wrap: (component: React.ComponentType) => component,
}));
jest.mock('react-native-gesture-handler', () => ({}));

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
