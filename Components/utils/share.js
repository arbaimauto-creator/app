import { Platform } from 'react-native';
import Share from 'react-native-share';

// 복붙돼 있던 공유 옵션 빌드 + Share.open 호출을 단일화.
// subject/description은 iOS 공유 시트 메타데이터로만 쓰인다.
export function shareLink({ url, message, description }) {
  // 다이나믹 링크 생성 실패 시 res?.shortLink가 undefined로 흘러들어와
  // "... undefined"가 공유되던 문제 — 링크 없으면 공유 시트를 열지 않는다
  if (!url) {
    return Promise.resolve(null);
  }
  const options = Platform.select({
    ios: {
      activityItemSources: [
        {
          placeholderItem: { type: 'url', content: url },
          item: { default: { type: 'url', content: url } },
          subject: { default: description },
          linkMetadata: { originalUrl: url, url, description },
        },
        {
          placeholderItem: { type: 'text', content: message },
          item: { default: { type: 'text', content: message }, message: null },
        },
      ],
    },
    default: {
      description,
      subject: description,
      message: `${message} ${url}`,
    },
  });

  return Share.open(options)
    .then((res) => {
      console.log(res);
      return res;
    })
    .catch((err) => {
      err && console.log(err);
    });
}
