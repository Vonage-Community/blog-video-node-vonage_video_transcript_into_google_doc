require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { authorize, writeToGoogleDoc } = require("./google-apis/googleDoc");
const apiRouter = require("./routes");
const path = require("path");
const app = express();
const PORT = 3000;
const streamingSTT = require("./google-apis/streamingSTT");
const { createSessionandToken, generateToken } = require("./opentok");
const documentId = process.env.GOOGLE_DOCUMENT_ID;

// Set up EJS as templating engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Serve static files (like CSS, JS) from a 'public' directory
app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.json());

const expressWs = require("express-ws")(app);
let googleClient = null;

app.use("/api", apiRouter);
app.get("/room/:roomName", async (req, res) => {
  const { roomName } = req.params;
  console.log("Room exists", app.get(roomName));
  if (app.get(roomName)) {
    const sessionId = app.get(roomName);
    const cred = generateToken(sessionId, "publisher");
    // renderRoom(res, sessionId, token, roomId);
    res.render("index", {
      apiKey: cred.apiKey,
      sessionId: sessionId,
      token: cred.token,
      roomName: roomName,
    });
  } else {
    const data = await createSessionandToken(roomName, "publisher");
    app.set(roomName, data.sessionId);
    // serve the index page
    res.render("index", {
      apiKey: data.apiKey,
      sessionId: data.sessionId,
      token: data.token,
      roomName: roomName,
    });
  }
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );
  next();
});

app.ws(`/socket/:streamId`, async (ws, req) => {
  console.log("Socket connection received", req.params);
  const { streamId } = req.params;
  const streamingClient = new streamingSTT.GoogleSTT(streamId, (data) => {
    console.log("Callback", data);
    // {
    //   transcript: ' pause',
    //   streamId: 'b09656dd-40ab-4904-a236-3f8bebc97735',
    //   username: "Enrico"
    // }
    // todo need to write on Google Doc
    const username = data.username ? data.username : data.streamId;
    writeToGoogleDoc(googleClient, documentId, username, data.transcript);
  });
  ws.on("message", (msg) => {
    try {
      if (typeof msg === "string") {
        let config = JSON.parse(msg);
        console.log("First Message Config", config);
        streamingClient.setUsername(config.username);
        streamingClient.transcribe();
      } else {
        if (streamingClient.speechClient) {
          streamingClient.handleAudioStream(msg);
        }
      }
    } catch (err) {
      console.log(err);
      ws.removeAllListeners("message");
      ws.close();
    }
  });

  ws.on("close", () => {
    console.log("Websocket closed");
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  authorize().then((client) => {
    console.log("Google client authorized");
    googleClient = client;
  });
});
