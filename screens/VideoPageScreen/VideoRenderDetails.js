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
        <Text style={styles.description}>{video.description || video.descriptionByCountry}</Text>

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
