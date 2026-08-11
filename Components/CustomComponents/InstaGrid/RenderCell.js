import React from 'react';
import T from '../../Constants/DesignTokens';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Constants';

let { width } = Dimensions.get('window');

const RenderGroupedItem = ({ row, index, navigation }) => {
  const [smallImage1, smallImage2, largeImage] = row;

  if (index % 2 === 0) {
    return (
      <View style={{ flexDirection: 'row' }}>
        <View style={styles.groupedGridContainer}>
          <TouchableOpacity
            style={styles.gridStyle}
            onPress={() => {
              navigation.push('VideoPage', { videoId: smallImage1.id });
            }}
          >
            <FastImage style={styles.imageThumbnail} source={smallImage1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridStyle}
            onPress={() => {
              navigation.push('VideoPage', { videoId: smallImage2.id });
            }}
          >
            <FastImage style={styles.imageThumbnail} source={smallImage2} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.gridStyle}
          onPress={() => {
            navigation.push('VideoPage', { videoId: largeImage.id });
          }}
        >
          <FastImage style={styles.imageThumbnailLarge} source={largeImage} />
        </TouchableOpacity>
      </View>
    );
  } else {
    return (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          style={styles.gridStyle}
          onPress={() => {
            navigation.push('VideoPage', { videoId: largeImage.id });
          }}
        >
          <FastImage style={styles.imageThumbnailLarge} source={largeImage} />
        </TouchableOpacity>
        <View style={styles.groupedGridContainer}>
          <TouchableOpacity
            style={styles.gridStyle}
            onPress={() => {
              navigation.push('VideoPage', { videoId: smallImage1.id });
            }}
          >
            <FastImage style={styles.imageThumbnail} source={smallImage1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridStyle}
            onPress={() => {
              navigation.push('VideoPage', { videoId: smallImage2.id });
            }}
          >
            <FastImage style={styles.imageThumbnail} source={smallImage2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
};

const RenderSingleItem = ({ item, navigation }) => {
  return (
    <TouchableOpacity
      key={item.id}
      style={styles.gridStyle}
      onPress={() => {
        navigation.push('VideoPage', { videoId: item.id });
      }}
    >
      <FastImage style={styles.imageThumbnail} source={item} />
    </TouchableOpacity>
  );
};

const RenderCell = ({ row, index, columns, groupEveryNthRow, navigation }) => {
  if (row.length >= columns && index % groupEveryNthRow === 0) {
    // console.log(index, row.length, columns, groupEveryNthRow);
    return <RenderGroupedItem row={row} index={index} navigation={navigation} />;
  }

  return (
    <View style={{ flexDirection: 'row' }}>
      {row.map((item) => (
        <RenderSingleItem key={item.id || item.uri} item={item} navigation={navigation} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  groupedGridContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  gridStyle: {
    margin: 2,
  },
  imageThumbnail: {
    height: width / 3 - 12,
    width: width / 3 - 12,
    resizeMode: 'stretch',
    backgroundColor: T.COLORS.GREY,
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  imageThumbnailLarge: {
    height: width * 0.6 + 8,
    width: width * 0.6 + 8,
    marginLeft: 0,
    backgroundColor: T.COLORS.GREY,
    resizeMode: 'stretch',
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
});

export default React.memo(RenderCell);
