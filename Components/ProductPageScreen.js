import { useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { FlagButton } from 'react-native-country-picker-modal';
import Preference from 'react-native-default-preference';
import { getDeviceId } from 'react-native-device-info';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { getBottomSpace, isIphoneX } from 'react-native-iphone-x-helper';
import LinearGradient from 'react-native-linear-gradient';
import Animated from 'react-native-reanimated';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { FlatGrid } from 'react-native-super-grid';
import IconFeather from 'react-native-vector-icons/Feather';
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { Context } from '../Contexts';
import UserProfilePicView from '../screens/UserPageScreen/UserProfilePicView';
import { setTotalRevenue, setTotalReward } from '../slices/user';
import APIprovider from './APIprovider';
import CommentListItemView from './CommentListItemView';
import Constants from './Constants';
import CustomRating from './CustomComponents/CustomRating';
import ModalMenuButton from './ModalMenuButton';
import ProductListItemView from './ProductListItemView';
import ReportModal from './ReportModal';
import Strings from './Strings';
import VideoListItemView from './VideoListItemView';
import { CheckBox, ImageModal } from './Views';
import { PricePrivate } from './Views/ProductItemVerticalView';
import Utils, { LogoutAlert, getIPhoneHeaderMarginTop, isGuestUser } from './utils';
import { shareLink } from './utils/share';
const { UIManager } = NativeModules;

dayjs.extend(isSameOrBefore);

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const MARGIN_HORIZONTAL = 40;

const MODE = {
  SELECT_TO_LINK: 'select_to_link',
};

function Header({ context }) {
  return (
    <View style={styles.headerBarContainer}>
      <ActionButton
        renderItem={
          <View>
          <FastImage
            style={styles.headerButton}
            source={require('../Resources/img/icCommonNaviPrev22W.png')}
          />
          </View>
        }
        onPress={() => {
          context.props.navigation.pop();
        }}
      />
      <HeaderRight context={context} />
    </View>
  );
}

function HeaderRight({ context }) {
  const { navigation } = context.props;
  return (
    <View style={styles.headerRightButtonContainer}>
      <ActionButton
        renderItem={
          // <IconAntDesign name="qrcode" color={Constants.TIER_COLORS.ARTISAN} size={22} />
          <FastImage
            style={styles.headerButton}
            source={require('../Resources/img/iconRenewal/white-qr.png')}
          />
        }
        onPress={() => {
          navigation.push('QRCode', {
            type: 'product',
            product: context.state.product,
          });
        }}
      />
      <View style={{ marginRight: 20 }} />
      <ActionButton
        renderItem={
          <FastImage
            style={styles.headerButton}
            source={require('../Resources/img/iconRenewal/white-cart.png')}
          />
        }
        onPress={() => {
          if (isGuestUser(context.props.route.params.logonUserId)) {
            return LogoutAlert(context.props);
          }
          navigation.push('Cart');
        }}
      />
      <View style={{ marginRight: 5 }} />
      <ModalMenuButton
        navigation={context.props.navigation}
        menu={context.isMyProduct() ? context.menuUploader : context.menuVisitor}
        style={{ marginLeft: 10 }}
        buttonView={
          <FastImage
            style={styles.headerButton}
            source={require('../Resources/img/iconRenewal/white-dots.png')}
          />
        }
        logonUserId={context.props.route.params.logonUserId}
      />
    </View>
  );
}

function ActionButton({ renderItem, onPress = () => {} }) {
  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={() => onPress()}
        background={TouchableNativeFeedback.Ripple('#777', true)}
      >
        <View style={styles.actionButtonContainer}>{renderItem}</View>
      </TouchableNativeFeedback>
    );
  } else {
    return (
      <TouchableOpacity
        onPress={() => onPress()}
        activeOpacity={0.7}
        style={styles.actionButtonContainer}
      >
        {renderItem}
      </TouchableOpacity>
    );
  }
}

function Ratings({ context }) {
  const { product } = context.state;
  return (
    <View style={styles.ratingContainer}>
      <CustomRating
        rated={product.ratingScore}
        totalCount={5}
        size={14}
        type="custom" // default is always to "icon"
        selectedIconImage={require('../Resources/img/iconRenewal/icBadgeStoreStarOn14_.png')}
        emptyIconImage={require('../Resources/img/iconRenewal/icBadgeStoreStarOff14.png')}
      />
      <Text style={styles.ratingScore}>
        {product.ratingScore + ' (' + product.ratingCount + ')'}
      </Text>
    </View>
  );
}

function Title({ context }) {
  const { product } = context.state;
  return (
    <View style={{ flex: 1, marginRight: 3 }}>
      <Text style={styles.title}>{product.title}</Text>
    </View>
  );
}

function BookmarkButton({ context }) {
  const { product } = context.state;
  const icBookmark = product.isBookmarked ? (
    <FastImage
      style={styles.headerButton}
      source={require('../Resources/img/iconRenewal/black-bookmark-on.png')}
    />
  ) : (
    <FastImage
      style={styles.headerButton}
      source={require('../Resources/img/iconRenewal/black-bookmark-off.png')}
    />
  );

  return (
    <View style={styles.bookmarkButtonContainer}>
      <ActionButton
        renderItem={icBookmark}
        onPress={() => {
          if (isGuestUser(context.props.route.params.logonUserId)) {
            return LogoutAlert(context.props);
          }
          context.setState({
            product: {
              ...product,
              isBookmarked: !product.isBookmarked,
            },
          });
          APIprovider.bookmarkProduct(product.productId, !product.isBookmarked)
            .then(context.bookmarkProductCallback.bind(context))
            .catch((err) => {
              Alert.alert(
                Strings.FAILED_TO_BOOKMARK,
                err.errorMsg ? err.errorMsg : '',
                [{ text: Strings.OK }],
                { cancelable: true },
              );
            });
        }}
      />
    </View>
  );
}

function Price({ context }) {
  const { product } = context.state;
  const global = useContext(Context);
  if (product.discountPrice > 0) {
    return (
      <View style={styles.priceContainer}>
        {isGuestUser(context.props.route.params.logonUserId) ? (
          <PricePrivate style={{ fontSize: 16 }} />
        ) : (
          <>
            <View style={styles.discountPriceContainer}>
              <Text style={styles.discountRate}>-{Utils.displayDiscountRate(product.discountRate)}%</Text>
              <Text style={styles.discountPrice}>
                {Utils.displayPrice(
                  product.discountPrice,
                  global.state.region,
                  context.props.route.params.KRWPerUSD,
                )}
              </Text>
            </View>
            <Text style={styles.originalPrice}>
              {Utils.displayPrice(
                product.price,
                global.state.region,
                context.props.route.params.KRWPerUSD,
              )}
            </Text>
          </>
        )}
      </View>
    );
  } else {
    return isGuestUser(context.props.route.params.logonUserId) ? (
      <PricePrivate style={{ fontSize: 16 }} />
    ) : (
      <Text style={styles.price}>
        {Utils.displayPrice(
          product.price,
          global.state.region,
          context.props.route.params.KRWPerUSD,
        )}
      </Text>
    );
  }
}

