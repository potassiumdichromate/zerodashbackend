const Player = require("../models/Player");

/**
 * GET PLAYER PROFILE
 */
exports.getProfile = async (req, res) => {
  try {
    let player = await Player.findOne({ walletAddress: req.walletAddress });

    // ✅ Create default player if not exists
    if (!player) {
      player = await Player.create({
        walletAddress: req.walletAddress,
        coins: 10,
        highScore: 0,
        nftPass: false,
        characters: {
          unlocked: [],
          currentIndex: 0
        }
      });
    }

    return res.json(player);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({
      error: "Failed to load player profile"
    });
  }
};

/**
 * SAVE PLAYER STATE
 * Server trusts only allowed fields
 */
exports.saveProfile = async (req, res) => {
  try {
    const { coins, highScore, characters, dailyReward } = req.body;

    const update = {};

    if (Number.isInteger(coins)) update.coins = coins;
    if (Number.isInteger(highScore)) update.highScore = highScore;

    if (characters) {
      update.characters = {
        unlocked: characters.unlocked || [],
        currentIndex: characters.currentIndex || 0
      };
    }

    if (dailyReward?.nextRewardAt) {
      update["dailyReward.nextRewardAt"] = new Date(dailyReward.nextRewardAt);
    }

    const player = await Player.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Save profile error:", err);
    return res.status(500).json({
      error: "Failed to save player profile"
    });
  }
};

/**
 * LEADERBOARD (TOP SCORES)
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const players = await Player.find(
      {},
      { walletAddress: 1, highScore: 1, _id: 0 }
    )
      .sort({ highScore: -1 })
      .limit(limit)
      .lean();

    // ✅ ALWAYS return array
    res.json(players ?? []);
  } catch (err) {
    console.error("Leaderboard error:", err);

    // ✅ Never crash Render
    res.status(200).json([]);
  }
};

/**
 * ACTIVATE NFT PASS
 * Called after successful NFT mint on blockchain
 */
exports.activateNftPass = async (req, res) => {
  try {
    const { nftPass } = req.body;

    if (nftPass !== true) {
      return res.status(400).json({
        success: false,
        error: "nftPass must be true"
      });
    }

    const player = await Player.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      { $set: { nftPass: true } },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      nftPass: player.nftPass,
      walletAddress: player.walletAddress
    });
  } catch (err) {
    console.error("NFT Pass update error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to activate NFT Pass"
    });
  }
};