module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },

  // '@react-native-community'는 구버전 패키지명 — RN 0.72+부터 '@react-native'로 이관됨
  extends: ['@react-native'],
  // 새 config는 eslint-plugin-prettier를 포함하지 않으므로 직접 선언 (prettier/prettier 룰용)
  plugins: ['prettier'],
  rules: {
    'no-alert': 'off',
    // rest 문법으로 prop을 제외하는 패턴({ a, ...rest })과 _ 접두사 변수는 미사용으로 취급하지 않음
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { ignoreRestSiblings: true, argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-unused-vars': [
      'warn',
      { ignoreRestSiblings: true, argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'prettier/prettier': ['warn', { endOfLine: 'auto' }],
    // indent: ['error', 2],
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'react-native/no-inline-styles': 0,
    'no-var': 'error',
    'consistent-this': 'off',
    'no-control-regex': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
