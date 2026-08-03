import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import IconAntDesign from 'react-native-vector-icons/AntDesign';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import UserProfilePicViewUpdate from '../UserPageScreen/UserProfilePicViewUpdate';
import { styles } from './styles';

const ChatTextInput = ({ onPressSend, placeholder, hashtagItem }) => {
  const [text, setText] = useState('');
  const [tagUser, setTagUser] = useState(null);
  const [suggestion, setSuggestions] = useState([]);
  const [participants, setParticipants] = useState([]);

  const inputRef = useRef();
  // useEffect(() => {
  //   InteractionManager.runAfterInteractions(() => {
  //     inputRef.current.focus();
  //   });
  // }, []);

  useEffect(() => {
    if (hashtagItem && hashtagItem.participants) {
      APIprovider.findParticipantByIds({
        qnaId: hashtagItem._id,
        participants: hashtagItem.participants,
      }).then((res) => setParticipants(res?.participants));
    }
  }, [hashtagItem]);

  const handleTextChange = async (newText) => {
    setText(newText);
    // /@(\w+)$/i
    const match = newText.match(/@(\w+)/i);
    const word = match ? match[1] : '';
    const filltersuggestion = participants.filter((user) =>
      user?.name.toLowerCase().includes(word.toLowerCase()),
    );

    if (word === '' && !newText.includes('@')) {
      setSuggestions([]);
    } else {
      if (word) {
        const result = await APIprovider.findUsersByName({ username: word });

        if (result instanceof Error) {
          return;
        }

        if (result && result.success) {
          const { users } = result;

          // const newSuggestions = new Set([...suggestion, users]);
          // console.log([...newSuggestions].length);
          // setSuggestions([...newSuggestions]);
          // return;

          // const exist = suggestion.findIndex((sug) => sug.userId === users.userId);

          // if (exist < 0) {
          setSuggestions(users);
          return;
          // }
        }
      }

      setSuggestions(filltersuggestion);
    }
  };

  const handleSuggestionPress = (_suggestion) => {
    const match = text.match(/@(\w+)/i);
    const taggedUserName = match ? match[1] : '';
    const removeTaggedUserText = text.split(`@${taggedUserName}`).join('');

    setTagUser(_suggestion);
    setText(removeTaggedUserText);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    if (text === '') {
      return Alert.alert('Please type Something in Answer');
    }

    onPressSend(text, tagUser);
    setText('');
    setTagUser(null);
  };

  return (
    <>
      {suggestion.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 60,
            marginHorizontal: 16,
            backgroundColor: '#535353',
            borderTopRightRadius: 8,
            borderTopLeftRadius: 8,
            width: '95%',
            zIndex: 1,
          }}
        >
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestion}
            keyExtractor={(_, _index) => _index.toString()}
            renderItem={({ item, index }) => {
              return (
                <TouchableOpacity
                  style={{
                    width: '100%',
                    backgroundColor: Constants.TIER_COLORS.PIONEER,
                    padding: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <UserProfilePicViewUpdate
                    style={styles.profileImage}
                    source={{ uri: item?.profilePicUrl }}
                    class={item?.class}
                  />
                  <Text
                    style={[
                      styles.descriptionText,
                      { marginLeft: 8, color: Constants.TIER_COLORS.ARTISAN },
                    ]}
                  >
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
      <View style={[styles.mainContainer, { paddingHorizontal: 16 }]}>
        <View style={styles.cellContainer}>
          {tagUser ? (
            <View
              style={{
                flexDirection: 'column',
                width: '80%',
                height: 100,
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  height: '50%',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                    color: Constants.COLOR_POINT_BLUE,
                    marginRight: 5,
                  }}
                >
                  @{tagUser.name}
                </Text>
                <TouchableOpacity onPress={() => setTagUser(null)}>
                  <IconAntDesign name="close" color={Constants.TIER_COLORS.ARTISAN} size={18} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.countText,
                  {
                    color: Constants.TIER_COLORS.ARTISAN,
                    height: '50%',
                  },
                ]}
                placeholder={placeholder || 'Enter Answer'}
                placeholderTextColor={Constants.TIER_COLORS.ARTISAN}
                value={text}
                onChangeText={handleTextChange}
                // onKeyPress={(e) => {
                //   if (e.nativeEvent.key === 'Backspace' && !text) {
                //     setTagUser(null);
                //   }
                // }}
              />
            </View>
          ) : (
            <TextInput
              style={[styles.countText, { color: Constants.TIER_COLORS.ARTISAN, width: '85%' }]}
              placeholder={placeholder || 'Enter Answer'}
              placeholderTextColor={Constants.TIER_COLORS.STRIVER}
              value={text}
              onChangeText={handleTextChange}
              ref={inputRef}
            />
          )}
          <TouchableOpacity
            style={{
              width: 60,
              paddingHorizontal: 8,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: Constants.COLOR_POINT_BLUE,
            }}
            onPress={() => handleSubmit()}
          >
            <Text style={[styles.countText, { color: Constants.COLOR_BACKGROUND_DARK }]}>
              {Strings.NEW_HASHTAG_CHAT_SEND}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default ChatTextInput;
