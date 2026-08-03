import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Carousel from 'react-native-snap-carousel';
import Constants from '../../Constants';
import { getLanguage } from '../../Strings';
import { LogoutAlert, isGuestUser } from '../../utils';
import { Icon } from 'react-native-elements';

const width = Dimensions.get('window').width;

export default function StoreBanner({ navigation, props, eventBanner, setIndex }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const carouselRef = useRef({});

  return (
    <View
      style={{
        marginBottom: 10,
        height: width,
      }}
    >
      <View style={styles.paginationContainer}>
        <Text style={{ ...styles.paginationTextContainer, color: Constants.TIER_COLORS.PIONEER }}>
          <Text>{bannerIndex + 1}</Text>
          <Text> / {eventBanner.length}</Text>
        </Text>
      </View>
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

                if (isGuestUser(props.route.params.logonUserId)) {
                  if (item.productId) {
                    props.route.path = `products/${item.productId}`;
                  }
                  return LogoutAlert(props);
                }

                if (item.page) {
                  setIndex(1);
                }

                if (item.productId) {
                  navigation.navigate('ProductPage', { productId: item.productId });
                }
              }}
            >
              <FastImage source={{ uri: item[getLanguage()] }} style={styles.image} />
            </TouchableNativeFeedback>
          </View>
        )}
        sliderWidth={Dimensions.get('window').width}
        itemWidth={width}
        loop
        autoplay
        autoplayDelay={3000}
        autoplayInterval={3000}
        onSnapToItem={(index) => {
          // console.log(`Snapped to item ${index}`);
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
  carousel: {
    flex: 1,
    backgroundColor: 'grey',
  },
  image: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'absolute',
    zIndex: 1,
    top: Dimensions.get('window').height * 0.23,
    left: 10,
  },
  arrowRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'absolute',
    zIndex: 1,
    top: Dimensions.get('window').height * 0.23,
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
