import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Constants from '../../Components/Constants';
import SoundOnOff from '../../Components/CustomComponents/SoundOnOff';
import Strings from '../../Components/Strings';
import { isGuestUser, LogoutAlert } from '../../Components/utils';

const iconSize = 24;

function HeaderRight({ context, changeSpeedRate, changeMuteStatus }) {
  // const icFullscreen = require('../../Resources/img/icCommonNaviFull22.png');
  // const icNormalscreen = require('../../Resources/img/icHeaderNaviSmall22.png');
  // const icRelay = require('../../Resources/img/relay.png');
  const icRelay = require('../../Resources/img/iconRenewal/white-relay.png');

  return React.useMemo(
    () => (
      <View style={[styles.headerRightButtonContainer]}>
        <View>
          {/* 공유/북마크는 하단 액션 레일(VideoOverlay)로 이동 — 여기선 영상 조작 버튼만 유지 */}
          <View>
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={() => {
                if (isGuestUser(context.props.route.params.logonUserId)) {
                  return LogoutAlert(context.props);
                }
                context.onAddRelayButtonPressed?.();
              }}
            >
              <FastImage source={icRelay} style={styles.requiredIcon} />
              <Text style={styles.iconText}>{Strings.RELAY}</Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={() => {
                if (context.state.speed === 1) {
                  context.setState({ speed: 1.25 });
                  changeSpeedRate(1.25);
                } else if (context.state.speed === 1.25) {
                  context.setState({ speed: 1.5 });
                  changeSpeedRate(1.5);
                } else if (context.state.speed === 1.5) {
                  context.setState({ speed: 2 });
                  changeSpeedRate(2);
                } else if (context.state.speed === 2) {
                  context.setState({ speed: 1 });
                  changeSpeedRate(1);
                }
              }}
            >
              <FastImage
                style={styles.requiredIcon}
                source={require('../../Resources/img/iconRenewal/speed-2.png')}
              />
              <Text style={styles.iconText}>x {context.state.speed}</Text>
            </TouchableOpacity>
          </View>
          <View>
            <View style={styles.buttonContainer}>
              <SoundOnOff
                isMuted={context.state.isMuted}
                setMuted={(status) => {
                  context.setState({ isMuted: status });
                  changeMuteStatus(status);
                }}
                style={{}}
              />
            </View>
          </View>
        </View>
      </View>
    ),
    [context, icRelay, changeSpeedRate, changeMuteStatus],
  );
}

const styles = StyleSheet.create({
  headerRightButtonContainer: {
    position: 'absolute',
    top: '20%',
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    // paddingVertical: 10,
    // paddingHorizontal: 5,
    // borderRadius: 40,
  },
  buttonContainer: {
    marginTop: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requiredIcon: {
    width: iconSize,
    height: iconSize,
  },
  iconText: {
    color: Constants.COLOR_BACKGROUND_DARK,
    paddingTop: 5,
    fontSize: 12,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
    // textShadowColor: 'rgba(0, 0, 0, 1)',
    // textShadowOffset: { width: -1, height: 1 },
    // textShadowRadius: 3,
  },
});

export default HeaderRight;
