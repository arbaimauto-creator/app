import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { View } from 'react-native-animatable';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import BubblView from './bubbleView';
import ChatTextInput from './ChatTextInput';
import { styles } from './styles';

const ChatView = (props) => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <BubblView item={props.route.params.item} navigation={navigation} />
      <KeyboardAvoidingView
        style={{
          position: 'absolute',
          bottom: 24,
          left: 8,
          right: 8,
          marginHorizontal: 16,
        }}
        behavior="position"
      >
        <ChatTextInput />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatView;
