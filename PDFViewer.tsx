import {
  StyleSheet,
  View,
  Modal,
  Dimensions,
  Text,
  TouchableOpacity,
  Button,
  Platform,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Pdf from 'react-native-pdf';
import {
  EdgeInsets,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Share from 'react-native-share';

type PDFViewerProps = {
  showShareButton?: boolean;
  loadPdfUrl?: string;
  showModal: boolean;
  base64Content?: string;
  closeCallBack: () => void;
};

const {width, height} = Dimensions.get('window');

// Function to download PDF from base64
export async function downloadPdfDocumentFromBase64Content(
  base64Content: string,
  fileName: string,
) {
  try {
    if (Platform.OS === 'ios') {
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const path = dirs.DocumentDir + '/' + fileName;
      ReactNativeBlobUtil.fs
        .writeFile(path, base64Content, 'base64')
        .then(result => {
          Share.open({
            subject: fileName,
            url: path,
          });
        });
    } else if (Platform.OS === 'android') {
      const url = 'data:application/pdf;base64,' + base64Content;
      Share.open({
        title: 'title',
        message: fileName,
        url: url,
      });
    }
  } catch (exception) {
    console.log(exception);
  }
}

// Function to download PDF from URL
export const downloadPdfDcoumentFromUrl = (
  sourceUrl: string,
  fileName: string,
) => {
  let dirs = ReactNativeBlobUtil.fs.dirs;
  ReactNativeBlobUtil.config({
    fileCache: true,
    appendExt: 'pdf',
    path: `${dirs.DocumentDir}/${fileName}`,
    addAndroidDownloads: {
      useDownloadManager: true,
      notification: true,
      title: fileName,
      description: 'File downloaded by download manager.',
      mime: 'application/pdf',
    },
  })
    .fetch('GET', sourceUrl)
    .then(res => {
      if (Platform.OS === 'ios') {
        const filePath = res.path();
        let options = {
          type: 'application/pdf',
          url: filePath,
          saveToFiles: false,
        };
        Share.open(options);
      } else if (Platform.OS === 'android') {
        const filePath = res.path();
        let options = {
          type: 'application/pdf',
          url: filePath,
          saveToFiles: false,
        };
        Share.open(options);
      }
    })
    .catch(err => console.log('BLOB ERROR -> ', err));
};

const PDFViewer = ({
  showShareButton = false,
  loadPdfUrl,
  showModal,
  base64Content,
  closeCallBack,
}: PDFViewerProps) => {
  let source = null;
  if (!!loadPdfUrl) {
    source = {uri: loadPdfUrl, cache: true};
  } else if (!!base64Content) {
    source = {uri: `data:application/pdf;base64,${base64Content}`};
  }

  const insets = useSafeAreaInsets();
  const styles = makeStyles(insets);
  const fileName: string = 'Pdf ' + new Date();

  const SharePDFHandler = () => {
    try {
      if (!!base64Content) {
        downloadPdfDocumentFromBase64Content(base64Content, fileName);
      } else if (!!loadPdfUrl) {
        downloadPdfDcoumentFromUrl(loadPdfUrl, fileName);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showModal}
      onRequestClose={closeCallBack}>
      <TouchableOpacity style={styles.backgroundStyle}></TouchableOpacity>
      <SafeAreaView style={[styles.container]}>
        <View style={styles.centerView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeViewStyle}
              onPress={closeCallBack}>
              <Text style={styles.closeTextStyle}> Close X</Text>
            </TouchableOpacity>
            {!!source && (
              <Pdf
                trustAllCerts={false}
                source={source}
                onLoadComplete={(numberOfPages: number, filePath: string) => {
                  console.log(`number of pages: ${numberOfPages}`);
                }}
                onPageChanged={(page: number, numberOfPages: number) => {
                  console.log(`current page: ${page}`);
                }}
                onError={(error: any) => {
                  console.log(error);
                }}
                style={styles.pdfStyle}
              />
            )}
            {!!showShareButton && (
              <Button
                title={
                  Platform.OS === 'android' ? 'Download' : 'Share Document'
                }
                onPress={SharePDFHandler}></Button>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const makeStyles = (insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: insets.top,
      paddingBottom: insets.bottom + 45,
    },
    centerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalView: {
      paddingTop: width / 9,
      width: width,
      height: height,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    pdfStyle: {
      width: '100%',
      height: '90%',
      backgroundColor: 'white',
    },
    backgroundStyle: {
      backgroundColor: '#272727',
      top: 0,
      bottom: 0,
      right: 0,
      left: 0,
      zIndex: -1,
    },
    closeTextStyle: {
      textAlign: 'right',
      fontSize: 20,
      color: 'gray',
    },
    closeViewStyle: {
      paddingHorizontal: 20,
      height: height / 30,
      justifyContent: 'center',
      alignItems: 'flex-end',
      width: '100%',
    },
  });

export default PDFViewer;
