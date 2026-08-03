import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import IconEntypo from 'react-native-vector-icons/Entypo';
import APIprovider from '../../Components/APIprovider';
import CommentListItemView from '../../Components/CommentListItemView';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import { LogoutAlert, isGuestUser } from '../../Components/utils';

function ReviewComments({ context }) {
  // let isCommentSubmitting = false;
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const { video } = context.state;
  const [recommentPosition, setRecommentPosition] = useState(-1);
  const [comment, setComment] = useState('');
  const [mentionedId, setMentionedId] = useState('');
  const [mentionedName, setMentionedName] = useState('');
  const [isRecommentLoading, setRecommentLoading] = useState(false);
  const recommentRef = useRef(null);

  useEffect(() => {
    if (!context.state.video.commentList || context.state.video.commentList.length < 1) {
      APIprovider.getVideoCommentList(video.videoId, undefined, '', 6).then((commentList) => {
        if (commentList && commentList.length > 0) {
          let loadedCommentCount = 0;
          commentList.forEach((item) => {
            loadedCommentCount = loadedCommentCount + (item.childCount ?? 0) + 1;
          });

          if (loadedCommentCount < context.state.video.commentCount) {
            context.setState({
              video: {
                ...context.state.video,
                commentList,
              },
              isEnableLoadingComment: true,
            });
          } else {
            context.setState({
              video: {
                ...context.state.video,
                commentList,
              },
              isEnableLoadingComment: false,
            });
          }
        }
      });
    }
  }, [context, video.videoId, context.state.video.commentCount]);

  const onRecommentDeleteRequested = useCallback(
    (commentId) => {
      APIprovider.deleteVideoComment(context.state.video.videoId, commentId)
        .then((res) => {
          deleteVideoRecommentCallback(res);
        })
        .catch((err) => {
          console.log(err);
          Alert.alert(
            Strings.FAILED_DELETE_COMMENT,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    },
    [context.state.video.videoId, deleteVideoRecommentCallback],
  );

  const loadRecommentList = useCallback(
    (_comment) => {
      const { video: currentVideo } = context.state;
      if (
        (!isRecommentLoading && !_comment.childComments) ||
        _comment.childComments?.length === 0
      ) {
        setRecommentLoading(true);
        APIprovider.getVideoCommentList(currentVideo.videoId, _comment.commentId, '', 5)
          .then((data) => {
            getRecommentListOfVideoCallback(data, _comment);
            setRecommentLoading(false);
          })
          .catch((err) => {
            setRecommentLoading(false);
            console.log(err);
            Alert.alert(
              Strings.FAILED_LOAD_COMMENTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
      } else if (!isRecommentLoading) {
        setRecommentLoading(true);
        // const offset = _comment.childComments[_comment.childComments.length - 1].createdAt;
        const skip = _comment.childComments.length;
        APIprovider.getVideoCommentList(currentVideo.videoId, _comment.commentId, skip, 5)
          .then((data) => {
            getRecommentListOfVideoCallback(data, _comment);
            setRecommentLoading(false);
          })
          .catch((err) => {
            setRecommentLoading(false);
            console.log(err);
            Alert.alert(
              Strings.FAILED_LOAD_COMMENTS,
              err.errorMsg ? err.errorMsg : '',
              [{ text: Strings.OK }],
              { cancelable: true },
            );
          });
      }
    },
    [context.state, getRecommentListOfVideoCallback, isRecommentLoading],
  );

  const getRecommentListOfVideoCallback = useCallback(
    (newList, _comment) => {
      for (let i = 0; i < context.state.video.commentList.length; i++) {
        if (context.state.video.commentList[i].commentId === _comment.commentId) {
          let prevState = Object.assign({}, context.state);
          if (!prevState.video.commentList[i].childComments) {
            prevState.video.commentList[i].childComments = newList;
          } else {
            prevState.video.commentList[i].childComments.push(...newList);
          }
          context.setState(prevState);
          break;
        }
      }
    },
    [context],
  );

  const deleteVideoRecommentCallback = useCallback(
    (result) => {
      for (let i = 0; i < context.state.video.commentList.length; i++) {
        for (let j = 0; j < context.state.video.commentList[i].childComments?.length; j++) {
          if (context.state.video.commentList[i].childComments[j]._id === result.commentId) {
            context.setState({
              video: {
                ...context.state.video,
                commentCount: context.state.video.commentCount - 1,
                commentList: [
                  ...context.state.video.commentList.slice(0, i),
                  {
                    ...context.state.video.commentList[i],
                    childCount: context.state.video.commentList[i].childCount - 1,
                    childComments: [
                      ...context.state.video.commentList[i].childComments.slice(0, j),
                      ...context.state.video.commentList[i].childComments.slice(
                        j + 1,
                        context.state.video.commentList[i].childComments.length,
                      ),
                    ],
                  },
                  ...context.state.video.commentList.slice(
                    i + 1,
                    context.state.video.commentList.length,
                  ),
                ],
              },
            });
            return;
          }
        }
      }
    },
    [context],
  );

  const addRecommentCallback = useCallback(
    (res) => {
      const newRecomment = res.data.comment;
      if (newRecomment.comment !== undefined && newRecomment.comment !== '') {
        setRecommentPosition(-1);
        setComment('');
        context.setState({ isWritingComment: false });
        Keyboard.dismiss();
        for (let i = 0; i < context.state.video.commentList.length; i++) {
          if (
            (context.state.video.commentList[i].commentId ||
              context.state.video.commentList[i]._id) === newRecomment.parentId
          ) {
            const childComments = context.state.video.commentList[i].childComments
              ? context.state.video.commentList[i].childComments
              : [];
            context.setState({
              video: {
                ...context.state.video,
                commentCount: context.state.video.commentCount + 1,
                commentList: [
                  ...context.state.video.commentList.slice(0, i),
                  {
                    ...context.state.video.commentList[i],
                    childCount: context.state.video.commentList[i].childCount + 1,
                    // childComments: [newRecomment, ...childComments],
                    childComments: [...childComments, newRecomment],
                  },
                  ...context.state.video.commentList.slice(
                    i + 1,
                    context.state.video.commentList.length,
                  ),
                ],
              },
            });
          }
        }
        // isCommentSubmitting = false;
        setIsCommentSubmitting(false);
      }
    },
    [context],
  );

  const submitRecomment = useCallback(
    ({ comment: commentText, upperCommentId, tagId = undefined }) => {
      // isCommentSubmitting = true;
      APIprovider.addVideoRecomment(
        commentText,
        context.state.video.videoId,
        context.state.video.videoId,
        upperCommentId,
        tagId,
      )
        .then((res) => {
          setIsCommentSubmitting(true);
          addRecommentCallback(res);
        })
        .catch((err) => {
          // isCommentSubmitting = false;
          setIsCommentSubmitting(false);
          Alert.alert(
            Strings.FAILED_ADD_COMMENT,
            err.errorMsg ? err.errorMsg : '',
            [{ text: Strings.OK }],
            { cancelable: true },
          );
        });
    },
    [addRecommentCallback, context.state.video.videoId],
  );

  const MemoizedReviewComments = (
    <View>
      <TouchableNativeFeedback
        onPress={() => {
          context.setState({
            isCommentExpanded: !context.state.isCommentExpanded,
          });
          context.loadCommentList();
        }}
      >
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            {Strings.COMMENTS} {video.commentCount}
          </Text>
          {video.commentCount > 0 && (
            <FastImage
              style={styles.sectionTitleMoreIcon}
              source={require('../../Resources/img/iconRenewal/icCommonTitle20W.png')}
            />
          )}
        </View>
      </TouchableNativeFeedback>
      <TouchableWithoutFeedback
        onPress={() => {
          if (isGuestUser(context.state.myUserId)) {
            return LogoutAlert(context.props);
          }
          context.setState({ isShowingCommentInput: true });
          context.commentInput.focus();
          setRecommentPosition(-1);
          context.setState({ isWritingComment: false });
          setMentionedName('');
          setMentionedId('');
          setComment('');
        }}
      >
        <View style={styles.addCommentButtonContainer}>
          <FastImage
            style={styles.userProfilePic}
            source={{ uri: context.state.logonUserProfilePicUrl }}
          />
          <Text
            style={{
              flex: 1,
              marginRight: 4,
              color: Constants.TIER_COLORS.ARTISAN,
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
            }}
          >
            {Strings.INPUT_COMMENT}
          </Text>
        </View>
      </TouchableWithoutFeedback>
      {context.state.isCommentExpanded && (
        <View style={styles.commentContainer}>
          <Animated.FlatList
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            data={video.commentList}
            renderItem={({ item, index }) => (
              <View>
                <CommentListItemView
                  type={'video'}
                  videoAuthor={context.state.video.author}
                  navigation={context.props.navigation}
                  data={item}
                  theme={'dark'}
                  onItemDeleteRequested={context.onCommentDeleteRequested.bind(context)}
                  enableRecomment
                  recommentCount={item.childCount}
                  onClickMoreComment={() => {
                    if (!item.childComments || item.childComments?.length < item.childCount) {
                      loadRecommentList(item);
                    }
                  }}
                  onClickRecomment={() => {
                    if (isGuestUser(context.state.myUserId)) {
                      return LogoutAlert(context.props);
                    }
                    setRecommentPosition(index);
                    context.setState({ isWritingComment: true });
                  }}
                  onClickOption={() => {
                    context.setState({
                      reportedCommentId: item.commentId,
                      isInvalidComment: true,
                    });
                  }}
                  isLikeLoading={context.state.isLikeLoading}
                  setLikeLoading={(value) => context.setState({ isLikeLoading: value })}
                  contextProps={context.props}
                />
                {recommentPosition === index && !item.parentId && (
                  <View
                    style={{
                      flexDirection: 'row',
                      marginHorizontal: 10,
                      marginBottom: 13,
                      paddingHorizontal: 21,
                      paddingVertical: Platform.OS === 'ios' ? 5 : 0,
                      alignItems: 'center',
                      backgroundColor: Constants.TIER_COLORS.PIONEER,
                    }}
                  >
                    <FastImage
                      style={styles.userProfilePic}
                      source={{ uri: context.state.logonUserProfilePicUrl }}
                    />
                    <View
                      style={{
                        flex: 1,
                        paddingBottom: Platform.OS === 'ios' ? 3 : 0,
                      }}
                    >
                      <TextInput
                        ref={recommentRef}
                        multiline
                        autoFocus
                        scrollEnabled={false}
                        style={{
                          color: Constants.TIER_COLORS.ARTISAN,
                          fontSize: 13,
                          marginLeft: -1,
                        }}
                        placeholder={Strings.ADD_RECOMMENT}
                        placeholderTextColor={Constants.TIER_COLORS.ARTISAN}
                        onChangeText={(text) => {
                          if (mentionedName !== '') {
                            if (text.length < mentionedName.length + 2) {
                              setMentionedName('');
                              setMentionedId('');
                              setComment('');
                            } else {
                              setComment(text.substr(mentionedName.length + 2));
                            }
                          } else {
                            setComment(text);
                          }
                        }}
                      >
                        {mentionedName !== '' && <Text>{`@${mentionedName} `}</Text>}
                        <Text>{comment}</Text>
                      </TextInput>
                    </View>
                    {comment !== '' ? (
                      <Button
                        title={Strings.POST}
                        type="clear"
                        titleStyle={{
                          fontSize: 13,
                          textDecorationLine: 'underline',
                          color: Constants.COLOR_MAIN,
                        }}
                        onPress={() => {
                          if (mentionedId !== '') {
                            submitRecomment({
                              comment: comment,
                              upperCommentId: item._id,
                              tagId: mentionedId,
                            });
                          } else {
                            submitRecomment({
                              comment: comment,
                              upperCommentId: item._id,
                            });
                          }
                        }}
                        disabled={isCommentSubmitting}
                      />
                    ) : (
                      <Button
                        title={Strings.CLOSE}
                        type="clear"
                        titleStyle={{
                          fontSize: 14,
                          textDecorationLine: 'underline',
                          color: Constants.COLOR_MAIN,
                        }}
                        onPress={() => {
                          setRecommentPosition(-1);
                          context.setState({ isWritingComment: false });
                          setMentionedName('');
                          setMentionedId('');
                          setComment('');
                        }}
                        disabled={isCommentSubmitting}
                      />
                    )}
                  </View>
                )}
                {item.childComments?.map((childItem, childIndex) => {
                  return (
                    <View style={{ marginLeft: 50 }} key={childItem._id}>
                      <CommentListItemView
                        type={'video'}
                        videoAuthor={context.state.video.author}
                        navigation={context.props.navigation}
                        data={childItem}
                        theme={'dark'}
                        onItemDeleteRequested={(res) => {
                          onRecommentDeleteRequested(res);
                        }}
                        recomment
                        mentionedName={childItem.tagId?.name}
                        onPressComment={() => {
                          setRecommentPosition(index);
                          context.setState({ isWritingComment: true });
                          setMentionedName(childItem.authorName);
                          setMentionedId(childItem.authorId);
                        }}
                        onClickOption={() => {
                          context.setState({
                            reportedCommentId: childItem.commentId,
                            isInvalidComment: true,
                          });
                        }}
                        isLikeLoading={context.state.isLikeLoading}
                        setLikeLoading={(value) => context.setState({ isLikeLoading: value })}
                      />
                      {childIndex === item.childComments?.length - 1 &&
                        item.childComments?.length < item.childCount && (
                          <TouchableOpacity
                            onPress={() => {
                              if (
                                !item.childComments ||
                                item.childComments.length < item.childCount
                              ) {
                                loadRecommentList(item);
                              }
                            }}
                          >
                            <Text
                              style={{
                                marginLeft: 10,
                                marginTop: -5,
                                color: '#999',
                                textDecorationLine: 'underline',
                              }}
                            >
                              {Strings.ViewMoreRecomment(
                                item.childCount - item.childComments.length,
                              )}
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  );
                })}
              </View>
            )}
            keyExtractor={(item) => item._id}
          />
          {context.state.isEnableLoadingComment && (
            <TouchableOpacity
              onPress={(data) => {
                context.loadCommentList(data);
              }}
              style={{ paddingBottom: 10, alignItems: 'center', justifyContent: 'center' }}
            >
              <IconEntypo size={18} name="dots-three-vertical" color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // 의도적 메모 패턴 — 아래 상태 변경 시에만 갱신

  return React.useMemo(
    () => MemoizedReviewComments,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      video.commentCount,
      video.commentList,
      loadRecommentList,
      submitRecomment,
      onRecommentDeleteRequested,
      context.state.isCommentExpanded,
      context.state.isEnableLoadingComment,
      recommentPosition,
      comment,
      mentionedId,
      mentionedName,
      isRecommentLoading,
    ],
  );
}

const styles = StyleSheet.create({
  sectionTitleContainer: {
    marginTop: 20, //34,
    marginLeft: 20,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    color: Constants.TIER_COLORS.ARTISAN,
    marginRight: 6,
  },
  sectionTitleMoreIcon: {
    width: 12,
    height: 20,
  },
  addCommentButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 21,
    alignItems: 'center',
    backgroundColor: Constants.TIER_COLORS.EXPLORER,
    borderRadius: 14,
  },
  userProfilePic: {
    width: 28,
    height: 28,
    borderRadius: 28,
    marginRight: 20,
  },
  commentContainer: {
    paddingHorizontal: 10,
  },
});

export default ReviewComments;
