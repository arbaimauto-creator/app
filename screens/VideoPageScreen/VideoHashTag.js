import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../AddingNewVideoScreen/styles';
import APIprovider from '../../Components/APIprovider';

export default function VideoHashTag({ hashTags, isReviewPage = false, navigation }) {
  const uniqueHashtags = [...new Set(hashTags)]; //removing duplicated hashtags

  const handleHashtagPress = (tag) => {
    // Navigate immediately
    if (isReviewPage) {
      navigation.push('Search', {
        hashTag: tag,
        isHashtagSearch: true,
      });
    } else {
      navigation.replace('Search', {
        hashTag: tag,
        isHashtagSearch: true,
      });
    }

    APIprovider.findVideoByHashTag(tag)
      .then((_results) => {
        // navigation.setParams is possible to update the results
      })
      .catch((error) => {
        console.log('Error fetching hashtag results:', error);
      });
  };

  return (
    <View style={styles.hashTagListContainer}>
      {uniqueHashtags.map((tag, index) => (
        <TouchableOpacity
          style={styles.hashTagList}
          key={`${tag}-${index}`}
          onPress={() => handleHashtagPress(tag)}
        >
          <Text style={styles.hashTagItem}>
            <Text style={{ fontWeight: 'bold' }}>#</Text> {tag}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
