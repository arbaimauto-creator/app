// 리뷰 상세 시트 (2026-09-14 쇼츠 UX 개편).
// 이전엔 리뷰 상세가 "영상 아래로 스크롤한 위치"라, 상세를 보는 동안 바깥 쇼츠 페이저가 잠겨
// 다음 영상으로 넘어가려면 다시 위로 올라와야 했다(화면이 둘로 느껴지는 원인).
// 이제 리뷰 본문은 오버레이 캡션(더보기)으로 같은 화면에 보이고, 댓글·문의·연관 리뷰 같은 나머지 상세는
// 이 시트가 영상 위에 겹쳐 연다. 시트를 닫으면 같은 쇼츠 그 자리다. 기존 상세 컴포넌트는 그대로 재사용.
import React from 'react';
import {
  Dimensions,
  Modal,
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

const { COLORS, FONT } = T;

export default function DetailsSheet({ visible, onClose, children }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* 위쪽 여백 — 누르면 닫힘. 영상이 살짝 보여 "같은 쇼츠 위에 떠 있다"는 감각을 준다 */}
        <TouchableWithoutFeedback onPress={onClose} accessibilityRole="button">
          <View style={styles.spacer} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={styles.grabBar} />
          <View style={styles.header}>
            <Text style={styles.title}>{Strings.VIDEO_DETAILS_TITLE}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={Strings.VIDEO_DETAILS_CLOSE}
            >
              <IconMaterialIcons name="close" size={24} color={COLORS.INK} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {visible ? children : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  // 위 여백은 남는 공간, 시트는 화면의 86% 고정 — flex:1 시트는 내용 높이에 밀려 화면을 넘겼다(실측)
  spacer: { flex: 1 },
  sheet: {
    height: Math.round(Dimensions.get('window').height * 0.86),
    backgroundColor: COLORS.BG,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  grabBar: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.LINE,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LINE,
  },
  title: { fontFamily: FONT.Bold, fontSize: 15, color: COLORS.INK },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 40 },
});
