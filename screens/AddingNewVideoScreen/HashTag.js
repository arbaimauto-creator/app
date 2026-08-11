import React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { Pressable, Text, TextInput, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import styles from './styles';

export default function HashTags({ context }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{Strings.HASH_TAG}</Text>
      </View>
      <TextInput
        style={{ ...styles.textInput, ...styles.hashTagTextInput }}
        borderRadius={10}
        placeholder={Strings.HASH_TAG_PLACE_HOLDER}
        placeholderTextColor={T.COLORS.GREY}
        onChange={(event) => {
          const { text } = event.nativeEvent;

          if (text.includes(' ')) {
            if (text !== ' ' && text !== '  ' && !context.state.hashTagArr.includes(text.trim())) {
              let hashTag = context.state.hashTag;
              while (hashTag.startsWith('#')) {
                hashTag = hashTag.slice(1);
              }

              if (!hashTag) {
                return;
              }

              context.setState({
                hashTagArr: [...context.state.hashTagArr, hashTag.trim()],
                hashTag: '',
              });
            } else {
              context.setState({ hashTag: '' });
            }

            return;
          }

          context.setState({ hashTag: text.trim() });
        }}
        value={context.state.hashTag}
        maxLength={Constants.MAX_LENGTH_REVIEW_TITLE}
      />
      <View style={styles.hashTagListContainer}>
        {context.state.hashTagArr.map((tag) => (
          <View style={styles.hashTagList} key={tag}>
            <Text style={styles.hashTagItem}>
              <Text style={{ fontWeight: 'bold' }}>#</Text> {tag}
            </Text>
            <Pressable
              style={{ marginLeft: 20 }}
              onPress={() => {
                context.setState({
                  hashTagArr: context.state.hashTagArr.filter((tagElement) => tagElement !== tag),
                });
              }}
            >
              <FastImage
                source={require('../../Resources/img/iconRenewal/icHeaderClose22.png')}
                style={{ height: 16, width: 16 }}
              />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
