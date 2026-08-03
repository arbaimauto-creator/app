import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import Postcode from '@actbase/react-daum-postcode';

import Strings from './Strings';
import Constants from './Constants';

function AddressSearchScreen(props) {
  props.navigation.setOptions({
    title: Strings.SEARCH_ADDRESS,
  });

  useEffect(() => {}, []);
  return (
    <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
      <Postcode
        theme={{
          bgColor: '#162525', //바탕 배경색
          searchBgColor: '#162525', //검색창 배경색
          contentBgColor: '#162525', //본문 배경색(검색결과,결과없음,첫화면,검색서제스트)
          pageBgColor: '#162525', //페이지 배경색
          textColor: '#FFFFFF', //기본 글자색
          queryTextColor: '#FFFFFF', //검색창 글자색
          //postcodeTextColor: "", //우편번호 글자색
          //emphTextColor: "", //강조 글자색
          outlineColor: '#444444', //테두리
        }}
        style={{
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height,
        }}
        jsOptions={{ animation: true }}
        onSelected={(res) => {
          if (props.route.params.onComplete) {
            props.route.params.onComplete({
              postcode: res.zonecode,
              roadAddress: res.roadAddress,
              jibunAddress: res.jibunAddress,
            });
          }
          props.navigation.pop();
        }}
      />
    </SafeAreaView>
  );
}

export default AddressSearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
});
