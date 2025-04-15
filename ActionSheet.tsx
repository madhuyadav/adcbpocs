import React, {memo, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Modal,
  GestureResponderEvent,
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  useColorScheme,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import CaptureImgUsingCamera from './CaptureImage';

const WHITE = '#ffffff';
const DARK_BG = '#1c1c1e';

type ActionItem = {
  id: string | number;
  label: string;
  onPress: (event?: GestureResponderEvent) => void;
};

type ActionSheetProps = {
  actionItems: ActionItem[];
  showModal: boolean;
  onClose: () => void;
  actionTextColor?: string | null;
};

const ActionSheet = ({
  actionItems,
  showModal,
  onClose,
  actionTextColor = null,
}: ActionSheetProps) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const bgColor = isDarkMode ? DARK_BG : WHITE;
  const primaryColor = isDarkMode ? '#0a84ff' : 'rgb(0,98,255)';

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs access to your camera',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };
  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission)
      return Alert.alert('Permission denied', 'Camera permission is required.');

    onClose();
  };

  const openGallery = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission)
      return Alert.alert(
        'Permission denied',
        'Storage permission is required.',
      );

    onClose();
  };
  const actionSheetItems: ActionItem[] = [
    ...actionItems,
    {
      id: 1,
      label: 'Take a photo',
      onPress: openCamera,
    },
    {
      id: 2,
      label: 'Choose from gallery',
      onPress: openGallery,
    },

    {
      id: '#cancel',
      label: 'cancel',
      onPress: onClose,
    },
  ];

  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (showModal) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [showModal]);

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={showModal}
      onRequestClose={onClose}>
      <CaptureImgUsingCamera />
      {/* <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <SafeAreaView style={[styles.modalContent]}>
            {actionSheetItems.map((actionItem, index) => {
              const isFirst = index === 0;
              const isLast = index === actionSheetItems.length - 1;
              const isSecondLast = index === actionSheetItems.length - 2;

              return (
                <TouchableHighlight
                  key={actionItem.id.toString()}
                  style={[
                    styles.actionSheetView,
                    {backgroundColor: bgColor},
                    isFirst && styles.roundedTop,
                    isSecondLast && styles.roundedBottom,
                    isLast && styles.cancelButton,
                  ]}
                  underlayColor={isDarkMode ? '#2c2c2e' : '#f7f7f7'}
                  onPress={actionItem.onPress}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.actionSheetText,
                      {color: primaryColor},
                      actionTextColor && {color: actionTextColor},
                      isLast && {color: '#fa1616'},
                    ]}>
                    {actionItem.label}
                  </Text>
                </TouchableHighlight>
              );
            })}
          </SafeAreaView>
        </Animated.View>
      </View> */}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000050',
  },
  animatedContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: Platform.OS === 'android' ? 20 : 0,
  },
  modalContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionSheetView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'gray',
  },
  actionSheetText: {
    fontSize: 18,
  },
  roundedTop: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  roundedBottom: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cancelButton: {
    marginTop: 8,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
});

export default memo(ActionSheet);
