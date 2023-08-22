const opentok = require("./opentok");

const express = require("express");

const router = express.Router();

// Use the routes
router.use("/opentok", opentok);



module.exports = router;
