import React, { useRef, useState } from 'react';
import { Dimensions, Linking, StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import Carousel from 'react-native-snap-carousel';
import Constants from '../../Constants';
import Strings, { getLanguage } from '../../Strings';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const width = Dimensions.get('window').width; // - horizontalScale(40);

export default function MainBanner({ navigation, eventBanner }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const carouselRef = useRef({});

  if (!eventBanner) {
    return (
      <ShimmerPlaceholder
        style={{
          ...styles.container,
          backgroundColor: Constants.TIER_COLORS.EXPLORER,
          width,
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TouchableNativeFeedback onPress={() => navigation.navigate('NoticeList', { eventBanner })}>
        <View style={styles.paginationContainer}>
          <Text style={{ ...styles.paginationTextContainer, color: Constants.TIER_COLORS.PIONEER }}>
            <Text>{bannerIndex + 1}</Text>
            <Text> / {eventBanner.length}</Text>
            <Text>
              {'  '}
              {Strings.ALL} {'>'}
            </Text>
          </Text>
        </View>
      </TouchableNativeFeedback>
      <Carousel
        data={eventBanner}
        renderItem={({ item }) => (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <TouchableNativeFeedback
              onPress={() => {
                if (bannerIndex < 1) {
                  carouselRef.current.snapToItem(eventBanner.length - 1);
                  setBannerIndex(eventBanner.length - 1);
                  return;
                }

                carouselRef.current.snapToItem(bannerIndex - 1);
                setBannerIndex(bannerIndex - 1);
              }}
            >
              <View style={styles.leftSwipeButton} />
            </TouchableNativeFeedback>

            <TouchableNativeFeedback
              onPress={() => {
                if (bannerIndex >= eventBanner.length - 1) {
                  carouselRef.current.snapToItem(0);
                  setBannerIndex(0);
                  return;
                }

                carouselRef.current.snapToItem(bannerIndex + 1);
                setBannerIndex(bannerIndex + 1);
              }}
            >
              <View style={styles.rightSwipeButton} />
            </TouchableNativeFeedback>

            <TouchableNativeFeedback
              onPress={() => {
                if (item.guideLink) {
                  return Linking.openURL(item.guideLink);
                }

                if (item.imageUri) {
                  navigation.navigate('NoticeDetail', {
                    title: item.title[getLanguage()],
                    description: item.description[getLanguage()],
                    shortImageUri: item[getLanguage()],
                    imageUri: item.imageUri[getLanguage()],
                    navigationParams: item.navigationParams,
                    eventUrl: item.eventUrl,
                    imageRatio: item.imageRatio,
                  });
                }
              }}
            >
              <FastImage source={{ uri: item[getLanguage()], cache: 'web' }} style={styles.image} />
            </TouchableNativeFeedback>
          </View>
        )}
        sliderWidth={Dimensions.get('window').width}
        itemWidth={Dimensions.get('window').width}
        loop
        autoplay
        autoplayDelay={5000}
        autoplayInterval={5000}
        onSnapToItem={(index) => {
          setBannerIndex(index);
        }}
        snap
        nestedScrollEnabled
        ref={carouselRef}
        layout={'tinder'}
        useExperimentalSnap={true}
        disableIntervalMomentum={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginTop: 15,
    marginBottom: 10,
    height: width * 0.5,
  },
  carousel: {
    flex: 1,
    backgroundColor: 'grey',
  },
  image: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
    // borderRadius: 9,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,.6)',
    zIndex: 1,
    borderRadius: 14,
  },
  paginationTextContainer: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    fontSize: 10,
  },
  arrowLeft: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'absolute',
    zIndex: 1,
    left: 10,
  },
  arrowRight: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'absolute',
    zIndex: 1,
    right: 10,
  },
  leftSwipeButton: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'transparent',
    height: '100%',
    width: 50,
    left: 0,
  },
  rightSwipeButton: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'transparent',
    height: '100%',
    width: 50,
    right: 0,
  },
});
