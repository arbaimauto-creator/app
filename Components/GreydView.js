import * as React from 'react';
import { Image, StyleSheet, Vibration, View } from 'react-native';
import {
  State as GestureState,
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Constants from './Constants';

export default function GreydView({
  style = {},
  initialRating = null,
  onRatingChange = (value) => {},
  onRatingComplete = (value) => {},
  onRatingCancel = () => {},
  ...props
}) {
  const [rating, setRating] = React.useState(initialRating);
  const [isRated, setIsRated] = React.useState(initialRating !== null);
  //  const sliderThumbLightness = rating !== null ? (rating) * 9 + 10 : 50

  const buttonOff = (
    <View style={styles.buttonContainer}>
      <Image style={styles.button} source={require('../Resources/img/icBadgeGreydOff34.png')} />
    </View>
  );
  const buttonOnFull = (
    <View style={styles.buttonContainer}>
      <Image style={styles.button} source={require('../Resources/img/icBadgeGreydOn34.png')} />
    </View>
  );
  const buttonOnFullFocused = (
    <View style={styles.buttonContainer}>
      <Image
        style={styles.buttonFocused}
        source={require('../Resources/img/icBadgeGreydOn42.png')}
      />
    </View>
  );
  const buttonOnHalfFocused = (
    <View style={styles.buttonContainer}>
      <Image
        style={styles.buttonFocused}
        source={require('../Resources/img/icBadgeGreydHalf42.png')}
      />
    </View>
  );

  if (initialRating && !isRated) {
    setIsRated(true);
  }

  function getValue(positionX) {
    let value = parseInt((positionX + 10) / 20, 10);

    if (value > 10) {
      value = 10;
    } else if (value < 0) {
      value = 0;
    }
    return value;
  }

  const onGestureEvent = React.useCallback(
    (event) => {
      //    console.log('onGestureEvent', event.nativeEvent.state)
      const value = getValue(event.nativeEvent.x);
      setRating(value);
      if (onRatingChange) {
        onRatingChange(value);
      }
    },
    [onRatingChange],
  );

  const onTouchEvent = React.useCallback(
    (event) => {
      //    console.log('onTouchEvent', event.nativeEvent.state)
      const value = getValue(event.nativeEvent.x);
      if (event.nativeEvent.state === GestureState.BEGIN) {
        onSlidingStart(value);
        setRating(value);
      } else if (event.nativeEvent.state === GestureState.END) {
        onSlidingComplete(value);
        //      if (onRatingChange)
        //        onRatingChange(value)
      }
    },
    [onSlidingComplete],
  );

  function onSlidingStart(value) {}

  const onSlidingComplete = React.useCallback(
    (value) => {
      Vibration.vibrate(Constants.VIBRATION_USER_ACTION);
      if (rating === value) {
        // cancel
        if (onRatingChange) {
          onRatingChange(null);
        }
        setRating(null);
        //      if (onRatingCancel)
        //        onRatingCancel()
      } else {
        if (onRatingChange) {
          onRatingChange(value);
        }
        //      if (onRatingComplete)
        //        onRatingComplete(value)
        setRating(value);
      }
    },
    [onRatingChange, rating],
  );

  return (
    <View style={[styles.container, style]}>
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <TapGestureHandler onHandlerStateChange={onTouchEvent}>
          <View style={styles.container}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
              if (value === 0) {
                return (
                  <View key={value} style={styles.buttonContainer}>
                    <Image
                      style={styles.button}
                      source={require('../Resources/img/icBadgeGreydOff34.png')}
                    />
                  </View>
                );
              }
              if (rating === null || rating < value) {
                return (
                  <View key={value} style={styles.buttonContainer}>
                    <Image
                      style={styles.button}
                      source={require('../Resources/img/icBadgeGreydOff34.png')}
                    />
                  </View>
                );
              }
              if (rating === value) {
                return (
                  <View key={value} style={styles.buttonContainer}>
                    <Image
                      style={styles.buttonFocused}
                      source={require('../Resources/img/icBadgeGreydHalf42.png')}
                    />
                  </View>
                );
              }
              return (
                <View key={value} style={styles.buttonContainer}>
                  <Image
                    style={styles.button}
                    source={require('../Resources/img/icBadgeGreydOn34.png')}
                  />
                </View>
              );
            })}
          </View>
        </TapGestureHandler>
      </PanGestureHandler>
    </View>
  );
  /*
  return (
          <View style={{flex:1}}>

          <Slider
//            allowTouchTrack
            value={initialRating !== null ? initialRating : 5}
            minimumValue={0}
            maximumValue={10}
            minimumTrackTintColor="#666"
            maximumTrackTintColor="#666"
            step={1}
            onValueChange={(value) => {
              setRating(value)
              if (rating !== startValue && startValue !== -1) {
                setIsValueChanged(true)
              }
              if (onRatingChange)
                onRatingChange(value)
            }}
            onSlidingStart={(value) => {
              setStartValue(value)
            }}
            onSlidingComplete={(value) => {
              Vibration.vibrate(Constants.VIBRATION_USER_ACTION)
              if (rating === value &&
                  !isValueChanged &&
                  isRated) { // cancel
                setIsRated(false)
                setRating(null)
                if (onRatingCancel)
                  onRatingCancel()
              } else {
                if (onRatingChange)
                  onRatingChange(value)
                if (onRatingComplete)
                  onRatingComplete(value)
                setIsRated(true)
                setIsValueChanged(false)
                setRating(value)
              }
              setStartValue(-1)
              setIsSliding(false)
            }}
            thumbStyle={{ height: 30, width: 40, backgroundColor: 'transparent' }}
            thumbProps={{
              children: (
                 isRated && rating !== null ?
                 <Image resizeMode={'contain'}
                   source={ require('../Resources/img/checked.png')}
                   style={{width:30, height:32, marginLeft:5}}/> :
                 <Image resizeMode={'contain'}
                   source={ require('../Resources/img/checked_box.png')}
                   style={{width:30, height:30, marginLeft:5}}/>
              ),
            }}
          />


          </View>
  )*/
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // alignItems: 'flex-end',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    height: 42,
  },
  button: {
    width: 30,
    height: 33,
    marginHorizontal: 6,
  },
  buttonFocused: {
    width: 37,
    height: 41,
    marginHorizontal: 2,
  },
});
