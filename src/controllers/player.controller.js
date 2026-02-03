const Player = require("../models/Player");
const sessionService = require("../blockchain/sessionService");

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
 * Saves to both MongoDB AND 0G Blockchain
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

    // Save to MongoDB
    const player = await Player.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      { $set: update },
      { upsert: true, new: true }
    );

    // 🔥 Save to 0G Blockchain (non-blocking)
    let blockchainResult = null;
    try {
      blockchainResult = await sessionService.saveSessionOnChain(
        req.walletAddress,
        coins || player.coins,
        highScore || player.highScore
      );
    } catch (blockchainError) {
      console.error("Blockchain save failed (non-critical):", blockchainError);
    }

    res.json({ 
      success: true,
      savedToBlockchain: blockchainResult?.success || false,
      txHash: blockchainResult?.txHash,
      explorerUrl: blockchainResult?.explorerUrl
    });
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

    res.json(players ?? []);
  } catch (err) {
    console.error("Leaderboard error:", err);
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

/**
 * GET ON-CHAIN SESSIONS
 */
exports.getOnChainSessions = async (req, res) => {
  try {
    const sessions = await sessionService.getPlayerSessions(req.walletAddress);
    const sessionCount = await sessionService.getSessionCount(req.walletAddress);
    
    res.json({ 
      success: true, 
      sessions,
      count: sessionCount,
      contractAddress: "0x9D8090A0D65370A9c653f71e605718F397D1B69C",
      explorerUrl: `https://scan.0g.ai/address/0x9D8090A0D65370A9c653f71e605718F397D1B69C`
    });
  } catch (err) {
    console.error("Error fetching on-chain sessions:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

/**
 * GET LATEST ON-CHAIN SESSION
 */
exports.getLatestSession = async (req, res) => {
  try {
    const session = await sessionService.getLatestSession(req.walletAddress);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "No sessions found for this player"
      });
    }
    
    res.json({ 
      success: true, 
      session 
    });
  } catch (err) {
    console.error("Error fetching latest session:", err);
    res.status(500).json({ error: "Failed to fetch latest session" });
  }
};

/**
 * GET BLOCKCHAIN STATS
 */
exports.getBlockchainStats = async (req, res) => {
  try {
    const sessionCount = await sessionService.getSessionCount(req.walletAddress);
    const totalSessions = await sessionService.getTotalSessions();
    const owner = await sessionService.getOwner();
    const contractInfo = sessionService.getContractInfo();
    
    res.json({
      success: true,
      stats: {
        yourSessions: sessionCount,
        totalSessions: totalSessions,
        contractOwner: owner,
        ...contractInfo
      }
    });
  } catch (err) {
    console.error("Error fetching blockchain stats:", err);
    res.status(500).json({ error: "Failed to fetch blockchain stats" });
  }
};