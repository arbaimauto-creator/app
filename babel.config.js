module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
  env: {
    // 릴리즈 번들에서 console.* 호출 제거 (앱 전반에 로그가 많아 런타임 비용이 큼)
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
