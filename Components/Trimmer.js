import PropTypes from 'prop-types';
import React from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const cornerHandleWidth = 20;
const cornerMarginHorizontal = 20;

function calculateCornerResult(duration, value, width, fromRight) {
  // duration -> width
  // x -> value
  // x = duration * value / width
  const val = (fromRight && value > 0) || (!fromRight && value < 0) ? 0 : Math.abs(value);
  const result = (duration * val) / width;
  return fromRight ? duration - result : result;
}

export default class Trimmer extends React.Component {
  static propTypes = {
    source: PropTypes.string.isRequired,
    onChange: PropTypes.func,
  };
  static defaultProps = {
    onChange: () => null,
  };

  constructor(props) {
    super(props);
    this.state = {
      images: [],
      duration: 5.7,
      leftCorner: new Animated.Value(0),
      rightCorner: new Animated.Value(0),
      layoutWidth: width,
    };

    this.leftResponder = null;
    this.rigthResponder = null;

    this._startTime = 0;
    this._endTime = 0;
    this._leftCornerPos = 0;
    this._rightCornerPos = 0;
    this._handleRightCornerMove = this._handleRightCornerMove.bind(this);
    this._handleLeftCornerMove = this._handleLeftCornerMove.bind(this);
    this._retriveInfo = this._retriveInfo.bind(this);
    //    this._retrivePreviewImages = this._retrivePreviewImages.bind(this);
    this._handleRightCornerRelease = this._handleRightCornerRelease.bind(this);
    this._handleLeftCornerRelease = this._handleLeftCornerRelease.bind(this);
  }

