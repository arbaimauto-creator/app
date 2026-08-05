module.exports = {
  preset: 'react-native',
  // RN 계열 패키지는 ESM이라 변환 대상에 포함해야 한다 (표준 RN 프리셋 패턴 확장)
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*|immer|@reduxjs)/)',
  ],
  testEnvironment: 'node',
};
