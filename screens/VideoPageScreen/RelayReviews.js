import React from 'react';
import { StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList as GestureHandlerFlatList } from 'react-native-gesture-handler';
import Constants from '../../Components/Constants';
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
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              {Strings.RELAYS_OF_THIS_REVIEW}{' '}
              {video.relayedVideoCount > 0 ? video.relayedVideoCount : ''}
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

      {/* <TouchableNativeFeedback onPress={context.onAddRelayButtonPressed.bind(context)}>
        <View style={styles.addRelayButton}>
          <Text style={styles.addRelayButtonLabel}>{Strings.ADD_RELAY_REVIEW}</Text>
        </View>
      </TouchableNativeFeedback> */}
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
    color: Constants.TIER_COLORS.ARTISAN,
    marginRight: 6,
  },
  sectionTitleMoreIcon: {
    width: 12,
    height: 20,
  },
  addRelayButton: {
    marginBottom: 53,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  addRelayButtonLabel: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 17,
    fontWeight: '600',
  },
});

export default RelayReviews;