  componentDidMount() {
    this.state.leftCorner.addListener(({ value }) => (this._leftCornerPos = value));
    this.state.rightCorner.addListener(({ value }) => (this._rightCornerPos = value));

    this.leftResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => Math.abs(gestureState.dx) > 0,
      onMoveShouldSetResponderCapture: (e, gestureState) => Math.abs(gestureState.dx) > 0,
      onMoveShouldSetPanResponderCapture: (e, gestureState) => Math.abs(gestureState.dx) > 0,
      onPanResponderMove: this._handleLeftCornerMove,
      onPanResponderRelease: this._handleLeftCornerRelease,
    });

    this.rightResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => Math.abs(gestureState.dx) > 0,
      onMoveShouldSetResponderCapture: (e, gestureState) => Math.abs(gestureState.dx) > 0,
      onMoveShouldSetPanResponderCapture: (e, gestureState) => Math.abs(gestureState.dx) > 0,
      onPanResponderMove: this._handleRightCornerMove,
      onPanResponderRelease: this._handleRightCornerRelease,
    });
    const { source = '' } = this.props;
    if (!source.trim()) {
      throw new Error('source should be valid string');
    }
    //    this._retrivePreviewImages();
    this._retriveInfo();
  }

  componentWillUnmount() {
    this.state.leftCorner.removeAllListeners();
    this.state.rightCorner.removeAllListeners();
  }

  _handleLeftCornerRelease() {
    this.state.leftCorner.setOffset(this._leftCornerPos);
    this.state.leftCorner.setValue(0);
  }

  _handleRightCornerRelease() {
    this.state.rightCorner.setOffset(this._rightCornerPos);
    this.state.rightCorner.setValue(0);
  }

  _handleRightCornerMove(e, gestureState) {
    const { duration, layoutWidth } = this.state;
    const leftPos = this._leftCornerPos;
    const rightPos = layoutWidth - Math.abs(this._rightCornerPos);
    const moveLeft = gestureState.dx < 0;

    if ((rightPos - leftPos <= 50 && moveLeft) || (!moveLeft && this._rightCornerPos === 0)) {
      return;
    }

    if (!moveLeft && this._rightCornerPos > 0) {
      this.state.rightCorner.setOffset(0);
      this.state.rightCorner.setValue(0);
      this._endTime = calculateCornerResult(duration, 0, layoutWidth, true);
    } else {
      this._endTime = calculateCornerResult(duration, this._rightCornerPos, layoutWidth, true);
      Animated.event([null, { dx: this.state.rightCorner }])(e, gestureState);
    }
    this._callOnChange();
  }

  _handleLeftCornerMove(e, gestureState) {
    const { duration, layoutWidth } = this.state;
    const leftPos = this._leftCornerPos;
    const rightPos = layoutWidth - Math.abs(this._rightCornerPos);
    const moveRight = gestureState.dx > 0;

    if ((rightPos - leftPos <= 50 && moveRight) || (!moveRight && this._leftCornerPos === 0)) {
      return;
    }

    if (!moveRight && this._leftCornerPos < 0) {
      this.state.leftCorner.setOffset(0);
      this.state.leftCorner.setValue(0);
      this._startTime = calculateCornerResult(duration, 0, layoutWidth);
    } else {
      this._startTime = calculateCornerResult(duration, this._leftCornerPos, layoutWidth);
      Animated.event([null, { dx: this.state.leftCorner }])(e, gestureState);
    }
    this._callOnChange();
  }

  _callOnChange() {
    this.props.onChange({
      startTime: this._startTime,
      endTime: this._endTime,
    });
  }

  _retriveInfo() {
    /*
    TrimmerManager
      .getVideoInfo(this.props.source)
      .then((info) => {
        this.setState(() => ({
          ...info,
          duration: msToSec(info.duration)
        }));
        this._endTime = msToSec(info.duration);
      });
    */
  }

  retrivePreviewImages() {
    /*TrimmerManager
      .getPreviewImages(this.props.source)
      .then(({ images }) => {
        this.setState({ images });
      })
      .catch((e) => console.error(e));*/
  }

  renderLeftSection() {
    const { leftCorner, layoutWidth } = this.state;
    if (this.leftResponder === null || this.leftResponder.panHandlers === null) {
      return <View />;
    }
    return (
      <Animated.View
        style={[
          styles.container,
          styles.leftCorner,
          {
            left: -layoutWidth,
            transform: [
              {
                translateX: leftCorner,
              },
            ],
          },
        ]}
        {...this.leftResponder.panHandlers}
      >
        <View style={styles.row}>
          <View style={styles.bgBlack} />
          <View style={styles.cornerItem} />
        </View>
      </Animated.View>
    );
  }

  renderRightSection() {
    const { rightCorner, layoutWidth } = this.state;
    if (!this.rightResponder || !this.rightResponder.panHandlers) {
      return <View />;
    }
    return (
      <Animated.View
        style={[
          styles.container,
          styles.rightCorner,
          { right: -layoutWidth },
          {
            transform: [
              {
                translateX: rightCorner,
              },
            ],
          },
        ]}
        {...this.rightResponder.panHandlers}
      >
        <View style={styles.row}>
          <View style={styles.cornerItem} />
          <View style={styles.bgBlack} />
        </View>
      </Animated.View>
    );
  }

  render() {
    const { images } = this.state;
    return (
      <View
        style={styles.container}
        onLayout={({ nativeEvent }) => {
          this.setState({
            layoutWidth: nativeEvent.layout.width,
          });
        }}
      >
        {/*images.map((uri,index) => (
          <Image
            key={`preview-source-${uri}-${index}`}
            source={{ uri }}
            style={styles.imageItem}
          />
        ))*/}
        <View style={styles.corners}>
          {this.renderLeftSection()}
          {this.renderRightSection()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  imageItem: {
    flex: 1,
    width: 50,
    height: 50,
    resizeMode: 'cover',
  },
  corners: {
    position: 'absolute',
    height: 50,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightCorner: {
    position: 'absolute',
    flex: 1,
    marginRight: cornerMarginHorizontal,
  },
  leftCorner: {
    marginLeft: cornerMarginHorizontal,
    left: cornerHandleWidth,
  },
  bgBlack: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width,
  },
  cornerItem: {
    backgroundColor: 'gray',
    width: cornerHandleWidth,
    height: 50,
  },
});
