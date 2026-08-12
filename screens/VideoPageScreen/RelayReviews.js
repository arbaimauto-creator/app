import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList as GestureHandlerFlatList } from 'react-native-gesture-handler';
import Constants from '../../Components/Constants';
import FEATURES from '../../Components/Constants/Features';
import Strings from '../../Components/Strings';
import VideoListItemView from '../../Components/VideoListItemView';

function RelayReviews({ context }) {
  const { video } = context.state;

  const MemoizedRelayReviews = (
    <View>
      <TouchableNativeFeedback
        onPress={() => {
          if (video.relayedVideoCount > 0) {
            context.props.navigation.push('VideoList', {
              listOf: Constants.VIDEO_LIST_RELAYING,
              videoId: video.videoId,
            });
          }
        }}
      >
        <View>
          {/* 아직 참고한 사람이 없으면 계보 줄은 숨기고 CTA만 남긴다 */}
          <View style={[styles.sectionTitleContainer, !video.relayedVideoCount && styles.hidden]}>
            <Text style={styles.sectionTitle}>
              {/* 인용 계보: 하트 수 대신 "이 리뷰를 보고 몇 명이 만들었는가"를 보여준다 */}
              {FEATURES.REFERENCE_ARCHIVE
                ? Strings.REF_REFERENCED_COUNT(video.relayedVideoCount || 0)
                : `${Strings.RELAYS_OF_THIS_REVIEW} ${
                    video.relayedVideoCount > 0 ? video.relayedVideoCount : ''
                  }`}
            </Text>
            {video.relayedVideoCount > 0 && (
              <FastImage
                style={styles.sectionTitleMoreIcon}
                source={require('../../Resources/img/iconRenewal/icCommonTitle20W.png')}
              />
            )}
          </View>
          {video.relayedVideoList && video.relayedVideoList.length > 0 && (
            <GestureHandlerFlatList
              horizontal={true}
              data={video.relayedVideoList}
              renderItem={({ item }) => (
                <VideoListItemView
                  navigation={context.props.navigation}
                  data={item}
                  style={{
                    marginRight: Constants.VIDEO_LIST_SPACING,
                    width: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_WIDTH,
                  }}
                  type={'list_horizontal'}
                  noProduct
                />
              )}
              keyExtractor={(item) => 'relayed' + item._id}
              onRefresh={() => {}}
              onEndReached={({ distanceFromEnd }) => {
                if (
                  distanceFromEnd > 0 &&
                  video.relayedVideoList.length >= 10 &&
                  !context.state.relayedVideoListIsRefreshing
                ) {
                  context.onRelayedVideoListEndReached();
                }
              }}
              onEndReachedThreshold={0.5}
              refreshing={context.state.relayedVideoListIsRefreshing}
              style={{
                height: Constants.VIDEO_HORIZONTAL_LIST_ITEM_VIEW_HEIGHT - 50,
                paddingLeft: 20,
              }}
            />
          )}
        </View>
      </TouchableNativeFeedback>

      {/* "이걸 참고해서 올리기" — 누르면 업로드 화면이 원본을 물고 열리고(relayingVideo),
          올린 리뷰가 원본의 계보에 붙는다. 저장 → 참고 → 업로드를 한 줄로 잇는 지점. */}
      <TouchableNativeFeedback onPress={() => context.onAddRelayButtonPressed()}>
        <View style={styles.addRelayButton}>
          <Text style={styles.addRelayButtonLabel}>
            {FEATURES.REFERENCE_ARCHIVE ? Strings.REF_MAKE_LIKE_THIS : Strings.ADD_RELAY_REVIEW}
          </Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );

  return React.useMemo(
    () => MemoizedRelayReviews,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      video.relayedVideoCount,
      video.relayedVideoList,
      video.videoId,
      context.state.relayedVideoListIsRefreshing,
    ],
  );
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
    fontWeight: '600',
    color: T.COLORS.INK,
    marginRight: 6,
  },
  sectionTitleMoreIcon: {
    width: 12,
    height: 20,
  },
  hidden: { display: 'none' },
  addRelayButton: {
    marginBottom: 53,
    // 밝은 상세 영역 위에 놓이므로 반투명 흰색 대신 흰 카드 + 경계선으로 보이게 한다.
    backgroundColor: T.COLORS.SURFACE,
    borderWidth: 1,
    borderColor: T.COLORS.LINE,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: T.RADIUS.CARD,
    alignItems: 'center',
  },
  addRelayButtonLabel: {
    color: T.COLORS.INK,
    fontSize: 17,
    fontWeight: '600',
  },
});

export default RelayReviews;
