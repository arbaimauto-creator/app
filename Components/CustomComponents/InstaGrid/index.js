import * as _ from 'lodash';
import React from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, View } from 'react-native';
import Animated from 'react-native-reanimated';
import APIprovider from '../../APIprovider';
import RenderCell from './RenderCell';
import Constants from '../../Constants';
let { height } = Dimensions.get('window');

const InstaGrid = ({ columns, navigation }) => {
  const [isRefreshing, setRefreshing] = React.useState(false);
  const [data, setData] = React.useState([]);
  const [rowsArray, setRowsArray] = React.useState([]);

  const groupEveryNthRow = 3;

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setRefreshing(true);

    const result = await APIprovider.getVideoThumbnails();
    if (result.success) {
      const thumbnails = result.thumbnails.map((thumbnail) => ({
        id: thumbnail._id,
        uri: thumbnail.thumbnailUrl,
        attachmentList: thumbnail.attachmentList.map((attachment) => attachment.url),
      }));

      setData(thumbnails);
      setRowsArray(_.chunk(thumbnails, columns));
    }

    setRefreshing(false);
  };

  const fetchMoreData = async () => {
    setRefreshing(true);

    const result = await APIprovider.getVideoThumbnails();
    if (result.success) {
      const thumbnailUrls = result.thumbnails.map((thumbnail) => ({
        id: thumbnail._id,
        uri: thumbnail.thumbnailUrl,
        attachmentList: thumbnail.attachmentList.map((attachment) => attachment.url),
      }));

      const ids = new Set();
      const newVideos = [];
      for (const video of [...data, ...thumbnailUrls]) {
        const prevSize = ids.size;
        ids.add(video.id);
        if (ids.size > prevSize) {
          newVideos.push(video);
        }
      }

      console.log(data.length, newVideos.length);

      setData(newVideos);
      setRowsArray(_.chunk(newVideos, columns));
    }

    setRefreshing(false);
  };

  const renderFooter = () => {
    return (
      <View style={{ marginBottom: 16 }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, height, flexDirection: 'row' }}>
      {rowsArray.length > 0 ? (
        <Animated.FlatList
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              tintColor={Constants.TIER_COLORS.ARTISAN}
              refreshing={isRefreshing}
              onRefresh={() => {
                fetchData();
              }}
            />
          }
          data={rowsArray}
          renderItem={({ item, index }) => (
            <RenderCell
              row={item}
              index={index}
              groupEveryNthRow={groupEveryNthRow}
              columns={columns}
              navigation={navigation}
            />
          )}
          onEndReached={({ distanceFromEnd }) => {
            console.log('onEndReached', distanceFromEnd);
            fetchMoreData();
          }}
          onEndReachedThreshold={0.1}
          keyExtractor={(item) => item[0].id}
        />
      ) : (
        renderFooter()
      )}
    </View>
  );
};

export default InstaGrid;
