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
import { Flag } from 'react-native-country-picker-modal';
import Preference from 'react-native-default-preference';
import FastImage from 'react-native-fast-image';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { ActivityIndicator } from 'react-native-paper';
import { Shadow } from 'react-native-shadow-2';
import { FlatGrid } from 'react-native-super-grid';
import { ClipPath, Defs, Path, Svg, Image as SvgImage, Text as SvgText } from 'react-native-svg';
import IconAntDesign from 'react-native-vector-icons/AntDesign';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { VictoryArea, VictoryChart, VictoryGroup, VictoryPolarAxis } from 'victory-native';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
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
import VideoListItemView from '../../Components/VideoListItemView';
import Utils, { changeCurrency, isGuestUser, menuLogout } from '../../Components/utils';
import { horizontalScale, moderateScale, verticalScale } from '../../Components/utils/scailing';
import { shareLink } from '../../Components/utils/share';
import { Context } from '../../Contexts';
import { UPLOADING_VIDEO, USER } from '../../Contexts/actionTypes';
import { setUser } from '../../slices/user';
import FollowedBy from './FollowedBy';
import UserProfilePicViewUpdate from './UserProfilePicViewUpdate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={{ ...styles.orderHeaderContainer, paddingTop: Platform.OS === 'android' ? top : 0 }}
    >
      <ActionButton
        renderItem={
          <FastImage
            style={styles.headerButton}
            source={require('../../Resources/img/iconRenewal/backward.png')}
          />
        }
        onPress={() => {
          if (Platform.OS !== 'ios') {
            StatusBar.setBackgroundColor(Constants.TIER_COLORS.ARTISAN);
            StatusBar.setBarStyle('default', true);
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

  const { top } = useSafeAreaInsets();

  return (
    <View style={{ ...styles.headerContainer, paddingTop: Platform.OS === 'android' ? top : 0 }}>
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
  const tierName = Utils.getTierNameByClass(user.class);
  const tierColor = Utils.getTierColorByTierName(tierName);

  return (
    <View style={styles.profileInfoContainer}>
      <View style={{ marginTop: moderateScale(10), marginBottom: 0 }}>
        {context.isMyUserPage() ? (
          <View
            style={{
              backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            }}
          >
            <View style={styles.box}>
              <View style={styles.leftBorder1} />
              <View style={styles.rightBorder1} />
            </View>
            <View style={styles.box} />

            <View style={{ marginHorizontal: 16, marginTop: 16, flexDirection: 'row' }}>
              <TouchableOpacity
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
                <UserProfilePicViewUpdate
                  style={styles.profilePicnew}
                  source={{ uri: user.profilePicUrl }}
                  class={user.class}
                />
              </TouchableOpacity>

              <View style={{ marginHorizontal: 6 }} />
              <View style={{ justifyContent: 'center' }}>
                <Text
                  style={{
                    color: Constants.TIER_COLORS.ARTISAN,
                    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                    fontSize: 16,
                    justifyContent: 'space-between',
                    marginBottom: -6,
                    lineHeight: 20,
                  }}
                >
                  {user.name}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignContent: 'center',
                    width: '80%',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <Follower user={user} context={context} />
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.STRIVER,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 4,
                      marginLeft: 4,
                    }}
                  >
                    {'\u2B24'}
                  </Text>
                  <Following user={user} context={context} />
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.STRIVER,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 4,
                      marginLeft: 4,
                    }}
                  >
                    {'\u2B24'}
                  </Text>
                  <View
                    style={{
                      marginLeft: horizontalScale(4),
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ marginRight: -14, top: 4 }}>
                      <Flag countryCode={user.countryCode ?? 'KR'} flagSize={30} />
                    </View>
                    <View style={{ marginRight: -9 }}>
                      <Text
                        style={{
                          color: Constants.TIER_COLORS.ARTISAN,
                          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
                          fontSize: 11,
                          bottom: 4,
                        }}
                      >
                        {nationalities[user.countryCode]?.code ?? nationalities.KR.code}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.STRIVER,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 4,
                      marginLeft: 10,
                    }}
                  >
                    {'\u2B24'}
                  </Text>
                  <TouchableOpacity
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: horizontalScale(4),
                    }}
                    onPress={() => {
                      if (
                        !user.instagramId ||
                        user.instagramId.toString() === 'undefined' ||
                        typeof user.instagramId === 'undefined'
                      ) {
                        return Alert.alert('Instagram', Strings.INSTAGRAM_ID_NOT_REGISTERED);
                      }

                      Linking.openURL(`https://instagram.com/${user.instagramId.trim()}`);
                    }}
                  >
                    <FastImage
                      style={{ width: 22, height: 22 }}
                      source={require('../../Resources/img/iconRenewal/instagram.png')}
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', alignContent: 'center' }}
                >
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.ARTISAN,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
                      fontSize: 16,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: Constants.TIER_COLORS.OPERATOR }}>Lv.</Text>
                    {Utils.capitalizeFirstLetter(tierName)}
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 6 }}
                    onPress={() =>
                      context.props.navigation.navigate('TierGuide', {
                        category: Strings.GREYD_GUIDE_TIER_DESCRIPTION,
                      })
                    }
                  >
                    <FastImage
                      style={{ width: 32, height: 32 }}
                      source={Constants.TIER_ICONS[tierName]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: Constants.COLOR_BACKGROUND_DARK,
              borderTopLeftRadius: moderateScale(20),
              borderTopRightRadius: moderateScale(20),
            }}
          >
            <View style={styles.box}>
              <View style={styles.leftBorder1} />
              <View style={styles.rightBorder1} />
            </View>
            <View style={styles.box} />

            <View style={{ marginHorizontal: 16, marginTop: 16, flexDirection: 'row' }}>
              <View>
                <UserProfilePicViewUpdate
                  style={styles.profilePicnew}
                  source={{ uri: user.profilePicUrl }}
                  class={user.class}
                />
              </View>

              <View style={{ marginHorizontal: 6 }} />
              <View style={{ justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: -6 }}>
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.ARTISAN,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 16,
                      justifyContent: 'space-between',
                      lineHeight: 20,
                    }}
                  >
                    {user.name}
                  </Text>
                  <NewFollowButton context={context} user={user} />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignContent: 'center',
                    width: '80%',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <Follower user={user} context={context} />
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.STRIVER,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 4,
                      marginLeft: 4,
                    }}
                  >
                    {'\u2B24'}
                  </Text>
                  <Following user={user} context={context} />
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.STRIVER,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 4,
                      marginLeft: 4,
                    }}
                  >
                    {'\u2B24'}
                  </Text>
                  {/* <View style={{ marginLeft: horizontalScale(4), marginRight: -14 }}> */}
                  <View
                    style={{
                      marginLeft: horizontalScale(4),
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ marginRight: -14, top: 4 }}>
                      <Flag countryCode={user.countryCode ?? 'KR'} flagSize={30} />
                    </View>
                    <View style={{ marginRight: -9 }}>
                      <Text
                        style={{
                          color: Constants.TIER_COLORS.ARTISAN,
                          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
                          fontSize: 11,
                          bottom: 4,
                        }}
                      >
                        {nationalities[user.countryCode]?.code ?? nationalities.KR.code}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.STRIVER,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 4,
                      marginLeft: 10,
                    }}
                  >
                    {'\u2B24'}
                  </Text>
                  <TouchableOpacity
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: horizontalScale(4),
                    }}
                    onPress={() => {
                      if (
                        !user.instagramId ||
                        user.instagramId.toString() === 'undefined' ||
                        typeof user.instagramId === 'undefined'
                      ) {
                        return Alert.alert('Instagram', Strings.INSTAGRAM_ID_NOT_REGISTERED);
                      }

                      Linking.openURL(`https://instagram.com/${user.instagramId.trim()}`);
                    }}
                  >
                    <FastImage
                      style={{ width: 22, height: 22 }}
                      source={require('../../Resources/img/iconRenewal/instagram.png')}
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', alignContent: 'center' }}
                >
                  <Text
                    style={{
                      color: Constants.TIER_COLORS.ARTISAN,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
                      fontSize: 16,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: Constants.TIER_COLORS.OPERATOR }}>Lv.</Text>
                    {Utils.capitalizeFirstLetter(tierName)}
                  </Text>
                  <TouchableOpacity
                    // style={{ marginHorizontal: 8 }}
                    style={{ marginTop: 6 }}
                    onPress={() =>
                      context.props.navigation.navigate('TierGuide', {
                        category: Strings.GREYD_GUIDE_TIER_DESCRIPTION,
                      })
                    }
                  >
                    <FastImage
                      style={{ width: 32, height: 32 }}
                      source={Constants.TIER_ICONS[tierName]}
                    />
                    {/* <HexagonWithText
                      grade={Strings.GREYD_TIER_GIVER}
                      fillColor={tierColor}
                      size={20}
                    /> */}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        <UserIntroduction user={user} />
        {context.isMyUserPage() ? (
          <ProfileButtons context={context} user={user} />
        ) : (
          <>
            <FollowedBy
              user={user}
              logonUserId={context.props.route.params.logonUserId}
              navigation={context.props.navigation}
            />
            <View
              style={{ marginHorizontal: 20, width: '90%', height: 1, backgroundColor: 'grey' }}
            />
          </>
        )}
      </View>
    </View>
  );
}

