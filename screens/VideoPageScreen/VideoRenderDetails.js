import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { styles } from '.';
import FEATURES from '../../Components/Constants/Features';
import LikedBy from './LikedBy';
import LinkedProduct from './LinkedProduct';
import LinkedProductReviews from './LinkedProductReviews';
import QuestionToReviewer from './QuestionToReviewer';
import RatingListModal from './RatingListModal';
import RelayReviews from './RelayReviews';
import RenderImage from './RenderImage';
import ReviewComments from './ReviewComments';
import ReviewerRating from './ReviewerRating';
import UpperRelayReview from './UpperRelayReview';
import VideoHashTag from './VideoHashTag';

/**
 * 크리에이터가 붙여넣은 설명에 마크다운 기호가 그대로 남아 화면에 **별표**로 보였다.
 * 리치 텍스트 렌더러를 새로 들이는 대신, 화면에서 의미 없는 기호만 걷어낸다.
 * (굵게/기울임 표시는 잃지만, 기호가 노출되는 것보다 낫다)
 */
function plainText(s) {
  if (!s) {
    return '';
  }
  return String(s)
    .replace(/\*\*(.+?)\*\*/g, '$1') // **굵게**
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/g, '$1$2') // *기울임*
    .replace(/(^|\s)__(.+?)__(?=\s|$)/g, '$1$2') // __강조__
    .replace(/^#{1,6}\s+/gm, '') // # 제목
    .replace(/^\s*[-*+]\s+/gm, '· '); // 목록 기호
}

export default function VideoRenderDetails({ context, useIsFocused }) {
  const { video } = context.state;

  const [_commentCount, setCommentCount] = useState(0);
  const [linkedProduct, setLinkedProduct] = useState(video.linkedProduct);

  useEffect(() => {
    if (
      typeof video.linkedProduct?.productId === 'string' ||
      video.linkedProduct?.productId === undefined
    ) {
      setLinkedProduct(video.linkedProduct);
    } else {
      setLinkedProduct(video.linkedProduct.productId);
    }
  }, [video.linkedProduct]);

  useEffect(() => {
    if (context.state.video.commentCount > 0) {
      setCommentCount(context.state.video.commentCount);
    }
  }, [context.state.video.commentCount]);

  if (!context.state.isFullScreen) {
    return (
      <View style={styles.detailsContainer}>
        <View style={styles.slidePagination}>
          <View style={styles.sliderViewStyle}>
            {context.state.slides.map((item, index) => (
              <RenderImage context={context} item={item} index={index} key={index} />
            ))}
          </View>
        </View>

        {linkedProduct?._id ? null : (
          <LinkedProduct context={context} linkedProduct={linkedProduct} />
        )}

        <ReviewerRating context={context} />
        {FEATURES.SOCIAL_LIKES ? (
          <LikedBy
            videoId={video.videoId}
            likes={video.likes}
            logonUserId={context.props.route.params.logonUserId}
            navigation={context.props.navigation}
          />
        ) : null}
        <Text style={styles.description}>
          {plainText(video.description || video.descriptionByCountry)}
        </Text>

        <View>
          {video.hashTags ? (
            <VideoHashTag
              hashTags={video.hashTags}
              navigation={context.props.navigation}
              isReviewPage
            />
          ) : null}
        </View>

        <QuestionToReviewer context={context} navigation={context.props.navigation} />

        {video.relayingVideo ? <UpperRelayReview context={context} /> : <View />}
        {context.props.route.params.isFocused && useIsFocused && !context.state.isBlurred && (
          <View style={styles.relatedInfoContainer}>
            {/* {commentCount > 0 ? <ReviewComments context={context} /> : null} */}
            <ReviewComments context={context} />
            {video.relayedVideoCount > 0 && <RelayReviews context={context} />}
            {context.props.route.params.isFocused &&
            useIsFocused &&
            video.linkedProduct?.productId !== undefined ? (
              <LinkedProductReviews context={context} />
            ) : (
              <View />
            )}
          </View>
        )}
        {context.props.route.params.isFocused && useIsFocused && (
          <RatingListModal context={context} />
        )}
      </View>
    );
  }
}
