import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Constants from '../Constants';
import { StyleSheet } from 'react-native';
import Strings, { getLanguage } from '../Strings';
import utils from '../utils';
import FastImage from 'react-native-fast-image';

export default function ReviewDescriptionSummary({ description, isMain, review }) {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    if (review?.relayedVideo) {
      setVideo(review.relayedVideo);
      return;
    }

    setVideo(review);
  }, [review]);

  if (!isMain && video) {
    return (
      <View>
        {video.title !== null && video.title !== '' && (
          <View>
            {video.titleByCountry ? (
              <Text style={styles.reviewTitle} numberOfLines={1}>
                {video.titleByCountry}
              </Text>
            ) : (
              <Text style={styles.reviewTitle} numberOfLines={1}>
                {video.title[getLanguage()]
                  ? video.title[getLanguage()].trim()
                  : video.title.trim()}
              </Text>
            )}

            {video.isSponsored ? (
              <Text style={styles.sponsoredText}>{Strings.SPONSORED}</Text>
            ) : null}
          </View>
        )}
        <View>
          <View style={styles.reviewSubTitle}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.reviewInfo} numberOfLines={1}>
                {video.author?.name}
              </Text>
              <FastImage
                style={{ width: 18, height: 18 }}
                source={
                  Constants.TIER_ICONS[
                    utils.getTierNameByClass(video.author?.class) || utils.getTierNameByClass(0)
                  ]
                }
              />
            </View>
            {/* <Text style={{ marginHorizontal: 5, color: Constants.TIER_COLORS.PIONEER }}>・</Text> */}
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: -2, marginBottom: 2 }}
          >
            <Text style={styles.reviewInfo}>{Strings.VIEW_COUNT(video.viewCount)}</Text>
            <Text style={{ marginHorizontal: 5, color: Constants.TIER_COLORS.PIONEER }}>・</Text>
            <FastImage
              style={{ marginRight: 2, width: 12, height: 12 }}
              source={require('../../Resources/img/iconRenewal/heart-on-outlined.png')}
            />
            <Text style={styles.reviewInfo}>{review?.likes || 0}</Text>
          </View>
          {video.descriptionByCountry ? (
            <Text style={styles.itemDescriptionText} numberOfLines={1}>
              {video.descriptionByCountry}
            </Text>
          ) : (
            <Text style={styles.itemDescriptionText} numberOfLines={2}>
              {description || video.description?.[getLanguage()]}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.mainDescriptionText} numberOfLines={3}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mainDescriptionText: {
    color: Constants.TIER_COLORS.PIONEER,
    // fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Light,
    fontSize: 13,
    lineHeight: 24,
  },
  itemDescriptionText: {
    color: Constants.TIER_COLORS.PIONEER,
    // fontFamily: Constants.CUSTOM_FONTS.SCDREAM.LIGHT_3,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Light,
    fontSize: 10,
  },
  reviewTitle: {
    color: Constants.TIER_COLORS.PIONEER,
    // fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Medium,
  },
  reviewInfo: {
    color: Constants.TIER_COLORS.PIONEER,
    // fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
    fontSize: 9,
  },
  reviewSubTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sponsoredText: {
    color: Constants.TIER_COLORS.GIVER,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.BOLD_7,
    fontSize: 9,
  },
});
