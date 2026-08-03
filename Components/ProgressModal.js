import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as Progress from 'react-native-progress';

import Constants from './Constants';
import Strings from './Strings';
import { CommonButtonModal } from './Views/CommonButtonModal';

const ProgressModal = ({
  progress = 0,
  buttons, //[{title, onPress}]
  guidelines,
  visible,
  cancelAlertEnable = true,
  cancelAlertTitle = Strings.CANCEL_RUNNING_JOB,
  cancelAlertMessage = Strings.CANCEL_RUNNING_JOB_GUIDELINE,
  onCancel,
}) => {
  return (
    <CommonButtonModal
      visible={visible}
      onCancel={onCancel}
      buttonArray={buttons}
      scrollEnable={false}
      cancelAlertEnable={cancelAlertEnable}
      cancelAlertTitle={cancelAlertTitle}
      cancelAlertMessage={cancelAlertMessage}
    >
      <View style={styles.innerContainer}>
        <View style={styles.fieldContainer}>
          {guidelines.map((item, index) => {
            return (
              <Text
                key={item + '_' + index}
                style={{
                  color: Constants.TIER_COLORS.ARTISAN, //'white',
                  fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
                  fontSize: 15,
                  marginHorizontal: 20,
                  marginTop: index === 0 ? 10 : 0,
                  marginBottom: index === guidelines.length - 1 ? 10 : 0,
                }}
              >
                {item}
              </Text>
            );
          })}
          <Progress.Bar
            color={Constants.COLOR_MAIN}
            useNativeDriver={true}
            progress={progress}
            width={220}
            height={10}
            borderRadius={6}
          />
          <Text
            style={{
              color: Constants.TIER_COLORS.ARTISAN, // color: 'white',
              fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
              fontSize: 16,
              marginHorizontal: 20,
              marginTop: 15,
              marginBottom: 10,
            }}
          >{`${Math.ceil(progress * 100)}%`}</Text>
        </View>
      </View>
    </CommonButtonModal>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProgressModal;

// example
// eslint-disable-next-line no-lone-blocks
{
  /* <ProgressModal
    visible={this.state.isShowingRevenueGuideModal}
    navigation={this.props.navigation}
    guidelines={['인스타그램 공유를 준비하고 있어요.', '앱을 종료하지 말고, 잠시만 기다려주세요.']}
    buttons={[{title:'공유하기', onPress:()=>{console.log('pressed')}, disabled: false}]}
    onCancel={()=>{this.setState({isShowingRevenueGuideModal: false})}}
/> */
}
