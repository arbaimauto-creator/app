module.exports = {
  assets: ['./assets/fonts'],
  dependencies: {
    'react-native-video': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-video/android',
        },
      },
    },
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
    // ✅ Apple Authentication은 iOS에서만 링크
    '@invertase/react-native-apple-authentication': {
      platforms: {
        android: null, // Android에서 제외
      },
    },
    // ffmpeg-kit 대체 AAR에 x86_64 바이너리가 없어 에뮬레이터에서 크래시.
    // GREYD_EMULATOR=1 환경변수로 빌드할 때만 제외한다 (실기기/배포 빌드는 영향 없음).
    ...(process.env.GREYD_EMULATOR === '1'
      ? {
          'ffmpeg-kit-react-native': {
            platforms: {
              android: null,
            },
          },
        }
      : {}),
  },
  project: {
    android: {
      packageName: 'com.arbaim.greyd', // ✅ app/build.gradle의 applicationId와 동일하게
    },
  },
};
