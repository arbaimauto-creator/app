// 리뷰 상세 시트 (2026-09-14 쇼츠 UX 개편 · 9/15 제스처·디자인 정리).
// 리뷰 본문은 오버레이 캡션(더보기)으로 같은 화면에 보이고, 평가·문의·댓글·연관 리뷰 같은 나머지 상세는
// 이 시트가 영상 위에 겹쳐 연다. 닫으면 같은 쇼츠 그 자리. 위로 쓸어 열고(오버레이 핸들), 아래로 끌어 닫는다.
// 헤더는 design-import 시안 "REVIEW DETAIL"(작성자 · 저장 · 닫기)을 따르고 색·반경은 DesignTokens 값 그대로.
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import T from '../../Components/Constants/DesignTokens';
import Strings from '../../Components/Strings';
import { ReviewGradeBadgeView } from '../../Components/Views';

const { COLORS, FONT, RADIUS } = T;
const WINDOW_H = Dimensions.get('window').height;
const SHEET_H = Math.round(WINDOW_H * 0.86);
const CLOSE_DRAG = 110; // 이만큼 끌어내리면 닫힘
const CLOSE_VELOCITY = 0.9;

export default function DetailsSheet({
  visible,
  onClose,
  review,
  isBookmarked,
  onToggleBookmark,
  onPressAuthor,
  children,
}) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SHEET_H);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 26,
        stiffness: 260,
        mass: 0.9,
      }).start();
    }
  }, [visible, translateY]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: SHEET_H,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose && onClose());
  };

  // 그랩바·헤더 영역에서 아래로 끌면 시트가 따라오고, 충분히 끌거나 빠르게 던지면 닫힌다
  const headerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > CLOSE_DRAG || g.vy > CLOSE_VELOCITY) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 24 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 24 }).start();
      },
    }),
  ).current;

  const handle = review?.author?.name ? `@${review.author.name}` : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.backdrop}>
        {/* 위쪽 여백 — 누르면 닫힘. 영상이 살짝 보여 "같은 쇼츠 위에 떠 있다"는 감각을 준다 */}
        <TouchableWithoutFeedback onPress={dismiss} accessibilityRole="button">
          <View style={styles.spacer} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View {...headerPan.panHandlers}>
            <View style={styles.grabBar} />
            <View style={styles.header}>
              <TouchableOpacity
                onPress={dismiss}
                style={styles.roundBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={Strings.VIDEO_DETAILS_CLOSE}
              >
                <IconMaterialIcons name="keyboard-arrow-down" size={22} color={COLORS.INK} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onPressAuthor}
                disabled={!onPressAuthor}
                style={styles.authorWrap}
                accessibilityRole="button"
              >
                <Text style={styles.authorMeta} numberOfLines={1}>
                  {Strings.VIDEO_DETAILS_TITLE}
                  {handle ? ' · ' : ''}
                  <Text style={styles.authorHandle}>{handle}</Text>
                </Text>
              </TouchableOpacity>
              {review?.g6RatingCount > 0 ? (
                <ReviewGradeBadgeView
                  g6RatingCount={review.g6RatingCount}
                  g6AvgRatingScore={review.g6AvgRatingScore}
                  type={review.myG6Rating ? 'review_on' : 'review_off'}
                />
              ) : null}
              <TouchableOpacity
                onPress={onToggleBookmark}
                style={[styles.saveBtn, isBookmarked && styles.saveBtnOn]}
                accessibilityRole="button"
                accessibilityLabel={isBookmarked ? Strings.REF_SAVED : Strings.REF_SAVE}
              >
                <IconMaterialIcons
                  name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                  size={16}
                  color={isBookmarked ? COLORS.AMBER_DEEP : COLORS.INK}
                />
                <Text style={[styles.saveText, isBookmarked && styles.saveTextOn]}>
                  {isBookmarked ? Strings.REF_SAVED : Strings.REF_SAVE}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {visible ? children : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23, 23, 23, 0.42)', justifyContent: 'flex-end' },
  spacer: { flex: 1 },
  sheet: {
    height: SHEET_H,
    backgroundColor: COLORS.BG,
    borderTopLeftRadius: RADIUS.SHEET,
    borderTopRightRadius: RADIUS.SHEET,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  grabBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.TRACK,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
    backgroundColor: COLORS.BG,
  },
  roundBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.PILL,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorWrap: { flex: 1, minWidth: 0 },
  authorMeta: { fontFamily: FONT.Regular, fontSize: 11.5, color: COLORS.GREY },
  authorHandle: { fontFamily: FONT.Bold, color: COLORS.INK },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: RADIUS.BTN_SM,
    borderWidth: 1,
    borderColor: COLORS.LINE,
    backgroundColor: COLORS.SURFACE,
  },
  saveBtnOn: { backgroundColor: COLORS.AMBER_SOFT, borderColor: COLORS.AMBER_SOFT },
  saveText: { fontFamily: FONT.Bold, fontSize: 11, color: COLORS.INK },
  saveTextOn: { color: COLORS.AMBER_DEEP },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 40 },
});
