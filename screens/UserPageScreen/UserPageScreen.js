import { useKeyboard } from '@react-native-community/hooks';
import React, { useContext } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from 'react-native';
import Preference from 'react-native-default-preference';
import FastImage from 'react-native-fast-image';
import { ActivityIndicator } from 'react-native-paper';
import { Shadow } from 'react-native-shadow-2';
import { FlatGrid } from 'react-native-super-grid';
import { ClipPath, Defs, Path, Svg, Image as SvgImage, Text as SvgText } from 'react-native-svg';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { VictoryArea, VictoryChart, VictoryGroup, VictoryPolarAxis } from 'victory-native';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import T from '../../Components/Constants/DesignTokens';
import { Badge, Btn, Card } from '../../Components/UI';
import FEATURES from '../../Components/Constants/Features';
import Codes from '../../Components/Constants/Codes';
import QNAList from '../../Components/CustomComponents/QNA/QNAList';
import ModalMenuButton from '../../Components/ModalMenuButton';
import ProductListItemView from '../../Components/ProductListItemView';
import ReportModal from '../../Components/ReportModal';
import RevenueGuideModal from '../../Components/RevenueGuideModal';
import Strings, { getLanguage } from '../../Components/Strings';
import { nationalities } from '../../Components/Strings/nationalities';
import UploadingVideoListItemView from '../../Components/UploadingVideoListItemView';
import Utils, { changeCurrency, isGuestUser, menuLogout } from '../../Components/utils';
import { horizontalScale, moderateScale, verticalScale } from '../../Components/utils/scailing';
import { shareLink } from '../../Components/utils/share';
import { Context } from '../../Contexts';
import { UPLOADING_VIDEO, USER } from '../../Contexts/actionTypes';
import { setUser } from '../../slices/user';
import FollowedBy from './FollowedBy';

const { COLORS, FONT, TYPE } = T;

// 그리드 셀 높이 리듬 — CuratedHome 그리드와 동일 규격
const GRID_HEIGHTS = [118, 96, 100, 132];

// 리뷰 썸네일 (없으면 그리드에서 제외)
function gridThumbUrl(item) {
  return item.thumbnailUrl || item?.relayedVideo?.thumbnailUrl || null;
}

// 점수 없으면 배지 숨김 (✓ 0.0 노출 금지)
function reviewScore(item) {
  const raw = item.g6RatingCount > 0 ? item.g6AvgRatingScore : item.ratingScore;
  const n = Number(raw || 0);
  return n > 0 ? n.toFixed(1) : null;
}

// 원형 아바타 — 구 육각형(Hexagon) 대체
function Avatar({ url, size = 56, style }) {
  return (
    <FastImage
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      source={{ uri: url && url !== '' ? url : Constants.NO_USER_URL }}
    />
  );
}

const USER_HISTORY_TAB_INDEX = {
  REVIEW: 0,
  PRODUCT: 1,
};
const USER_TYPE_TAB_INDEX = {
  REVIEWNEW: 0,
  QA: 1,
};
const QA_TAB_INDEX = {
  Reviewer: 0,
  Product: 1,
  Country: 2,
};

