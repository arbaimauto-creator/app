module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(immer|@reduxjs|@react-native)/)',
  ],
  testEnvironment: 'node',
};
