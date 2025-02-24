import {StyleSheet} from 'react-native';

const globalStyles = StyleSheet.create({
  titleText: {
    fontSize: 22,
    marginTop: 20,
    marginBottom: 100,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hitSlop: {
    top: 20,
    bottom: 20,
    left: 40,
    right: 40,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cameraButtonBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    height: 112,
  },
  cameraCancelButton: {
    position: 'absolute',
    left: 20,
  },
  marginHorizontal: {
    marginHorizontal: 25,
  },
  denseButton: {
    alignSelf: 'center',
    width: 'auto',
  },
  whiteBackground: {
    backgroundColor: 'white',
  },
  primaryButton: {
    marginBottom: 60,
  },
  retryText: {
    marginBottom: 20,
  },
  textInput: {
    borderRadius: 5,
  },
  topRightButton: {
    margin: 10,
  },
});

export default globalStyles;
