import { default as React, useEffect, useRef, useState } from 'react';
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
import { Icon } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import Carousel from 'react-native-snap-carousel';
import Constants from '../../Constants';
import Strings, { getLanguage } from '../../Strings';
import { CommonButtonModal } from '../../Views/CommonButtonModal';

const width = Dimensions.get('window').width;

const EventModalCarousel = ({ navigation, eventBanner }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const carouselRef = useRef({});

  const [popupImages, setPopupImages] = useState([]);

  useEffect(() => {
    setPopupImages(
      eventBanner.filter(
        (banner) => banner.popupImageUri && banner.popupImageUri.ko && banner.popupImageUri.en,
      ),
    );
  }, [eventBanner]);

  return (
    <CommonButtonModal
      title={Strings.EVENTS}
      visible={isOpen}
      type={'full'}
      mode={'full-screen'}
      onCancel={() => {
        setIsOpen(false);
      }}
      // buttonArray={[
      //   {
      //     title: popupImage.buttonText,
      //     disabled: false,
      //     onPress: async () => {
      //       await Linking.openURL(popupImage.url);
      //       // navigation.navigate('Store');
      //       // setIsOpen(false);
      //     },
      //   },
      // ]}
      scrollEnable={false}
    >
      <View
        style={{
          marginBottom: 10,
          height: width,
        }}
      >
        <View style={styles.paginationContainer}>
          <Text style={{ ...styles.paginationTextContainer, color: Constants.TIER_COLORS.PIONEER }}>
            <Text>{bannerIndex + 1}</Text>
            <Text> / {popupImages.length}</Text>
          </Text>
        </View>
        <Carousel
          data={popupImages}
          renderItem={({ item }) => {
            return (
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
                      setIsOpen(false);
                    }
                  }}
                >
                  <FastImage
                    source={{ uri: item.popupImageUri[getLanguage()], cache: 'web' }}
                    style={styles.image}
                  />
                </TouchableNativeFeedback>
              </View>
            );
          }}
          sliderWidth={Dimensions.get('window').width}
          itemWidth={width}
          loop
          autoplay
          autoplayDelay={5000}
          autoplayInterval={5000}
          onSnapToItem={(index) => {
            // console.log(`Snapped to item ${index}`);
            setBannerIndex(index);
          }}
          snap
          nestedScrollEnabled
          ref={carouselRef}
          useExperimentalSnap={true}
          disableIntervalMomentum={true}
        />
      </View>
    </CommonButtonModal>
  );
};

const styles = StyleSheet.create({
  guideImageContainer: {
    flex: 1,
  },
  guideMessageContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 40,
    flex: 1,
    flexDirection: 'column',
  },
  guideTitle: {
    color: Constants.COLOR_MAIN,
    paddingHorizontal: 25,
    fontSize: 24,
    lineHeight: 33,
    marginBottom: 20,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  guideWapper: {
    marginHorizontal: 25,
    marginVertical: 5,
    flexDirection: 'row',
  },
  guideTextWapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 20,
  },
  guideMessage: {
    color: 'white',
    fontSize: 18,
    lineHeight: 26,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },

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
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    position: 'absolute',
    zIndex: 1,
    left: 10,
  },
  arrowRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
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

export default EventModalCarousel;
