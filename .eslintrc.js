module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ['web/**/*.{js,jsx,ts,tsx}'],
      env: { browser: true },
    },
  ],

  // '@react-native-community'는 구버전 패키지명 — RN 0.72+부터 '@react-native'로 이관됨
  extends: ['@react-native'],
  // 새 config는 eslint-plugin-prettier를 포함하지 않으므로 직접 선언 (prettier/prettier 룰용)
  plugins: ['prettier'],
  rules: {
    // Constants 순환 참조 재발 방지 — Style.js가 './index'를 import해 릴리스 흰 화면을
    // 유발한 사고(2026-08-11)의 구조적 차단. Constants 하위는 서로를 참조하지 않는다.
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/Constants/index', '**/Constants/index.js'],
            message:
              'Constants/index를 Constants 내부에서 import하지 마세요 — 순환 참조로 릴리스에서 상수가 undefined가 됩니다.',
          },
        ],
      },
    ],
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
