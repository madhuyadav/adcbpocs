import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Alert, PermissionsAndroid, Platform} from 'react-native';
import {Camera, CameraType, CameraApi} from 'react-native-camera-kit';

const QRScanner = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    const requestCameraPermission = async (): Promise<void> => {
      if (Platform.OS === 'android') {
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
        setIsAuthorized(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setIsAuthorized(true); // Assume iOS permission is handled via Info.plist or handle separately
      }
    };

    requestCameraPermission();
  }, []);

  const handleReadCode = (event: {nativeEvent: {codeStringValue: string}}) => {
    if (!scannedRef.current) {
      scannedRef.current = true;
      const code = event.nativeEvent.codeStringValue;
      console.log('QR Code:', code);
      setQrCode(code);

      // Reset scanner after 3 seconds
      setTimeout(() => {
        scannedRef.current = false;
      }, 3000);
    }
  };

  if (!isAuthorized) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1, paddingTop: 50}}>
        <Camera
          style={{width: '100%', height: '90%'}}
          showFrame={true}
          scanBarcode={true}
          cameraType={CameraType.Back}
          onReadCode={handleReadCode}
        />
      </View>
      <Text style={{padding: 16, fontSize: 16}}>
        {qrCode ? `Scanned QR Code: ${qrCode}` : 'Scan a QR Code'}
      </Text>
    </View>
  );
};

export default QRScanner;
