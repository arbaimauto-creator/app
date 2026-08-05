const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    unstable_enablePackageExports: true,
  },
  transformer: {
    unstable_allowRequireContext: true,
    // 모듈을 첫 사용 시점에 lazy require — 앱 시작 시 전체 모듈 일괄 로드로 인한
    // 스플래시 대기(수 초~수십 초)를 크게 줄인다
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  // ❌ 문제가 되는 설정 제거
  // server: {
  //   experimentalImportSupport: false,
  // },
};

module.exports = mergeConfig(defaultConfig, config);
