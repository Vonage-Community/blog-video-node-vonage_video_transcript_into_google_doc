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
let sessionId;

const opentok = new OpenTok(apiKey, apiSecret);

const createSessionandToken = (session, role) => {
  return new Promise((resolve, reject) => {
    opentok.createSession({ mediaMode: "routed" }, function (error, session) {
      if (error) {
        reject(error);
      } else {
        sessionId = session.sessionId;
        const token = role
          ? opentok.generateToken(sessionId, { data: role })
          : opentok.generateToken(sessionId);
        resolve({ sessionId: sessionId, token: token });
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

const initiateArchiving = async (sessionId) => {
  const archive = await createArchive(sessionId);
  return archive;
};
const getCredentials = async (session = null, role) => {
  console.log("gen creds for " + role);
  const data = await createSessionandToken(session, role);
  sessionId = data.sessionId;
  const token = data.token;
  return { sessionId: sessionId, token: token, apiKey: apiKey };
};

const startTranscription = async (streamId, sessionId) => {
  try {
    // const { token } = generateToken(sessionId, "publisher");
    let socketUriForStream = socketURI + "/" + stream_id;
    opentok.websocketConnect(
      sessionId,
      token,
      socketUriForStream,
      { streams: [stream_id] },
      function (error, socket) {
        if (error) {
          console.log("Error:", error.message);
        } else {
          console.log("OpenTok Socket websocket connected");
        }
      }
    );
    // const { token } = generateToken(sessionId, "publisher");

    // const data = JSON.stringify({
    //   sessionId: sessionId,
    //   token: token,
    //   websocket: {
    //     uri: `${process.env.websocket_url}/socket`,
    //     streams: [streamId],
    //     headers: {
    //       from: streamId,
    //     },
    //   },
    // });
    // const config = {
    //   method: "post",
    //   url: `https://api.opentok.com/v2/project/${process.env.VIDEO_API_API_KEY}/connect`,
    //   headers: {
    //     "X-OPENTOK-AUTH": await generateRestToken(),
    //     "Content-Type": "application/json",
    //   },
    //   data: data,
    // };
    // const response = await axios(config);
    // console.log(response.data);
    return response.data;
  } catch (e) {
    console.log(e?.response?.data);
    return e;
  }
};

module.exports = {
  getCredentials,
  generateToken,
};
