import _ from 'lodash';
import T from '../../Constants/DesignTokens';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { styles } from '../../../screens/UserPageScreen/UserPageScreen';
import { setQnaList } from '../../../slices/notification';
import APIprovider from '../../APIprovider';
import Constants from '../../Constants';
import Strings from '../../Strings';
import { isGuestUser, LogoutAlert } from '../../utils';

export default function QNAList({ context, scrollRef, navigation }) {
  const [buttonTitle, setButtonTitle] = useState(Strings.QNA_FIND);
  const [isQnaRefreshing, SetIsQnaRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');

  const { qnaList, currentPushedQnaId } = useSelector((state) => state.notification);
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('currentPushedQnaId', currentPushedQnaId);
    refreshQnaList();
    // refreshQnaList는 매 렌더 재생성 — 푸시 ID 변경 시에만 갱신하는 의도
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPushedQnaId]);

  useEffect(() => {
    refreshQnaList();
    // 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshQnaList = async () => {
    SetIsQnaRefreshing(true);

    const result = await APIprovider.hashtagList(context.state.user.userId);
    if (result && result.success) {
      const othersOriginal = result.qnas.filter((tag) => tag.author !== APIprovider.requesterId);
      const myOriginal = result.qnas.filter((tag) => tag.author === APIprovider.requesterId);

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
    }

    setTimeout(() => SetIsQnaRefreshing(false), 250);
  };

  const hashtagRef = useRef();

  const listToMatrix = (list) => {
    return _.chunk(list, 8);
  };

  const findHashtag = (word) => {
    setKeyword(word);

    // 버튼 구분
    const qna = qnaList?.othersOriginal.find(
      (item) => item.hashtag.toLowerCase() === word.toLowerCase(),
    );
    const myQna = qnaList?.myOriginal.find(
      (item) => item.hashtag.toLowerCase() === word.toLowerCase(),
    );

    if (!qna && !myQna && word) {
      setButtonTitle(Strings.QNA_CREATE);
    } else {
      setButtonTitle(Strings.QNA_FIND);
    }

    // 검색 결과반영
    const filltersuggestion = qnaList?.othersOriginal.filter((item) =>
      item?.hashtag.toLowerCase().includes(word.toLowerCase()),
    );
    const fillterMySuggestion = qnaList?.myOriginal.filter((item) =>
      item?.hashtag.toLowerCase().includes(word.toLowerCase()),
    );

    if (filltersuggestion.length && fillterMySuggestion.length) {
      dispatch(setQnaList({ qnaList: { others: filltersuggestion, mine: fillterMySuggestion } }));
    } else if (filltersuggestion.length && !fillterMySuggestion.length) {
      dispatch(setQnaList({ qnaList: { others: filltersuggestion, mine: [] } }));
    } else if (!filltersuggestion.length && fillterMySuggestion.length) {
      dispatch(setQnaList({ qnaList: { others: [], mine: fillterMySuggestion } }));
    } else if (!filltersuggestion.length && !fillterMySuggestion.length) {
      dispatch(setQnaList({ qnaList: { others: [], mine: [] } }));
    }
  };

  const enterChat = async (item) => {
    const result = await APIprovider.getQnaChatlist(item?._id);

    if (result && result.success && result.updatedQna) {
      if (result.updatedQna.statusCode === 0) {
        navigation.push('QNAChat', { qnaId: item._id, context });
        return;
      }
    }

    Alert.alert(Strings.QNA_HASHTAG_DELETED);
    refreshQnaList();

    // APIprovider.getQnaChatlist(item?._id).then((res) => {
    // navigation.push('QNAChat', { qnaId: item._id, context });
    // });
  };

  const renderRow = (item, _context) => {
    return (
      <TouchableOpacity style={style.hashTagBorder(item)} onPress={() => enterChat(item)}>
        <Text
          style={{
            fontSize: 12,
            color: !item?.selected ? T.COLORS.INK : '#535353',
          }}
        >
          {'#' + item?.hashtag}
        </Text>
      </TouchableOpacity>
    );
  };

  const handlePressAddQna = async () => {
    const { user } = context.state;

    // 게스트는 QnA 해시태그를 생성할 수 없다 (게스트 공용 계정 명의 생성 방지)
    if (isGuestUser(user?._id)) {
      return LogoutAlert({ navigation, route: {} });
    }

    Alert.alert(
      Strings.QNA_NOT_FOUND,
      Strings.SHALL_WE_CREATE_QNA(keyword),
      [
        {
          text: Strings.BACK_BUTTON_TITLE,
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: Strings.OK,
          onPress: async () => {
            if (keyword === '') {
              return Alert.alert(Strings.NEW_HASHTAG_EMPTY);
            }

            const addedResult = await APIprovider.addQnaHashtag({
              host: user._id,
              hashtag: keyword,
            });

            if (addedResult && addedResult.success) {
              refreshQnaList();
              setKeyword('');

              if (hashtagRef.current) {
                hashtagRef.current.scrollToEnd({ animated: true });
              }
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  if (isQnaRefreshing) {
    return (
      <View style={styles.qnaLoadingContainer}>
        <ActivityIndicator size="small" color={Constants.COLOR_MAIN} />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 20 }}>
      <TouchableOpacity
        style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}
        onPress={() => refreshQnaList()}
      >
        <Text style={styles.qnaRefresh}>{Strings.QNA_REFRESH}</Text>
      </TouchableOpacity>

      <View style={styles.qnaSentence}>
        <Text style={[styles.descriptionText, style.othersQuestionText]}>
          {Strings.QNA_HASHTAG_LIST_SENTENCE(context.state.user.name)}
        </Text>
      </View>

      <FlatList
        data={listToMatrix(qnaList?.others)}
        listKey={(item, index) => index.toString()}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={item}
            renderItem={({ item: _item }) => renderRow(_item, context)}
            keyExtractor={(keyItem) => keyItem._id.toString()}
            listKey={(listKeyItem) => listKeyItem._id.toString()}
            ref={hashtagRef}
            onContentSizeChange={() => {
              if (hashtagRef.current) {
                // hashtagRef.current.scrollToEnd({ animated: true });
              }
            }}
          />
        )}
      />

      <Text style={style.myQuestionText}>{Strings.QNA_HASHTAG_LIST_ME}</Text>

      <View style={style.hashTagListContainer}>
        {qnaList?.mine &&
          qnaList?.mine.map((tag, index) => (
            <TouchableOpacity
              key={tag.hashtag + '_' + index}
              style={style.hashTagBorder(tag)}
              onPress={() => enterChat(tag)}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: !tag?.selected ? T.COLORS.INK : '#535353',
                }}
              >
                {'#' + tag?.hashtag}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      <View style={style.findContainer}>
        <TextInput
          style={style.findTextInput}
          placeholder={Strings.QNA_HASHTAG_FIND_PLACE_HOLDER}
          placeholderTextColor="#6a6a6a"
          value={keyword}
          onChangeText={(text) => {
            findHashtag(text);
          }}
        />
        <TouchableOpacity
          style={style.findOrCreateButton}
          onPress={() => {
            if (buttonTitle === Strings.QNA_CREATE) {
              handlePressAddQna();
            }
          }}
        >
          <Text style={{ color: Constants.COLOR_BACKGROUND_DARK }}>{buttonTitle}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  hashTagListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // marginHorizontal: 20,
    marginTop: 10,
  },
  hashTagList: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: 'rgba(255, 255, 255, .5)',
    marginRight: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    marginBottom: 5,
  },
  hashTagItem: {
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    color: T.COLORS.INK,
  },
  hashTagBorder: (item) => ({
    margin: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    // flex: 0.2,
    backgroundColor: !item?.selected ? 'transparent' : Constants.COLOR_MAIN,
    borderColor: T.COLORS.INK,
  }),
  findContainer: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderColor: '#6a6a6a',
    // marginVertical: 14,
    marginTop: 14,
    marginBottom: 28,
    flexDirection: 'row',
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  findTextInput: {
    color: T.COLORS.INK,
    fontSize: 12,
    flex: 0.8,
    marginHorizontal: 8,
    paddingVertical: 0,
  },
  findOrCreateButton: {
    margin: 2,
    flex: 0.2,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: Constants.COLOR_POINT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myQuestionText: {
    marginTop: 10,
    color: T.COLORS.GREY,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    fontSize: 13,
  },
  othersQuestionText: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    textAlign: 'left',
    color: T.COLORS.GREY,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
    fontSize: 13,
  },
});
