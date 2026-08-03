import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Constants from '../Constants';
import { getLanguage } from '../Strings';

const helpScreenType = {
  main: [
    {
      text: '왼쪽으로\n화면을 넘겨보세요.\n\n숨어있는 멋진 제품들의\n매력적인 리뷰를 볼 수 있어요!',
      top: '15%',
      left: '20%',
    },
    {
      text: '이용자가 직접 평가한\n리뷰어의 리뷰 평점이에요.\n화면을 클릭하시면\n평가할 수 있어요.\n\n지금 점수를 주세요.\n여러분의 리워드가 쌓일거에요!',
      top: '50%',
      left: '5%',
    },
    {
      text: '노란색 바를 위로 끌어올려보세요.\n\n카테고리별로 리뷰를 확인할 수 있어요.',
      top: '80%',
      left: '15%',
    },
  ],
  video: [
    {
      text: 'greyd의 자랑, 자부심.\n리뷰 평가 기능이에요.\n\n보신 리뷰를 평가해주세요!\n\n좋은 리뷰가 인정받는\ngreyd 를 여러분이 만들어주세요.\n\n리워드도 드립니다!',
      top: '70%',
      left: '10%',
    },
  ],
  addingNewVideo: [
    {
      text: '리뷰를 올려주세요!\n\n올리기만 해도 리워드가 쌓이고\n올리신 제품이 판매가 되면\n수익을 나눠드립니다.',
      top: '8%',
      left: '20%',
    },
    {
      text: '리뷰하신 제품이 \ngreyd 쇼핑에서 판매중인 상품이라면\n꼭 상품을 연결해주세요.\n\n리뷰를 통해 매출이 발생하면\n수익을 나눠드립니다. \n\n(연결이 안되면 수익을 못드려요. ㅠㅠ)',
      top: '50%',
      left: '12%',
    },
    {
      text: '인스타그램에\n동시 포스팅 해보세요. \n\n더 많은 사람들에게 리뷰가 알려지고\n여러분의 팬이 생기고\n더 많은 수익이 발생할 수 있습니다.',
      top: '60%',
      left: '20%',
    },
  ],
  tierGuide: [
    {
      text: '리뷰어 등급에 따라\n얻을 수 있는 판매 수익의 %가 달라집니다.\n\n리뷰를 더 많이 올릴 수록\n더 많은 평가를 받을 수록\n더 높은 평점을 받을 수록\n\n등급이 올라갑니다. ',
      top: '40%',
      left: '10%',
    },
  ],
};

export default function HelpBubble({ type, helpBubbleIndex, onPress }) {
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    if (helpScreenType[type]) {
      const bubbleObject = helpScreenType[type][helpBubbleIndex];
      if (bubbleObject) {
        setTop(bubbleObject.top);
        setLeft(bubbleObject.left);
        setText(bubbleObject.text);
      } else {
        setText('');
      }
    }
  }, [type, helpBubbleIndex]);

  if (getLanguage() === 'en' || !text) {
    return null;
  }

  return (
    <>
      <TouchableOpacity style={styles.container({ top, left })} onPress={() => onPress()}>
        <Text style={{ fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4, fontSize: 15 }}>
          {text}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: ({ top, left }) => ({
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,.85)',
    borderRadius: 16,
    borderColor: 'blue',
    padding: 20,
    top: top || '50%',
    left: left || '50%',
  }),
});
