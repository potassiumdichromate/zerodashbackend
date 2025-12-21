const Player = require("../models/Player");

/**
 * GET PLAYER PROFILE
 */
exports.getProfile = async (req, res) => {
  let player = await Player.findOne({ walletAddress: req.walletAddress });

  if (!player) {
    player = await Player.create({
      walletAddress: req.walletAddress
    });
  }

  res.json({
    coins: player.coins,
    highScore: player.highScore,
    characters: player.characters,
    dailyReward: player.dailyReward
  });
};

/**
 * SAVE PLAYER STATE
 * Server trusts only allowed fields
 */
exports.saveProfile = async (req, res) => {
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
};

/**
 * LEADERBOARD (TOP SCORES)
 */
exports.getLeaderboard = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  const leaderboard = await Player.find(
    { highScore: { $gt: 0 } },
    { walletAddress: 1, highScore: 1, _id: 0 }
  )
    .sort({ highScore: -1 })
    .limit(limit);

  res.json(leaderboard);
};
