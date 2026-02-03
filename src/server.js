require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const nftRoutes = require('./routes/nftRoutes');

connectDB();

const app = express();

const allowedOrigins = [
  "https://zerodashgame.xyz",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev/v6",
  "https://pub-c51325b05b6848599be1cf2978bc4c0e.r2.dev"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Routes
app.use("/player", require("./routes/player.routes"));
app.use('/nft', nftRoutes);

app.get("/", (_, res) => res.send("ZeroDash Backend Running"));

// 🔥 Health check for blockchain connections
app.get("/blockchain-info", (_, res) => {
  const sessionService = require("./blockchain/sessionService");
  const leaderboardService = require("./blockchain/leaderboardService");
  
  res.json({
    status: "online",
    services: {
      sessions: {
        ready: sessionService.isReady(),
        contractInfo: sessionService.getContractInfo()
      },
      leaderboard: {
        ready: leaderboardService.isReady(),
        contractInfo: leaderboardService.getContractInfo()
      }
    },
    network: {
      name: "0G Mainnet",
      chainId: 16661,
      rpcUrl: "https://evmrpc.0g.ai",
      explorer: "https://chainscan.0g.ai"
    }
  });
});

// 📊 Global stats endpoint
app.get("/stats", async (_, res) => {
  try {
    const sessionService = require("./blockchain/sessionService");
    const leaderboardService = require("./blockchain/leaderboardService");
    const Player = require("./models/Player");
    
    const [totalSessions, totalSnapshots, totalPlayers] = await Promise.all([
      sessionService.getTotalSessions().catch(() => 0),
      leaderboardService.getTotalSnapshots().catch(() => 0),
      Player.countDocuments()
    ]);
    
    res.json({
      totalPlayers,
      totalSessions,
      totalLeaderboardSnapshots: totalSnapshots,
      contracts: {
        sessions: process.env.SESSION_CONTRACT_ADDRESS,
        leaderboard: process.env.LEADERBOARD_CONTRACT_ADDRESS
      }
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 📜 Contract information endpoint
app.get("/contracts", (_, res) => {
  res.json({
    network: "0G Mainnet",
    chainId: 16661,
    explorer: "https://chainscan.0g.ai",
    contracts: {
      sessionTracker: {
        address: process.env.SESSION_CONTRACT_ADDRESS,
        purpose: "Tracks player gaming sessions",
        explorerUrl: `https://chainscan.0g.ai/address/${process.env.SESSION_CONTRACT_ADDRESS}`
      },
      leaderboardTracker: {
        address: process.env.LEADERBOARD_CONTRACT_ADDRESS,
        purpose: "Tracks leaderboard snapshots",
        explorerUrl: `https://chainscan.0g.ai/address/${process.env.LEADERBOARD_CONTRACT_ADDRESS}`
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║          🎮 ZeroDash Backend Server 🎮            ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log("");
  console.log("📡 Endpoints:");
  console.log(`   🏠 Root: http://localhost:${PORT}/`);
  console.log(`   🎨 NFT: http://localhost:${PORT}/nft/metadata/0`);
  console.log(`   ⛓️  Blockchain: http://localhost:${PORT}/blockchain-info`);
  console.log(`   📊 Stats: http://localhost:${PORT}/stats`);
  console.log(`   📜 Contracts: http://localhost:${PORT}/contracts`);
  console.log("");
  console.log("⛓️  Blockchain:");
  console.log(`   📝 Sessions: ${process.env.SESSION_CONTRACT_ADDRESS || '❌ Not set'}`);
  console.log(`   🏆 Leaderboard: ${process.env.LEADERBOARD_CONTRACT_ADDRESS || '❌ Not set'}`);
  console.log("");
  console.log("🔗 0G Mainnet (Chain ID: 16661)");
  console.log("🔍 https://chainscan.0g.ai");
  console.log("");
  console.log("✅ Server ready!");
  console.log("════════════════════════════════════════════════════");
});