import React, { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSoftInputState } from 'react-native-avoid-softinput';
import IconAntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { ChatBuble } from '../../../screens/ChatView/bubbleView';
import ChatTextInput from '../../../screens/ChatView/ChatTextInput';
import { styles } from '../../../screens/ChatView/styles';
import { setQnaList } from '../../../slices/notification';
import APIprovider from '../../APIprovider';
import Constants from '../../Constants';
import Strings from '../../Strings';
import { moderateScale } from '../../utils/scailing';
import { shareLink } from '../../utils/share';
import { isGuestUser, LogoutAlert } from '../../utils';
import LoadingView from '../../Views/LoadingView';
import ShowParticipants from './ShowParticipants';
export default function QNAChat(props) {
  const [questionArray, setQuestionArray] = useState([]);
  const [hastagSelected, setHastagSelected] = useState('');
  const [hastagSelectedID, setHastagSelectedID] = useState('');

  const [logonUser, setLogonUser] = useState(null);
  const [host, setHost] = useState(null);
  const [item, setItem] = useState({});
  const [isMyUserPage, setIsMyUserPage] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [showParticipants, setShowParticipants] = useState(false);
  const [currentQnaParticipants, setCurrentQnaParticipants] = useState([]);

  const chatListRef = useRef(null);

  const { currentPushedNotification } = useSelector((state) => state.notification);
  const dispatch = useDispatch();

  const { isSoftInputShown, softInputHeight } = useSoftInputState();
  const [keyboardHeight, setKeyboardHeight] = useState(1);
  // 기존 로직과 동일하게 처리
  useEffect(() => {
    if (!isSoftInputShown) {
      setKeyboardHeight(softInputHeight);
      return;
    }
    setKeyboardHeight(1);
  }, [isSoftInputShown, softInputHeight]);

  useEffect(() => {
    // currentPushedNotification은 {type, qnaId} 객체 — 문자열 id와 직접 비교하면 항상 다름
    if (props.route.params.qnaId !== currentPushedNotification?.qnaId) {
      refreshByPushNotification(props.route.params.qnaId);
    } else {
      refreshByPushNotification(currentPushedNotification?.qnaId);
    }
  }, [currentPushedNotification, props.route.params.qnaId]);

  useEffect(() => {
    setIsLoading(true);
    APIprovider.getQnaChatlist(props.route.params.qnaId).then((result) => {
      if (result && result.success) {
        if (!result.updatedQna || result.updatedQna.statusCode === 1) {
          Alert.alert(Strings.QNA_HASHTAG_DELETED);
          props.navigation.pop();
          return;
        }

        setQuestionArray(result.qnaChats);
        setItem(result.updatedQna);
        setHastagSelected(result.updatedQna.hashtag);
        setHastagSelectedID(result.updatedQna._id);

        APIprovider.getUserDetails(props.route.params.logonUserId).then((_logonUser) => {
          setLogonUser(_logonUser);

          setIsMyUserPage(result.updatedQna.host === props.route.params.logonUserId);

          if (result.updatedQna.host === props.route.params.logonUserId) {
            setHost(_logonUser);
          } else {
            APIprovider.getUserDetails(result.updatedQna.host).then((_host) => {
              setHost(_host);
            });
          }
        });
      }
    });

    setTimeout(() => setIsLoading(false), 500);
    // 마운트 시 1회만 실행 (deps 추가 시 재실행 위험)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePressRemoveChat = () => {
    // 게스트 공용 계정으로는 삭제 불가 (게스트끼리 상호 삭제 방지)
    if (isGuestUser(APIprovider.requesterId)) {
      return LogoutAlert({ navigation: props.navigation, route: {} });
    }
    Alert.alert(
      Strings.QNA_HASHTAG_DELETE_TITLE,
      Strings.QNA_HASHTAG_DELETE_MESSAGE,
      [
        {
          text: Strings.BACK_BUTTON_TITLE,
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: Strings.DELETE,
          onPress: async () => {
            try {
              const removed = await APIprovider.removeQna({
                qnaId: hastagSelectedID,
              });

              if (removed && removed.success) {
                const result = await APIprovider.hashtagList(host._id);
                const othersOriginal = result.qnas.filter(
                  (tag) => tag.author !== APIprovider.requesterId,
                );
                const myOriginal = result.qnas.filter(
                  (tag) => tag.author === APIprovider.requesterId,
                );

                dispatch(
                  setQnaList({
                    qnaList: {
                      othersOriginal: othersOriginal,
                      others: othersOriginal,
                      myOriginal: myOriginal,
                      mine: myOriginal,
                    },
                  }),
                );

                props.navigation.pop();
              }
            } catch (err) {
              console.log('removeQna error', err);

              Alert.alert(
                Strings.FAILED_TO_DELETE,
                err.errorMsg ? err.errorMsg : '',
                [{ text: Strings.OK }],
                { cancelable: true },
              );
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  const handlePressLeave = () => {
    props.navigation.pop();
  };

  const addQuestionHashtag = async (message, tagUser) => {
    // 게스트는 채팅을 남길 수 없다
    if (isGuestUser(APIprovider.requesterId)) {
      return LogoutAlert({ navigation: props.navigation, route: {} });
    }
    await APIprovider.addQNAChat(hastagSelectedID, message, tagUser);
    const result = await APIprovider.getQnaChatlist(hastagSelectedID);

    if (result && result.success) {
      setQuestionArray(result?.qnaChats);
    }
  };

  const qnaShareWithDynamicLink = () => {
    const { _id, hashtag } = item;

    APIprovider.getQnaDynamicLink(_id, host.name, hashtag, host.profilePicUrl).then((res) => {
      const url = res?.shortLink;
      const message = Strings.QNA_SHARE(host.name, hashtag);

      shareLink({ url, message, description: hashtag });
    });
  };

  const refreshByPushNotification = async (qnaId) => {
    const result = await APIprovider.getQnaChatlist(qnaId);
    if (result && result.success) {
      setQuestionArray(result.qnaChats);
    }
  };

  const refreshQnaChat = async (qnaId) => {
    setIsLoading(true);

    const result = await APIprovider.getQnaChatlist(qnaId);
    if (result && result.success) {
      setQuestionArray(result.qnaChats);
    }

    Keyboard.dismiss();

    setTimeout(() => setIsLoading(false), 400);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: Constants.COLOR_BACKGROUND_DARK,
      }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <View
          style={{
            width: '100%',
            backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            borderRadius: 8,
            minHeight: 200,
            marginVertical: 8,
            justifyContent: 'space-between',
            height: '100%',
            // marginHorizontal: 20,
          }}
        >
          <View>
            <TouchableOpacity
              style={{ position: 'absolute', left: 10, top: 10, zIndex: 1 }}
              onPress={() => refreshQnaChat(hastagSelectedID)}
            >
              <Text
                style={{
                  color: Constants.COLOR_POINT_BLUE,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                }}
              >
                {Strings.QNA_REFRESH}
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.descriptionText,
                {
                  color: Constants.TIER_COLORS.ARTISAN,
                  paddingHorizontal: 2,
                  paddingVertical: 8,
                  fontSize: moderateScale(16),
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                  textAlign: 'center',
                },
              ]}
            >
              #{hastagSelected}
            </Text>
            <TouchableOpacity
              style={{ position: 'absolute', right: 10, top: 10 }}
              onPress={() => qnaShareWithDynamicLink()}
            >
              <Text
                style={{
                  color: Constants.COLOR_POINT_BLUE,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                }}
              >
                {Strings.SHARE}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              height: 50,
              backgroundColor: Constants.TIER_COLORS.STRIVER,
              borderTopRightRadius: 8,
              borderTopLeftRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              justifyContent: 'space-between',
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', width: '15%' }}
              onPress={() => handlePressLeave()}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                color={Constants.COLOR_BACKGROUND_DARK}
                size={30}
                style={{ marginRight: -3 }}
              />
              <Text
                style={{
                  color: Constants.COLOR_BACKGROUND_DARK,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                  fontSize: 16,
                }}
              >
                {Strings.QNA_LEAVE}
              </Text>
            </TouchableOpacity>

            {hastagSelected !== '' && (
              <TouchableOpacity
                onPress={async () => {
                  if (currentQnaParticipants.length) {
                    setShowParticipants(!showParticipants);
                  }

                  if (!currentQnaParticipants.length) {
                    const result = await APIprovider.findParticipantByIds({
                      qnaId: hastagSelectedID,
                      participants: item.participants,
                    });

                    setCurrentQnaParticipants(result?.participants);
                    setShowParticipants(!showParticipants);
                  }
                }}
              >
                <Text
                  style={[
                    styles.descriptionText,
                    {
                      color: Constants.COLOR_BACKGROUND_DARK,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.SEMIBOLD,
                      paddingHorizontal: 2,
                      fontSize: moderateScale(16),
                    },
                  ]}
                >
                  {item.participants.length} {Strings.QNA_PARTICIPANTS}
                </Text>
              </TouchableOpacity>
            )}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '15%',
              }}
            >
              {isMyUserPage ||
              (!questionArray.length && logonUser && logonUser._id === item.author) ? (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => handlePressRemoveChat()}
                >
                  <IconAntDesign
                    name="close"
                    color={Constants.COLOR_BACKGROUND_DARK}
                    size={16}
                    style={{ marginRight: 3 }}
                  />
                  <Text
                    style={{
                      color: Constants.COLOR_BACKGROUND_DARK,
                      fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                      fontSize: 16,
                    }}
                  >
                    {Strings.DELETE}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
            </View>
          </View>

          {showParticipants && currentQnaParticipants ? (
            <ShowParticipants
              currentQnaParticipants={currentQnaParticipants}
              setShowParticipants={setShowParticipants}
              navigation={props.navigation}
            />
          ) : null}

          {isLoading ? (
            <LoadingView message="" />
          ) : (
            <FlatList
              ref={chatListRef}
              onContentSizeChange={() => {
                if (chatListRef.current) {
                  chatListRef.current.scrollToEnd({ animated: true });
                }
              }}
              style={{ padding: 8 }}
              data={questionArray}
              keyExtractor={(_item) => _item._id}
              renderItem={(chatItem) => (
                <ChatBuble
                  item={chatItem}
                  right={props.route.params.logonUserId === chatItem?.item?.author?._id}
                  user={
                    props.route.params.logonUserId === chatItem?.item?.author?._id && logonUser
                      ? logonUser
                      : host
                  }
                  navigation={props.navigation}
                  setQuestionArray={setQuestionArray}
                />
              )}
              ListFooterComponent={<View style={{ height: keyboardHeight }} />}
            />
          )}

          <View style={{ padding: 8 }}>
            <ChatTextInput
              hashtagItem={item}
              placeholder={isMyUserPage ? 'Enter Answer' : 'Enter Question'}
              onPressSend={(text, tagUser) => {
                addQuestionHashtag(text, tagUser);
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