function GuestProfileInfo({ context, onPress, navigation }) {
  const tierName = Utils.getTierNameByClass(0);
  const tierColor = Utils.getTierColorByTierName(tierName);
  // 호출부가 {...props}만 전달해 context가 없다 — navigation prop으로 폴백 (티어 탭 크래시 방지)
  const nav = context?.props?.navigation || navigation;

  return (
    <View style={{ flex: 1, backgroundColor: Constants.COLOR_BACKGROUND_DARK }}>
      <View
        style={{
          position: 'absolute',
          flex: 1,
          backgroundColor: 'rgba(255, 255, 255, .7)',
          width: '100%',
          height: '100%',
          zIndex: 5,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View />
        <View />
        <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => onPress()}>
          <Text
            style={{
              marginBottom: 10,
              color: Constants.TIER_COLORS.ARTISAN,
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            }}
          >
            {Strings.PLEASE_LOGIN}
          </Text>
          <Text
            style={{
              color: Constants.COLOR_POINT_BLUE,
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
              fontSize: 20,
            }}
          >
            {Strings.GUEST_USER_ALERT_TITLE}
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          ...styles.profileInfoContainer,
          backgroundColor: Constants.COLOR_BACKGROUND_DARK,
          flex: 1,
        }}
      >
        <View style={{ marginTop: moderateScale(80), marginBottom: 0 }}>
          <Shadow
            sides={{ bottom: false }}
            corners={{ bottomStart: false, bottomEnd: false }}
            stretch={true}
          >
            <View
              style={{
                backgroundColor: Constants.COLOR_BACKGROUND_DARK,
                borderTopLeftRadius: moderateScale(20),
                borderTopRightRadius: moderateScale(20),
              }}
            >
              <View style={styles.box}>
                <View style={styles.leftBorder1} />
                <View style={styles.rightBorder1} />
              </View>
              <View style={styles.box} />

              <View style={{ marginHorizontal: 16, marginTop: 16, flexDirection: 'row' }}>
                <View>
                  <UserProfilePicViewUpdate style={styles.profilePicnew} class={0} />
                </View>

                <View style={{ marginHorizontal: 6 }} />
                <View style={{ justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: -6 }}>
                    <Text
                      style={{
                        color: Constants.TIER_COLORS.ARTISAN,
                        fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                        fontSize: 16,
                        justifyContent: 'space-between',
                      }}
                    >
                      {'Guest'}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignContent: 'center',
                      width: '80%',
                      justifyContent: 'space-between',
                      marginBottom: 2,
                    }}
                  >
                    <Follower
                      user={{
                        userId: 'Guest',
                        followerCount: '0',
                      }}
                      context={{ isMyUserPage: () => false }}
                    />
                    <Text
                      style={{
                        color: Constants.TIER_COLORS.STRIVER,
                        fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                        fontSize: 4,
                        marginLeft: 4,
                      }}
                    >
                      {'\u2B24'}
                    </Text>
                    <Following
                      user={{
                        userId: 'Guest',
                        followingCount: '0',
                      }}
                      context={{ isMyUserPage: () => false }}
                    />
                    <Text
                      style={{
                        color: Constants.TIER_COLORS.STRIVER,
                        fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                        fontSize: 4,
                        marginLeft: 4,
                      }}
                    >
                      {'\u2B24'}
                    </Text>
                    <View style={{ marginLeft: horizontalScale(4), marginRight: -14 }}>
                      <Flag countryCode={'KR'} flagSize={30} />
                    </View>
                    <Text
                      style={{
                        color: Constants.TIER_COLORS.STRIVER,
                        fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                        fontSize: 4,
                        marginLeft: 10,
                      }}
                    >
                      {'\u2B24'}
                    </Text>
                    <TouchableOpacity
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: horizontalScale(4),
                      }}
                    >
                      <IconAntDesign
                        name="instagram"
                        color={Constants.TIER_COLORS.ARTISAN}
                        size={22}
                      />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', alignContent: 'center' }}
                  >
                    <Text
                      style={{
                        color: Constants.TIER_COLORS.ARTISAN,
                        fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
                        fontSize: 16,
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ color: Constants.TIER_COLORS.OPERATOR }}>Lv.</Text>
                      {Utils.capitalizeFirstLetter('Pioneer')}
                    </Text>
                    <TouchableOpacity
                      style={{ marginHorizontal: 8 }}
                      onPress={() =>
                        nav?.navigate('TierGuide', {
                          category: Strings.GREYD_GUIDE_TIER_DESCRIPTION,
                        })
                      }
                    >
                      <HexagonWithText
                        grade={Strings.GREYD_TIER_GIVER}
                        fillColor={tierColor}
                        size={20}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Shadow>

          <View style={{ marginVertical: 20 }} />

          <ProfileButtons
            isGuest
            user={{
              g6AvgRatingScore: 0,
              countryCode: 'KR',
              instagramId: '',
              class: 0,
            }}
            context={{
              isMyUserPage: () => false,
              props: {
                navigation: nav || null,
                currencyRate: 0,
              },
              state: {
                user: {
                  id: '',
                  title: '',
                  description: '',
                  thumbnailUrl: '',
                },
              },
            }}
          />

          <View style={{ marginVertical: 10 }} />

          <View
            style={{
              backgroundColor: Constants.TIER_COLORS.PIONEER,
              borderRadius: moderateScale(14),
              marginHorizontal: horizontalScale(20),
              flexDirection: 'column',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginHorizontal: horizontalScale(20),
                marginVertical: verticalScale(20),
              }}
            >
              <RevenueAmount
                user={{
                  profitAmount: 0,
                  withdrawalAmount: 0,
                  isHideContributionRevenue: 0,
                  class: 0,
                }}
                context={{
                  isMyUserPage: () => false,
                  props: {
                    navigation: null,
                    currencyRate: 0,
                  },
                }}
              />
              <ReviewReward
                user={{
                  profitAmount: 0,
                  withdrawalAmount: 0,
                  isHideContributionRevenue: 0,
                  class: 0,
                }}
                context={{
                  isMyUserPage: () => false,
                  props: {
                    navigation: null,
                    currencyRate: 0,
                  },
                }}
              />
              <GreydTierName context={context} tier={0} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function SellerRegistrationButton({ navigation }) {
  return (
    <Pressable
      onPress={() => {
        navigation.navigate('RegisterAsSeller');
      }}
    >
      <View style={styles.blockContainer}>
        <Text style={styles.emptyMessage}>{'+ ' + Strings.REGISTER_SELLER_BUTTON_TITLE}</Text>
        <Text style={styles.descriptionTitle}>{Strings.REGISTER_SELLER_BUTTON_GUIDE1}</Text>
        <Text style={styles.descriptionTitle}>{Strings.REGISTER_SELLER_BUTTON_GUIDE2}</Text>
      </View>
    </Pressable>
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
  return (
    <>
      <View
        style={{
          marginBottom: 10,
          paddingVertical: 16,
          backgroundColor: Constants.COLOR_BACKGROUND_DARK,
        }}
      >
        {user.sellerStatus === Constants.SELLER_STATUS.APPROVED ? (
          <TouchableOpacity style={styles.circuletabview}>
            <TouchableOpacity
              style={[
                styles.lefttabstyle,
                {
                  backgroundColor:
                    context.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.REVIEW
                      ? Constants.COLOR_POINT_BLUE
                      : 'transparent',
                },
              ]}
              onPress={() => {
                context.setState({
                  focusedUserHistoryTab: USER_HISTORY_TAB_INDEX.REVIEW,
                });
              }}
            >
              <Text
                style={[
                  styles.tabTextstyle,
                  {
                    color:
                      context.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.REVIEW
                        ? Constants.COLOR_BACKGROUND_DARK
                        : Constants.TIER_COLORS.ARTISAN,
                  },
                ]}
              >
                {Strings.REVIEWER}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                context.setState({
                  focusedUserHistoryTab: USER_HISTORY_TAB_INDEX.PRODUCT,
                });
              }}
              style={[
                styles.righttabstyle,
                {
                  backgroundColor:
                    context.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.PRODUCT
                      ? Constants.COLOR_POINT_BLUE
                      : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabTextstyle,
                  {
                    color:
                      context.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.PRODUCT
                        ? Constants.COLOR_BACKGROUND_DARK
                        : Constants.TIER_COLORS.ARTISAN,
                  },
                ]}
              >
                {Strings.SELLER}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : null}
        <View style={{ marginVertical: horizontalScale(16) }}>
          <UserStatBox context={context} user={user} />
        </View>
        <View style={styles.userHistoryTab}>
          <TouchableWithoutFeedback
            onPress={() => {
              context.setState({
                focusedTab: USER_TYPE_TAB_INDEX.REVIEWNEW,
              });
            }}
          >
            <View
              style={{
                ...styles.userHistoryTabButton,
                borderBottomWidth:
                  context.state.focusedTab === USER_TYPE_TAB_INDEX.REVIEWNEW
                    ? horizontalScale(3)
                    : 0,
                borderBottomColor:
                  context.state.focusedTab === USER_TYPE_TAB_INDEX.REVIEWNEW
                    ? Constants.COLOR_POINT_BLUE
                    : '',
              }}
            >
              <Text
                style={
                  context.state.focusedTab === USER_TYPE_TAB_INDEX.REVIEWNEW
                    ? styles.userHistoryTabNameSelected
                    : styles.userHistoryTabName
                }
              >
                {context.state.focusedUserHistoryTab === USER_HISTORY_TAB_INDEX.REVIEW
                  ? Strings.REVIEWS
                  : Strings.PRODUCTS}
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
              style={{
                ...styles.userHistoryTabButton,
                borderBottomWidth:
                  context.state.focusedTab === USER_TYPE_TAB_INDEX.QA ? horizontalScale(3) : 0,
                borderBottomColor:
                  context.state.focusedTab === USER_TYPE_TAB_INDEX.QA
                    ? Constants.COLOR_POINT_BLUE
                    : '',
              }}
            >
              <Text
                style={
                  context.state.focusedTab === USER_TYPE_TAB_INDEX.QA
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
    </>
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
function UserHistoryView({ context, scrollRef }) {
  const global = useContext(Context);
  const focusedTab = context.state.focusedUserHistoryTab;
  const focuseInnerTab = context.state.focusedTab;
  const uploadingVideoList = global.state.uploadingVideos;
  const videoList = context.state.user.userUploadVideo;
  const productList = context.state.user.userUploadProduct;

  if (focuseInnerTab === USER_TYPE_TAB_INDEX.QA) {
    return (
      <View style={{ marginHorizontal: 24, backgroundColor: Constants.COLOR_BACKGROUND_DARK }}>
        <QNAList context={context} scrollRef={scrollRef} navigation={context.props.navigation} />
      </View>
    );
  }

  if (focusedTab === USER_HISTORY_TAB_INDEX.REVIEW && videoList.length === 0) {
    if (context.state.isRefreshing) {
      return (
        <View style={styles.emptyMessageContainer}>
          <ActivityIndicator size="small" color={Constants.COLOR_MAIN} />
        </View>
      );
    }
    if (context.isMyUserPage()) {
      return <AddNewReviewButton context={context} />;
    } else {
      return (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessage}>{Strings.NO_REVIEW_UPLOADED}</Text>
        </View>
      );
    }
  } else if (focusedTab === USER_HISTORY_TAB_INDEX.PRODUCT && productList.length === 0) {
    // } else if (focusedTab === USER_HISTORY_TAB_INDEX.PRODUCT) {
    if (context.state.isRefreshing) {
      return (
        <View style={styles.emptyMessageContainer}>
          <ActivityIndicator size="small" color={Constants.COLOR_MAIN} />
        </View>
      );
    }
    if (context.isMyUserPage()) {
      if (!context.state.user.sellerStatus) {
        return <SellerRegistrationButton navigation={context.props.navigation} />;
        // } else if (context.state.user.sellerStatus === Constants.SELLER_STATUS.APPROVAL_REQUEST) {
        //   return <SellerApprovalWaitingView />;
      } else {
        if (context.state.user.isSeller) {
          return (
            <>
              <Shadow
                stretch
                containerStyle={{
                  marginTop: verticalScale(10),
                  marginHorizontal: horizontalScale(20),
                }}
              >
                <View>
                  <TouchableNativeFeedback
                    onPress={() => {
                      context.props.navigation.navigate('MyStore');
                    }}
                  >
                    <View style={styles.sellerPageButton}>
                      <Text style={styles.sellerButtonLabel}>{Strings.SELLER_PAGE}</Text>
                    </View>
                  </TouchableNativeFeedback>
                </View>
              </Shadow>
              <AddNewProductButton context={context} />
            </>
          );
        }
        return <AddNewProductButton context={context} />;
      }
    } else {
      return (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.emptyMessage}>{Strings.NO_PRODUCT_UPLOADED}</Text>
        </View>
      );
    }
  }

  return (
    <View>
      {focusedTab === USER_HISTORY_TAB_INDEX.PRODUCT &&
        context.state.user.sellerStatus === Constants.SELLER_STATUS.APPROVAL_REQUEST && (
          <SellerApprovalWaitingView />
        )}
      {focusedTab === USER_HISTORY_TAB_INDEX.PRODUCT &&
        context.state.user.isSeller &&
        context.isMyUserPage() && (
          <Shadow
            stretch
            containerStyle={{
              marginVertical: verticalScale(20),
              marginHorizontal: horizontalScale(20),
            }}
          >
            <View style={{ borderRadius: 14 }}>
              <TouchableNativeFeedback
                onPress={() => {
                  context.props.navigation.navigate('MyStore');
                }}
              >
                <View style={styles.sellerPageButton}>
                  <Text style={styles.sellerButtonLabel}>{Strings.SELLER_PAGE}</Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          </Shadow>
        )}

      <FlatGrid
        fixed={true}
        containerStyle={{ borderColor: 'red', borderWidth: 1 }}
        itemDimension={Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2}
        spacing={Constants.VIDEO_LIST_SPACING}
        data={
          focusedTab === USER_HISTORY_TAB_INDEX.PRODUCT
            ? productList
            : context.isMyUserPage()
              ? [...uploadingVideoList, ...videoList]
              : videoList
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
              <VideoListItemView
                style={{
                  height: Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - moderateScale(120),
                }} // moderateScale(60)
                navigation={context.props.navigation}
                data={item}
                dataType={'userUpload'}
                dataList={videoList}
                dataSortType={'recent'}
                noCreator
              />
            );
          }
        }}
        keyExtractor={(item) => item.videoId || item.productId || item.id}
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
        style={{ marginHorizontal: 10 }}
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
              color: Constants.TIER_COLORS.ARTISAN,
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
  return (
    // <Shadow style={styles.editButtonShadow} containerStyle={{ bottom: moderateScale(-15) }}>les.editButtonShadow}>
    <TouchableOpacity
      style={styles.newFollowButtonContainer}
      onPress={() => {
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
      }}
    >
      <Text
        style={{
          color: user.isFollowing ? Constants.TIER_COLORS.ARTISAN : 'white',
          fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
          fontSize: 12,
        }}
      >
        {user.isFollowing ? Strings.FOLLOWING : Strings.FOLLOW}
      </Text>
    </TouchableOpacity>
    // </Shadow>
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
            color: user.isFollowing ? Constants.TIER_COLORS.ARTISAN : 'white',
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
            borderColor={Constants.TIER_COLORS.GIVER}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_GIVER}
            textColor={'#3a3a3a'}
            fillColor={Constants.TIER_COLORS.GIVER}
          />
        )}
      </View>
      <View style={styles.hexagon(285, hexagonLeftPosition - moderateScale(45 - 1))}>
        {user.class === 4 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={Constants.TIER_COLORS.ARTISAN}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_ARTISAN}
            textColor={'white'}
            fillColor={Constants.TIER_COLORS.ARTISAN}
          />
        )}
      </View>
      <View style={styles.hexagon(285, hexagonLeftPosition + moderateScale(45 - 1))}>
        {user.class === 3 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={Constants.TIER_COLORS.OPERATOR}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_OPERATOR}
            textColor={'white'}
            fillColor={Constants.TIER_COLORS.OPERATOR}
          />
        )}
      </View>
      <View style={styles.hexagon(365 - 4, hexagonLeftPosition - moderateScale(90 - 2.5))}>
        {user.class === 2 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={Constants.TIER_COLORS.STRIVER}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_STRIVER}
            textColor={'#1a1a1a'}
            fillColor={Constants.TIER_COLORS.STRIVER}
          />
        )}
      </View>
      <View style={styles.hexagon(365 - 4, hexagonLeftPosition)}>
        {user.class === 1 ? (
          <HexagonWithPhoto
            user={user}
            context={context}
            profilePicUrl={user.profilePicUrl}
            borderColor={Constants.TIER_COLORS.EXPLORER}
          />
        ) : (
          <HexagonWithText
            grade={Strings.GREYD_TIER_EXPLORER}
            textColor={'#2a2a2a'}
            fillColor={Constants.TIER_COLORS.EXPLORER}
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
    <View
      style={{
        marginHorizontal: horizontalScale(20),
        marginTop: verticalScale(10),
      }}
    >
      <View style={{ borderWidth: 0.5, borderColor: '#a0a0a0' }} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: verticalScale(10),
          marginHorizontal: horizontalScale(20),
        }}
      >
        <View style={{ overflow: 'hidden', width: '25%' }}>
          <TouchableNativeFeedback
            onPress={() => {
              context.props.navigation.navigate('BookmarkList');
            }}
            background={TouchableNativeFeedback.Ripple('#777', true)}
          >
            <View
              style={{
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <FastImage
                style={styles.profileButtonIcon}
                source={require('../../Resources/img/iconRenewal/bookmark.png')}
              />
              <Text
                style={{
                  color: Constants.TIER_COLORS.ARTISAN,
                  marginTop: horizontalScale(6),
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                  fontSize: moderateScale(11),
                }}
              >
                {Strings.BOOKMARKS}
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
        {/* 기능 다이어트 (COMMERCE off): 장바구니·주문 내역 진입점 숨김 */}
        {FEATURES.COMMERCE ? (
        <>
        <View style={{ overflow: 'hidden', width: '25%' }}>
          <TouchableNativeFeedback
            onPress={() => {
              context.props.navigation.navigate('Cart');
            }}
            background={TouchableNativeFeedback.Ripple('#777', true)}
          >
            <View
              style={{
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <FastImage
                style={styles.profileButtonIcon}
                source={require('../../Resources/img/iconRenewal/cart.png')}
              />
              <Text
                style={{
                  color: Constants.TIER_COLORS.ARTISAN,
                  marginTop: horizontalScale(6),
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                  fontSize: moderateScale(11),
                }}
              >
                {Strings.CART}
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
        <View style={{ overflow: 'hidden', width: '25%' }}>
          <TouchableNativeFeedback
            onPress={() => {
              context.props.navigation.navigate('MyOrderList');
            }}
            background={TouchableNativeFeedback.Ripple('#777', true)}
          >
            <View
              style={{
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* <IconFontAwesome5 name={'clipboard-list'} size={20} color={'white'} /> */}
              <FastImage
                style={styles.profileButtonIcon}
                source={require('../../Resources/img/iconRenewal/orderlist.png')}
              />
              <Text
                style={{
                  color: Constants.TIER_COLORS.ARTISAN,
                  marginTop: horizontalScale(6),
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                  fontSize: moderateScale(11),
                }}
              >
                {Strings.ORDER_LIST}
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
        </>
        ) : null}
        <View style={{ overflow: 'hidden', width: '25%' }}>
          {context.isMyUserPage() || isGuest ? (
            <RewardDetail context={context} />
          ) : (
            <GreydTierName context={context} tier={user.class} />
          )}
        </View>
      </View>
      <View style={{ borderWidth: 0.5, borderColor: '#a0a0a0' }} />
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
            color: Constants.TIER_COLORS.ARTISAN,
            fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
            fontSize: moderateScale(20),
          }}
        >
          {user.g6RatingCount}
        </Text>
      </View>
      <Text
        style={{
          color: Constants.TIER_COLORS.ARTISAN,
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
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        // width: horizontalScale(90),
      }}
      onPress={() => {
        const params = context.isMyUserPage() ? {} : { targetUserId: user.userId };
        context.props.navigation.push('FollowList', params);
      }}
    >
      <Text
        style={{
          color: Constants.TIER_COLORS.OPERATOR,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
          fontSize: moderateScale(14),
          textAlign: 'center',
        }}
      >
        {Strings.FOLLOWERS}
      </Text>
      <Text
        style={{
          color: Constants.TIER_COLORS.ARTISAN,
          marginLeft: 4,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
          fontSize: moderateScale(14),
        }}
      >
        {user.followerCount}
      </Text>
    </TouchableOpacity>
  );
}
function Following({ user, context }) {
  return (
    <TouchableOpacity
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
        flexDirection: 'row',
      }}
      onPress={() => {
        const params = context.isMyUserPage() ? {} : { targetUserId: user.userId };
        context.props.navigation.push('FollowList', params);
      }}
    >
      <Text
        style={{
          color: Constants.TIER_COLORS.OPERATOR,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
          fontSize: moderateScale(14),
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {Strings.FOLLOWING}
      </Text>
      <Text
        style={{
          color: Constants.TIER_COLORS.ARTISAN,
          marginLeft: 4,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
          fontSize: moderateScale(14),
        }}
      >
        {user.followingCount}
      </Text>
    </TouchableOpacity>
  );
}
function RevenueAmount({ user, context }) {
  const { navigation, totalRevenue, currencyRate } = context.props;

  return (
    <View
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        width: horizontalScale(90),
      }}
    >
      <Text
        style={{
          color: Constants.TIER_COLORS.ARTISAN,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
          fontSize: moderateScale(
            // 십만원까지 16, 백만원 까지 13, 천만원 이상 억이하 10
            totalRevenue >= 10000000 ? 10 : totalRevenue >= 1000000 ? 13 : 16,
          ),
        }}
      >
        {!context.isMyUserPage() && user.isHideContributionRevenue ? (
          Strings.CONTRIBUTION_HIDED
        ) : (
          <Text>
            {getLanguage() === 'en' ? (
              <Text style={{ color: Constants.COLOR_POINT_BLUE, fontSize: moderateScale(16) }}>
                ${' '}
              </Text>
            ) : null}
            {Utils.numberWithCommas(
              changeCurrency({
                current: user.totalRevenue,
                currencyRate: context?.props?.route?.params?.KRWPerUSD,
              }),
            )}
            {getLanguage() === 'ko' ? (
              <Text style={{ color: Constants.COLOR_POINT_BLUE, fontSize: moderateScale(16) }}>
                {' '}
                원
              </Text>
            ) : null}
          </Text>
        )}
      </Text>

      <Text
        style={{
          color: Constants.TIER_COLORS.ARTISAN,
          // fontSize: moderateScale(14),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
          fontSize: moderateScale(13),
          marginTop: verticalScale(5),
          textAlign: 'center',
        }}
      >
        {Strings.CONTRIBUTION}
      </Text>
    </View>
  );
}
function ReviewReward({ user, context }) {
  const { navigation, totalReward, currencyRate } = context.props;

  return (
    <TouchableOpacity
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: horizontalScale(90),
      }}
      onPress={() => {
        if (context.isMyUserPage()) {
          navigation.navigate('RewardList');
          // navigation.navigate('RewardList', { unearnedProfit, unearnedRevenue });
        }
      }}
    >
      <Text
        style={{
          color: Constants.TIER_COLORS.ARTISAN,
          fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
          fontSize: moderateScale(
            // 십만원까지 16, 백만원 까지 13, 천만원 이상 억이하 10
            totalReward >= 10000000 ? 10 : totalReward >= 1000000 ? 13 : 16,
          ),
        }}
      >
        {!context.isMyUserPage() && user.isHideContributionRevenue ? (
          Strings.CONTRIBUTION_HIDED
        ) : (
          <Text>
            {getLanguage() === 'en' ? (
              <Text style={{ color: Constants.COLOR_POINT_BLUE, fontSize: moderateScale(16) }}>
                ${' '}
              </Text>
            ) : null}
            {Utils.numberWithCommas(
              changeCurrency({
                // current: !context.isMyUserPage()
                //   ? totalReward + user?.withdrawalAmount
                //   : totalReward,
                // current: !context.isMyUserPage() ? user.accumulatedRevenue : user.totalReward,
                current: !context.isMyUserPage() ? user.totalReward : totalReward,
                currencyRate: context?.props?.route?.params?.KRWPerUSD,
              }),
            )}
            {getLanguage() === 'ko' ? (
              <Text style={{ color: Constants.COLOR_POINT_BLUE, fontSize: moderateScale(16) }}>
                {' '}
                원
              </Text>
            ) : null}
          </Text>
        )}
      </Text>
      <Text
        style={{
          color: Constants.TIER_COLORS.ARTISAN,
          // fontSize: moderateScale(14),
          fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
          fontSize: moderateScale(13),
          marginTop: verticalScale(5),
          textAlign: 'center',
        }}
      >
        {Strings.REVIEW_REWARDS}
      </Text>
    </TouchableOpacity>
  );
}
function RewardDetail({ context }) {
  const { userId, name, introduction, profilePicUrl } = context.state.user;

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TouchableOpacity
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
        style={{ justifyContent: 'center', alignItems: 'center' }}
      >
        <View
          style={{
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* <IconFontAwesome5 name={'clipboard-list'} size={20} color={'white'} /> */}
          <FastImage
            style={styles.profileButtonIcon}
            source={require('../../Resources/img/iconRenewal/qr.png')}
          />
          <Text
            style={{
              color: Constants.TIER_COLORS.ARTISAN,
              marginTop: horizontalScale(6),
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
              fontSize: moderateScale(11),
            }}
          >
            {Strings.QR_CODE}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function GreydTierName({ context, tier }) {
  const tierName = Utils.getTierNameByClass(tier);
  const tierColor = Utils.getTierColorByTierName(tierName);

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: horizontalScale(90),
      }}
    >
      <TouchableOpacity
        onPress={() => {
          context.props.navigation.navigate('TierGuide', {
            category: Strings.GREYD_GUIDE_TIER_DESCRIPTION,
          });
        }}
        style={{ justifyContent: 'center', alignItems: 'center' }}
      >
        <Text
          style={{
            color: tierName === Strings.GREYD_TIER_GIVER.toUpperCase() ? tierColor : 'white',
            fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
            fontSize: moderateScale(18),
          }}
        >
          {tierName ? Utils.capitalizeFirstLetter(tierName) : ''}
        </Text>
        <Text
          style={{
            color: '#A0A0A0',
            fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
            fontSize: moderateScale(14),
            marginTop: verticalScale(5),
          }}
        >
          {Strings.TIER}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function UserStatBox({ user, context }) {
  return (
    <View
      style={{
        backgroundColor: Constants.TIER_COLORS.PIONEER,
        borderRadius: moderateScale(14),
        marginHorizontal: horizontalScale(20),
        flexDirection: 'column',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: horizontalScale(20),
          marginVertical: verticalScale(20),
        }}
      >
        <TouchableOpacity
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: horizontalScale(90),
            // marginBottom: horizontalScale(6),
          }}
          onPress={() =>
            context.props.navigation.navigate('G6UserChart', {
              context: context,
              state: context.state,
            })
          }
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <FastImage
              source={require('../../Resources/img/icGreydSplashSymbol126.png')}
              style={{ width: 16, height: 16 }}
            />
            <Text
              style={{
                paddingLeft: 4,
                color: Constants.TIER_COLORS.ARTISAN,
                fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
                fontSize: moderateScale(16),
              }}
            >
              {user.g6AvgRatingScore}
            </Text>
          </View>

          <Text
            style={{
              color: Constants.TIER_COLORS.ARTISAN,
              // fontSize: moderateScale(14),
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
              fontSize: moderateScale(13),
              marginTop: verticalScale(5),
            }}
          >
            {Strings.AVERAGE_GRADE}
          </Text>
        </TouchableOpacity>
        <RevenueAmount user={user} context={context} />
        <ReviewReward user={user} context={context} />
      </View>
    </View>
  );
}