function LowestPriceLink({ context }) {
  const {
    product: { lowestPriceLink },
  } = context.state;

  return (
    <View style={styles.lowestPriceLinkContainer}>
      <TouchableNativeFeedback
        onPress={() => context.openLowestPriceLink(lowestPriceLink)}
        activeOpacity={0.9}
      >
        <View style={[styles.summaryTypeContainer, { height: 64 }]}>
          <View
            style={[
              styles.thumbnailSummaryType,
              {
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <IconFeather size={20} name="external-link" color="#999" />
          </View>
          <View style={styles.summaryInfoContainer}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '85%',
              }}
            >
              <Text style={styles.productTitle} numberOfLines={1}>
                {Strings.CHECK_LOWEST_PRICE}
              </Text>
            </View>
            <View>
              <Text style={styles.externalLink} numberOfLines={1}>
                {lowestPriceLink}
              </Text>
            </View>
          </View>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}
function Seller({ context }) {
  const { product } = context.state;
  return (
    <TouchableNativeFeedback
      onPress={() => {
        context.props.navigation.push('UserPage', {
          pageOwnerUserId: product.seller.userId,
          pageOwnerUserName: product.seller.name,
          pageOwnerUserProfilePicUrl: product.seller.profilePicUrl,
        });
      }}
    >
      <View style={styles.sellerContainer}>
        <UserProfilePicView
          style={styles.sellerProfilePic}
          source={{ uri: product.seller.profilePicUrl }}
        />
        <Text style={styles.sellerName}>{product.seller.name}</Text>
      </View>
    </TouchableNativeFeedback>
  );
}

function Description({ context }) {
  const { product } = context.state;
  return (
    <View>
      <Text style={styles.description}>{product.description}</Text>
    </View>
  );
}

function DescriptionImage({ img, index }) {
  const MAX_HEIGHT = 23500;
  const ZOOM_OUT_FACTOR = 1.001;

  if (!img.height) {
    return <View />;
  }

  const viewHeight = img.height > MAX_HEIGHT ? MAX_HEIGHT : img.height;

  if (Platform.OS === 'android') {
    return (
      <View
        key={`descriptionImage_${index}`}
        style={[styles.descriptionImageContainer, { height: viewHeight, overflow: 'hidden' }]}
      >
        <FastImage
          key={img.url + index}
          style={[
            styles.descriptionImage,
            {
              width: '100%',
              height:
                img.height > MAX_HEIGHT
                  ? MAX_HEIGHT * ZOOM_OUT_FACTOR
                  : img.height * ZOOM_OUT_FACTOR,
              resizeMode: FastImage.resizeMode.contain,
              position: 'absolute',
              top: img.height > MAX_HEIGHT ? -((img.height * ZOOM_OUT_FACTOR - viewHeight) / 2) : 0, // Center vertically
            },
          ]}
          source={{ uri: img.url }}
          onError={(err) => {
            console.log('FastImage error:', err);
          }}
        />
      </View>
    );
  } else {
    return (
      <Image
        key={img.url + index}
        style={[
          styles.descriptionImage,
          {
            height: img.height * ZOOM_OUT_FACTOR,
            width: '100%',
            resizeMode: 'contain',
          },
        ]}
        source={{ uri: img.url }}
        resizeMode={'contain'}
      />
    );
  }
}

function DescriptionImages({ context }) {
  const { descriptionImageList } = context.state.product;
  const imageWidth = Dimensions.get('window').width - 40;
  if (descriptionImageList && descriptionImageList.length > 0) {
    if (
      context.state.isCollapsedDescription === true &&
      (descriptionImageList.length > 1 || imageWidth < descriptionImageList[0].height)
    ) {
      return (
        <View style={{ flex: 1, marginVertical: 20 }}>
          <View>
            <ScrollView style={{ height: imageWidth, flex: 1 }} scrollEnabled={false}>
              <DescriptionImage index={0} img={descriptionImageList[0]} />
              {imageWidth > descriptionImageList[0].height && (
                <DescriptionImage index={1} img={descriptionImageList[1]} />
              )}
            </ScrollView>
            <LinearGradient
              colors={[
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0.9)',
              ]}
              locations={[0, 0.3, 0.8, 1]}
              pointerEvents="none"
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          </View>
          <DescriptionButton context={context} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, marginVertical: 20 }}>
        {descriptionImageList &&
          descriptionImageList.map((img, i) => {
            return <DescriptionImage index={i} img={img} key={img.url + '_' + i} />;
          })}
      </View>
    );
  } else {
    return <View />;
  }
}

