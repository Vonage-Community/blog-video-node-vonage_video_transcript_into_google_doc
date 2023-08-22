const express = require("express");
const router = express.Router();

const { startTranscription, createSessionandToken } = require("../opentok");

router.post("/start-transcribe", async (req, res) => {
  const { streamId, sessionId, username } = req.body;
  const data = await startTranscription(streamId, sessionId, username);
  res.send(data);
});





module.exports = router;
