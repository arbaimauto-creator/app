import { Platform } from 'react-native';
import Share from 'react-native-share';

// 복붙돼 있던 공유 옵션 빌드 + Share.open 호출을 단일화.
// subject/description은 iOS 공유 시트 메타데이터로만 쓰인다.
export function shareLink({ url, message, description }) {
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