function ExchangeReturn({ context }) {
  const { product } = context.state;
  return (
    <View>
      <TouchableNativeFeedback
        onPress={() => {
          context.setState({
            isExchangeReturnExpanded: !context.state.isExchangeReturnExpanded,
          });
        }}
      >
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{Strings.EXCHANGE_AND_RETURN}</Text>
          {context.state.isExchangeReturnExpanded ? (
            <FastImage
              style={styles.sectionTitleFoldIcon}
              source={require('../Resources/img/iconRenewal/icSortUp22.png')}
            />
          ) : (
            <FastImage
              style={styles.sectionTitleFoldIcon}
              source={require('../Resources/img/iconRenewal/icSortDown22.png')}
            />
          )}
        </View>
      </TouchableNativeFeedback>
      {context.state.isExchangeReturnExpanded && (
        <View>
          <View style={styles.subSectionContainer}>
            <Text style={styles.subSectionTitle}>{Strings.EXCHANGE_RETURN_NOT_AVAILABLE}</Text>
          </View>
        </View>
      )}
      {false && context.state.isExchangeReturnExpanded && (
        <View>
          <View style={styles.subSectionContainer}>
            <Text style={styles.subSectionTitle}>{Strings.EXCHANGE_AND_RETURN_PERIOD}</Text>
            <Text style={styles.exchangeReturnDescription}>
              {Strings.EXCHANGE_AND_RETURN_PERIOD_DESCRIPTION}
            </Text>
          </View>
          <View style={styles.subSectionContainer}>
            <Text style={styles.subSectionTitle}>{Strings.HOW_TO_EXCHANGE_AND_RETURN}</Text>
            <Text style={styles.exchangeReturnDescription}>
              {Strings.HOW_TO_EXCHANGE_AND_RETURN_DESCRIPTION}
            </Text>
          </View>
          <View style={styles.subSectionContainer}>
            <Text style={styles.subSectionTitle}>{Strings.EXCHANGE_AND_RETURN_SHIPMENT_FEE}</Text>
            <Text style={styles.exchangeReturnDescription}>
              {Strings.EXCHANGE_AND_RETURN_SHIPMENT_FEE_DESCRIPTION}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Comments({ context }) {
  const { product } = context.state;
  return (
    <View>
      <TouchableNativeFeedback
        onPress={() => {
          context.setState({
            isCommentExpanded: !context.state.isCommentExpanded,
          });
          context.loadCommentList();
        }}
      >
        <View style={styles.sectionTitleContainer}>
          <QuestionToSellerButton context={context} />
        </View>
      </TouchableNativeFeedback>

      <TouchableWithoutFeedback
        onPress={() => {
          if (isGuestUser(context.props.route.params.logonUserId)) {
            return LogoutAlert(context.props);
          }
          context.setState({ isShowingCommentInput: true });
          context.commentInput.focus();
        }}
      >
        <View style={styles.addCommentButtonContainer}>
          <FastImage
            style={styles.userProfilePic}
            source={{ uri: context.state.logonUserProfilePicUrl }}
          />
          <Text
            style={{
              flex: 1,
              marginRight: 4,
              color: Constants.TIER_COLORS.ARTISAN,
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            }}
          >
            {product.seller.userId === APIprovider.requesterId
              ? Strings.REPLAY
              : Strings.ASK_A_QUESTION}
          </Text>
        </View>
      </TouchableWithoutFeedback>

      {context.state.isCommentExpanded && (
        <View style={styles.commentContainer}>
          <Animated.FlatList
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            data={product.commentList}
            renderItem={({ item }) => (
              <CommentListItemView
                type={'product'}
                navigation={context.props.navigation}
                data={item}
                theme={'dark'}
                onItemDeleteRequested={context.onCommentDeleteRequested.bind(context)}
              />
            )}
            keyExtractor={(item) => item.no}
          />

          {product.commentList.length < product.commentCount && (
            <Button
              title={<IconFeather size={18} name="more-vertical" color="#666" />}
              type="clear"
              titleStyle={{ color: '#666' }}
              containerStyle={{ paddingBottom: 10 }}
              onPress={context.loadCommentList.bind(context)}
            />
          )}
        </View>
      )}
    </View>
  );
}

function LinkedReviews({ context }) {
  const { product } = context.state;
  return (
    <View>
      <TouchableNativeFeedback
        onPress={() => {
          if (product.linkedVideoCount > 0) {
            context.props.navigation.push('VideoList', {
              listOf: Constants.VIDEO_LIST_LINKED_PRODUCT,
              productId: product.productId,
            });
          }
        }}
      >
        <View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              {Strings.LINKED_REVIEWS}{' '}
              {product.linkedVideoCount > 0 ? product.linkedVideoCount : ''}
            </Text>
            {product.linkedVideoCount > 0 && (
              <FastImage
                style={styles.sectionTitleMoreIcon}
                source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
              />
            )}
          </View>
          {product.linkedVideoList && product.linkedVideoList.length > 0 && (
            <FlatGrid
              horizontal={true}
              itemDimension={Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT}
              spacing={Constants.VIDEO_LIST_SPACING}
              data={product.linkedVideoList}
              renderItem={({ item, index }) => (
                <VideoListItemView
                  navigation={context.props.navigation}
                  data={item}
                  style={{
                    width: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
                  }}
                  type={'list_horizontal'}
                  noProduct
                  dataType={Constants.VIDEO_LIST_LINKED_PRODUCT}
                  dataSortType={'recent'}
                  dataList={product.linkedVideoList}
                />
              )}
              keyExtractor={(item) => 'linkedReview' + item._id}
              onRefresh={() => {}}
              onEndReached={({ distanceFromEnd }) => {
                if (
                  distanceFromEnd > 0 &&
                  product.linkedVideoList.length >= 10 &&
                  !context.state.linkedVideoListIsRefreshing
                ) {
                  context.onLinkedVideoListEndReached();
                }
              }}
              onEndReachedThreshold={0.5}
              refreshing={context.state.linkedVideoListIsRefreshing}
              style={{
                height: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT - 50,
                paddingLeft: 20,
              }}
            />
          )}
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

function SellerProducts({ context }) {
  const { product } = context.state;
  const {
    params: { logonUserId },
  } = useRoute();

  return (
    <View>
      <TouchableNativeFeedback
        onPress={() => {
          if (product.sellerOtherProductList.productList?.length > 0) {
            context.props.navigation.push('ProductList', {
              listOf: Constants.PRODUCT_LIST_OF_SELLER,
              sellerId: product.seller.userId,
              sellerName: product.seller.name,
              productList: product.sellerOtherProductList.productList,
            });
          }
        }}
      >
        <View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              {Strings.MORE_BY(product.seller.name)} {product.sellerOtherProductCount}
            </Text>
            {product.sellerOtherProductList.productList &&
              product.sellerOtherProductList.productList.length > 0 && (
                <FastImage
                  style={styles.sectionTitleMoreIcon}
                  source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
                />
              )}
          </View>
          {product.sellerOtherProductList.productList &&
            product.sellerOtherProductList.productList.length > 0 && (
              <FlatGrid
                horizontal={true}
                itemDimension={Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT}
                spacing={Constants.PRODUCT_LIST_SPACING}
                data={product.sellerOtherProductList.productList}
                renderItem={({ item, index }) => (
                  <ProductListItemView
                    navigation={context.props.navigation}
                    data={item}
                    style={{
                      width: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
                      height: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT,
                      paddingLeft: index === 0 ? 10 : 0,
                    }}
                    type={'list_horizontal'}
                    logonUserId={logonUserId}
                  />
                )}
                keyExtractor={(item) => 'sellers' + '_' + item.productId}
                //                      onRefresh={() => {}}
                onEndReached={({ distanceFromEnd }) => {
                  if (
                    distanceFromEnd >= 0 &&
                    product.sellerOtherProductList.productList.length >= 10 &&
                    !context.state.otherProductListIsRefreshing
                  ) {
                    context.onOtherProductListEndReached();
                  }
                }}
                onEndReachedThreshold={0.5}
                refreshing={context.state.otherProductListIsRefreshing}
                style={{
                  height: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT + 10,
                }}
              />
            )}
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

function RelatedProducts({ context }) {
  const { product } = context.state;
  const {
    params: { logonUserId },
  } = useRoute();

  return (
    <View>
      <TouchableNativeFeedback
        onPress={() => {
          if (product.relatedOtherProductList.productList?.length > 0) {
            context.props.navigation.push('ProductList', {
              listOf: Constants.PRODUCT_LIST_RELATED_TO_PRODUCT,
              productId: product.productId,
              productList: product.relatedOtherProductList.productList,
            });
          }
        }}
      >
        <View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{Strings.YOU_MAY_ALSO_LIKE}</Text>
            {product.relatedOtherProductList.productList &&
              product.relatedOtherProductList.productList.length > 0 && (
                <FastImage
                  style={styles.sectionTitleMoreIcon}
                  source={require('../Resources/img/iconRenewal/icCommonTitle20W.png')}
                />
              )}
          </View>
          {product.relatedOtherProductList.productList &&
            product.relatedOtherProductList.productList.length > 0 && (
              <FlatGrid
                horizontal={true}
                itemDimension={Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT}
                spacing={Constants.PRODUCT_LIST_SPACING}
                data={product.relatedOtherProductList.productList}
                renderItem={({ item, index }) => (
                  <ProductListItemView
                    navigation={context.props.navigation}
                    data={item}
                    style={{
                      width: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
                      height: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT,
                      paddingLeft: index === 0 ? 10 : 0,
                    }}
                    type={'list_horizontal'}
                    logonUserId={logonUserId}
                  />
                )}
                keyExtractor={(item) => 'sellers' + '_' + item.productId}
                //                      onRefresh={() => {}}
                onEndReached={({ distanceFromEnd }) => {
                  if (
                    distanceFromEnd >= 0 &&
                    product.relatedOtherProductList.productList.length >= 10 &&
                    !context.state.relatedProductListIsRefreshing
                  ) {
                    context.onRelatedProductListEndReached();
                  }
                }}
                onEndReachedThreshold={0.5}
                refreshing={context.state.relatedProductListIsRefreshing}
                style={{
                  height: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT + 10,
                }}
              />
            )}
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

function QuestionToSellerButton({ context }) {
  const { product } = context.state;

  return (
    <Button
      containerStyle={{ ...styles.bottomButtonGroupButton, width: '100%' }}
      buttonStyle={{
        backgroundColor: Constants.COLOR_POINT_BLUE,
        height: 45,
      }}
      titleStyle={{
        color: Constants.COLOR_BACKGROUND_DARK,
        fontSize: 18,
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
      }}
      title={`${Strings.QUESTION_TO_SELLER}  ${product.commentCount}`}
      onPress={() => {
        if (isGuestUser(context.props.route.params.logonUserId)) {
          return LogoutAlert(context.props);
        }
        context.setState({ isCommentExpanded: !context.state.isCommentExpanded });
        context.loadCommentList();
      }}
    />
  );
}

function PurchaseButton({ context }) {
  const { product } = context.state;
  return (
    <Button
      containerStyle={styles.bottomButtonGroupButton}
      buttonStyle={{
        backgroundColor:
          product.isAvailableToSale === false ||
          product.availableNumberToSale === 0 ||
          product.isRefundProductAlreadyBuy
            ? '#999'
            : Constants.COLOR_POINT_BLUE,
        height: 45,
      }}
      titleStyle={{
        color: Constants.COLOR_BACKGROUND_DARK,
        fontSize: 18,
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
      }}
      title={context.state.buyButtonPhrase}
      onPress={() => {
        if (isGuestUser(context.props.route.params.logonUserId)) {
          return LogoutAlert(context.props);
        }
        if (
          product.isAvailableToSale === false ||
          product.availableNumberToSale === 0 ||
          product.isRefundProductAlreadyBuy
        ) {
          if (product.isRefundProductAlreadyBuy) {
            Alert.alert(
              '이미 구매했던 이력이 있는 상품입니다.',
              '환불 프로모션 제품은 1회만 구매 가능합니다.',
              [{ text: Strings.OK }],
              {
                cancelable: true,
              },
            );
            return;
          }

          Alert.alert(Strings.NOT_AVAILABLE_PRODUCT_TO_SALE, '', [{ text: Strings.OK }], {
            cancelable: true,
          });
          return;
        }
        LayoutAnimation.easeInEaseOut();
        context.setState({ isShowPurchaseUI: true });
      }}
    />
  );
}

function ReviewButton({ context }) {
  const { product } = context.state;
  return (
    <Button
      containerStyle={styles.bottomButtonGroupButton}
      buttonStyle={{
        backgroundColor: Constants.COLOR_GREY,
        height: 45,
      }}
      titleStyle={{
        color: Constants.TIER_COLORS.ARTISAN,
        fontSize: 18,
        fontWeight: 'bold',
      }}
      title={Strings.MAKE_REVIEW}
      onPress={() => {
        if (isGuestUser(context.props.route.params.logonUserId)) {
          return LogoutAlert(context.props);
        }
        context.props.navigation.navigate('AddingNewVideo', {
          linkedProduct: product,
        });
      }}
    />
  );
}

function SelectToLinkButton({ context }) {
  const { product } = context.state;
  return (
    <Button
      containerStyle={styles.bottomButtonContainer}
      buttonStyle={{
        backgroundColor: Constants.COLOR_POINT_BLUE,
        height: 54,
      }}
      titleStyle={styles.bottomButtonTitle}
      title={Strings.LINK_THIS_PRODUCT}
      onPress={() => {
        context.props.route.params.onSelectedToLink(product);
        context.props.navigation.pop();
      }}
    />
  );
}

function DescriptionButton({ context }) {
  return (
    <Pressable
      style={{
        backgroundColor: Constants.TIER_COLORS.PIONEER,
        height: 45,
        marginVertical: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
      }}
      onPress={() => {
        context.setState({ isCollapsedDescription: false });
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            color: Constants.TIER_COLORS.ARTISAN,
            fontSize: 18,
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          }}
        >
          {Strings.MORE_PRODUCT_INFORMATION}
        </Text>
        <FastImage source={require('../Resources/img/iconRenewal/icSortDown22.png')} />
      </View>
    </Pressable>
  );
}

function PurchasePopup({ context }) {
  const { product } = context.state;
  const global = useContext(Context);
  const dispatch = useDispatch();

  const handlePressBuy = () => {
    APIprovider.newCartItem(
      product.productId,
      context.state.buyNumber,
      product.options,
      context.state.reviewerVideoId,
      Constants.CART_FROM.BUY,
    )
      .then((result) => {
        if (result) {
          context.setState({ isShowPurchaseUI: false });
          result.product = context.state.product;
          const totalPrice = result.product.shipmentCost + context.getPriceToPay();

          context.props.navigation.navigate('MakeOrder', {
            cartItems: [result],
            totalPrice: totalPrice,
            shipmentCost: result.product.shipmentCost,

            shipmentCostUS: result.product.shipmentCostUS,
            lowestOrderPriceForFreeDeliveryKR: result.product.lowestOrderPriceForFreeDeliveryKR,
            lowestOrderPriceForFreeDeliveryUS: result.product.lowestOrderPriceForFreeDeliveryUS,
            productId: result.product.productId,
            fetchData: async () => {
              context.loadData();
              (context.props.fetchData || context.props.route.params.fetchData)();

              const getTotalReward = await APIprovider.getUserTotalReward(
                context.props.route.params.logonUserId,
              );
              if (getTotalReward.success) {
                dispatch(setTotalReward({ totalReward: getTotalReward.totalReward }));
                dispatch(setTotalRevenue({ totalRevenue: getTotalReward.totalRevenue }));
              }

              // APIprovider.addBuyerToProduct({
              //   userId: context.props.route.params.logonUserId,
              //   productId: result.product.productId,
              // });
            },
            categoryCode: result.product.categoryCode,
          });
        }
      })
      .catch((err) => {
        Alert.alert(
          'Failed to make order',
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  };

  return (
    <View
      style={[
        styles.purchasePopupContainer,
        {
          bottom: context.state.isShowPurchaseUI ? 0 : -Dimensions.get('window').height,
        },
      ]}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          LayoutAnimation.easeInEaseOut();
          context.setState({ isShowPurchaseUI: false });
        }}
      >
        <View style={{ flex: 1 }} />
      </TouchableWithoutFeedback>
      <View style={styles.divider} />
      <View style={styles.purchasePopupModalContainer}>
        <View style={styles.purchasePopupModalHeaderContainer}>
          <Text style={styles.purchasePopupModalHeaderTitle}>{Strings.CHOOSE_PRODUCT}</Text>
          <TouchableWithoutFeedback
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              context.setState({ isShowPurchaseUI: false });
            }}
          >
            <FastImage
              source={require('../Resources/img/iconRenewal/icHeaderClose22.png')}
              style={styles.closeIcon}
            />
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.productNumberContainer}>
          <View>
            <Text style={styles.purchasePopupModalfieldTitle}>
              <Text>{Strings.NUMBER_PRODUCTS}</Text>
              {product.availableNumberToSale !== -1 && (
                <Text
                  style={{
                    fontSize: 13,
                    color: Constants.COLOR_RED,
                  }}
                >{` (${Strings.REMAINING_QUANTITY(product.availableNumberToSale)})`}</Text>
              )}
            </Text>
            <Text style={styles.delieverElapsedDay}>{Strings.DELIVER_ELAPSED_DAY(3)}</Text>
          </View>
          <View style={styles.numberControllerContainer}>
            <Button
              containerStyle={{
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0,
              }}
              buttonStyle={{
                paddingVertical: 0,
                paddingHorizontal: 10,
                height: 30,
                borderWidth: 0,
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0,
              }}
              titleStyle={{ color: Constants.TIER_COLORS.ARTISAN }}
              type={'outline'}
              icon={
                <FastImage
                  source={require('../Resources/img/iconRenewal/black-minus.png')}
                  style={styles.plusMinusIcon}
                />
              }
              onPress={() => {
                const newNumber = context.state.buyNumber - 1;
                if (newNumber === 0) {
                  return;
                }
                context.setState({ buyNumber: newNumber });
              }}
            />
            <View
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                height: 30,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: Constants.TIER_COLORS.ARTISAN, fontSize: 13 }}>
                {context.state.buyNumber}
              </Text>
            </View>
            <Button
              containerStyle={{
                borderBottomLeftRadius: 0,
                borderTopLeftRadius: 0,
              }}
              buttonStyle={{
                paddingVertical: 0,
                paddingHorizontal: 10,
                height: 30,
                borderWidth: 0,
                borderBottomLeftRadius: 0,
                borderTopLeftRadius: 0,
              }}
              titleStyle={{ color: Constants.TIER_COLORS.ARTISAN }}
              type={'outline'}
              icon={
                <FastImage
                  source={require('../Resources/img/iconRenewal/black-plus.png')}
                  style={styles.plusMinusIcon}
                />
              }
              onPress={() => {
                if (context.state.product.eventType === 'refund') {
                  Alert.alert(
                    Strings.MAX_AVAILABLE_PRODUCT_NUMBER,
                    Strings.PURCHASE_ONLY_ONE_REFUND_PRODUCT,
                  );
                  return;
                }

                // === 비교는 품절(0)·미로딩(undefined) 시 상한이 뚫린다 (B2B 쪽 수정과 동기화)
                if (
                  product.availableNumberToSale !== -1 &&
                  context.state.buyNumber >= (product.availableNumberToSale ?? 0)
                ) {
                  Alert.alert(
                    Strings.MAX_AVAILABLE_PRODUCT_NUMBER,
                    Strings.CHECK_MAX_AVAILABLE_PRODUCT,
                  );
                  return;
                }
                context.setState({ buyNumber: context.state.buyNumber + 1 });
              }}
            />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {product.options.lists.length > 0 && (
            <View>
              {product.options.lists.map((option, idx) => (
                <View key={'listoption' + idx} style={styles.chooseProductOptionContainer}>
                  <Text style={styles.purchasePopupModalOptionTitle}>{option.name}</Text>
                  {option.items.map((item, idxItem) => (
                    <View style={styles.optionItemContainer} key={'listoption_item_' + idxItem}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CheckBox
                          key={'listoptionitem' + idxItem}
                          onChanged={() => {
                            context.listOptionSelectChanged(option.name, item.name);
                          }}
                          value={option.selectedItemName === item.name}
                          style={{ marginRight: 8 }}
                          type={'radio'}
                        />
                        <Text style={styles.purchasePopupModalfieldTitle}>{item.name}</Text>
                      </View>
                      <Text style={styles.optionPrice}>
                        {item.addition > 0 ? '+' : ''}
                        {Strings.MONEY_AMOUNT_UNIT_WON(Utils.numberWithCommas(item.addition))}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
          {product.options.checks.length > 0 && (
            <View style={styles.chooseProductOptionContainer}>
              <Text style={styles.purchasePopupModalOptionTitle}>{Strings.ADDITIONAL_PRODUCT}</Text>
              {product.options.checks.map((option, idx) => (
                <View style={styles.optionItemContainer} key={option.name + '_' + idx}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckBox
                      key={'checkoption' + idx}
                      onChanged={() => {
                        context.checkOption(option.name, !option.isChecked);
                      }}
                      value={option.isChecked}
                      style={{ marginRight: 8 }}
                    />

                    <Text style={styles.purchasePopupModalfieldTitle}>{option.name}</Text>
                  </View>
                  <Text style={styles.optionPrice}>
                    {option.addition > 0 ? '+' : ''}
                    {Utils.displayPrice(
                      option.addition,
                      global?.state?.region,
                      context?.props?.route?.params?.KRWPerUSD,
                    )}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <View style={[styles.divider, { marginTop: 20, marginBottom: 10 }]} />
        <View style={styles.priceToPayContainer}>
          <Text style={styles.purchasePopupModalfieldTitle}>{Strings.TOTAL_PRODUCT_PRICE}</Text>
          <Text style={styles.expectedPrice}>
            {Utils.displayPrice(
              context.getPriceToPay(),
              global?.state?.region,
              context?.props?.route?.params?.KRWPerUSD,
            )}
          </Text>
        </View>
      </View>
      <View style={styles.bottomPurchaseButtonContainer}>
        <Button
          containerStyle={{ flex: 1 }}
          buttonStyle={{
            backgroundColor:
              product.isAvailableToSale === false ||
              product.availableNumberToSale === 0 ||
              product.isRefundProductAlreadyBuy
                ? '#999'
                : Constants.COLOR_POINT_BLUE,
            height: 54,
          }}
          titleStyle={{
            color: Constants.COLOR_BACKGROUND_DARK,
            fontSize: 18,
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
          }}
          title={Strings.BUY_NOW}
          onPress={() => {
            if (isGuestUser(context.props.route.params.logonUserId)) {
              return LogoutAlert(context.props);
            }

            const currentDate = dayjs(); // Get the current date and time
            const startDate = dayjs('2023-08-21', 'YYYY-MM-DD'); // Set the target start date
            const endDate = dayjs('2023-09-05', 'YYYY-MM-DD'); // Set the target end date
            const isEventPeriod = currentDate.isBefore(endDate) && currentDate.isAfter(startDate);

            if (
              !context.props.route.params.videoId &&
              context.state.product.linkedVideoList.length &&
              isEventPeriod
            ) {
              // TODO: 구매 회차를 가져와서 적용
              Alert.alert(
                '잠깐! 다른 사람의 리뷰를 보고 구매하면 적립금을 받을 수 있어요!',
                '링크된 리뷰를 보고 상품을 구매하러 오시겠어요?',
                [
                  {
                    text: '그냥 구매하기',
                    onPress: () => {
                      handlePressBuy();
                    },
                    style: 'destructive',
                  },
                  {
                    text: '리뷰 보러가기',
                    onPress: () => {
                      context.props.navigation.push('VideoList', {
                        listOf: Constants.VIDEO_LIST_LINKED_PRODUCT,
                        productId: context.state.product.productId,
                      });
                    },
                  },
                ],
                { cancelable: true },
              );
            } else {
              handlePressBuy();
            }
          }}
        />
        <Button
          containerStyle={{ marginLeft: 12 }}
          buttonStyle={{
            backgroundColor:
              product.isAvailableToSale === false ||
              product.availableNumberToSale === 0 ||
              product.isRefundProductAlreadyBuy
                ? '#999'
                : Constants.COLOR_POINT_BLUE,
            paddingHorizontal: 24,
            height: 54,
          }}
          titleStyle={{
            color: Constants.COLOR_BACKGROUND_DARK,
            fontSize: 18,
            fontWeight: 'bold',
          }}
          icon={
            <FastImage
              source={require('../Resources/img/iconRenewal/white-cart.png')}
              style={styles.addCartIcon}
            />
          }
          onPress={() => {
            if (isGuestUser(context.props.route.params.logonUserId)) {
              return LogoutAlert(context.props);
            }
            APIprovider.newCartItem(
              product.productId,
              context.state.buyNumber,
              product.options,
              null,
              Constants.CART_FROM.CART,
            )
              .then((result) => {
                if (result) {
                  Alert.alert(Strings.SUCCEED_TO_CART, Strings.ASK_CHECK_CART, [
                    {
                      text: Strings.YES,
                      onPress: () => {
                        context.props.navigation.push('Cart');
                        context.setState({ isShowPurchaseUI: false });
                      },
                    },
                    {
                      text: Strings.NO,
                      onPress: () => {
                        context.setState({ isShowPurchaseUI: false });
                      },
                    },
                  ]);
                }
              })
              .catch((err) => {
                Alert.alert(
                  Strings.FAILED_TO_ADD_CART,
                  err.errorMsg ? err.errorMsg : '',
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          }}
        />
      </View>
    </View>
  );
}

function CommentModal({ context }) {
  const bottom = context.state.isShowingCommentInput ? 0 : -Dimensions.get('window').height;
  const [deviceModel, setDeviceModel] = useState('');

  useEffect(() => {
    const model = getDeviceId();
    setDeviceModel(model);
  }, []);

  const model = getDeviceId();
  let keyboardVerticalOffset;

  switch (model) {
    case 'iPhone14,6': //iphone SE 3rd gen
      keyboardVerticalOffset = -152;
      break;
    case 'iPhone15,2': //iphone 14pro
      keyboardVerticalOffset = -160;
      break;
    case 'iPhone17,1': //iphone 16pro
      keyboardVerticalOffset = -228;
      break;
    case 'iPhone17,2': //iphone 16pro max
      keyboardVerticalOffset = -238;
      break;
    case 'iPhone17,4': //iphone 16 plus
      keyboardVerticalOffset = -170;
      break;
    default:
      keyboardVerticalOffset = -160; // Default offset
  }
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        context.setState({ isShowingCommentInput: false });
        Keyboard.dismiss();
      }}
    >
      <View style={[styles.addCommentModalContainer, { bottom }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : null}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={{ width: '100%' }}
        >
          <TouchableWithoutFeedback>
            <View style={styles.addCommentInputContainer}>
              <FastImage
                style={styles.userProfilePic}
                source={{ uri: context.state.logonUserProfilePicUrl }}
              />
              <TextInput
                ref={(input) => {
                  context.commentInput = input;
                }}
                multiline
                style={{
                  flex: 1,
                  marginRight: 4,
                  color: Constants.TIER_COLORS.ARTISAN,
                  fontSize: 16,
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
                }}
                placeholder={
                  context.state.product.seller.userId === APIprovider.requesterId
                    ? Strings.REPLAY
                    : Strings.ASK_A_QUESTION
                }
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                onChangeText={(newComment) => context.setState({ newComment })}
                value={context.state.newComment}
              />
              {/* <Text>Device Model: {model}</Text> */}
              {context.state.newComment !== '' && (
                <Button
                  title={Strings.POST}
                  type="clear"
                  titleStyle={styles.addCommentButtonTitle}
                  //containerStyle={styles.interactionButtonContainer}
                  //buttonStyle={styles.interactionButton}
                  onPress={context.onSubmitNewComment.bind(context)}
                  disabled={context.state.isNewCommentSubmitting}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

function AvailableNumberToSale({ number }) {
  return (
    <View
      style={{
        backgroundColor: Constants.TIER_COLORS.EXPLORER,
        alignItems: 'center',
      }}
    >
      <Text
        style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD, fontSize: 16, marginVertical: 15 }}
      >
        {Strings.PRODUCT_REMAINING_QUANTITY(number)}
      </Text>
    </View>
  );
}

function PromitionPeriod({ promotionStartDate, promotionEndDate }) {
  return (
    <View
      style={{
        backgroundColor: Constants.TIER_COLORS.PIONEER,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          marginVertical: 10,
        }}
      >
        {/* <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD, fontSize: 14 }}>프로모션 상품입니다.</Text> */}
        <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM, fontSize: 14 }}>
          {Strings.PROMOTION_PERIOD}: {dayjs(promotionStartDate).format('YYYY-MM-DD')} ~{' '}
          {dayjs(promotionEndDate).format('YYYY-MM-DD')}
        </Text>
      </View>
    </View>
  );
}

export default class ProductPageScreen extends React.Component {
  menuEditProductClicked = function () {
    const { product } = this.state;

    this.props.navigation.navigate('AddingNewProduct', {
      product: product,
      isEdit: true,
      onUpdatedProduct: this.loadData.bind(this),
    });
  };

  menuDeleteProductClicked = function () {
    Alert.alert(
      Strings.DELETE_PRODUCT,
      Strings.SURE_TO_DELETE_PRODUCT,
      [
        {
          text: Strings.CANCEL,
          onPress: () => {
            console.log('Cancel Pressed');
          },
          style: 'cancel',
        },
        {
          text: Strings.OK,
          onPress: () => {
            APIprovider.deleteProduct(this.state.product.productId)
              .then(({ result }) => {
                if (result === 1) {
                  Alert.alert(Strings.DELETE_PRODUCT, Strings.PRODUCT_DELETED, [
                    {
                      text: Strings.OK,
                      onPress: () => {
                        if (this.props.route.params.onItemRemoved) {
                          this.props.route.params.onItemRemoved();
                        }
                        this.props.navigation.pop();
                      },
                    },
                  ]);
                }
              })
              .catch((err) => {
                Alert.alert(
                  Strings.FAILED_TO_LOAD_DATA,
                  err.errorMsg ? err.errorMsg : '',
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          },
        },
      ],
      { cancelable: true },
    );
  };

  menuShareClicked = function () {
    const url = Constants.CONTENTS_PAGE_ENDPOINT + 'products/' + this.state.product.productId;
    const message = Strings.SHARE_PRODUCT_MESSAGE;
    const { title } = this.state.product;

    shareLink({ url, message, description: title });
  };

  productShareWithDynamicLink = function () {
    const { productId, title, description, attachmentList } = this.state.product;

    APIprovider.getProductDynamicLink(
      productId,
      title,
      description?.slice(0, 250),
      // 이미지 없는 상품 공유 시 크래시 방지 (B2B 쪽 수정과 동기화)
      attachmentList?.[0]?.url,
    ).then((res) => {
      const url = res?.shortLink;
      const message = Strings.SHARE_PRODUCT_MESSAGE;

      shareLink({ url, message, description });
    });
  };

  menuReportClicked = function () {
    console.log('menuReportClicked is called');
    this.setState({
      isInvalidContents: true,
    });
  };

  menuUploader = [
    {
      key: 'share_product',
      name: Strings.SHARE,
      icon: <IconMaterialCommunityIcons size={20} name={'share'} color={'#000'} />,
      // onClicked: this.menuShareClicked.bind(this),
      onClicked: this.productShareWithDynamicLink.bind(this),
    },
    {
      key: 'edit_product',
      name: Strings.EDIT_PRODUCT,
      icon: <IconMaterialIcons name="edit" color={'#000'} size={20} />,
      onClicked: this.menuEditProductClicked.bind(this),
    },
    {
      key: 'delete_product',
      name: Strings.DELETE_PRODUCT,
      icon: <IconMaterialIcons name="delete" color={'#000'} size={20} />,
      onClicked: this.menuDeleteProductClicked.bind(this),
    },
  ];

  menuVisitor = [
    {
      key: 'share_product',
      name: Strings.SHARE,
      icon: <IconMaterialCommunityIcons size={20} name={'share'} color={'#000'} />,
      // onClicked: this.menuShareClicked.bind(this),
      onClicked: this.productShareWithDynamicLink.bind(this),
    },
    {
      key: 'report_product',
      name: Strings.REPORT,
      icon: <IconMaterialIcons name="report" color={'#000'} size={20} />,
      onClicked: this.menuReportClicked.bind(this),
    },
  ];

  isMyProduct() {
    return (
      this.state.product.seller === this.props.route.params.logonUserId ||
      this.state.product.seller.userId === this.props.route.params.logonUserId
    );
  }

  constructor(props) {
    super(props);
    const { productId, videoId } = this.props.route.params;
    this.state = {
      product: {
        lowestPriceLink: '',
        productId: productId,
        countryCode: undefined,
        thumbnailUrl: '',
        thumbnailPath: '',
        title: '',
        description: '',
        seller: {
          userId: '',
          name: '',
          profilePicUrl:
            'https://www.kindpng.com/picc/m/22-223910_circle-user-png-icon-transparent-png.png',
          class: 0,
        },
        ratingScore: 0,
        ratingCount: 0,
        ratingCountList: [],
        viewCount: 0,
        reviewCount: 0,
        reviewList: [],
        commentCount: 0,
        commentList: [],
        linkedVideoList: [],
        linkedVideoCount: 0,
        sellerOtherProductCount: 0,
        sellerOtherProductList: {},
        relatedOtherProductList: {},
        attachmentList: [],
        price: 0,
        discountPrice: 0,
        promotionAmount: 0,
        promotionTimestampBy: 0,
        isEnabledNewReview: true,
        options: {
          checks: [
            /*{
                name,
                addition,
                isChecked
              }*/
          ],
          lists: [
            /*{
                name,
                items: [{
                  name,
                  addition,
                }],
                selectedItemName,
              }*/
          ],
        },
        isRefundProductAlreadyBuy: false,
      },
      isSeller: true,
      newComment: '',
      isNewCommentSubmitting: false,
      newReview: '',
      newReviewRating: 0,
      isNewReviewSubmitting: false,
      otherProductListIsRefreshing: false,
      relatedProductListIsRefreshing: false,
      linkedVideoListIsRefreshing: false,
      isReviewExpanded: false,
      isCommentExpanded: false,
      isExchangeReturnExpanded: false,
      isShowPurchaseUI: false,
      isShowingCommentInput: false,
      buyNumber: 1,
      logonUserProfilePicUrl: this.props.route.params.logonUserProfilePicUrl,
      isShowingVideoControl: false,
      activeSlideIndex: 0,
      isInvalidContents: false,
      imageModalVisible: false,
      isCollapsedDescription: true,
      reviewerVideoId: videoId,
      buyButtonPhrase: Strings.BUY,
    };
    this._carousel = null;
    this.newImageList = [];
  }

  componentDidMount() {
    Preference.get('userProfilePicUrl').then((value) => {
      this.setState({
        logonUserProfilePicUrl: value,
      });
    });
    this.loadData();

    if (this.props.route.params.videoId) {
      this.updateLastVideoView();
      this.setState({ buyButtonPhrase: Strings.TRUST_REVIEWER_AND_BUY });
    }

    BackHandler.addEventListener('hardwareBackPress', this.backAction);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.backAction);
  }

  backAction = () => {
    if (this.state.isShowPurchaseUI === true) {
      this.setState({ isShowPurchaseUI: false });
      return true;
    }
    return false;
  };

  loadData() {
    APIprovider.getProductDetails(this.props.route.params.productId)
      // .then(this.getProductDetailsCallback.bind(this))
      .then((res) => {
        if (!(res instanceof Error)) {
          this.getProductDetailsCallback(res);
        } else {
          // menuLogout(this.props);
          Alert.alert(Strings.FAILED_TO_LOAD_DATA);
          this.props.navigation.pop();
        }
      })
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  updateLastVideoView() {
    const { videoId, productId } = this.props.route.params;

    APIprovider.updateLastVideoView(videoId, productId)
      .then((result) => {
        console.log('updateLastVideoView', result);
      })
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  checkOption(name, isChecked) {
    let options = this.state.product.options.checks;
    //check if already added
    for (let i = 0; i < options.length; i++) {
      if (options[i].name === name) {
        options[i].isChecked = isChecked;
        break;
      }
    }
    this.setState({
      'product.options.checks': options,
    });
  }

  listOptionSelectChanged(name, itemName) {
    let options = this.state.product.options.lists;
    for (let i = 0; i < options.length; i++) {
      if (options[i].name === name) {
        options[i].selectedItemName = itemName;
        break;
      }
    }
    this.setState({
      'product.options.lists': options,
    });
  }

  getProductDetailsCallback(product) {
    if (product.statusCode === Constants.POST_STATUS_CODE.DELETED) {
      Alert.alert(Strings.INVALID_PRODUCT, Strings.INVALID_PRODUCT_SELLER_DELETED, [
        {
          text: Strings.OK,
          onPress: () => {
            this.props.navigation.pop();
          },
        },
      ]);
    } else if (product.statusCode === Constants.POST_STATUS_CODE.REPORTED) {
      Alert.alert(Strings.INVALID_PRODUCT, Strings.INVALID_PRODUCT_REPORTED, [
        {
          text: Strings.OK,
          onPress: () => {
            this.props.navigation.pop();
          },
        },
      ]);
    } else if (product.statusCode === Constants.POST_STATUS_CODE.DELETED_BY_ADMIN) {
      Alert.alert(Strings.INVALID_PRODUCT, Strings.INVALID_PRODUCT_ADMIN_BLOCK, [
        {
          text: Strings.OK,
          onPress: () => {
            this.props.navigation.pop();
          },
        },
      ]);
    } else {
      // initialize options
      let { checks } = product.options;
      for (let i = 0; i < checks.length; i++) {
        checks[i].isChecked = false;
      }
      product.options.checks = checks;
      let { lists } = product.options;
      for (let i = 0; i < lists.length; i++) {
        product.options.lists[i].selectedItemName = product.options.lists[i].items[0].name;
      }

      this.newImageList = [];
      // initialize description images
      if (product.descriptionImageList) {
        this.updateDescriptionImages(product.descriptionImageList);
      }

      this.setState({
        product: {
          ...this.state.product,
          ...product,
          isRefundProductAlreadyBuy: product.isRefundProductAlreadyBuy ? true : false,
        },
      });
    }
  }

  async updateDescriptionImages(imageList, i = 0) {
    if (imageList.length === 0) {
      return;
    }

    if (i === imageList.length) {
      this.setState({
        product: {
          ...this.state.product,
          descriptionImageList: this.newImageList,
        },
      });
      return;
    }

    Image.getSize(
      imageList[i].url,
      (width, height) => {
        this.newImageList.push({
          ...imageList[i],
          height: (height * (Dimensions.get('window').width - MARGIN_HORIZONTAL)) / width,
        });
        this.updateDescriptionImages(imageList, ++i);
      },
      (err) => console.log(err),
    );
  }

  onSubmitNewComment() {
    this.setState({
      isNewCommentSubmitting: true,
    });
    APIprovider.addNewProductComment(
      this.state.newComment,
      this.state.product.productId,
      this.state.product.productId,
    )
      .then(this.addNewProductCommentCallback.bind(this))
      .catch((err) => {
        this.setState({ isNewCommentSubmitting: false });
        Alert.alert(
          Strings.FAILED_ADD_COMMENT,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  addNewProductCommentCallback(data) {
    if (data.comment === this.state.newComment) {
      this.setState({ isShowingCommentInput: false });
      Keyboard.dismiss();
      this.setState({
        product: {
          ...this.state.product,
          commentCount: this.state.product.commentCount + 1,
          commentList: [data, ...this.state.product.commentList],
        },
        isNewCommentSubmitting: false,
        newComment: '',
      });
    }
  }

  getCommentListOfProductCallback(newList) {
    this.setState({
      product: {
        ...this.state.product,
        commentList: this.state.product.commentList
          ? [...this.state.product.commentList, ...newList]
          : newList,
      },
    });
  }

  loadCommentList() {
    const { product } = this.state;
    if (product.commentCount === 0 || product.commentCount === product.commentList.length) {
      return;
    }

    if (product.commentList.length === 0) {
      APIprovider.getProductCommentList(product.productId)
        .then(this.getCommentListOfProductCallback.bind(this))
        .catch((err) => {
          console.log(err);
          Alert.alert(
            Strings.FAILED_LOAD_COMMENTS,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    } else {
      const offset = product.commentList[product.commentList.length - 1].createdAt;
      APIprovider.getProductCommentList(product.productId, offset)
        .then(this.getCommentListOfProductCallback.bind(this))
        .catch((err) => {
          console.log(err);
          Alert.alert(
            Strings.FAILED_LOAD_COMMENTS,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    }
  }

  onCommentDeleteRequested(commentId) {
    APIprovider.deleteProductComment(this.state.product.productId, commentId)
      .then(this.deleteProductCommentCallback.bind(this))
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_DELETE_COMMENT,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  deleteProductCommentCallback(result) {
    for (let i = 0; i < this.state.product.commentList.length; i++) {
      if (this.state.product.commentList[i]._id === result.commentId) {
        this.setState({
          product: {
            ...this.state.product,
            commentCount: this.state.product.commentCount - 1,
            commentList: [
              ...this.state.product.commentList.slice(0, i),
              ...this.state.product.commentList.slice(i + 1, this.state.product.commentList.length),
            ],
          },
        });
      }
    }
  }

  onOtherProductListEndReached() {
    this.setState({ otherProductListIsRefreshing: true });
    const offset =
      this.state.product.sellerOtherProductList.productList[
        this.state.product.sellerOtherProductList.productList.length - 1
      ].createdAt;
    const skip = this.state.product.sellerOtherProductList.productList.length;
    const limit = 20;
    APIprovider.getUserUploadProductList(this.state.product.seller.userId, offset, skip, limit)
      .then((data) => {
        this.setState({
          product: {
            ...this.state.product,
            sellerOtherProductList: {
              ...this.state.product.sellerOtherProductList,
              productList: [
                ...this.state.product.sellerOtherProductList.productList,
                ...data.productList,
              ],
            },
          },
          otherProductListIsRefreshing: false,
        });
      })
      .catch((err) => {
        console.log(err);
        Alert.alert(
          Strings.FAILED_TO_LOAD_PRODUCTS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ otherProductListIsRefreshing: false });
      });
  }

  onRelatedProductListEndReached() {
    this.setState({ relatedProductListIsRefreshing: true });
    const offset =
      this.state.product.relatedOtherProductList.productList[
        this.state.product.relatedOtherProductList.productList.length - 1
      ].createdAt;
    const skip = this.state.product.relatedOtherProductList.productList.length;
    const limit = 20;
    APIprovider.getProductListRelatedToProduct(
      this.state.product.productId,
      undefined,
      offset,
      skip,
      limit,
    )
      .then((data) => {
        this.setState({
          product: {
            ...this.state.product,
            relatedOtherProductList: {
              ...this.state.product.relatedOtherProductList,
              productList: [
                ...this.state.product.relatedOtherProductList.productList,
                ...data.productList,
              ],
            },
          },
          relatedProductListIsRefreshing: false,
        });
      })
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_PRODUCTS,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ relatedProductListIsRefreshing: false });
      });
  }

  onLinkedVideoListEndReached() {
    this.setState({ linkedVideoListIsRefreshing: true });
    const offset =
      this.state.product.linkedVideoList[this.state.product.linkedVideoList.length - 1].createdAt;
    const limit = 10;
    APIprovider.getLinkedVideoListOfProduct(
      this.state.product.productId,
      undefined,
      offset,
      this.state.product.linkedVideoList.length,
      limit,
    )
      .then((data) => {
        this.setState({
          product: {
            ...this.state.product,
            linkedVideoList: [...this.state.product.linkedVideoList, ...data.videoList],
          },
          linkedVideoListIsRefreshing: false,
        });
      })
      .catch((err) => {
        Alert.alert(
          Strings.LOAD_REVIEW_LIST,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
        this.setState({ linkedVideoListIsRefreshing: false });
      });
  }

  bookmarkProductCallback() {}

  getPriceToPay() {
    const { product } = this.state;
    let price = product.discountPrice > 0 ? product.discountPrice : product.price;

    let addition = 0;
    const { checks, lists } = product.options;
    for (let i = 0; i < checks.length; i++) {
      if (checks[i].isChecked === true) {
        addition += checks[i].addition;
      }
    }
    for (let i = 0; i < lists.length; i++) {
      for (let j = 0; j < lists[i].items.length; j++) {
        if (lists[i].selectedItemName === lists[i].items[j].name) {
          addition += lists[i].items[j].addition;
          break;
        }
      }
    }
    price += addition;
    price *= this.state.buyNumber;
    return price;
  }

  renderPrice() {
    const { product } = this.state;
    if (product.discountPrice > 0) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, marginRight: 10, fontWeight: 'bold' }}>
            ￦ {Utils.numberWithCommas(product.discountPrice)}
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginRight: 10,
              fontWeight: '200',
              color: '#999',
              textDecorationLine: 'line-through',
            }}
          >
            ￦ {Utils.numberWithCommas(product.price)}
          </Text>
          <Text
            style={{
              fontSize: 20,
              marginRight: 10,
              color: Constants.COLOR_MAIN,
              flex: 1,
            }}
          >
            {Math.round(((product.price - product.discountPrice) / product.price) * 100)}
            %↓
          </Text>
        </View>
      );
    } else {
      return (
        <Text style={{ fontSize: 20, marginRight: 20, fontWeight: '200', flex: 1 }}>
          ￦ {Utils.numberWithCommas(product.price)}
        </Text>
      );
    }
  }

  _renderSlide({ item, index }) {
    return (
      <TouchableNativeFeedback
        onPress={() => {
          this.setState({ imageModalVisible: true });
        }}
      >
        <FastImage source={{ uri: item.url }} style={styles.slide} resizeMode={'cover'} />
      </TouchableNativeFeedback>
    );
  }

  async openLowestPriceLink(lowestPriceLink) {
    const supported = await Linking.canOpenURL(lowestPriceLink);
    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(lowestPriceLink);
    } else {
      Alert.alert(`${Strings.UNSUPPORTED_EXTERNAL_URL}: ${lowestPriceLink}`);
    }
  }

  render() {
    const { navigation } = this.props;
    const { product } = this.state;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <View style={styles.container}>
          <ScrollView style={styles.container}>
            <View>
              <Carousel
                ref={(c) => {
                  this._carousel = c;
                }}
                data={product.attachmentList}
                renderItem={this._renderSlide.bind(this)}
                sliderWidth={Dimensions.get('window').width}
                itemWidth={Dimensions.get('window').width}
                onSnapToItem={(index) => {
                  this.setState({
                    activeSlideIndex: index,
                  });
                }}
                scrollEnabled={!this.state.isShowingVideoControl}
                useExperimentalSnap={true}
                disableIntervalMomentum={true}
              />
              <LinearGradient
                colors={[
                  'rgba(0, 0, 0, 0.4)',
                  'rgba(0, 0, 0, 0)',
                  'rgba(0, 0, 0, 0)',
                  'rgba(0, 0, 0, 0.4)',
                ]}
                locations={[0, 0.3, 0.8, 1]}
                pointerEvents="none"
                style={{ width: '100%', height: '100%', position: 'absolute' }}
              />
              <View style={styles.slidePagination} pointerEvents="none">
                <Pagination
                  dotsLength={product.attachmentList.length}
                  activeDotIndex={this.state.activeSlideIndex}
                  dotContainerStyle={{
                    marginHorizontal: 2,
                  }}
                  dotStyle={{
                    width: 5,
                    height: 5,
                    borderRadius: 5,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  }}
                  inactiveDotStyle={{}}
                  inactiveDotOpacity={0.2}
                  inactiveDotScale={1}
                />
              </View>
              {product.isPromotion ? (
                <PromitionPeriod
                  promotionStartDate={product.promotionStartDate}
                  promotionEndDate={product.promotionEndDate}
                />
              ) : null}
              {product.availableNumberToSale > -1 ? (
                <AvailableNumberToSale number={product.availableNumberToSale} />
              ) : null}
            </View>

            <Header context={this} />
            <View style={{ padding: 20 }}>
              <Ratings context={this} />
              <View style={styles.titleContainer}>
                <Title context={this} />
                <BookmarkButton context={this} />
              </View>
              <Price context={this} />
              {/* {this.state.product.lowestPriceLink ? <LowestPriceLink context={this} /> : null} */}
            </View>

            <View style={[styles.divider, { marginHorizontal: 20 }]} />

            <View style={styles.descriptionContainer}>
              <Seller context={this} />
              <DescriptionImages context={this} />
              <Description context={this} />
            </View>
            <View
              style={{
                flex: 1,
                paddingHorizontal: 20,
                marginBottom: -25,
              }}
            >
              <FlagButton
                withCountryNameButton={true}
                countryCode={product.countryCode ?? 'KR'}
                flagSize={18}
              />
            </View>
            <ExchangeReturn context={this} />
            <View style={styles.relatedInfoContainer}>
              <Comments context={this} />
              <LinkedReviews context={this} />
              <SellerProducts context={this} />
              <RelatedProducts context={this} />
            </View>
          </ScrollView>
          {this.props.route.params.mode === MODE.SELECT_TO_LINK ? (
            <SelectToLinkButton context={this} />
          ) : (
            <View style={styles.bottomButtonGroupContainer}>
              {/* <ReviewButton context={this} /> */}
              <PurchaseButton context={this} />
            </View>
          )}
          <PurchasePopup context={this} />
          <CommentModal context={this} />
          <ReportModal
            visible={this.state.isInvalidContents}
            onCancel={() => {
              this.setState({ isInvalidContents: false });
            }}
            contentInfo={{ type: 'product', id: this.state.product.productId }}
          />
          <ImageModal
            visible={this.state.imageModalVisible}
            index={this.state.activeSlideIndex}
            sources={product.attachmentList}
            onClose={() => this.setState({ imageModalVisible: false })}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  headerBarContainer: {
    width: '100%',
    position: 'absolute',
    // marginTop: isIphoneX() ? 50 : 20,
    marginTop: getIPhoneHeaderMarginTop(),
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerRightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 28,
    height: 28,
  },
  actionButtonContainer: {
    borderRadius: 40,
    width: 44,
    height: 44,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    margin: -11,
  },
  slide: {
    width: '100%',
    height: Dimensions.get('window').width,
  },
  slidePagination: {
    position: 'absolute',
    alignSelf: 'flex-end',
    bottom: -10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingScore: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    marginLeft: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: 13,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  bookmarkButtonContainer: {
    marginTop: 3,
  },
  priceContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountPriceContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountRate: {
    // color: 'red',
    color: Constants.COLOR_POINT_BLUE,
    fontSize: 20,
    // fontWeight: '600',
    marginRight: 6,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  discountPrice: {
    fontSize: 20,
    color: 'black',
    marginRight: 10,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  originalPrice: {
    marginTop: 4,
    fontSize: 16,
    color: Constants.TIER_COLORS.OPERATOR,
    textDecorationLine: 'line-through',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  price: {
    marginTop: 4,
    fontSize: 20,
    color: 'black',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  descriptionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 45,
  },
  sellerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerProfilePic: {
    width: 28,
    height: 28,
    borderRadius: 40,
  },
  sellerName: {
    marginLeft: 10,
    fontSize: 14,
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: Constants.TIER_COLORS.ARTISAN,
    marginTop: 12,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  descriptionImageContainer: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  descriptionImage: {
    flex: 1,
    width: Dimensions.get('window').width - MARGIN_HORIZONTAL,
    height: 'auto',
  },
  userProfilePic: {
    width: 28,
    height: 28,
    borderRadius: 28,
    marginRight: 20,
  },
  relatedInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 60,
  },
  sectionTitleContainer: {
    marginTop: 34,
    marginLeft: 20,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 19,
    color: Constants.TIER_COLORS.ARTISAN,
    marginRight: 6,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  sectionTitleMoreIcon: {
    width: 12,
    height: 20,
  },
  subSectionContainer: {
    paddingHorizontal: 20,
  },
  subSectionTitle: {
    fontSize: 14,
    color: Constants.TIER_COLORS.ARTISAN,
    marginTop: 10,
    marginBottom: 6,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  exchangeReturnDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  commentContainer: {
    paddingHorizontal: 10,
  },
  addCommentInputContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 21,
    alignItems: 'center',
    backgroundColor: Constants.TIER_COLORS.EXPLORER,
  },
  addCommentButtonContainer: {
    marginHorizontal: 20,
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 21,
    alignItems: 'center',
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    borderRadius: 14,
  },
  addCommentButtonTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addReviewButton: {
    marginBottom: 53,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  addReviewButtonLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 17,
    fontWeight: '600',
  },
  followButtonTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 14,
  },
  productTitle: {
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    flexWrap: 'wrap',
    fontSize: 15,
    lineHeight: 19,
    color: Constants.TIER_COLORS.ARTISAN,
  },
  saleStatus: {
    color: Constants.COLOR_GREY,
    fontSize: 14,
    marginLeft: 10,
  },
  bottomButtonContainer: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 44 : 20,
    marginHorizontal: 20,
  },
  bottomButtonGroupContainer: {
    marginTop: 6,
    marginBottom: Platform.OS === 'ios' ? 30 : 12,
    marginHorizontal: 20,
  },
  bottomButtonGroupButton: {
    marginVertical: 4,
    borderRadius: 14,
  },
  bottomButtonTitle: {
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPurchaseButtonContainer: {
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 20,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    flexDirection: 'row',
  },
  purchasePopupContainer: {
    position: 'absolute',
    justifyContent: 'flex-end',
    width: '100%',
    height: Dimensions.get('window').height - (isIphoneX() ? 350 : 320) - getBottomSpace(),
  },
  purchasePopupModalContainer: {
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  purchasePopupModalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  purchasePopupModalHeaderTitle: {
    fontWeight: '500',
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 20,
  },
  purchasePopupModalfieldTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
  },
  purchasePopupModalOptionTitle: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    marginBottom: 5,
  },
  delieverElapsedDay: {
    fontSize: 13,
    color: Constants.TIER_COLORS.OPERATOR,
    marginTop: 6,
  },
  productNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingVertical: 14,
  },
  numberControllerContainer: {
    borderRadius: 4,
    borderColor: Constants.TIER_COLORS.STRIVER,
    borderWidth: 1,
    flexDirection: 'row',
  },
  chooseProductOptionContainer: {
    marginTop: 20,
  },
  optionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  optionPrice: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 15,
    fontWeight: '500',
  },
  priceToPayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  expectedPrice: {
    fontSize: 18,
    fontWeight: '500',
    color: Constants.TIER_COLORS.ARTISAN,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#4d4d4d',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addCommentModalContainer: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addCommentModalViewContainer: {
    width: '100%',
    margin: 15,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeIcon: {
    width: 22,
    height: 22,
  },
  plusMinusIcon: {
    width: 12,
    height: 12,
  },
  addCartIcon: {
    width: 26,
    height: 26,
  },
  sectionTitleFoldIcon: {
    width: 22,
    height: 22,
  },
  divider: {
    height: 1,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
  },

  lowestPriceLinkContainer: {
    marginTop: 16,
  },
  summaryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
  },
  thumbnailSummaryType: {
    width: 64,
    height: 64,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    marginRight: 14,
  },
  summaryInfoContainer: {
    flex: 1,
    paddingRight: 20,
  },
  externalLink: {
    marginTop: 5,
    color: 'rgb(69, 139, 210)',
  },
});
