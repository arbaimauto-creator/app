import React, { useEffect, useState } from 'react';
import T from '../../Constants/DesignTokens';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../../screens/ChatView/styles';
import APIprovider from '../../APIprovider';
import Strings from '../../Strings';
import Constants from '../../Constants';

export default function InputNewQnaHashtag({ host, selectedHastag, context, hashtagRef }) {
  const [text, setText] = useState('');

  const handlePressAddQna = async () => {
    if (text === '') {
      return Alert.alert(Strings.NEW_HASHTAG_EMPTY);
    }

    const isDuplicated = context.state.hastagArray.findIndex((qna) => qna.hashtag === text);

    if (isDuplicated > 0) {
      return Alert.alert(Strings.NEW_HASHTAG_DUPLICATED);
    }

    setText('');

    const addedResult = await APIprovider.addHashtag({ host, hashtag: text });

    if (addedResult && addedResult.success) {
      const qnaHashtagList = await APIprovider.hashtagList(host);
      const hastagArray = qnaHashtagList.qnas.map((v) => ({ ...v, selected: false }));

      context.setState({ hastagArray, hastagArrayMain: hastagArray });
      selectedHastag(addedResult.result, context);

      if (hashtagRef.current) {
        hashtagRef.current.scrollToEnd({ animated: true });
      }
    }
  };

  useEffect(() => {
    // console.log('host', host);
  }, []);

  return (
    <View style={{ marginVertical: 20 }}>
      <View style={[styles.mainContainer, { paddingLeft: 20 }]}>
        <View style={styles.cellContainer}>
          <TextInput
            style={[styles.countText, { color: T.COLORS.INK, width: '80%' }]}
            placeholder={Strings.NEW_HASHTAG_PLACE_HOLDER}
            placeholderTextColor={T.COLORS.INK}
            value={text}
            onChangeText={(value) => {
              setText(value);
            }}
          />
          <TouchableOpacity
            style={{
              width: 60,
              paddingHorizontal: 8,
              height: 32,
              justifyContent: 'center',
              backgroundColor: '#535365',
            }}
            onPress={() => handlePressAddQna()}
          >
            <Text style={[styles.countText, { color: T.COLORS.INK }]}>
              {Strings.NEW_HASHTAG_CHAT_SEND}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
