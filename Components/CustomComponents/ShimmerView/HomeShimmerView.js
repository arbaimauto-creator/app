import React from 'react';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Constants from '../../Constants';
import { horizontalScale, moderateScale, verticalScale } from '../../utils/scailing';
import Strings from '../../Strings';
import Animated from 'react-native-reanimated';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const HomeShimmerView = () => {
  return (
    <>
      {/* <View style={{ flexDirection: 'row', marginStart: 20, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginEnd: 20 }}>
            <ShimmerPlaceholder style={styles.homeRoundShimmer} />
            <ShimmerPlaceholder
              style={{
                alignItems: 'center',
                width: horizontalScale(60),
                borderRadius: 5,
              }}
            />
          </View>
        ))}
      </View> */}
      <ShimmerPlaceholder
        style={{
          height: 30,
          marginTop: 0,
          marginStart: 30,
        }}
      />
      <View style={styles.childViewShimmer}>
        <Animated.FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          keyExtractor={(index) => index}
          data={[1, 2, 3, 4, 5, 6]}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={() => (
            <View style={styles.shimmerItemContainer1}>
              <ShimmerPlaceholder style={styles.profilePicBigest} />
              <ShimmerPlaceholder style={styles.hotItemImageShimmer} />
              <ShimmerPlaceholder style={styles.hotShimmerRate} />
              <ShimmerPlaceholder style={styles.hotShimmerName} />
            </View>
          )}
        />
      </View>
      <View style={styles.moreButton}>
        <Text
          style={{
            fontSize: moderateScale(16),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            color: Constants.TIER_COLORS.ARTISAN,
          }}
        >
          {Strings.MORE}
        </Text>
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
    backgroundColor: Constants.COLOR_POINT_BLUE,
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
    width: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH - 30,
    height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH - 30,
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
    // marginStart: 20,
    marginHorizontal: 25,
  },
  shimmerItemContainer1: {
    alignItems: 'center',
    justifyContent: 'center',
    // width: 100,
    marginBottom: 15,
    // marginEnd: 20,
  },
  moreButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: verticalScale(45),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    marginTop: verticalScale(0),
    marginBottom: horizontalScale(30),
    marginHorizontal: horizontalScale(20),
  },
});
export default HomeShimmerView;
