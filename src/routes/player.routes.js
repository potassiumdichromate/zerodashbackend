const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/player.controller");

// Existing routes
router.get("/profile", auth, ctrl.getProfile);
router.post("/save", auth, ctrl.saveProfile);
router.get("/leaderboard", ctrl.getLeaderboard);
router.post("/nft-pass", auth, ctrl.activateNftPass);

// 🔥 NEW: Blockchain session routes
router.get("/sessions", auth, ctrl.getOnChainSessions);
router.get("/latest-session", auth, ctrl.getLatestSession);
router.get("/blockchain-stats", auth, ctrl.getBlockchainStats);

module.exports = router;