export function ActionButton({ renderItem, onPress = () => {} }) {
  if (Platform.OS === 'android') {
    return (
      <View style={styles.actionButton}>
        <TouchableNativeFeedback
          onPress={() => onPress()}
          background={TouchableNativeFeedback.Ripple('#777', true)}
        >
          <View
            style={{
              borderRadius: 40,
              width: 44,
              height: 44,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {renderItem}
          </View>
        </TouchableNativeFeedback>
      </View>
    );
  } else {
    return (
      <View style={styles.actionButton}>
        <TouchableOpacity
          onPress={() => onPress()}
          activeOpacity={0.7}
          style={{
            borderRadius: 40,
            width: 44,
            height: 44,
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {renderItem}
        </TouchableOpacity>
      </View>
    );
  }
}

function HeaderRight({ context }) {
  const { navigation } = context.props;
  return (
    <View style={styles.headerRightButtonContainer}>
      <ModalMenuButton
        menu={context.menuOthers()}
        style={{ marginLeft: 10 }}
        buttonView={
          <FastImage
            style={styles.headerButton}
            source={require('../../Resources/img/iconRenewal/etc.png')}
          />
        }
      />
    </View>
  );
}

function OtherProfileHeader({ context }) {
  return (
    <View style={styles.orderHeaderContainer}>
      <ActionButton
        renderItem={
          <FastImage
            style={styles.headerButton}
            source={require('../../Resources/img/iconRenewal/backward.png')}
          />
        }
        onPress={() => {
          if (Platform.OS !== 'ios') {
            StatusBar.setBackgroundColor(COLORS.BG);
            StatusBar.setBarStyle('dark-content', true);
          }

          context.props.navigation.pop();
        }}
      />
      {context.isMyUserPage() ? null : <HeaderRight context={context} />}
    </View>
  );
}

function MyProfileHeader({ navigation, user, context }) {
  const navigationState = context.props.navigation.getState();
  const isTopLevel = navigationState.index === 0;

  return (
    <View style={styles.headerContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {isTopLevel ? null : (
          <ActionButton
            renderItem={
              <FastImage
                style={styles.headerButton}
                source={require('../../Resources/img/iconRenewal/backward.png')}
              />
            }
            onPress={() => {
              context.props.navigation.pop();
            }}
          />
        )}
        <Text style={styles.headerTitle}>{Strings.MY_PAGE}</Text>
      </View>
      <MyProfileHeaderRight navigation={navigation} user={user} context={context} />
    </View>
  );
}

function MyProfileHeaderRight({ navigation, user, context }) {
  return (
    <View style={styles.headerButtonContainer}>
      <View style={{ borderRadius: 44, overflow: 'hidden' }}>
        <TouchableNativeFeedback
          onPress={() => {
            navigation.navigate('Settings', {
              ...user,
              onProfileChanged: (profile) => {
                context.setState({
                  user: {
                    ...user,
                    ...profile,
                  },
                });
              },
            });
          }}
          background={TouchableNativeFeedback.Ripple('#777', true)}
        >
          <View
            style={{
              borderRadius: 40,
              width: 44,
              height: 44,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FastImage
              style={styles.headerButton}
              source={require('../../Resources/img/iconRenewal/setting.png')}
            />
          </View>
        </TouchableNativeFeedback>
      </View>
    </View>
  );
}

function UploadingVideoListItem({ context, item }) {
  const global = useContext(Context);
  const dispatchContext = global.dispatch;
  const { user } = context.state;
  return (
    <UploadingVideoListItemView
      style={{
        width: Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2,
        height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2,
      }}
      uploadingVideo={item}
      author={{ name: user.name }}
      onCancel={() => {
        if (global.state.uploadingVideos.find((element) => element.id === item.id)) {
          dispatchContext({
            type: UPLOADING_VIDEO.STOP,
            id: item.id,
          });
          dispatchContext({
            type: UPLOADING_VIDEO.DELETE,
            id: item.id,
          });
          context.removeUploadingVideoInfo(item.id);
          context.loadData();
        }
      }}
      onRetry={() => {
        dispatchContext({
          id: item.id,
          type: UPLOADING_VIDEO.UPLOAD,
        });
        Utils.simpleNotification({
          title: Strings.REVIEW_UPLOAD_BEGIN_TITLE(),
          description: Strings.REVIEW_UPLOAD_BEGIN_BODY(),
          thumbnailUrl: item.thumbnailUri,
          data: {
            type: 'mypage',
            id: context.props.route.params.logonUserId,
          },
        });
        Utils.scheduleBackgroundTask({
          onTask: async () => {
            const onSuccess = (result) => {
              dispatchContext({
                id: item.id,
                type: UPLOADING_VIDEO.UPLOAD_COMPLETE,
              });
              Utils.simpleNotification({
                title: Strings.REVIEW_UPLOAD_COMPLETE_TITLE(),
                description: Strings.REVIEW_UPLOAD_COMPLETE_BODY(item),
                thumbnailUrl: item.thumbnailUri,
                data: {
                  type: 'mypage',
                  id: context.props.route.params.logonUserId,
                },
              });
              // TODO: PreviousWrittenReview preference 컨트롤은 코드를 모아야 할 것 같음.
              context.removeUploadingVideoInfo(item.id);
            };
            const onError = (err) => {
              dispatchContext({
                id: item.id,
                type: UPLOADING_VIDEO.UPLOAD_ERROR,
              });
              console.log(err);
              Utils.simpleNotification({
                title: Strings.REVIEW_UPLOAD_ERROR_TITLE(),
                description: Strings.REVIEW_UPLOAD_ERROR_BODY(item),
                thumbnailUrl: item.thumbnailUri,
                data: {
                  type: 'mypage',
                  id: context.props.route.params.logonUserId,
                },
              });
            };
            const upload = async (id, onSuccess, onError) => {
              //adding uploading video
              const video = global.state.uploadingVideos.find((item) => id === item.id);
              const onExecution = (executionId) => {
                video.videoProcessingId = executionId;
              };
              if (
                video.trimInfo !== undefined &&
                video.trimInfo.trimEndTimeSec > video.trimInfo.trimBeginTimeSec
              ) {
                const videoUri = video.videoUri;
                try {
                  const trimBegin = video.trimInfo.trimBeginTimeSec;
                  const trimEnd = video.trimInfo.trimEndTimeSec;
                  const result = await Utils.trimVideo(videoUri, trimBegin, trimEnd, onExecution);
                  video.uploadingVideoUri = result;
                } catch (err) {
                  if (video.state !== Codes.UPLOADING_VIDEO_STATE.STOPPED) {
                    onError(err);
                  }
                  return;
                }
              } else {
                video.uploadingVideoUri = video.videoUri;
              }
              video.videoUri = video.uploadingVideoUri;
              try {
                const result = await APIprovider.createVideo(video);
                onSuccess(result);
              } catch (err) {
                if (video.state !== Codes.UPLOADING_VIDEO_STATE.STOPPED) {
                  onError(err);
                }
              }
              return;
            };
            await upload(item.id, onSuccess, onError);
          },
        });
      }}
    />
  );
}

function GraphViewInfo({ context, state }) {
  if (!state.data) {
    return null;
  }

  return (
    <View>
      <View style={{ position: 'absolute' }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Constants.COLOR_MAIN,
              fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
              fontSize: 22,
            }}
          >
            {state?.user?.g6AvgRatingScore}
          </Text>
        </View>
        <VictoryChart
          // padding={{ top: 50, left: 50, bottom: 50, right: 50 }}
          startAngle={90}
          endAngle={450}
          polar
          domain={{ y: [0, 1] }}
        >
          <VictoryGroup
            colorScale={['#d5d5d5', 'none']}
            style={{
              data: {
                fillOpacity: 0.4,
                strokeWidth: 1,
              },
            }}
          >
            {state.data.map((data, i) => {
              return <VictoryArea key={i} data={data} />;
            })}
          </VictoryGroup>

          {Object.keys(state.maxima).map((key, i) => {
            return (
              <VictoryPolarAxis
                key={i}
                style={{
                  axisLabel: {
                    fill: 'none',
                  },
                  axis: { stroke: 'none' },
                  grid: { stroke: 'none' },
                  tickLabels: {
                    fill: 'white',
                    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
                    fontWeight: '600',
                    fontSize: moderateScale(14),
                    padding: 15,
                  },
                }}
                labelPlacement="vertical"
                label={Strings.G_SIX[key.toUpperCase()]}
                axisValue={key}
              />
            );
          })}
        </VictoryChart>
      </View>
      <VictoryChart startAngle={90} endAngle={450} polar domain={{ y: [0, 1] }}>
        <VictoryGroup
          colorScale={[
            Constants.COLOR_MAIN,
            Constants.COLOR_MAIN,
            Constants.COLOR_MAIN,
            Constants.COLOR_MAIN,
            Constants.COLOR_MAIN,
          ]}
        >
          {state.data1.map((data, i) => {
            // console.log(data, i);
            return (
              <VictoryArea
                key={i}
                data={data}
                style={{ data: { fillOpacity: 0, strokeWidth: 1, opacity: 0.2 * (i + 1) } }}
              />
            );
          })}
        </VictoryGroup>

        {Object.keys(state.maxima1).map((key, i) => {
          return (
            <VictoryPolarAxis
              // dependentAxis
              key={i}
              style={{
                axis: { stroke: 'none' },
                grid: { stroke: 'none' },
                tickLabels: {
                  fill: 'none',
                },
              }}
            />
          );
        })}
      </VictoryChart>
    </View>
  );
}

function ProfileInfo({ context, user }) {
  const isMine = context.isMyUserPage();
  const tierName = Utils.getTierNameByClass(user.class);
  const countryCode = nationalities[user.countryCode]?.code ?? nationalities.KR.code;

  const openEditProfile = () => {
    context.props.navigation.navigate('EditProfile', {
      onProfileChanged: (profile) => {
        context.setState({
          user: {
            ...user,
            ...profile,
          },
        });
      },
      profilePicPath: user.profilePicPath,
      profilePicUrl: user.profilePicUrl,
      introduction: user.introduction,
      name: user.name,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      instagramId: user.instagramId,
      isHideContributionRevenue: user.isHideContributionRevenue,
    });
  };

  const openInstagram = () => {
    if (
      !user.instagramId ||
      user.instagramId.toString() === 'undefined' ||
      typeof user.instagramId === 'undefined'
    ) {
      return Alert.alert('Instagram', Strings.INSTAGRAM_ID_NOT_REGISTERED);
    }

    Linking.openURL(`https://instagram.com/${user.instagramId.trim()}`);
  };

  return (
    <View style={styles.profileInfoContainer}>
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          {isMine ? (
            <TouchableOpacity activeOpacity={0.8} onPress={openEditProfile}>
              <Avatar url={user.profilePicUrl} />
            </TouchableOpacity>
          ) : (
            <Avatar url={user.profilePicUrl} />
          )}
          <View style={styles.profileBody}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user.name}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                context.props.navigation.navigate('TierGuide', {
                  category: Strings.GREYD_GUIDE_TIER_DESCRIPTION,
                })
              }
            >
              <Text style={styles.profileMeta} numberOfLines={1}>
                {countryCode}
                {tierName ? ` · Lv.${Utils.capitalizeFirstLetter(tierName)}` : ''}
              </Text>
            </TouchableOpacity>
            <View style={styles.profileStatRow}>
              <Follower user={user} context={context} />
              <Following user={user} context={context} />
              <TouchableOpacity
                style={styles.instagramButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={openInstagram}
              >
                <FastImage
                  style={styles.instagramIcon}
                  source={require('../../Resources/img/iconRenewal/instagram.png')}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {isMine ? null : (
          <View style={styles.followButtonRow}>
            <NewFollowButton context={context} user={user} />
          </View>
        )}

        <UserIntroduction user={user} />
      </Card>

      {isMine ? (
        <ProfileButtons context={context} user={user} />
      ) : (
        <FollowedBy
          user={user}
          logonUserId={context.props.route.params.logonUserId}
          navigation={context.props.navigation}
        />
      )}
    </View>
  );
}

function GuestProfileInfo({ onPress }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.guestContainer}>
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar url={''} />
            <View style={styles.profileBody}>
              <Text style={styles.profileName}>{'Guest'}</Text>
              <Text style={styles.profileMeta}>{Strings.PLEASE_LOGIN}</Text>
            </View>
          </View>
        </Card>
        <Btn
          title={Strings.GUEST_USER_ALERT_TITLE}
          onPress={() => onPress()}
          style={styles.guestButton}
        />
      </View>
    </SafeAreaView>
  );
}

function SellerApprovalWaitingView({ navigation }) {
  return (
    <View>
      <View
        style={{
          ...styles.blockContainer,
          width: '90%',
          height: (Dimensions.get('window').width * 9) / 40,
          marginBottom: 10,
        }}
      >
        <Text style={{ ...styles.emptyMessage, marginVertical: 10 }}>
          {Strings.WAIT_FOR_APPROVAL_SELLER_BUTTON_TITLE}
        </Text>
        <Text style={{ ...styles.descriptionTitle, marginBottom: 10 }}>
          {Strings.WAIT_FOR_APPROVAL_SELLER_BUTTON_GUIDE1}
        </Text>
      </View>
    </View>
  );
}

function UserHistoryTab({ context, user, scrollRef }) {
  const focusedTab = context.state.focusedTab;
  const isReviewHistory = context.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.REVIEW;

  return (
    <View style={styles.historyTabWrap}>
      {/* 기능 다이어트 (COMMERCE off): 리뷰어/셀러 역할 토글 숨김 */}
      {FEATURES.COMMERCE && user.sellerStatus === Constants.SELLER_STATUS.APPROVED ? (
        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleToggleButton, isReviewHistory && styles.roleToggleButtonOn]}
            onPress={() => {
              context.setState({
                focusedUserHistoryTab: USER_HISTORY_TAB_INDEX.REVIEW,
              });
            }}
          >
            <Text style={[styles.roleToggleText, isReviewHistory && styles.roleToggleTextOn]}>
              {Strings.REVIEWER}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleToggleButton, !isReviewHistory && styles.roleToggleButtonOn]}
            onPress={() => {
              context.setState({
                focusedUserHistoryTab: USER_HISTORY_TAB_INDEX.PRODUCT,
              });
            }}
          >
            <Text style={[styles.roleToggleText, !isReviewHistory && styles.roleToggleTextOn]}>
              {Strings.SELLER}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <UserStatBox context={context} user={user} />

      <View style={styles.userHistoryTab}>
        <TouchableWithoutFeedback
          onPress={() => {
            context.setState({
              focusedTab: USER_TYPE_TAB_INDEX.REVIEWNEW,
            });
          }}
        >
          <View
            style={[
              styles.userHistoryTabButton,
              focusedTab === USER_TYPE_TAB_INDEX.REVIEWNEW && styles.userHistoryTabButtonOn,
            ]}
          >
            <Text
              style={
                focusedTab === USER_TYPE_TAB_INDEX.REVIEWNEW
                  ? styles.userHistoryTabNameSelected
                  : styles.userHistoryTabName
              }
            >
              {isReviewHistory ? Strings.REVIEWS : Strings.PRODUCTS}
            </Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          onPress={() => {
            context.setState({
              focusedTab: USER_TYPE_TAB_INDEX.QA,
            });

            if (scrollRef.current) {
              scrollRef.current.scrollToLocation({
                itemIndex: 1,
                sectionIndex: 1,
                viewPosition: 1,
              });
            }
          }}
        >
          <View
            style={[
              styles.userHistoryTabButton,
              focusedTab === USER_TYPE_TAB_INDEX.QA && styles.userHistoryTabButtonOn,
            ]}
          >
            <Text
              style={
                focusedTab === USER_TYPE_TAB_INDEX.QA
                  ? styles.userHistoryTabNameSelected
                  : styles.userHistoryTabName
              }
            >
              {Strings.QA}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

function AddNewReviewButton({ context }) {
  return (
    <View style={styles.addNewReviewContainer}>
      <TouchableNativeFeedback
        onPress={() => {
          context.props.navigation.navigate('AddingNewVideo');
        }}
      >
        <View style={styles.addNewReviewButton}>
          <FastImage
            style={styles.addNewReviewButtonIcon}
            source={require('../../Resources/img/icProductAdd34.png')}
          />
          <Text style={styles.addNewReviewTitle}>{Strings.ADD_NEW_REVIEW}</Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

function AddNewProductButton({ context }) {
  return (
    <View style={styles.addNewReviewContainer}>
      <TouchableNativeFeedback
        onPress={() => {
          context.props.navigation.navigate('AddingNewProduct');
        }}
      >
        <View style={styles.addNewReviewButton}>
          <FastImage
            style={styles.addNewReviewButtonIcon}
            source={require('../../Resources/img/icProductAdd34.png')}
          />
          <Text style={styles.addNewReviewTitle}>{Strings.ADD_NEW_PRODUCT}</Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}
// 리뷰 썸네일 셀 — CuratedHome 그리드와 동일 규격 (radius 10 · 앰버 ✓점수 · 흰 제목)
function ReviewGridItem({ item, index, videoList, navigation }) {
  const score = reviewScore(item);

  return (
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={0.85}
      onPress={() => {
        navigation.push('VideoPage', {
          videoId: item._id,
          videoType: 'userUpload',
          videoList: videoList,
          videoSortType: 'recent',
        });
      }}
    >
      <View style={[styles.gridThumbWrap, { height: GRID_HEIGHTS[index % 4] }]}>
        <FastImage source={{ uri: gridThumbUrl(item) }} style={styles.gridThumb} />
        {score ? <Badge tone="amber" text={`✓ ${score}`} style={styles.gridBadge} /> : null}
        <Text style={styles.gridTitle} numberOfLines={1}>
          {item.title || item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyReviewMessage({ title, description }) {
  return (
    <View style={styles.emptyMessageContainer}>
      <Text style={styles.emptyEmoji}>{'📭'}</Text>
      <Text style={styles.emptyMessage}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function UserHistoryView({ context, scrollRef }) {
  const global = useContext(Context);
  const focusedTab = context.state.focusedUserHistoryTab;
  const focuseInnerTab = context.state.focusedTab;
  const uploadingVideoList = global.state.uploadingVideos;
  const videoList = context.state.user.userUploadVideo;
  const productList = context.state.user.userUploadProduct;
  // 썸네일 없는 리뷰는 그리드에서 제외 (빈 칸 방지)
  const gridVideoList = videoList.filter((item) => gridThumbUrl(item));

  if (focuseInnerTab === USER_TYPE_TAB_INDEX.QA) {
    return (
      <View style={styles.qnaContainer}>
        <QNAList context={context} scrollRef={scrollRef} navigation={context.props.navigation} />
      </View>
    );
  }

  if (focusedTab === USER_HISTORY_TAB_INDEX.REVIEW && videoList.length === 0) {
    if (context.state.isRefreshing) {
      return (
        <View style={styles.emptyMessageContainer}>
          <ActivityIndicator size="small" color={COLORS.AMBER} />
        </View>
      );
    }
    if (context.isMyUserPage()) {
      return <AddNewReviewButton context={context} />;
    } else {
      return (
        <EmptyReviewMessage
          title={Strings.NO_REVIEW_UPLOADED}
          description={Strings.USERPAGE_EMPTY_REVIEW_DESC}
        />
      );
    }
  }

  return (
    <View style={styles.historyBody}>
      <FlatGrid
        maxItemsPerRow={2}
        itemDimension={Dimensions.get('window').width / 2 - 30}
        spacing={8}
        data={
          focusedTab === USER_HISTORY_TAB_INDEX.PRODUCT
            ? productList
            : context.isMyUserPage()
              ? [...uploadingVideoList, ...gridVideoList]
              : gridVideoList
        }
        renderItem={({ item, index }) => {
          if (focusedTab === USER_HISTORY_TAB_INDEX.PRODUCT) {
            return (
              <ProductListItemView
                navigation={context.props.navigation}
                data={item}
                style={{ height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_HEIGHT }}
                type={'grid'}
                logonUserId={context.props.route.params.logonUserId}
              />
            );
          } else if (focusedTab === USER_HISTORY_TAB_INDEX.REVIEW) {
            if (
              context.isMyUserPage() &&
              uploadingVideoList.length > 0 &&
              index < uploadingVideoList.length
            ) {
              return <UploadingVideoListItem context={context} item={item} />;
            }
            return (
              <ReviewGridItem
                item={item}
                index={index}
                videoList={videoList}
                navigation={context.props.navigation}
              />
            );
          }
        }}
        keyExtractor={(item) => item.videoId || item.productId || item.id || item._id}
        onRefresh={() => {}}
        refreshing={context.state.isRefreshing}
        onEndReached={({ distanceFromEnd }) => {
          if (context.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.REVIEW) {
            if (
              distanceFromEnd >= 0 &&
              context.state.user.userUploadVideo.length >= 10 &&
              !context.state.isRefreshing
            ) {
              context.onListEndReached();
            }
          } else {
            if (
              distanceFromEnd >= 0 &&
              context.state.user.userUploadProduct.length >= 10 &&
              !context.state.isRefreshing
            ) {
              context.onListEndReached();
            }
          }
        }}
        onEndReachedThreshold={0.5}
        style={styles.grid}
      />
    </View>
  );
}

function TierHelp({ navigation }) {
  return (
    <View style={{ flexDirection: 'row', marginLeft: moderateScale(20) }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          borderRadius: 10,
          marginTop: 5,
          marginRight: 10,
          backgroundColor: '#343434', //'#2a2a2a',
        }}
        onPress={() => {
          navigation.navigate('TierGuide', { category: Strings.GREYD_GUIDE_TIER_DESCRIPTION });
        }}
      >
        <FastImage
          style={{
            width: 10,
            height: 10,
            marginHorizontal: horizontalScale(5),
            marginVertical: verticalScale(5),
          }}
          source={require('../../Resources/img/newIcon/event-icon.png')}
        />
        <Text
          style={{
            fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
            fontSize: moderateScale(12),
            color: '#A0A0A0',
            marginRight: horizontalScale(5),
          }}
        >
          <Text
            style={{
              color: Constants.COLOR_MAIN,
              fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
              fontSize: moderateScale(12),
            }}
          >
            6{' '}
          </Text>
          {Strings.TIER_DESCRIPTION}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function HexagonWithPhoto({ profilePicUrl, borderColor, context, user }) {
  return (
    <TouchableOpacity
      style={{ zIndex: 0 }}
      onPress={() => {
        context.props.navigation.navigate('EditProfile', {
          onProfileChanged: (profile) => {
            context.setState({
              user: {
                ...user,
                ...profile,
              },
            });
          },
          profilePicPath: user.profilePicPath,
          profilePicUrl: user.profilePicUrl,
          introduction: user.introduction,
          name: user.name,
          email: user.email,
          phone: user.phone,
          countryCode: user.countryCode,
          instagramId: user.instagramId,
          isHideContributionRevenue: user.isHideContributionRevenue,
        });
      }}
    >
      <Svg height={moderateScale(100)} width={moderateScale(100)} viewBox="0 0 90 100">
        <Defs>
          <ClipPath id="hexagon-profile">
            <Path d="M34.64101615137754 4.999999999999999Q43.30126018922193 0 51.96152422706632 4.999999999999999L77.94228634059948 20Q86.60254037844386 25 86.60254037844386 35L86.60254037844386 65Q86.60254037844386 75 77.94228634059948 80L51.96152422706632 95Q43.30127018922193 100 34.64101615137754 95L8.660254037844387 80Q0 75 0 65L0 35Q0 25 8.660254037844387 20Z" />
          </ClipPath>
        </Defs>
        <SvgImage
          preserveAspectRatio="xMidYMid slice"
          width="90%"
          height="100%"
          href={profilePicUrl}
          clipPath="url(#hexagon-profile)"
        />

        <Path
          opacity={0.8}
          stroke={borderColor}
          strokeWidth="2"
          d="M34.64101615137754 4.999999999999999Q43.30127018922193 0 51.96152422706632 4.999999999999999L77.94228634059948 20Q86.60254037844386 25 86.60254037844386 35L86.60254037844386 65Q86.60254037844386 75 77.94228634059948 80L51.96152422706632 95Q43.30127018922193 100 34.64101615137754 95L8.660254037844387 80Q0 75 0 65L0 35Q0 25 8.660254037844387 20Z"
        />
      </Svg>
    </TouchableOpacity>
  );
}
function HexagonWithText({ grade, textColor, fillColor, size }) {
  return (
    <View style={{ zIndex: 0 }}>
      <Svg
        height={moderateScale(size ? size : 100)}
        width={moderateScale(size ? size : 100)}
        viewBox="0 0 90 100"
      >
        <Path
          opacity={0.6}
          // stroke={fillColor}
          stroke={'black'}
          strokeWidth="1"
          fill={fillColor}
          d="M34.64101615137754 4.999999999999999Q43.30127018922193 0 51.96152422706632 4.999999999999999L77.94228634059948 20Q86.60254037844386 25 86.60254037844386 35L86.60254037844386 65Q86.60254037844386 75 77.94228634059948 80L51.96152422706632 95Q43.30127018922193 100 34.64101615137754 95L8.660254037844387 80Q0 75 0 65L0 35Q0 25 8.660254037844387 20Z"
        />

        <SvgText
          x={'45%'}
          y={'55%'}
          textAnchor="middle"
          opacity={0.7}
          fill={textColor}
          // fontWeight="bold"
          fontSize={moderateScale(13)}
          letterSpacing="0"
          fontFamily="SUIT-Bold"
        >
          {grade}
        </SvgText>
      </Svg>
    </View>
  );
}

function EditProfileIcon({ context, user }) {
  return (
    <Shadow style={styles.editButtonShadow} containerStyle={styles.editButtonShadowContainer}>
      <TouchableOpacity
        style={styles.editButtonContainer}
        onPress={() => {
          context.props.navigation.navigate('EditProfile', {
            onProfileChanged: (profile) => {
              context.setState({
                user: {
                  ...user,
                  ...profile,
                },
              });
            },
            profilePicPath: user.profilePicPath,
            profilePicUrl: user.profilePicUrl,
            introduction: user.introduction,
            name: user.name,
            email: user.email,
            phone: user.phone,
            countryCode: user.countryCode,
            instagramId: user.instagramId,
            isHideContributionRevenue: user.isHideContributionRevenue,
          });
        }}
      >
        <FastImage
          style={styles.editButton}
          source={require('../../Resources/img/newIcon/edit-profile.png')}
        />
      </TouchableOpacity>
    </Shadow>
  );
}

function NewBlockButton() {
  return (
    <Shadow style={styles.editButtonShadow} containerStyle={styles.editButtonShadowContainer}>
      <TouchableOpacity
        disabled
        style={styles.newBlockButtonContainer}
        background={TouchableNativeFeedback.Ripple('#777', true)}
      >
        <View>
          <Text
            style={{
              color: T.COLORS.INK,
              fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
            }}
          >
            {Strings.BLOCKED_ACCOUNT}
          </Text>
        </View>
      </TouchableOpacity>
    </Shadow>
  );
}

function NewFollowButton({ context, user }) {
  const onFollowPressed = () => {
    const isFollow = !user.isFollowing ? true : false;
    Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
    if (!isFollow) {
      Alert.alert(
        Strings.CANCEL_FOLLOW_GUIDE_TITLE(user.name),
        Strings.CANCEL_FOLLOW_GUIDE_BODY,
        [
          {
            text: Strings.BACK_BUTTON_TITLE,
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: Strings.UNFOLLOW_BUTTON_TITLE,
            onPress: () => {
              APIprovider.followUser(user.userId, isFollow)
                .then((res) => {
                  if (res.result === 1) {
                    context.setState({
                      user: {
                        ...user,
                        isFollowing: isFollow,
                        followerCount: user.followerCount + (isFollow ? 1 : -1),
                      },
                    });
                  }
                })
                .catch((err) => {
                  console.log(err);
                  Alert.alert(
                    Strings.FAILED_TO_FOLLOW,
                    err.errorMsg ? err.errorMsg : '',
                    [{ text: Strings.OK }],
                    { cancelable: true },
                  );
                });
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      APIprovider.followUser(user.userId, isFollow)
        .then((res) => {
          if (res.result === 1) {
            context.setState({
              user: {
                ...user,
                isFollowing: isFollow,
                followerCount: user.followerCount + (isFollow ? 1 : -1),
              },
            });
          }
        })
        .catch((err) => {
          console.log(err);
          Alert.alert(
            Strings.FAILED_TO_FOLLOW,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    }
  };

  return (
    <Btn
      small
      style={styles.followBtn}
      title={user.isFollowing ? Strings.FOLLOWING : Strings.FOLLOW}
      variant={user.isFollowing ? 'ghost' : 'primary'}
      onPress={onFollowPressed}
    />
  );
}

export function VideoPageFollowButton({ user, context, setRatingList }) {
  return (
    // <Shadow style={styles.editButtonShadow} containerStyle={{ bottom: moderateScale(-15) }}>
    <View style={styles.editButtonShadow} containerStyle={{ bottom: moderateScale(-15) }}>
      <TouchableOpacity
        style={styles.newFollowButtonContainer}
        onPress={() => {
          const isFollow = !user.isFollowing ? true : false;
          Vibration.vibrate(Constants.VIBRATION_USER_ACTION);

          const userIdx = context.state.ratingList.findIndex((rating) => {
            return rating.user.userId === user.userId;
          });

          const newRatingList = context.state.ratingList.slice();

          if (!isFollow) {
            Alert.alert(
              Strings.CANCEL_FOLLOW_GUIDE_TITLE(user.name),
              Strings.CANCEL_FOLLOW_GUIDE_BODY,
              [
                {
                  text: Strings.BACK_BUTTON_TITLE,
                  onPress: () => {},
                  style: 'cancel',
                },
                {
                  text: Strings.UNFOLLOW_BUTTON_TITLE,
                  onPress: () => {
                    APIprovider.followUser(user.userId, false)
                      .then((res) => {
                        if (res.result === 1) {
                          newRatingList[userIdx].user.isFollowing = false;
                          newRatingList[userIdx].user.followerCount = user.followerCount - 1;

                          context.setState({
                            ratingList: newRatingList,
                          });
                          setRatingList(newRatingList);
                        }
                      })
                      .catch((err) => {
                        console.log(err);
                        Alert.alert(
                          Strings.FAILED_TO_FOLLOW,
                          err.errorMsg ? err.errorMsg : '',
                          [{ text: Strings.OK }],
                          { cancelable: true },
                        );
                      });
                  },
                },
              ],
              { cancelable: false },
            );
          } else {
            APIprovider.followUser(user.userId, true)
              .then((res) => {
                if (res.result === 1) {
                  newRatingList[userIdx].user.isFollowing = true;
                  newRatingList[userIdx].user.followerCount = user.followerCount + 1;

                  context.setState({
                    ratingList: newRatingList,
                  });
                  setRatingList(newRatingList);
                }
              })
              .catch((err) => {
                console.log(err);
                Alert.alert(
                  Strings.FAILED_TO_FOLLOW,
                  err.errorMsg ? err.errorMsg : '',
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          }
        }}
      >
        <Text
          style={{
            color: user.isFollowing ? T.COLORS.INK : 'white',
            fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
          }}
        >
          {user.isFollowing ? Strings.FOLLOWING : Strings.FOLLOW}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
function GradeTier({ context, user }) {
  const hexagonLeftPosition = Dimensions.get('window').width / 2 - horizontalScale(50);

  return (
    <View style={{ height: moderateScale(270) }}>
      <View style={styles.hexagon(205 + 4, hexagonLeftPosition)}>
        {user.class === 5 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={T.COLORS.AMBER}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_GIVER}
            textColor={'#3a3a3a'}
            fillColor={T.COLORS.AMBER}
          />
        )}
      </View>
      <View style={styles.hexagon(285, hexagonLeftPosition - moderateScale(45 - 1))}>
        {user.class === 4 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={T.COLORS.INK}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_ARTISAN}
            textColor={'white'}
            fillColor={T.COLORS.INK}
          />
        )}
      </View>
      <View style={styles.hexagon(285, hexagonLeftPosition + moderateScale(45 - 1))}>
        {user.class === 3 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={T.COLORS.GREY}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_OPERATOR}
            textColor={'white'}
            fillColor={T.COLORS.GREY}
          />
        )}
      </View>
      <View style={styles.hexagon(365 - 4, hexagonLeftPosition - moderateScale(90 - 2.5))}>
        {user.class === 2 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={T.COLORS.GREY}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_STRIVER}
            textColor={'#1a1a1a'}
            fillColor={T.COLORS.GREY}
          />
        )}
      </View>
      <View style={styles.hexagon(365 - 4, hexagonLeftPosition)}>
        {user.class === 1 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={T.COLORS.LINE}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_EXPLORER}
            textColor={'#2a2a2a'}
            fillColor={T.COLORS.LINE}
          />
        )}
      </View>
      <View style={styles.hexagon(365 - 4, hexagonLeftPosition + moderateScale(90 - 2.5))}>
        {user.class === 0 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={Constants.TIER_COLORS.PIONEER}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_PIONEER}
            textColor={'#3a3a3a'}
            fillColor={Constants.TIER_COLORS.PIONEER}
          />
        )}
      </View>
    </View>
  );
}

function ProfileButtons({ context, user, isGuest }) {
  return (
    <View style={styles.profileButtonsRow}>
      <TouchableOpacity
        style={styles.profileButton}
        activeOpacity={0.8}
        onPress={() => {
          context.props.navigation.navigate('BookmarkList');
        }}
      >
        <FastImage
          style={styles.profileButtonIcon}
          source={require('../../Resources/img/iconRenewal/bookmark.png')}
        />
        <Text style={styles.profileButtonLabel}>{Strings.BOOKMARKS}</Text>
      </TouchableOpacity>
      {/* 기능 다이어트 (COMMERCE off): 장바구니·주문 내역 진입점 숨김 */}
      <View style={styles.profileButton}>
        {context.isMyUserPage() || isGuest ? (
          <RewardDetail context={context} />
        ) : (
          <GreydTierName context={context} tier={user.class} />
        )}
      </View>
    </View>
  );
}

function GradeCount({ user }) {
  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: horizontalScale(90),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: T.COLORS.INK,
            fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
            fontSize: moderateScale(20),
          }}
        >
          {user.g6RatingCount}
        </Text>
      </View>
      <Text
        style={{
          color: T.COLORS.INK,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
          fontSize: moderateScale(14),
          marginTop: verticalScale(5),
          textAlign: 'center',
        }}
      >
        {Strings.GREYD_COUNT}
      </Text>
    </View>
  );
}
function Follower({ user, context }) {
  return (
    <TouchableOpacity
      style={styles.statLink}
      onPress={() => {
        const params = context.isMyUserPage() ? {} : { targetUserId: user.userId };
        context.props.navigation.push('FollowList', params);
      }}
    >
      <Text style={styles.statLinkLabel}>{Strings.FOLLOWERS}</Text>
      <Text style={styles.statLinkValue}>{user.followerCount}</Text>
    </TouchableOpacity>
  );
}
function Following({ user, context }) {
  return (
    <TouchableOpacity
      style={styles.statLink}
      onPress={() => {
        const params = context.isMyUserPage() ? {} : { targetUserId: user.userId };
        context.props.navigation.push('FollowList', params);
      }}
    >
      <Text style={styles.statLinkLabel}>{Strings.FOLLOWING}</Text>
      <Text style={styles.statLinkValue}>{user.followingCount}</Text>
    </TouchableOpacity>
  );
}
function RevenueAmount({ user, context }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue} numberOfLines={1}>
        {!context.isMyUserPage() && user.isHideContributionRevenue ? (
          Strings.CONTRIBUTION_HIDED
        ) : (
          <Text>
            {getLanguage() === 'en' ? '$ ' : ''}
            {Utils.numberWithCommas(
              changeCurrency({
                current: user.totalRevenue,
                currencyRate: context?.props?.route?.params?.KRWPerUSD,
              }),
            )}
            {getLanguage() === 'ko' ? ' 원' : ''}
          </Text>
        )}
      </Text>
      <Text style={styles.statLabel}>{Strings.CONTRIBUTION}</Text>
    </View>
  );
}
function ReviewReward({ user, context }) {
  const { navigation, totalReward } = context.props;

  return (
    <TouchableOpacity
      style={styles.statItem}
      onPress={() => {
        if (context.isMyUserPage()) {
          navigation.navigate('RewardList');
        }
      }}
    >
      <Text style={styles.statValue} numberOfLines={1}>
        {!context.isMyUserPage() && user.isHideContributionRevenue ? (
          Strings.CONTRIBUTION_HIDED
        ) : (
          <Text>
            {getLanguage() === 'en' ? '$ ' : ''}
            {Utils.numberWithCommas(
              changeCurrency({
                current: !context.isMyUserPage() ? user.totalReward : totalReward,
                currencyRate: context?.props?.route?.params?.KRWPerUSD,
              }),
            )}
            {getLanguage() === 'ko' ? ' 원' : ''}
          </Text>
        )}
      </Text>
      <Text style={styles.statLabel}>{Strings.REVIEW_REWARDS}</Text>
    </TouchableOpacity>
  );
}
function RewardDetail({ context }) {
  const { userId, name, introduction, profilePicUrl } = context.state.user;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.profileButtonInner}
      onPress={() => {
        if (context.isMyUserPage()) {
          context.props.navigation.navigate('QRCode', {
            id: userId,
            title: name,
            description: introduction,
            thumbnailUrl: profilePicUrl,
          });
        }
      }}
    >
      <FastImage
        style={styles.profileButtonIcon}
        source={require('../../Resources/img/iconRenewal/qr.png')}
      />
      <Text style={styles.profileButtonLabel}>{Strings.QR_CODE}</Text>
    </TouchableOpacity>
  );
}
function GreydTierName({ context, tier }) {
  const tierName = Utils.getTierNameByClass(tier);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.profileButtonInner}
      onPress={() => {
        context.props.navigation.navigate('TierGuide', {
          category: Strings.GREYD_GUIDE_TIER_DESCRIPTION,
        });
      }}
    >
      <Text style={styles.statValue}>{tierName ? Utils.capitalizeFirstLetter(tierName) : ''}</Text>
      <Text style={styles.profileButtonLabel}>{Strings.TIER}</Text>
    </TouchableOpacity>
  );
}
function UserStatBox({ user, context }) {
  return (
    <Card style={styles.statCard}>
      <TouchableOpacity
        style={styles.statItem}
        onPress={() =>
          context.props.navigation.navigate('G6UserChart', {
            context: context,
            state: context.state,
          })
        }
      >
        <Text style={styles.statValue}>{user.g6AvgRatingScore}</Text>
        <Text style={styles.statLabel}>{Strings.AVERAGE_GRADE}</Text>
      </TouchableOpacity>
      {/* 기능 다이어트 (COMMERCE off): 기여 매출 지표 숨김 */}
      <ReviewReward user={user} context={context} />
    </Card>
  );
}

function UserIntroduction({ user }) {
  if (!user.introduction) {
    return null;
  }

  return (
    <View style={styles.introBox}>
      <Text style={styles.introLabel}>{Strings.ABOUT_ME}</Text>
      <Text style={styles.introText}>{user.introduction}</Text>
    </View>
  );
}

export default function UserScreenWrapper(props) {
  const keyboardHooks = useKeyboard();

  const { totalRevenue, totalReward, currencyRate } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const dispatchUser = (user) => {
    dispatch(setUser({ user }));
  };

  const ref = React.useRef(null);
  // useScrollToTop(ref);

  return isGuestUser(props.route.params.logonUserId) ? (
    <GuestProfileInfo
      {...props}
      onPress={() => {
        if (isGuestUser(props.route.params.logonUserId)) {
          props.route.path =
            props.route.params.pageOwnerUserId === props.route.params.logonUserId ||
            props.route.params.pageOwnerUserId === 'undefined'
              ? 'myPage'
              : `users/${props.route.params.pageOwnerUserId}:${props.route.params.pageOwnerUserName}`;
        }
        menuLogout(props);
      }}
    />
  ) : (
    <UserPageScreen
      {...props}
      dispatchUser={dispatchUser}
      totalRevenue={totalRevenue}
      totalReward={totalReward}
      currencyRate={currencyRate}
      scrollRef={ref}
      keyboardHooks={keyboardHooks}
    />
  );
}

class UserPageScreen extends React.Component {
  static contextType = Context;
  isMyUserPage() {
    return this.props.route.params.pageOwnerUserId === this.props.route.params.logonUserId;
  }

  constructor(props) {
    super(props);

    const { logonUserId, logonUserName, pageOwnerUserId, pageOwnerUserName } =
      this.props.route.params;
    this.state = {
      user: {
        userId: pageOwnerUserId !== '' ? pageOwnerUserId : logonUserId,
        name: pageOwnerUserName !== '' ? pageOwnerUserName : logonUserName,
        email: '',
        phone: '',
        class: 0,
        profilePicUrl: '',
        profilePicPath: '',
        introduction: '',
        userUploadVideo: [],
        userUploadProduct: [],
        ratingScore: 0,
        followerCount: 0,
        followingCount: 0,
        revenueAmount: 0,
        profitAmount: 0,
        videoCount: 0,
        productCount: 0,
        isFollowing: false,
        isBlocked: false,
        isSeller: '',
        sellerStatus: '',
        g6RatingScoreGraph: Strings.SCORE_INNER,
      },
      isUserRefreshing: false,
      isRefreshing: true,
      focusedUserHistoryTab: USER_HISTORY_TAB_INDEX.REVIEW,
      focusedTab: props.route.params?.isQuestion
        ? USER_TYPE_TAB_INDEX.QA
        : USER_TYPE_TAB_INDEX.REVIEWNEW,
      QAfocusedTab: QA_TAB_INDEX.Reviewer,
      isInvalidContents: false,
      isShowingRevenueGuideModal: false,
      uploadingVideos: [],
      currencyRate: 0,
      data: null,
      maxima: null,
      data1: this.processData(Strings.SCORE_OUTLINE),
      maxima1: this.getMaxima(Strings.SCORE_OUTLINE),
      logonUser: null,
    };
  }

  getMaxima(data) {
    const groupedData = Object.keys(data[0]).reduce((memo, key) => {
      memo[key] = data.map((d) => d[key]);
      return memo;
    }, {});
    return Object.keys(groupedData).reduce((memo, key) => {
      memo[key] = Math.max(...groupedData[key]);
      return memo;
    }, {});
  }

  processData(data) {
    const maxByGroup = this.getMaxima(data);
    const makeDataArray = (d) => {
      return Object.keys(d).map((key) => {
        return { x: key, y: d[key] / maxByGroup[key] };
      });
    };
    return data.map((datum) => makeDataArray(datum));
  }

  menuReportClicked() {
    this.setState({
      isInvalidContents: true,
    });
  }

  menuBlockClicked() {
    Alert.alert(
      Strings.BLOCK_SOMEONE_QUESTION({
        userName: this.props.route.params.pageOwnerUserName,
      }),
      Strings.BLOCK_GUIDELINES({
        userName: this.props.route.params.pageOwnerUserName,
      }),
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
            APIprovider.blockUser(this.state.user.userId)
              .then(({ result }) => {
                if (result === 1) {
                  Alert.alert(
                    Strings.BLOCK_SOMEONE_COMPLETE({
                      userName: this.props.route.params.pageOwnerUserName,
                    }),
                    Strings.BLOCK_COMPLETE_GUIDELINES,
                    [
                      {
                        text: Strings.OK,
                        onPress: () => {
                          this.loadData();
                        },
                      },
                    ],
                  );
                } else if (result === -1) {
                  Alert.alert(Strings.BLOCKED_ALREADY, Strings.BLOCK_COMPLETE_GUIDELINES, [
                    {
                      text: Strings.OK,
                      onPress: () => {
                        this.loadData();
                      },
                    },
                  ]);
                }
              })
              .catch(() => {
                Alert.alert(
                  Strings.BLOCK_SOMEONE_FAILED({
                    userName: this.props.route.params.pageOwnerUserName,
                  }),
                  Strings.RETRY_GUIDELINES,
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          },
        },
      ],
      { cancelable: false },
    );
  }

  menuUnblockClicked() {
    Alert.alert(
      Strings.UNBLOCK_SOMEONE_QUESTION({
        userName: this.props.route.params.pageOwnerUserName,
      }),
      Strings.UNBLOCK_COMPLETE_GUIDELINES({
        userName: this.props.route.params.pageOwnerUserName,
      }),
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
            APIprovider.unblockUser(this.state.user.userId)
              .then(({ result }) => {
                if (result === 1) {
                  Alert.alert(
                    Strings.UNBLOCK_SOMEONE_COMPLETE({
                      userName: this.props.route.params.pageOwnerUserName,
                    }),
                    Strings.UNBLOCK_COMPLETE_GUIDELINES({
                      userName: this.props.route.params.pageOwnerUserName,
                    }),
                    [
                      {
                        text: Strings.OK,
                        onPress: () => {
                          this.loadData();
                        },
                      },
                    ],
                  );
                } else if (result === -1) {
                  Alert.alert(
                    Strings.UNBLOCKED_ALREADY,
                    Strings.UNBLOCK_COMPLETE_GUIDELINES({
                      userName: this.props.route.params.pageOwnerUserName,
                    }),
                    [
                      {
                        text: Strings.OK,
                        onPress: () => {
                          this.loadData();
                        },
                      },
                    ],
                  );
                }
              })
              .catch(() => {
                Alert.alert(
                  Strings.UNBLOCK_SOMEONE_FAILED({
                    userName: this.props.route.params.pageOwnerUserName,
                  }),
                  Strings.RETRY_GUIDELINES,
                  [{ text: Strings.OK }],
                  { cancelable: true },
                );
              });
          },
        },
      ],
      { cancelable: false },
    );
  }

  menuOthers = () => [
    {
      key: 'report_user',
      name: Strings.REPORT,
      icon: <IconMaterialIcons name="report" color={'#000'} size={20} />,
      onClicked: this.menuReportClicked.bind(this),
    },
    {
      key: 'block_user',
      name: this.state.user.isBlocked ? Strings.UNBLOCK : Strings.BLOCK,
      icon: <IconMaterialIcons name="block" color={'#000'} size={20} />,
      onClicked: this.state.user.isBlocked
        ? this.menuUnblockClicked.bind(this)
        : this.menuBlockClicked.bind(this),
    },
    {
      name: Strings.SHARE,
      icon: <IconMaterialIcons name="share" color={'#000'} size={20} />,
      onClicked: async () => {
        const { userId, name, introduction, profilePicUrl } = this.state.user;
        const result = await APIprovider.getUserProfileDynamicLink(
          userId,
          name,
          introduction,
          profilePicUrl,
        );

        console.log(result);

        if (result.success) {
          const url = result?.shortLink;
          const message = name;

          shareLink({ url, message, description: introduction });
        }
      },
    },
  ];

  loadData(isUserRefreshing = false) {
    this.setState({
      isRefreshing: true,
    });

    if (this.props.route.params.pageOwnerUserId !== this.props.route.params.logonUserId) {
      // APIprovider.getUserDetails(this.props.route.params.logonUserId).then((res) => {
      //   this.setState({ logonUser: res });
      // });
    }

    APIprovider.getUserDetails(
      this.props.route.params.pageOwnerUserId || this.props.route.params.logonUserId,
    )
      // .then(this.getUserDetailsCallback.bind(this))
      .then((res) => {
        if (!APIprovider.isFailure(res)) {
          this.getUserDetailsCallback(res);
        } else {
          // 일시적 네트워크 오류로 강제 로그아웃하지 않는다 — 안내 후 새로고침 상태만 해제
          this.setState({ isRefreshing: false, isUserRefreshing: false });
          Alert.alert(Strings.FAILED_TO_LOAD_DATA, res?.errorMsg || '', [{ text: Strings.OK }], {
            cancelable: true,
          });
        }
      })
      .catch((err) => {
        console.error('getUserDetails', err);

        this.setState({
          isRefreshing: false,
          isUserRefreshing: false,
        });
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });

    APIprovider.getCurrencyRate('USD').then((res) =>
      this.setState({ currencyRate: res.currencyRate }),
    );
  }

  getUserDetailsCallback(data) {
    if (data.isDeleted) {
      Alert.alert(Strings.DELETED_USER_TITLE, Strings.DELETED_USER_BODY, [
        {
          text: Strings.OK,
          onPress: () => {
            this.props.navigation.pop();
          },
        },
      ]);
    } else {
      this.context.dispatch({
        type: USER.SET,
        value: {
          ...data,
          userUploadVideo: data.userUploadVideo.videoList,
          userUploadProduct: data.userUploadProduct.productList,
        },
      });

      if (data.sellerStatus || data.sellerStatus === '') {
        Preference.set('userIsSeller', data.sellerStatus);
      }

      if (this.isMyUserPage()) {
        this.props.dispatchUser(data);
      }

      // setState 직후 this.state를 읽으면 이전 값(stale)이라, 그래프 데이터를
      // 지역 변수로 만들어 두 setState 모두에 동일한 최신 값을 사용한다.
      const newG6RatingScoreGraph = [
        getLanguage() === 'ko'
          ? {
              표현력: data.g6RatingScore.authentic,
              재미: data.g6RatingScore.entertaining,
              매력도: data.g6RatingScore.attractive,
              정보성: data.g6RatingScore.informative,
              영상미: data.g6RatingScore.aesthetic,
              독창성: data.g6RatingScore.creative,
            }
          : {
              Authentic: data.g6RatingScore.authentic,
              Informative: data.g6RatingScore.informative,
              Attractive: data.g6RatingScore.attractive,
              Entertaining: data.g6RatingScore.entertaining,
              Aesthetic: data.g6RatingScore.aesthetic,
              Creative: data.g6RatingScore.creative,
            },
        this.state.user.g6RatingScoreGraph[1],
      ];

      this.setState({
        user: {
          ...data,
          userUploadVideo: data.userUploadVideo.videoList,
          userUploadProduct: data.userUploadProduct.productList,
          g6RatingScoreGraph: newG6RatingScoreGraph,
        },
        isRefreshing: false,
        isUserRefreshing: false,
      });

      this.props.navigation.setParams({
        isFollowing: data.isFollowing,
        isBlocked: data.isBlocked,
      });

      this.setState({
        data: this.processData(newG6RatingScoreGraph),
        maxima: this.getMaxima(newG6RatingScoreGraph),
      });
    }
  }

  componentDidUpdate() {
    if (
      this.context.state.uploadingVideos.find(
        (item) => item.state === Codes.UPLOADING_VIDEO_STATE.UPLOADED,
      )
    ) {
      this.context.state.uploadingVideos.map((item) => {
        if (item.state === Codes.UPLOADING_VIDEO_STATE.UPLOADED) {
          this.context.dispatch({
            type: UPLOADING_VIDEO.DELETE,
            id: item.id,
          });
        }
      });
      this.loadData();
    }
  }

  componentDidMount() {
    if (Platform.OS !== 'ios') {
      StatusBar.setBackgroundColor(COLORS.BG);
    }

    this.props.navigation.setOptions({
      title: null,
    });
    Preference.get('userIsSeller').then((value) => {
      this.props.navigation.setParams({
        logonUserIsSeller: value,
      });
      this.props.route.params.setLogonUserIsSeller(value);
    });

    const { navigation } = this.props;

    if (this.isMyUserPage()) {
      navigation.setOptions({
        headerShown: false,
      });
    } else {
      // 다른 사용자 페이지일 경우
      navigation.setOptions({
        title: null,
      });
    }

    this.loadData();
    this.loadUploadingVideosInfo();
    this._unsubscribeFocusEvent = this.props.navigation.addListener('focus', () => {
      //this.loadData();
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocusEvent();
  }

  onFollowButtonPressed = async function () {};
  onMessageButtonPressed = async function () {};

  loadUploadingVideosInfo = () => {
    const dispatchContext = this.context.dispatch;
    Preference.get('UploadingReviews').then((value) => {
      const uploadingReviews = value ? JSON.parse(value) : {};
      const keys = Object.keys(uploadingReviews);
      if (this.context.state.uploadingVideos.length === 0 && keys.length !== 0) {
        keys.forEach((key) => {
          dispatchContext({
            id: key,
            type: UPLOADING_VIDEO.ADD,
            initialState: Codes.UPLOADING_VIDEO_STATE.ERROR,
            payload: uploadingReviews[key],
          });
        });
      }
    });
  };

  removeUploadingVideoInfo = (videoId) => {
    Preference.get('UploadingReviews').then((value) => {
      const uploadingReviews = value ? JSON.parse(value) : {};
      delete uploadingReviews[videoId];
      Preference.set('UploadingReviews', JSON.stringify(uploadingReviews));
    });
  };

  onListLoadError = function () {
    this.setState({ isRefreshing: false });
  };

  onListAdded = function (data) {
    if (this.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.REVIEW) {
      this.setState({
        user: {
          ...this.state.user,
          userUploadVideo: [...this.state.user.userUploadVideo, ...data.videoList],
        },
        isRefreshing: false,
      });
    } else {
      // TODO: product adding
      this.setState({
        user: {
          ...this.state.user,
          userUploadProduct: [...this.state.user.userUploadProduct, ...data.productList],
        },
        isRefreshing: false,
      });
    }
  };

  onListEndReached = function () {
    if (this.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.REVIEW) {
      this.setState({ isRefreshing: true });
      const offset =
        this.state.user.userUploadVideo[this.state.user.userUploadVideo.length - 1].createdAt;
      const limit = 15;
      APIprovider.getUserUploadVideoList(
        this.state.user.userId,
        offset,
        this.state.user.userUploadVideo.length,
        limit,
      )
        .then(this.onListAdded.bind(this))
        .catch(this.onListLoadError.bind(this));
    } else {
      // TODO: product adding
    }
  };

  profileScreenSections(scrollRef) {
    return [
      {
        title: [<View key={'profileScreenSections view key'} />],
        data: [<ProfileInfo context={this} user={this.state.user} />],
      },
      {
        title: [
          <UserHistoryTab
            key={'UserHistoryTab key'}
            context={this}
            user={this.state.user}
            scrollRef={scrollRef}
          />,
        ],
        data: [
          <UserHistoryView key={'UserHistoryView key'} context={this} scrollRef={scrollRef} />,
        ],
      },
    ];
  }
  render() {
    const { navigation, scrollRef } = this.props;
    const { user, isUserRefreshing, isInvalidContents, isShowingRevenueGuideModal } = this.state;
    return (
      <SafeAreaView style={styles.container}>
        {this.props.route.params.isPushedPage === undefined && this.isMyUserPage() ? (
          <>
            <MyProfileHeader navigation={navigation} user={user} context={this} />
          </>
        ) : (
          <OtherProfileHeader context={this} />
        )}
        {/* <KeyboardAwareSectionList */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'height' : null}
          style={{ flex: 1 }}
          keyboardVerticalOffset={25}
        >
          <SectionList
            stickySectionHeadersEnabled
            sections={this.profileScreenSections(scrollRef)}
            style={styles.sectionList}
            keyExtractor={(item, index) => 'profileScreenSection' + index}
            renderItem={({ item }) => item}
            renderSectionHeader={({ section: { title } }) => title}
            refreshControl={
              <RefreshControl
                tintColor={COLORS.GREY}
                refreshing={isUserRefreshing}
                onRefresh={() => {
                  this.setState({ isUserRefreshing: true });
                  this.loadData(true);
                }}
              />
            }
            ref={scrollRef}
          />
        </KeyboardAvoidingView>

        <ReportModal
          visible={isInvalidContents}
          onCancel={() => {
            this.setState({ isInvalidContents: false });
          }}
          contentInfo={{ type: 'user', id: user.userId }}
        />
        <RevenueGuideModal
          visible={isShowingRevenueGuideModal}
          navigation={navigation}
          onCancel={() => {
            this.setState({ isShowingRevenueGuideModal: false });
          }}
        />
      </SafeAreaView>
    );
  }
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  sectionList: {
    backgroundColor: COLORS.BG,
  },

  // 헤더
  orderHeaderContainer: {
    width: '100%',
    paddingTop: T.TOP_INSET,
    paddingHorizontal: 10,
    paddingBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BG,
  },
  headerRightButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingTop: T.TOP_INSET,
    paddingHorizontal: 16,
    paddingBottom: 6,
    alignItems: 'center',
    backgroundColor: COLORS.BG,
  },
  headerTitle: {
    ...TYPE.H_TITLE,
  },
  headerButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 24,
    height: 24,
  },
  actionButton: {
    borderRadius: 44,
    overflow: 'hidden',
  },

  // 프로필 카드
  profileInfoContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  profileCard: {
    paddingVertical: 15,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBody: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontFamily: FONT.Bold,
    fontSize: 15,
    color: COLORS.INK,
  },
  profileMeta: {
    ...TYPE.SUB,
    marginTop: 2,
  },
  profileStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  statLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statLinkLabel: {
    ...TYPE.SUB,
  },
  statLinkValue: {
    fontFamily: FONT.Bold,
    fontSize: 11.5,
    color: COLORS.INK,
    marginLeft: 3,
  },
  instagramButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramIcon: {
    width: 18,
    height: 18,
  },
  followButtonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  followBtn: {
    flex: 1,
  },
  introBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.LINE,
  },
  introLabel: {
    ...TYPE.LABEL,
    marginBottom: 3,
  },
  introText: {
    ...TYPE.BODY,
    lineHeight: 18,
  },

  // 프로필 하단 버튼 행
  profileButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 9,
  },
  profileButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  profileButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonIcon: {
    width: 22,
    height: 22,
  },
  profileButtonLabel: {
    ...TYPE.XS,
    marginTop: 5,
  },

  // 게스트
  guestContainer: {
    padding: 16,
    gap: 10,
  },
  guestButton: {
    marginTop: 4,
  },

  // 통계 카드 + 탭
  historyTabWrap: {
    backgroundColor: COLORS.BG,
    paddingHorizontal: 16,
    paddingTop: 9,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: FONT.ExtraBold,
    fontSize: 16,
    color: COLORS.INK,
  },
  statLabel: {
    ...TYPE.XS,
    marginTop: 4,
    textAlign: 'center',
  },
  roleToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    borderRadius: T.RADIUS.PILL,
    padding: 2,
    marginBottom: 9,
  },
  roleToggleButton: {
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: T.RADIUS.PILL,
  },
  roleToggleButtonOn: {
    backgroundColor: COLORS.AMBER,
  },
  roleToggleText: {
    fontFamily: FONT.Bold,
    fontSize: 11.5,
    color: COLORS.GREY,
  },
  roleToggleTextOn: {
    color: COLORS.ON_AMBER,
  },
  userHistoryTab: {
    flexDirection: 'row',
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
  },
  userHistoryTabButton: {
    paddingHorizontal: 4,
    paddingBottom: 7,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  userHistoryTabButtonOn: {
    borderBottomColor: COLORS.AMBER,
  },
  userHistoryTabName: {
    fontFamily: FONT.Bold,
    fontSize: 13,
    color: COLORS.GREY,
  },
  userHistoryTabNameSelected: {
    fontFamily: FONT.Bold,
    fontSize: 13,
    color: COLORS.INK,
  },

  // 리뷰 그리드
  historyBody: {
    paddingBottom: 20,
  },
  grid: {
    marginHorizontal: 12,
  },
  gridItem: {
    flex: 1,
  },
  gridThumbWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.TRACK,
  },
  gridThumb: {
    ...StyleSheet.absoluteFillObject,
  },
  gridBadge: {
    position: 'absolute',
    left: 7,
    top: 7,
  },
  gridTitle: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 7,
    fontFamily: FONT.Bold,
    fontSize: 10,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 빈 상태
  emptyMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 46,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  emptyMessage: {
    fontFamily: FONT.Bold,
    fontSize: 13,
    color: COLORS.INK,
    textAlign: 'center',
  },
  emptyDescription: {
    ...TYPE.SUB,
    marginTop: 5,
    textAlign: 'center',
  },
  descriptionTitle: {
    ...TYPE.SUB,
    textAlign: 'center',
  },

  // 리뷰 추가 / 셀러 (COMMERCE)
  addNewReviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  addNewReviewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 34,
    borderRadius: T.RADIUS.CARD,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
  },
  addNewReviewButtonIcon: {
    width: 28,
    height: 28,
    alignSelf: 'center',
  },
  addNewReviewTitle: {
    marginTop: 10,
    fontFamily: FONT.Bold,
    fontSize: 12.5,
    color: COLORS.INK,
    alignSelf: 'center',
  },
  blockContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: T.RADIUS.CARD,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  sellerPageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: T.RADIUS.BTN,
    backgroundColor: COLORS.AMBER,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  sellerButtonLabel: {
    ...TYPE.BTN,
  },

  // QNA (QNAList가 참조)
  qnaContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: COLORS.BG,
  },
  descriptionText: {
    ...TYPE.BODY,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  qnaSentence: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qnaRefresh: {
    fontFamily: FONT.Bold,
    fontSize: 12,
    color: COLORS.INK,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: T.RADIUS.BTN_SM,
    borderColor: COLORS.LINE,
    borderWidth: 1,
    textAlign: 'center',
  },
  qnaLoadingContainer: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },

  // 레거시 (티어 육각형·차단/수정 버튼 등에서 계속 참조)
  hexagon: (top, left) => ({
    position: 'absolute',
    top: moderateScale(top - 205),
    left: left,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  editButtonShadowContainer: {
    position: 'absolute',
    bottom: verticalScale(0),
    zIndex: 2,
  },
  editButtonShadow: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  editButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 100,
    backgroundColor: COLORS.SURFACE,
  },
  editButton: {
    width: 22,
    height: 22,
  },
  newBlockButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: horizontalScale(120),
    height: 30,
    borderRadius: 14,
    backgroundColor: COLORS.LINE,
  },
  // 비디오 페이지 오버레이(어두운 배경)에서 재사용 — 톤 유지
  newFollowButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: horizontalScale(70),
    borderRadius: 14,
    backgroundColor: T.COLORS.AMBER,

    paddingVertical: 2,
    borderColor: T.COLORS.INK,
    borderWidth: 1,
    marginLeft: 14,
  },
  profilePicnew: {
    width: 100,
    height: 100,
  },
});
