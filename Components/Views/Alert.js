import Strings from '../Strings';

export default function AlertModal(
  message,
  title = '',
  button1Title = Strings.OK,
  buttonSet = [],
) {}

/*
Alert.alert(
      "Alert Title",
      "My Alert Msg",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "OK", onPress: () => console.log("OK Pressed") }
      ]
    );
*/
