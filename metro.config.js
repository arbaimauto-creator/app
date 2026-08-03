const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    unstable_enablePackageExports: true,
  },
  transformer: {
    unstable_allowRequireContext: true,
  },
  // ❌ 문제가 되는 설정 제거
  // server: {
  //   experimentalImportSupport: false,
  // },
};

module.exports = mergeConfig(defaultConfig, config);
