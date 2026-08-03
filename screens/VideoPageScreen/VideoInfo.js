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
import Constants from '../../Components/Constants';
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
            <Text style={[styles.reviewSubInfoText, { marginLeft: 10 }]}>{review.author.name}</Text>
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
            <Text style={{ ...styles.reviewSubInfoText, color: Constants.TIER_COLORS.GIVER }}>
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
    fontSize: 18,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.COLOR_BACKGROUND_DARK,
  },
  reviewSubInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  detailsProfilePicUrl: {
    width: 45,
    height: 45,
    borderRadius: 30,
  },
  reviewSubInfoText: {
    color: Constants.TIER_COLORS.PIONEER,
    fontSize: 15,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
});

export default VideoInfo;
