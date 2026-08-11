import React, { useEffect, useMemo, useState } from 'react';
import T from '../../Components/Constants/DesignTokens';
import { StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import VideoListItemView from '../../Components/VideoListItemView';
import Animated from 'react-native-reanimated';
import APIprovider from '../../Components/APIprovider';

function LinkedProductReviews({ context }) {
  const { video } = context.state;

  const [videoListOfLinkedProduct, setVideoListOfLinkedProduct] = useState([]);
  const [videoListOfLinkedProductCount, setVideoListOfLinkedProductCount] = useState([]);
  useEffect(() => {
    if (video.linkedProduct && video.linkedProduct.productId) {
      const productId = video.linkedProduct.productId?._id || video.linkedProduct.productId;
      APIprovider.getLinkedVideoListOfProduct(productId).then((linkedVideos) => {
        setVideoListOfLinkedProduct(linkedVideos.videoList);
        setVideoListOfLinkedProductCount(linkedVideos.entireCount);
      });
    }
  }, [video.linkedProduct]);

  const MemoizedLinkedProductReviews = useMemo(
    () => (
      <TouchableNativeFeedback
        onPress={() => {
          if (videoListOfLinkedProduct.length > 0) {
            context.props.navigation.push('VideoList', {
              listOf: Constants.VIDEO_LIST_LINKED_PRODUCT,
              productId: video.linkedProduct.productId?._id,
            });
          }
        }}
      >
        <View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              {Strings.REVIEWS_FOR_PRODUCT} {videoListOfLinkedProductCount}
            </Text>
            {videoListOfLinkedProductCount > 0 && (
              <FastImage
                style={styles.sectionTitleMoreIcon}
                source={require('../../Resources/img/iconRenewal/icCommonTitle20W.png')}
              />
            )}
          </View>
          <Animated.FlatList
            horizontal={true}
            data={videoListOfLinkedProduct}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <VideoListItemView
                navigation={context.props.navigation}
                data={item}
                style={{
                  marginRight: Constants.VIDEO_LIST_SPACING,
                  width: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
                  height: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT,
                }}
                type={'list_horizontal'}
                noProduct
                dataType={Constants.VIDEO_LIST_LINKED_PRODUCT}
                dataSortType={'recent'}
                dataList={videoListOfLinkedProduct}
              />
            )}
            keyExtractor={(item) => item.videoId}
            onRefresh={() => {}}
            onEndReached={({ distanceFromEnd }) => {
              if (
                distanceFromEnd > 0 &&
                videoListOfLinkedProduct.length >= 10 &&
                !context.state.linkedProductVideoListIsRefreshing
              ) {
                context.onLinkedProductVideoListEndReached();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshing={context.state.linkedProductVideoListIsRefreshing}
            style={{ paddingLeft: 20 }}
          />
        </View>
      </TouchableNativeFeedback>
    ),
    [
      context,
      video.linkedProduct.productId,
      videoListOfLinkedProduct,
      videoListOfLinkedProductCount,
    ],
  );

  if (videoListOfLinkedProduct && videoListOfLinkedProductCount) {
    return MemoizedLinkedProductReviews;
  }

  return null;
}

const styles = StyleSheet.create({
  sectionTitleContainer: {
    marginTop: 34,
    marginLeft: 20,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: T.COLORS.INK,
    marginRight: 6,
  },
  sectionTitleMoreIcon: {
    width: 12,
    height: 20,
  },
});

export default LinkedProductReviews;
