import React from 'react';
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIPhone12, isIPhone12Max } from 'react-native-status-bar-height';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';

const { COLORS, RADIUS, FONT } = T;

function CommentModal({ context }) {
  const bottom = context.state.isShowingCommentInput ? 0 : -Dimensions.get('window').height;
  const insets = useSafeAreaInsets();

  const MemoizedCommentModal = (
    <TouchableWithoutFeedback
      onPress={() => {
        context.setState({ isShowingCommentInput: false });
        Keyboard.dismiss();
      }}
    >
      <View style={[styles.addCommentModalContainer(insets), { bottom }]}>
        <TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <View style={styles.grabBar} />
            <View style={styles.secretCommentContainer}>
              <Text style={styles.secretCommentLabel}>{Strings.SECRET_COMMENT}</Text>
              <Switch
                trackColor={{
                  false: COLORS.TRACK,
                  true: COLORS.AMBER,
                }}
                thumbColor={COLORS.SURFACE}
                ios_backgroundColor={COLORS.TRACK}
                onValueChange={(value) => {
                  context.setState({ isSecretComment: value });
                }}
                value={context.state.isSecretComment}
              />
            </View>
            {/* 댓글과 "리뷰어에게 물어보기"를 합쳤다 — 별도 Q&A 화면 대신 댓글에 질문 표시 (2026-09-15) */}
            <View style={styles.secretCommentContainer}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.secretCommentLabel}>{Strings.ASK_REVIEWER_TOGGLE}</Text>
                <Text style={styles.toggleDesc}>{Strings.ASK_REVIEWER_TOGGLE_DESC}</Text>
              </View>
              <Switch
                trackColor={{
                  false: COLORS.TRACK,
                  true: COLORS.AMBER,
                }}
                thumbColor={COLORS.SURFACE}
                ios_backgroundColor={COLORS.TRACK}
                onValueChange={(value) => {
                  context.setState({ isQuestionComment: value });
                }}
                value={context.state.isQuestionComment}
              />
            </View>
            <View style={styles.addCommentInputContainer}>
              <FastImage
                style={styles.userProfilePic}
                source={{ uri: context.state.logonUserProfilePicUrl }}
              />
              <TextInput
                ref={(input) => {
                  context.commentInput = input;
                }}
                multiline
                style={styles.commentInput}
                placeholder={Strings.INPUT_COMMENT}
                placeholderTextColor={COLORS.GREY}
                onChangeText={(newComment) => context.setState({ newComment })}
                value={context.state.newComment}
              />
              {context.state.newComment !== '' && (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    context.state.isNewCommentSubmitting && styles.submitButtonDisabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={context.onSubmitNewComment.bind(context)}
                  disabled={context.state.isNewCommentSubmitting}
                >
                  <Text style={styles.submitButtonText}>{Strings.POST}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );

  // MemoizedCommentModal은 매 렌더마다 새로 만들어지는 JSX — 아래 상태들이 바뀔 때만 갱신하는 의도적 패턴

  return React.useMemo(
    () => MemoizedCommentModal,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      context.state.isNewCommentSubmitting,
      context.state.newComment,
      context.state.isShowingCommentInput,
      context.state.isSecretComment,
      context.state.isQuestionComment,
    ],
  );
}

const styles = StyleSheet.create({
  addCommentModalContainer: (insets) => ({
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingBottom: isIPhone12() || isIPhone12Max() ? insets.bottom : 0,
    // isIPhoneWithDynamicIsland()
  }),
  sheet: {
    width: '100%',
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: RADIUS.SHEET,
    borderTopRightRadius: RADIUS.SHEET,
    paddingTop: 8,
    ...T.SHADOW_SHEET,
  },
  grabBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD9D2',
    marginBottom: 12,
  },
  addCommentInputContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  secretCommentContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
  },
  secretCommentLabel: {
    fontFamily: FONT.Bold,
    fontSize: 11,
    color: COLORS.INK,
  },
  toggleTextWrap: { flex: 1, paddingRight: 12 },
  toggleDesc: { marginTop: 2, fontFamily: FONT.Regular, fontSize: 10.5, color: COLORS.GREY },
  userProfilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: COLORS.LINE,
  },
  commentInput: {
    flex: 1,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 110,
    borderWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    backgroundColor: COLORS.SURFACE,
    paddingVertical: 9,
    paddingHorizontal: 12,
    color: COLORS.INK,
    fontFamily: FONT.Regular,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: COLORS.AMBER,
    borderRadius: RADIUS.BTN_SM,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontFamily: FONT.ExtraBold,
    fontSize: 12.5,
    color: COLORS.ON_AMBER,
  },
});

export default CommentModal;
