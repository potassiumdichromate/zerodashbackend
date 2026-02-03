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

// 🔥 Health check for blockchain connection
app.get("/blockchain-info", (_, res) => {
  const sessionService = require("./blockchain/sessionService");
  res.json({
    ready: sessionService.isReady(),
    contractInfo: sessionService.getContractInfo()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎨 NFT Metadata API: http://localhost:${PORT}/nft/metadata/0`);
  console.log(`⛓️  Blockchain Info: http://localhost:${PORT}/blockchain-info`);
});