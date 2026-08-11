import React from 'react';
import T from './Constants/DesignTokens';
import { SafeAreaView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import IconFeather from 'react-native-vector-icons/Feather';
import Constants from './Constants';
import Strings from './Strings';

function Keypad({ number, onPress, remove, resort }) {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        onPress(number);
      }}
    >
      <View style={styles.keypad}>
        {remove ? (
          <IconFeather name="delete" style={styles.keypadTitle} />
        ) : resort ? (
          <Text style={styles.keypadTitle}>{Strings.KEYPAD_RESHUFFLE}</Text>
        ) : (
          <Text style={styles.keypadTitle}>{number}</Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

export default class PasswordInputScreen extends React.Component {
  constructor(props) {
    super(props);

    let keypad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    this.shuffle(keypad);

    this.state = {
      input: [],
      keypad: keypad,
    };
  }

  componentDidMount() {}

  shuffle(array) {
    array.sort(() => Math.random() - 0.5);
    return array;
  }

  onKeypadPressed(number) {
    this.setState({
      input: [...this.state.input, number],
    });
  }

  onResortPressed() {
    this.setState({
      keypad: this.shuffle(this.state.keypad),
    });
  }

  onRemovePressed() {
    this.setState({
      input: this.state.input.slice(0, this.state.input.length - 1),
    });
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1 }}>
          <Text>{this.state.input.join()}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Keypad number={this.state.keypad[0]} onPress={this.onKeypadPressed.bind(this)} />
          <Keypad number={this.state.keypad[1]} onPress={this.onKeypadPressed.bind(this)} />
          <Keypad number={this.state.keypad[2]} onPress={this.onKeypadPressed.bind(this)} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Keypad number={this.state.keypad[3]} onPress={this.onKeypadPressed.bind(this)} />
          <Keypad number={this.state.keypad[4]} onPress={this.onKeypadPressed.bind(this)} />
          <Keypad number={this.state.keypad[5]} onPress={this.onKeypadPressed.bind(this)} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Keypad number={this.state.keypad[6]} onPress={this.onKeypadPressed.bind(this)} />
          <Keypad number={this.state.keypad[7]} onPress={this.onKeypadPressed.bind(this)} />
          <Keypad number={this.state.keypad[8]} onPress={this.onKeypadPressed.bind(this)} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Keypad resort onPress={this.onResortPressed.bind(this)} />
          <Keypad number={this.state.keypad[9]} onPress={this.onKeypadPressed.bind(this)} />
          <Keypad remove onPress={this.onRemovePressed.bind(this)} />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: T.COLORS.INK,
  },
  keypad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderWidth: 0.5,
  },
  keypadTitle: {
    fontSize: 18,
  },
});
