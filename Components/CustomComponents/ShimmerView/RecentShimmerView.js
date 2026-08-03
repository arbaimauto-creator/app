import React from 'react';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Constants from '../../Constants';
import { horizontalScale, moderateScale } from '../../utils/scailing';
import Animated from 'react-native-reanimated';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const RecentShimmerView = () => {
  return (
    <>
      <View style={styles.hotShimmerHeader}>
        <ShimmerPlaceholder style={styles.headerTitleShimmer} />
        <ShimmerPlaceholder style={styles.headerFilterShimmer} />
      </View>
      <View style={styles.childViewShimmer}>
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          keyExtractor={(index) => index}
          data={[1, 2, 3, 4, 5, 6, 7, 8]} //3, 4, 5, 6, 7, 8, 9
          numColumns={2}
          renderItem={() => (
            <View style={styles.shimmerItemContainer2}>
              <ShimmerPlaceholder style={styles.videoItemShimmer} />
              <ShimmerPlaceholder style={styles.videoShimmerRate} />
              <View style={styles.raw}>
                <ShimmerPlaceholder style={styles.videoShimmerName} />
                <ShimmerPlaceholder style={styles.videoShimmerViews} />
              </View>
            </View>
          )}
          style={{ paddingStart: 5 }}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  homeRoundShimmer: {
    borderWidth: horizontalScale(2),
    borderColor: 'white',
    backgroundColor: '#292929',
    marginBottom: horizontalScale(10),
    width: moderateScale(62),
    height: moderateScale(62),
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotItemImageShimmer: {
    position: 'absolute',
    bottom: 42,
    backgroundColor: Constants.COLOR_MAIN,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 4,
    borderColor: Constants.COLOR_BACKGROUND_DARK,
    width: 70,
  },
  hotShimmerRate: {
    width: 70,
    marginTop: 28,
    borderRadius: 5,
  },

  hotShimmerName: {
    width: 50,
    marginTop: 5,
    borderRadius: 5,
  },
  profilePicBigest: {
    width: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH - 20,
    height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH - 20,
    borderRadius: 60,
  },
  hotShimmerHeader: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  headerTitleShimmer: {
    height: 20,
    width: '40%',
    borderRadius: 5,
  },
  headerFilterShimmer: {
    height: 20,
    width: '30%',
    borderRadius: 5,
  },
  childViewShimmer: {
    marginTop: 30,
    marginStart: 20,
  },
  shimmerItemContainer1: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    marginBottom: 15,
    marginEnd: 20,
  },
  shimmerItemContainer2: {
    marginBottom: horizontalScale(20),
    marginEnd: 10,
  },
  videoItemShimmer: {
    width: Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2,
    height: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT - 100,
    borderRadius: 10,
  },
  videoShimmerRate: {
    width: 100,
    marginTop: 20,
    borderRadius: 5,
  },
  videoShimmerName: {
    width: 70,
    height: 10,
    marginTop: 8,
    borderRadius: 5,
  },
  videoShimmerViews: {
    width: 30,
    height: 10,
    marginTop: 8,
    borderRadius: 5,
  },
});
export default RecentShimmerView;
