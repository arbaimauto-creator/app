import * as React from 'react';
import T from './Constants/DesignTokens';
import {
  Alert,
  Button,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Constants from './Constants';
import { BottomScrollSelectionModal } from './Views/BottomScrollSelectionModal';

const OptionSelectionModal = ({ context }) => {
  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={context.state.modalVisible}
        onRequestClose={() => {
          context.setModalVisible(false);
        }}
        onDismiss={() => {}}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            context.setModalVisible(!context.state.modalVisible);
          }}
        >
          <View style={context.getMenuContainerStyle()}>
            <View style={[context.getMenuStyle(), styles.shadow]}>
              <Animated.FlatList
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={{ width: '100%' }}
                data={context.props.menu}
                keyExtractor={(item) => item.key}
                renderItem={({ item, index }) => (
                  <View>
                    {Platform.OS === 'android' ? (
                      <TouchableNativeFeedback
                        onPress={() => {
                          context.setModalVisible(false); //warning: iOS는 alert이 닫힘
                          setTimeout(() => {
                            context.props.menu[index].onClicked();
                          }, 10);
                        }}
                      >
                        <View style={styles.itemMenuItem}>
                          {item.icon}
                          <Text style={{ marginLeft: 10 }}>{item.name}</Text>
                        </View>
                      </TouchableNativeFeedback>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          context.setModalVisible(false); //warning: iOS는 alert이 닫힘
                          setTimeout(() => {
                            context.props.menu[index].onClicked();
                          }, 10);
                        }}
                        activeOpacity={0.7}
                        style={styles.itemMenuItem}
                      >
                        {item.icon}
                        <Text style={{ marginLeft: 10 }}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default class ModalMenuButton extends React.Component {
  static defaultProps = {
    buttonView: (
      <Button
        title="button"
        type="clear"
        onPress={() => console.log('ModalMenuButton is clicked')}
      />
    ),
    style: {},
    menu: [
      {
        name: 'menu1',
        icon: <IconMaterialIcons size={20} name="add-to-queue" color="#000" />,
        onClicked: () => {
          Alert.alert('menu1 clicked');
        },
      },
    ],
    visibility: false,
    headerLeft: false,
    headerRight: false,
    addingNewerStories: null,
    type: 'centeredOptionSelection',
    title: '',
  };

  constructor(props) {
    super(props);
    this.state = { modalVisible: false };
  }

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  getMenuContainerStyle() {
    return {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    };
  }

  getMenuStyle() {
    return {
      width: '50%',
      alignSelf: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 10,
    };
  }

  render() {
    return (
      <View>
        <View style={[styles.button, this.props.style]}>
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              onPress={() => {
                // if (isGuestUser(this.props.logonUserId)) {
                //   return LogoutAlert(this.props);
                // }
                this.setModalVisible(true);
              }}
              background={TouchableNativeFeedback.Ripple('#777', true)}
            >
              {this.props.buttonView}
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity
              onPress={() => {
                // if (isGuestUser(this.props.logonUserId)) {
                //   return LogoutAlert(this.props);
                // }
                this.setModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              {this.props.buttonView}
            </TouchableOpacity>
          )}
        </View>
        {this.props.type === 'centeredOptionSelection' ? (
          <OptionSelectionModal context={this} />
        ) : (
          <BottomScrollSelectionModal
            visible={this.state.modalVisible}
            initialIndex={4}
            title={this.props.title}
            contents={this.props.menu}
            height={undefined}
            onSelect={(item) => {
              item.onClicked();
            }}
            onCancel={() => {
              this.setModalVisible(false);
            }}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: T.COLORS.GREY,
  },
  itemMenuItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  button: {
    overflow: 'hidden',
    borderWidth: 0,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#4d4d4d',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
