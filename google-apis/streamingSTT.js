const speech = require("@google-cloud/speech");

class GoogleSTT {
  constructor(streamId, callback) {
    this.streamId = streamId;
    this.stream = null;
    this.speechClient = new speech.SpeechClient({
      projectId: process.env.GOOGLE_PROJECT_ID,
      keyFilename: "./vonage-transcript-audio-key.json", // Replace with path to your service account key
    });
    this.encoding = "LINEAR16";
    this.sampleRateHertz = 16000;
    this.languageCode = "en-US";
    this.transcriptCallback = callback;
    this.username = null;
  }

  setUsername(username) {
    this.username = username;
  }

  async transcribe() {
    const request = {
      config: {
        encoding: this.encoding,
        sampleRateHertz: this.sampleRateHertz,
        languageCode: this.languageCode,
      },
      interimResults: false,
    };
    console.log("Request", request);

    this.stream = this.speechClient.streamingRecognize(request);
    this.stream.on("data", async (data) => {
      let transcript = data.results[0].alternatives[0].transcript;
      console.log("Transcript", transcript);
      if (this.transcriptCallback) {
        this.transcriptCallback({
          transcript,
          streamId: this.streamId, //tood need to add User Name ?
          username: this.username,
        });
      }
    });

    this.stream.on("error", (err) => {
      console.error(err);
    });

    this.stream.on("finish", (res) => {});
    return this.stream;
  }
  handleAudioStream(data) {
    if (this.stream) {
      this.stream.write(data);
    }
  }

  closeStream() {
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }
  }
}

module.exports = {
  GoogleSTT,
};
