// 자동 번역 텍스트 (2026-09-17) — 리뷰 본문이 앱 언어와 다르면 번역해서 보여주고
// "원문 보기"로 되돌릴 수 있다. 번역 실패 시 조용히 원문 유지.
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Strings, { getLanguage } from './Strings';
import T from './Constants/DesignTokens';
import { needsTranslation, translate } from '../api/translate';

export default function AutoTranslateText({ text, style, numberOfLines, toggleStyle }) {
  const [translated, setTranslated] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const appLang = getLanguage();

  useEffect(() => {
    let alive = true;
    setTranslated(null);
    setShowOriginal(false);
    if (needsTranslation(text, appLang)) {
      translate(text, appLang).then((result) => {
        if (alive && result) {
          setTranslated(result);
        }
      });
    }
    return () => {
      alive = false;
    };
  }, [text, appLang]);

  const showingTranslation = translated && !showOriginal;
  return (
    <View>
      <Text style={style} numberOfLines={numberOfLines}>
        {showingTranslation ? translated : text}
      </Text>
      {translated ? (
        <TouchableOpacity
          onPress={() => setShowOriginal((v) => !v)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
        >
          <Text
            style={[
              { fontFamily: T.FONT.Bold, fontSize: 10.5, color: T.COLORS.GREY, marginTop: 3 },
              toggleStyle,
            ]}
          >
            {showingTranslation
              ? `${Strings.TRANSLATED_BY} · ${Strings.TRANSLATE_SHOW_ORIGINAL}`
              : Strings.TRANSLATE_SHOW_TRANSLATION}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
