const OpenTok = require("opentok");
const apiKey = process.env.VIDEO_API_API_KEY;
const apiSecret = process.env.VIDEO_API_API_SECRET;

const axios = require("axios");
const jwt = require("jsonwebtoken");
if (!apiKey || !apiSecret) {
  throw new Error(
    "Missing config values for env params OT_API_KEY and OT_API_SECRET"
  );
}

const app = require("express")();

const opentok = new OpenTok(apiKey, apiSecret);

const createSessionandToken = (roomName, role) => {
  return new Promise((resolve, reject) => {
    opentok.createSession({ mediaMode: "routed" }, function (error, session) {
      if (error) {
        reject(error);
      } else {
        sessionId = session.sessionId;
        const token = role
          ? opentok.generateToken(sessionId, { data: role })
          : opentok.generateToken(sessionId);
        resolve({ sessionId: sessionId, token: token, apiKey });
        //console.log("Session ID: " + sessionId);
      }
    });
  });
};

// const signal = (sessionId, captions, type) => {
//   return new Promise((res, rej) => {
//     console.log(JSON.stringify(captions), "being sent");
//     opentok.signal(
//       sessionId,
//       null,
//       { type: type, data: captions },
//       (err, resp) => {
//         if (!err) {
//           res(resp);
//         } else {
//           console.log(err);
//           rej(err);
//         }
//       }
//     );
//   });
// };

const generateRestToken = () => {
  return new Promise((res, rej) => {
    jwt.sign(
      {
        iss: process.env.VIDEO_API_API_KEY,
        // iat: Date.now(),
        ist: "project",
        exp: Date.now() + 200,
        // exp: 1658483742,
        jti: Math.random() * 132,
      },
      process.env.VIDEO_API_API_SECRET,
      { algorithm: "HS256" },
      function (err, token) {
        if (token) {
          console.log("\n Received token\n", token);
          res(token);
        } else {
          console.log("\n Unable to fetch token, error:", err);
          rej(err);
        }
      }
    );
  });
};

const generateToken = (sessionId, role) => {
  const token = role
    ? opentok.generateToken(sessionId, { data: role })
    : opentok.generateToken(sessionId);
  return { token: token, apiKey: apiKey };
};

const getCredentials = async (session = null, role) => {
  console.log("gen creds for " + role);
  const data = await createSessionandToken(session, role);
  sessionId = data.sessionId;
  const token = data.token;
  return { sessionId: sessionId, token: token, apiKey: apiKey };
};

const startTranscription = async (streamId, sessionId, username) => {
  try {
    const { token } = generateToken(sessionId, "publisher");
    let socketUriForStream = process.env.NGROK_DOMAIN + "/socket/" + streamId;
    opentok.websocketConnect(
      sessionId,
      token,
      socketUriForStream,
      { streams: [streamId], headers: { username } },
      function (error, socket) {
        if (error) {
          console.log("Error:", error.message);
        } else {
          console.log("OpenTok Socket websocket connected", socket);
        }
      }
    );
    return response.data;
  } catch (e) {
    console.log(e?.response?.data);
    return e;
  }
};

const forceDisconnect = async (sessionId, connectionId) => {
  const config = {
    method: "delete",
    url: `https://api.opentok.com/v2/project/${apiKey}/session/${sessionId}/connection/${connectionId}`,
    headers: {
      "X-OPENTOK-AUTH": await generateRestToken(),
      "Content-Type": "application/json",
    },
  };
  console.log(config);

  try {
    const response = await axios(config);
    return response.data;
  } catch (e) {
    console.log(`there was an error` + e);
    return e;
  }
};

module.exports = {
  getCredentials,
  generateToken,
  startTranscription,
  createSessionandToken,
};
