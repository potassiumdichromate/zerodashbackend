const { ethers } = require("ethers");
require("dotenv").config();

// 🔥 Your deployed contract on 0G Mainnet
const CONTRACT_ADDRESS = "0x9D8090A0D65370A9c653f71e605718F397D1B69C";

const ABI = [
  "function saveSession(address _player, uint256 _coins, uint256 _bestScore) external",
  "function getPlayerSessions(address _player) external view returns (tuple(address player, uint256 coins, uint256 bestScore, uint256 timestamp)[])",
  "function getLatestSession(address _player) external view returns (tuple(address player, uint256 coins, uint256 bestScore, uint256 timestamp))",
  "function sessionCount(address _player) external view returns (uint256)",
  "function totalSessions() external view returns (uint256)",
  "function owner() external view returns (address)",
  "event SessionSaved(address indexed player, uint256 coins, uint256 bestScore, uint256 timestamp, uint256 sessionId)"
];

class SessionService {
  constructor() {
    // 🔥 Connect to 0G MAINNET
    this.provider = new ethers.JsonRpcProvider(
      process.env.OG_MAINNET_RPC || "https://evmrpc.0g.ai"
    );
    
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.wallet);
    
    console.log("🔗 Connected to 0G Mainnet");
    console.log("📍 Contract Address:", CONTRACT_ADDRESS);
    console.log("👤 Deployer Address:", this.wallet.address);
    console.log("🔍 Explorer:", `https://scan.0g.ai/address/${CONTRACT_ADDRESS}`);
  }

  /**
   * Save session to blockchain
   */
  async saveSessionOnChain(playerAddress, coins, bestScore) {
    try {
      console.log(`💾 Saving session on-chain for ${playerAddress}`);
      console.log(`   Coins: ${coins}, Best Score: ${bestScore}`);
      
      // Estimate gas first
      const gasEstimate = await this.contract.saveSession.estimateGas(
        playerAddress,
        coins,
        bestScore
      );
      
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
      
      const tx = await this.contract.saveSession(
        playerAddress,
        coins,
        bestScore,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);
      console.log(`🔍 View on explorer: https://scan.0g.ai/tx/${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`✅ Session saved on-chain! Block: ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `https://scan.0g.ai/tx/${tx.hash}`
      };
    } catch (error) {
      console.error("❌ Blockchain save error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player's on-chain sessions
   */
  async getPlayerSessions(playerAddress) {
    try {
      const sessions = await this.contract.getPlayerSessions(playerAddress);
      return sessions.map(s => ({
        player: s.player,
        coins: Number(s.coins),
        bestScore: Number(s.bestScore),
        timestamp: Number(s.timestamp),
        date: new Date(Number(s.timestamp) * 1000).toISOString()
      }));
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
  }

  /**
   * Get latest session
   */
  async getLatestSession(playerAddress) {
    try {
      const session = await this.contract.getLatestSession(playerAddress);
      return {
        player: session.player,
        coins: Number(session.coins),
        bestScore: Number(session.bestScore),
        timestamp: Number(session.timestamp),
        date: new Date(Number(session.timestamp) * 1000).toISOString()
      };
    } catch (error) {
      console.error("Error fetching latest session:", error);
      return null;
    }
  }

  /**
   * Get player's total sessions count
   */
  async getSessionCount(playerAddress) {
    try {
      const count = await this.contract.sessionCount(playerAddress);
      return Number(count);
    } catch (error) {
      console.error("Error fetching session count:", error);
      return 0;
    }
  }

  /**
   * Get total sessions across all players
   */
  async getTotalSessions() {
    try {
      const total = await this.contract.totalSessions();
      return Number(total);
    } catch (error) {
      console.error("Error fetching total sessions:", error);
      return 0;
    }
  }

  /**
   * Get contract owner
   */
  async getOwner() {
    try {
      const owner = await this.contract.owner();
      return owner;
    } catch (error) {
      console.error("Error fetching owner:", error);
      return null;
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return !!CONTRACT_ADDRESS && !!this.wallet && !!this.provider;
  }

  /**
   * Get contract info
   */
  getContractInfo() {
    return {
      address: CONTRACT_ADDRESS,
      network: "0G Mainnet",
      explorerUrl: `https://scan.0g.ai/address/${CONTRACT_ADDRESS}`,
      rpcUrl: this.provider._getConnection().url
    };
  }
}

module.exports = new SessionService();