function UserIntroduction({ user }) {
  if (!user.introduction) {
    return <View style={{ marginVertical: 10 }} />;
  }

  return (
    <View
      style={{
        marginHorizontal: horizontalScale(16),
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginHorizontal: horizontalScale(8),
          marginTop: verticalScale(20),
        }}
      >
        <Text
          style={{
            fontSize: moderateScale(14),
            fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
            color: Constants.TIER_COLORS.ARTISAN,
          }}
        >
          {Strings.ABOUT_ME}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginHorizontal: horizontalScale(8),
          marginTop: verticalScale(10),
          marginBottom: verticalScale(20),
        }}
      >
        <Text
          style={{
            fontSize: moderateScale(14),
            fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
            color: Constants.TIER_COLORS.OPERATOR,
          }}
        >
          {user.introduction ? user.introduction : Strings.WRITE_ABOUT_ME}
        </Text>
      </View>
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
      StatusBar.setBackgroundColor(Constants.TIER_COLORS.GIVER);
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
            style={{ backgroundColor: Constants.COLOR_BACKGROUND_DARK }}
            keyExtractor={(item, index) => 'profileScreenSection' + index}
            renderItem={({ item }) => item}
            renderSectionHeader={({ section: { title } }) => title}
            refreshControl={
              <RefreshControl
                tintColor={Constants.TIER_COLORS.ARTISAN}
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
        <Shadow distance={20} stretch={true} containerStyle={{ zIndex: 100 }}>
          <View style={{ height: 0.1 }} />
        </Shadow>
      </SafeAreaView>
    );
  }
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.TIER_COLORS.GIVER,
  },
  orderHeaderContainer: {
    width: '100%',
    marginTop: isIphoneX() ? 50 : 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    // padding: 20,
    paddingHorizontal: 20,
    paddingBottom: 7,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(24),
    color: Constants.TIER_COLORS.PIONEER,
    fontFamily: Constants.CUSTOM_FONTS.PRETENDARD.Bold,
  },
  headerButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 30,
    height: 30,
  },
  followingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    minHeight: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    minHeight: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#313131',
    backgroundColor: '#313131',
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    minHeight: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfoContainer: {
    // marginTop: 20,
    // justifyContent: 'center',
    // alignItems: 'center',
    // alignSelf: 'center',
    // backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  profilePicContainer: {},
  profilePic: {
    width: 106,
    height: 106,
  },
  reviewerName: {
    marginTop: 5,
    color: 'white',
    fontSize: moderateScale(24),
    lineHeight: 24,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  reputationText: {
    color: '#919191',
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  contributionAmount: {
    color: Constants.COLOR_RED,
    marginTop: 2,
    fontWeight: '600',
  },
  contributionButtonText: {
    color: Constants.COLOR_MAIN,
    fontSize: moderateScale(13),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    textDecorationLine: 'underline',
  },
  helpButtonText: {
    color: '#919191',
    // fontSize: moderateScale(13),
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
    textDecorationLine: 'underline',
  },
  myContributionAmount: {
    color: Constants.TIER_COLORS.ARTISAN,
    // fontSize: moderateScale(13),
    fontSize: moderateScale(14),
    // fontWeight: 'bold',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  userIntroductionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  userIntroduction: {
    textAlign: 'center',
    color: 'white',
    width: (Dimensions.get('window').width * 2) / 3,
    marginHorizontal: 10,
  },
  userSnsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  userSnsTitle: {
    color: 'white',
  },
  userSnsBody: {
    textDecorationLine: 'underline',
    color: '#217DBF',
  },
  editProfileButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  snsButton: {
    height: 40,
    minWidth: 40,
    marginTop: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editProfileButtonLabel: {
    color: 'white',
    fontSize: moderateScale(14),
    // fontWeight: '600',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  userHistoryTab: {
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    borderBottomWidth: 0.5,
    borderColor: Constants.TIER_COLORS.STRIVER,
  },
  userHistoryTabButton: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingVertical: 5,
  },
  userHistoryTabNameSelected: {
    color: Constants.COLOR_POINT_BLUE,
    fontSize: moderateScale(18),
    // fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  userHistoryTabCount: {
    // color: 'rgba(255, 255, 255, 0.5)',
    color: '#999',
    // fontSize: moderateScale(19),
    // fontWeight: 'bold',
    fontSize: moderateScale(20),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
  },
  userHistoryTabName: {
    color: '#a0a0a0',
    fontSize: moderateScale(18),
    // fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  userHistoryRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: -20,
  },
  addNewReviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 20,
    marginBottom: 100,
  },
  addNewReviewButton: {
    justifyContent: 'center',
    width: Constants.VIDEO_GRID_LIST_ITEM_VIEW_WIDTH_2,
    height:
      Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - Constants.VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT,
    backgroundColor: 'rgb(31, 31, 31)',
    borderRadius: 6,
  },
  addNewReviewButtonIcon: {
    marginTop: 20,
    width: 34,
    height: 34,
    alignSelf: 'center',
  },
  addNewReviewTitle: {
    marginTop: 20,
    color: Constants.COLOR_BACKGROUND_DARK,
    fontSize: moderateScale(14),
    alignSelf: 'center',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  emptyMessageContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    height:
      Constants.VIDEO_GRID_LIST_ITEM_VIEW_HEIGHT_2 - Constants.VIDEO_LIST_ITEM_VIEW_FOOTER_HEIGHT,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  // emptyMessage: {
  //   color: Constants.TIER_COLORS.ARTISAN,
  //   fontSize: moderateScale(18),
  // },
  revenueGuideButton: {
    paddingHorizontal: 5,
    marginRight: -10,
  },
  blockContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 10,
    borderColor: Constants.TIER_COLORS.STRIVER,
    width: (Dimensions.get('window').width * 16) / 20,
    height: (Dimensions.get('window').width * 9) / 20,
    marginTop: 10,
    marginBottom: 100,
  },
  revenueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 5,
    // borderColor: 'rgba(255,255,255,0.5)',
    borderColor: '#999',
    width: (Dimensions.get('window').width * 3) / 4,
    marginTop: 10,
  },
  emptyMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: moderateScale(18),
    marginVertical: 10,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
  descriptionTitle: {
    fontSize: moderateScale(14),
    alignItems: 'center',
    // color: 'rgba(255, 255, 255, 0.5)',
    color: '#999',
    fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
  },
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
    // backgroundColor: '#2a2a2a',
  },
  editButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 100,
    backgroundColor: '#2a2a2a',
  },
  newFollowButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: horizontalScale(70),
    borderRadius: 14,
    backgroundColor: Constants.TIER_COLORS.GIVER,

    paddingVertical: 2,
    borderColor: Constants.TIER_COLORS.ARTISAN,
    borderWidth: 1,
    marginLeft: 14,
  },
  newBlockButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: horizontalScale(120),
    height: 30,
    borderRadius: 14,
    backgroundColor: '#3a3a3a',
  },
  editButton: {
    width: 22,
    height: 22,
  },

  sellerPageButton: {
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    justifyContent: 'center',
    height: Constants.PRODUCT_HORIZONTAL_LIST_ITEM_VIEW_WIDTH / 2 - 10,
    // marginVertical: 5,
    marginHorizontal: 20,
  },
  sellerButtonLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
    fontSize: 17,
  },
  profilePicnew: {
    width: 100,
    height: 100,
  },
  circuletabview: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: Constants.TIER_COLORS.ARTISAN,
    alignSelf: 'center',
    borderRadius: 21,
  },
  lefttabstyle: {
    paddingHorizontal: 24,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
  },
  righttabstyle: {
    marginLeft: -16,
    paddingHorizontal: 34,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
  },

  tabTextstyle: {
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  roundTabName: {
    color: '#999',
    fontSize: moderateScale(14),
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  roundView: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundTabContainer: {
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  roundTabContainernew: {
    // backgroundColor: Constants.COLOR_BACKGROUND_DARK,
    // marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  descriptionText: {
    fontSize: moderateScale(14),
    paddingHorizontal: 24,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    textAlign: 'center',
    color: '#d3d3d3',
  },
  qnaSentence: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qnaRefresh: {
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    color: Constants.TIER_COLORS.ARTISAN,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 4,
    borderColor: Constants.TIER_COLORS.ARTISAN,
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
  profileButtonIcon: {
    width: 26,
    height: 26,
  },
});
