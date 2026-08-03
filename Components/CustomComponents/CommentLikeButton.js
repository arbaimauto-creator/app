import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

export default function CommentLikeButton({ isLiked, likes, handlePressLikeComment, marginLeft }) {
  return (
    <View
      style={{
        marginLeft: marginLeft || 0,
        ...styles.commentLikeButtonContainer,
      }}
    >
      <TouchableOpacity
        onPress={async () => {
          await handlePressLikeComment();
        }}
      >
        <FastImage
          style={styles.likeImage}
          source={
            isLiked
              ? require('../../Resources/img/iconRenewal/heart-on-outlined.png')
              : require('../../Resources/img/iconRenewal/heart-off-outlined.png')
          }
        />
      </TouchableOpacity>
      <Text>{likes || ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  commentLikeButtonContainer: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeImage: { marginRight: 2, width: 18, height: 18 },
});
