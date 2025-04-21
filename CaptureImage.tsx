import React, {memo, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Image,
  Animated,
} from 'react-native';
import {Camera, useCameraDevices, PhotoFile} from 'react-native-vision-camera';
import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from 'react-native-image-resizer';
import {EdgeInsets, useSafeAreaInsets} from 'react-native-safe-area-context';
import MlkitOcr from 'react-native-mlkit-ocr';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const CaptureImage = () => {
  const insets = useSafeAreaInsets();
  const styles = makeStyles(insets);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [cameraPosition, setCameraPosition] = useState('Capture Card Front');
  const [previewLayout, setPreviewLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const flipped = useRef(false); // simple toggle flag

  const flip = () => {
    flipped.current = !flipped.current;
    Animated.timing(flipAnim, {
      toValue: flipped.current ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const flipInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const animatedStyle = {
    transform: [{rotateY: flipInterpolate}],
  };
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find(device => device.position === 'back');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(true);
    })();
  }, []);

  const takePhoto = async () => {
    try {
      if (!cameraRef.current || !previewLayout) return;

      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      const originalPath =
        Platform.OS === 'android' ? 'file://' + photo.path : photo.path;

      recognizeText(originalPath ?? originalPath);
      const imageWidth = photo.width!;
      const imageHeight = photo.height!;
      console.log(' Original size:', imageWidth, imageHeight);

      // ✅ Resize image to safe size
      const resizedImage = await ImageResizer.createResizedImage(
        originalPath,
        1280, // target width
        960, // target height
        'JPEG',
        100,
        0,
        undefined,
        false,
        {mode: 'contain'},
      );

      const resizedPath =
        Platform.OS === 'android'
          ? 'file://' + resizedImage.uri
          : resizedImage.uri;

      const resizedWidth = resizedImage.width;
      const resizedHeight = resizedImage.height;

      console.log(' Resized size:', resizedWidth, resizedHeight);

      // Step 1: Calculate scale between screen and resized image
      const scaleX = resizedWidth / screenWidth;
      const scaleY = resizedHeight / screenHeight;

      // Step 2: Map preview layout to resized image dimensions
      const cropX = Math.round(previewLayout.x * scaleX);
      const cropY = Math.round(previewLayout.y * scaleY);
      const cropWidth = Math.round(previewLayout.width * scaleX);
      const cropHeight = Math.round(previewLayout.height * scaleY);

      const cropData = {
        offset: {x: cropX, y: cropY},
        size: {
          width: cropWidth,
          height: cropHeight * (Platform.OS === 'android' ? 3.1 : 2.8),
        },
        displaySize: {
          width: Math.floor(previewLayout.width),
          height: Math.floor(previewLayout.height),
        },
        resizeMode: 'cover' as const,
      };

      console.log(' Final CropData:', cropData);

      const croppedImageUri = await ImageEditor.cropImage(
        resizedPath,
        cropData,
      );
      flip(); // Flip the image after cropping
      setCameraPosition(
        flipped.current ? 'Capture Card Back' : 'Capture Card Front',
      );

      setCapturedPhotoUri(croppedImageUri.uri ?? croppedImageUri); // handles string vs object format
    } catch (error) {
      console.error(' Error capturing or cropping image:', error);
    }
  };
  const recognizeText = async (imageUri: string) => {
    try {
      const result = await MlkitOcr.detectFromUri(imageUri);
      console.log('Recognized Text:', result);
      const issuingDateText = result.find(item =>
        item.text.toLowerCase().includes('issuing date'),
      );
      const expiryDateText = result.find(item =>
        item.text.toLowerCase().includes('expiry date'),
      );

      const emiratesIdText = result.find(item =>
        item.text.toLowerCase().includes('id number'),
      );

      if (issuingDateText) {
        const dateMatch = issuingDateText.text.match(/\d{2}\/\d{2}\/\d{4}/);
        if (dateMatch) {
          const issuingDate = dateMatch[0];
          console.log('📅 Issuing Date:', issuingDate);
        } else {
          console.log('Date not found in:', issuingDateText.text);
        }
      }
      if (expiryDateText) {
        const dateMatch = expiryDateText.text.match(/\d{2}\/\d{2}\/\d{4}/);
        if (dateMatch) {
          const expityDate = dateMatch[0];
          console.log('📅 Exipry Date:', expityDate);
        } else {
          console.log('Date not found in:', expiryDateText.text);
        }
      }
      if (emiratesIdText) {
        const emiratesIdMatch = emiratesIdText.text.match(
          /\d{3}-\d{4}-\d{7}-\d{1}/,
        );
        if (emiratesIdMatch) {
          const emiratesId = emiratesIdMatch[0];
          console.log('📅 Issuing Date:', emiratesId);
        } else {
          console.log('Date not found in:', emiratesIdText.text);
        }
      }
    } catch (error) {
      console.error('Native error:', error); // Check if the error is thrown from the native module
      if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Unknown error:', error);
      }
    }
  };
  return (
    <View style={styles.container}>
      <View
        onLayout={event => {
          const layout = event.nativeEvent.layout;
          if (layout.width > 0 && layout.height > 0) {
            setPreviewLayout(layout);
          }
        }}
        style={[styles.card, {borderWidth: 2, borderColor: 'red'}]}>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            zIndex: 10,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
          <Text style={{color: 'gray', fontSize: 20, fontWeight: 500}}>
            {cameraPosition}
          </Text>
          <View>
            <Animated.Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/2883/2883818.png',
              }}
              style={[styles.image, animatedStyle]}
            />
          </View>
        </View>
        {!!device && (
          <Camera
            device={device}
            ref={cameraRef}
            style={styles.camera}
            isActive={true}
            photo={true}
          />
        )}
      </View>
      <View>
        <TouchableOpacity
          onPress={takePhoto}
          style={[
            styles.captureButton,
            !previewLayout && {backgroundColor: '#aaa'},
          ]}
          disabled={!previewLayout}>
          <Text style={styles.captureButtonText}>Take a Photo</Text>
        </TouchableOpacity>
      </View>

      {capturedPhotoUri && (
        <View style={styles.previewContainer}>
          <Text
            style={{
              fontWeight: 500,
              fontSize: 20,
              marginBottom: 10,
              color: 'gray',
            }}>
            {flipped.current ? 'Card Front Image' : 'Card Back Image'}
          </Text>
          <Text style={styles.previewLabel}>
            {' '}
            Image Path:{' '}
            <Text style={{fontSize: 10}} numberOfLines={2}>
              {capturedPhotoUri}
            </Text>
          </Text>
          <Image
            source={{uri: capturedPhotoUri}}
            style={{
              width: previewLayout?.width ?? 0,
              height: previewLayout?.height ?? 0,
              borderWidth: 2,
              borderColor: '#ddd',
              marginTop: 10,
            }}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
};

export default memo(CaptureImage);

const makeStyles = (insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    card: {
      top: insets.top + 30,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
      width: '100%',
      height: '30%',
      borderRadius: 5,
      overflow: 'hidden',
      backgroundColor: '#000',
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: {width: 0, height: 4},
      shadowRadius: 6,
    },
    camera: {
      flex: 1,
    },
    captureButton: {
      backgroundColor: 'red',
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 10,
      marginBottom: 20,
    },
    captureButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    previewContainer: {
      paddingHorizontal: 10,
    },
    previewLabel: {
      fontWeight: 'bold',
      marginBottom: 5,
    },
    image: {
      width: 50,
      height: 50,
      backfaceVisibility: 'hidden',
    },
  });
