const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/player.controller");

router.get("/profile", auth, ctrl.getProfile);
router.post("/save", auth, ctrl.saveProfile);
router.get("/leaderboard", ctrl.getLeaderboard);
router.post("/nft-pass", auth, ctrl.activateNftPass);

module.exports = router;
