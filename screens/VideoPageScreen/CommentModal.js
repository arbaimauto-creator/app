import React from 'react';
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIPhone12, isIPhone12Max } from 'react-native-status-bar-height';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';

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
          <>
            <View style={styles.secretCommentContainer}>
              <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4 }}>
                {Strings.SECRET_COMMENT}
              </Text>
              <Switch
                trackColor={{
                  false: Constants.TIER_COLORS.ARTISAN,
                  true: Constants.COLOR_POINT_BLUE,
                }}
                thumbColor={
                  context.state.isSecretComment
                    ? Constants.TIER_COLORS.PIONEER
                    : Constants.TIER_COLORS.EXPLORER
                }
                ios_backgroundColor={Constants.TIER_COLORS.ARTISAN}
                onValueChange={(value) => {
                  context.setState({ isSecretComment: value });
                }}
                value={context.state.isSecretComment}
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
                style={{
                  flex: 1,
                  marginRight: 4,
                  color: Constants.TIER_COLORS.ARTISAN,
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                  fontSize: 14,
                }}
                placeholder={Strings.INPUT_COMMENT}
                placeholderTextColor={Constants.TIER_COLORS.STRIVER}
                onChangeText={(newComment) => context.setState({ newComment })}
                value={context.state.newComment}
              />
              {context.state.newComment !== '' && (
                <Button
                  title={Strings.POST}
                  type="clear"
                  titleStyle={styles.addCommentButtonTitle}
                  //containerStyle={styles.interactionButtonContainer}
                  //buttonStyle={styles.interactionButton}
                  onPress={context.onSubmitNewComment.bind(context)}
                  disabled={context.state.isNewCommentSubmitting}
                />
              )}
            </View>
          </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: isIPhone12() || isIPhone12Max() ? insets.bottom : 0,
    // isIPhoneWithDynamicIsland()
  }),
  addCommentInputContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 21,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  secretCommentContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 21,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  userProfilePic: {
    width: 28,
    height: 28,
    borderRadius: 28,
    marginRight: 20,
  },
  addCommentButtonTitle: {
    color: Constants.COLOR_MAIN,
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
  },
  interactionButtonContainer: {
    padding: 10,
  },
  interactionButton: {
    padding: 10,
  },
});

export default CommentModal;
