import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import APIprovider from '../../Components/APIprovider';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { ReviewGradeBadgeView } from '../../Components/Views';
import UserProfilePicView from '../UserPageScreen/UserProfilePicView';

function VideoInfo({ context }) {
  const navigation = useNavigation();
  const review = context.state.video;
  const [title, setTitle] = useState(review.title?.trim());

  useEffect(() => {
    if (review.titleByCountry) {
      setTitle(review.titleByCountry.trim());
    }
  }, [review.titleByCountry]);

  return (
    <View style={styles.reviewInfo}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (review.g6RatingCount > 0) {
            // innerData, innerMaxima의 setState 위치에 따라 표기가 달라지는 이유?
            // context.setState({
            //   isShowingRatingList: true,
            //   innerData: processData(context.state.g6RatingScoreGraph),
            //   innerMaxima: getMaxima(context.state.g6RatingScoreGraph),
            // });
            APIprovider.getVideoG6RatingList(review.videoId)
              .then((ratingList) => {
                context.setState({
                  ratingList,
                  // isShowingRatingList: true,
                  // innerData: processData(context.state.g6RatingScoreGraph),
                  // innerMaxima: getMaxima(context.state.g6RatingScoreGraph),
                });

                navigation.navigate('RatingList', {
                  ratingList,
                  context: context,
                });
              })
              .catch(() => Alert.alert(Strings.FAILED_LOAD_RATINGS));
          }
        }}
      >
        <View style={{ alignSelf: 'flex-start' }}>
          <ReviewGradeBadgeView
            g6RatingCount={review.g6RatingCount}
            g6AvgRatingScore={review.g6AvgRatingScore}
            type={context.state.video.myG6Rating ? 'review_on' : 'review_off'}
            containerStyle={{
              bottom: context.state.isShowingCheckSign ? 10 : 0,
            }}
          />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.titleContainer}>
        <Text style={styles.reviewTitle}>
          {/* {review.title !== null && review.title !== undefined && review.title !== ''
            ? review.title.trim()
            : ''} */}
          {title}
        </Text>
      </View>
      <View style={styles.reviewSubInfoContainer}>
        <TouchableNativeFeedback
          onPress={() => {
            context.props.navigation.push('UserPage', {
              pageOwnerUserId: review.author.userId,
              pageOwnerUserName: review.author.name,
              pageOwnerUserProfilePicUrl: review.author.profilePicUrl,
            });
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <UserProfilePicView
              style={styles.detailsProfilePicUrl}
              source={{ uri: review.author.profilePicUrl }}
            />
            <Text style={[styles.reviewSubInfoText, styles.authorName]}>{review.author.name}</Text>
          </View>
        </TouchableNativeFeedback>
        <Text style={styles.reviewSubInfoText}>
          {` ・ ${Strings.VIEW_COUNT(review.viewCount)}`}
          {/* {` ・ ${Strings.VIEW_COUNT(review.viewCount)} ・ ${utils.timestampToAgo(
            review.createdAt,
          )}`} */}
        </Text>
        {review?.isSponsored ? (
          <>
            <Text style={styles.reviewSubInfoText}> ・ </Text>
            <Text style={[styles.reviewSubInfoText, styles.sponsoredText]}>
              {Strings.SPONSORED}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewInfo: {
    width: '100%',
    position: 'absolute',
    bottom: 30,
    // bottom: '15%',
    paddingLeft: 20,
    paddingRight: 18,
  },
  // backgroundColor: 'rgba(58, 58, 58, .5)',
  titleContainer: {
    width: '80%', //Dimensions.get('screen').width - 20,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
    fontFamily: T.FONT.SemiBold,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reviewSubInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailsProfilePicUrl: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewSubInfoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontFamily: T.FONT.Regular,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authorName: {
    marginLeft: 10,
    fontSize: 13,
    color: '#fff',
    fontFamily: T.FONT.Bold,
  },
  sponsoredText: {
    color: T.COLORS.AMBER,
    fontFamily: T.FONT.Bold,
  },
});

export default VideoInfo;
