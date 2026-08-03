import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import React, { useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flag } from 'react-native-country-picker-modal';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import { Context } from '../../../Contexts';
import APIprovider from '../../APIprovider';
import Constants from '../../Constants';
import utils, { getKRWPerUSD } from '../../utils';
import MainBanner from '../EventBanner/MainBanner';
import Strings, { getLanguage } from '../../Strings';
import { nationalities } from '../../Strings/nationalities';

export default function CuratedKProducts() {
  const global = useContext(Context);
  const navigation = useNavigation();
  const [curatedKProducts, setCuratedKProducts] = useState([]);
  const [countryCode, setCountryCode] = useState('en');
  const [banner, setBanner] = useState([]);
  const [KRWPerUSD, setKRWPerUSD] = useState(1300);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { width } = Dimensions.get('window');

  async function fetchData() {
    setIsRefreshing(true);
    const response = await APIprovider.getGlobalGroupBuyings();

    if (response.success) {
      setCuratedKProducts(response.globalGroupBuyings);
      setCountryCode(response.countryCode);
      setBanner([response.banner]);

      const currency = await getKRWPerUSD();
      setKRWPerUSD(currency);
    }

    setIsRefreshing(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (curatedKProducts.length > 0) {
    return (
      <Animated.FlatList
        refreshControl={
          <RefreshControl
            tintColor={Constants.TIER_COLORS.ARTISAN}
            refreshing={isRefreshing}
            onRefresh={() => {
              fetchData();
            }}
          />
        }
        ListHeaderComponent={
          <>
            <MainBanner navigation={navigation} eventBanner={banner} />
            <View style={{ flex: 1, marginHorizontal: 20 }}>
              {curatedKProducts.map((curatedKProduct) => {
                const shipTo =
                  Object.keys(nationalities).find(
                    (code) => code === curatedKProduct.globalGroupBuyingShipTo,
                  ) || 'US';

                return (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('VideoPage', { videoId: curatedKProduct._id });
                    }}
                    style={{
                      shadowColor: '#4d4d4d',
                      shadowOffset: {
                        width: 2,
                        height: 2,
                      },
                      shadowOpacity: 0.5,
                      shadowRadius: 2,
                    }}
                    key={curatedKProduct._id}
                    disabled={dayjs(curatedKProduct.globalGroupBuyingEndDate).isBefore(dayjs())}
                  >
                    <Shadow distance={2} startColor="#a0a0a0" offset={[4, 4]}>
                      <ImageBackground
                        source={require('../../../Resources/img/iconRenewal/ck_libbon6.png')}
                        style={{
                          backgroundColor: dayjs(curatedKProduct.globalGroupBuyingEndDate).isBefore(
                            dayjs(),
                          )
                            ? 'rgba(255, 255, 255, 0.8)'
                            : '#FFEDCB',
                          borderRadius: 14,
                          marginBottom: 10,
                          width: width - 40,
                          height: (width - 40) / 1.74,
                        }}
                      >
                        {dayjs(curatedKProduct.globalGroupBuyingEndDate).isBefore(dayjs()) ? (
                          <View
                            style={{
                              zIndex: 1,
                              height: '100%',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.ExtraBold,
                                fontSize: 24,
                                color: 'red',
                              }}
                            >
                              Expired
                            </Text>
                          </View>
                        ) : null}

                        <View
                          style={{
                            position: 'absolute',
                            left: 45,
                            bottom: 15,
                            opacity: dayjs(curatedKProduct.globalGroupBuyingEndDate).isBefore(
                              dayjs(),
                            )
                              ? 0.2
                              : 1,
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Medium,
                                fontSize: 16,
                                bottom: 10,
                                width: width - 100,
                              }}
                              numberOfLines={1}
                            >
                              {curatedKProduct.linkedProduct.title[countryCode || 'en']}
                            </Text>

                            <View style={{ flexDirection: 'row' }}>
                              <FastImage
                                style={{
                                  marginRight: 10,
                                  width: 125,
                                  height: 125,
                                  borderRadius: 10,
                                }}
                                source={{
                                  uri: curatedKProduct.linkedProduct.thumbnailUrl,
                                }}
                              />
                              <View style={{ flexDirection: 'column' }}>
                                {/* period - ship to */}
                                <View style={{ flexDirection: 'column', marginTop: 0 }}>
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.SemiBold,
                                      color: 'black',
                                    }}
                                  >
                                    {dayjs(curatedKProduct.globalGroupBuyingStartDate).format(
                                      'YYYY.MM.DD',
                                    )}{' '}
                                    -{' '}
                                    {dayjs(curatedKProduct.globalGroupBuyingEndDate).format(
                                      'MM.DD',
                                    )}
                                  </Text>
                                  <View style={{ flexDirection: 'row' }}>
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.SemiBold,
                                        color: Constants.TIER_COLORS.OPERATOR,
                                      }}
                                    >
                                      Ship To: {nationalities[shipTo][getLanguage()]}
                                    </Text>
                                    <View style={{ marginLeft: -6, bottom: -1 }}>
                                      <Flag countryCode={shipTo} flagSize={10} />
                                    </View>
                                  </View>
                                </View>

                                <View style={{ flexDirection: 'column' }}>
                                  {/* price - discount */}
                                  {curatedKProduct.linkedProduct.productId.discountRate &&
                                  curatedKProduct.linkedProduct.productId.discountPrice ? (
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
                                        color: Constants.TIER_COLORS.ARTISAN,
                                        textDecorationLine: 'line-through',
                                      }}
                                    >
                                      {utils.displayPrice(
                                        curatedKProduct.linkedProduct.productId.price,
                                        global.state.region,
                                        KRWPerUSD,
                                      )}
                                    </Text>
                                  ) : (
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Regular,
                                        color: Constants.TIER_COLORS.ARTISAN,
                                        textDecorationLine: 'line-through',
                                      }}
                                    />
                                  )}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'flex-end',
                                    }}
                                  >
                                    {curatedKProduct.linkedProduct.productId.discountRate &&
                                    curatedKProduct.linkedProduct.productId.discountPrice ? (
                                      <View
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                        }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 18,
                                            fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
                                            color: 'red',
                                          }}
                                        >
                                          {(
                                            curatedKProduct.linkedProduct.productId.discountRate *
                                            100
                                          ).toFixed(0)}
                                          %
                                        </Text>
                                      </View>
                                    ) : null}
                                    <Text
                                      style={{
                                        marginLeft:
                                          curatedKProduct.linkedProduct.productId.discountRate &&
                                          curatedKProduct.linkedProduct.productId.discountPrice
                                            ? 5
                                            : 0,
                                        fontSize: 18,
                                        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
                                      }}
                                    >
                                      {utils.displayPrice(
                                        curatedKProduct.linkedProduct.productId.discountPrice ||
                                          curatedKProduct.linkedProduct.productId.price,
                                        global.state.region,
                                        KRWPerUSD,
                                      )}
                                    </Text>
                                  </View>
                                </View>

                                {/* stock - delivery */}
                                <View style={{ position: 'absolute', bottom: 0 }}>
                                  {curatedKProduct.linkedProduct.productId.availableNumberToSale >
                                  0 ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text
                                        style={{
                                          fontSize: 11,
                                          fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.regular,
                                        }}
                                      >
                                        In Stock :{' '}
                                      </Text>
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
                                        }}
                                      >
                                        {
                                          curatedKProduct.linkedProduct.productId
                                            .availableNumberToSale
                                        }
                                      </Text>
                                    </View>
                                  ) : null}
                                  <View style={{ flexDirection: 'row' }}>
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.regular,
                                      }}
                                    >
                                      Delivery :{' '}
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 12,
                                        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
                                      }}
                                    >
                                      1 wk
                                    </Text>
                                  </View>
                                  <View style={{ flexDirection: 'row' }}>
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
                                        color: Constants.TIER_COLORS.ARTISAN,
                                      }}
                                    >
                                      {curatedKProduct.author.name}
                                    </Text>

                                    <FastImage
                                      style={{ width: 14, height: 14 }}
                                      source={
                                        Constants.TIER_ICONS[
                                          utils.getTierNameByClass(curatedKProduct.author.class)
                                        ]
                                      }
                                    />
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* reviewer profile */}
                          <View style={{ position: 'absolute', bottom: 15, right: 15 }}>
                            <FastImage
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                              }}
                              source={{
                                uri: curatedKProduct.author.profilePicUrl || Constants.NO_USER_URL,
                              }}
                            />
                          </View>
                        </View>
                      </ImageBackground>
                    </Shadow>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
      />
    );
  }

  // Replace the current return null with:
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text
        style={{
          fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Medium,
          fontSize: 16,
          color: Constants.TIER_COLORS.ARTISAN,
          textAlign: 'center',
        }}
      >
        {Strings.NO_CURATED_PRODUCTS_AVAILABLE || 'No curated products available at this time.'}
      </Text>
    </View>
  );
}
