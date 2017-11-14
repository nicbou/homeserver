class ChromeCastService {
  constructor() {
    this.castSession = null;

    this.sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    const apiConfig = new chrome.cast.ApiConfig(
      this.sessionRequest,
      (session) => { // sessionListener
        console.log('Received ChromeCast session', session)
        this.castSession = session;
      },
      (receiverAvailability) => { // receiverListener
        if (receiverAvailability === chrome.cast.ReceiverAvailability.AVAILABLE) {
          console.log('Chromecast receivers are available')
        } else if (receiverAvailability === chrome.cast.ReceiverAvailability.NAVAILABLE) {
          console.log('No Chromecast receiver available')
        }
      }
    );
    chrome.cast.initialize(
      apiConfig,
      () => {
        console.log('Successful ChromeCast initialization');
      },
      (error) => {
        console.log('ChromeCast initialization failed', error);
      }
    );
  }

  // Lets the user select a ChromeCast and opens the player on the big screen
  selectDevice() {
    console.log('Opening ChromeCast device selection prompt')
      return new Promise((resolve, reject) => {
        chrome.cast.requestSession(
        (session) => {
          // ChromeCast should now show an empty media player on the screen. You're ready to stream
          console.log('Successfully connected to ChromeCast', session);
          this.castSession = session;
          resolve(this.castSession);
        },
        (error) => {
          console.log('Connection to ChromeCast failed', error);
          reject(error);
        }, 
        this.sessionRequest
      );
    });
  }

  isConnectedToDevice() {
    return this.castSession && this.castSession.status === "connected";
  }

  setMedia(mediaUrl, contentType) {
    const mediaInfo = new chrome.cast.media.MediaInfo(mediaUrl, contentType);
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    this.castSession.loadMedia(
      request,
      () => { console.log('Load succeed'); },
      (errorCode) => { console.error(errorCode); }
    );
  }

  setSubtitles(url, contentType, name, languageCode, subtitlesLanguage) {

  }
}

let ChromeCast = null;
window['__onGCastApiAvailable'] = function(isAvailable) {
  if (isAvailable) {
    ChromeCast = new ChromeCastService();
  }
};