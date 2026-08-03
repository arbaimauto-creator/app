import React from 'react';
import { StyleSheet, View } from 'react-native';
import VideoListItemView from '../../Components/VideoListItemView';

function UpperRelayReview({ context }) {
  const { video } = context.state;

  const MemoizedUpperRelayReview = (
    <View style={styles.relayingVideoContainer}>
      <VideoListItemView
        navigation={context.props.navigation}
        data={video.relayingVideo}
        type={'relaying'}
        noProduct
      />
    </View>
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => MemoizedUpperRelayReview, [video.relayingVideo]);
}

const styles = StyleSheet.create({
  relayingVideoContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
});

export default UpperRelayReview;
