/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));
jest.mock('@react-native-seoul/kakao-login', () => ({ logout: jest.fn() }));
jest.mock('../Components/utils', () => ({
  __esModule: true,
  default: { stopVideoProcessing: jest.fn() },
}));
jest.mock('../navigation/root', () => () => null);
jest.mock('../redux/store', () => ({ store: {} }));
jest.mock('react-redux', () => ({ Provider: ({ children }) => children }));
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (component) => component,
}));
jest.mock('react-native-gesture-handler', () => ({}));

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
