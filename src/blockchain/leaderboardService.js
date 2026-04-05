const { ethers } = require("ethers");
require("dotenv").config();

const CONTRACT_ADDRESS = process.env.LEADERBOARD_CONTRACT_ADDRESS;

const ABI = [
  "function saveLeaderboard(address _requestedBy, address _userWallet, uint256 _userScore, uint256 _userStanding, address[] memory _topPlayerAddresses, uint256[] memory _topPlayerScores, uint256[] memory _topPlayerStandings) external",
  "function getSnapshot(uint256 _snapshotId) external view returns (uint256 snapshotId, uint256 timestamp, address requestedBy, tuple(address player, uint256 bestScore, uint256 standing, uint256 timestamp) userEntry, address firstPlace, address secondPlace, address thirdPlace)",
  "function getSnapshotTopPlayers(uint256 _snapshotId) external view returns (tuple(address player, uint256 bestScore, uint256 standing, uint256 timestamp)[])",
  "function getPlayerSnapshots(address _player) external view returns (uint256[])",
  "function getLatestSnapshot() external view returns (uint256 snapshotId, uint256 timestamp, address requestedBy, tuple(address player, uint256 bestScore, uint256 standing, uint256 timestamp) userEntry, address firstPlace, address secondPlace, address thirdPlace)",
  "function getLatestTop3() external view returns (address, address, address)",
  "function totalSnapshots() external view returns (uint256)",
  "function owner() external view returns (address)",
  "event LeaderboardSaved(uint256 indexed snapshotId, address indexed requestedBy, uint256 userStanding, uint256 userScore, address firstPlace, address secondPlace, address thirdPlace, uint256 timestamp)"
];

class LeaderboardService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.OG_MAINNET_RPC || "https://evmrpc.0g.ai",
      { chainId: 16661, name: "0g-mainnet" }
    );
    
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.wallet);
    
    console.log("🏆 Leaderboard Service Connected");
    console.log("📍 Contract:", CONTRACT_ADDRESS);
  }

  /**
   * Save leaderboard snapshot to blockchain
   */
  async saveLeaderboardOnChain(requestedBy, userWallet, leaderboardData) {
    try {
      console.log(`🏆 Saving leaderboard snapshot on-chain...`);
      console.log(`   Requested by: ${requestedBy}`);
      console.log(`   User: ${userWallet}`);
      
      const { userScore, userStanding, topPlayers } = leaderboardData;
      
      // Prepare arrays for top players (limit to top 10)
      const topPlayerAddresses = topPlayers.slice(0, 10).map(p => p.walletAddress);
      const topPlayerScores = topPlayers.slice(0, 10).map(p => p.highScore);
      const topPlayerStandings = topPlayers.slice(0, 10).map((_, idx) => idx + 1);
      
      // Estimate gas
      const gasEstimate = await this.contract.saveLeaderboard.estimateGas(
        requestedBy,
        userWallet,
        userScore,
        userStanding,
        topPlayerAddresses,
        topPlayerScores,
        topPlayerStandings
      );
      
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
      
      const tx = await this.contract.saveLeaderboard(
        requestedBy,
        userWallet,
        userScore,
        userStanding,
        topPlayerAddresses,
        topPlayerScores,
        topPlayerStandings,
        {
          gasLimit: gasEstimate * 120n / 100n
        }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);
      console.log(`🔍 View: https://chainscan.0g.ai/tx/${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`✅ Leaderboard saved on-chain! Block: ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `https://chainscan.0g.ai/tx/${tx.hash}`
      };
    } catch (error) {
      console.error("❌ Blockchain leaderboard save error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshot(snapshotId) {
    try {
      const snapshot = await this.contract.getSnapshot(snapshotId);
      const topPlayers = await this.contract.getSnapshotTopPlayers(snapshotId);
      
      return {
        snapshotId: Number(snapshot.snapshotId),
        timestamp: Number(snapshot.timestamp),
        requestedBy: snapshot.requestedBy,
        userEntry: {
          player: snapshot.userEntry.player,
          bestScore: Number(snapshot.userEntry.bestScore),
          standing: Number(snapshot.userEntry.standing),
          timestamp: Number(snapshot.userEntry.timestamp)
        },
        top3: {
          first: snapshot.firstPlace,
          second: snapshot.secondPlace,
          third: snapshot.thirdPlace
        },
        topPlayers: topPlayers.map(p => ({
          player: p.player,
          bestScore: Number(p.bestScore),
          standing: Number(p.standing),
          timestamp: Number(p.timestamp)
        }))
      };
    } catch (error) {
      console.error("Error fetching snapshot:", error);
      return null;
    }
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot() {
    try {
      const snapshot = await this.contract.getLatestSnapshot();
      const snapshotId = Number(snapshot.snapshotId);
      return await this.getSnapshot(snapshotId);
    } catch (error) {
      console.error("Error fetching latest snapshot:", error);
      return null;
    }
  }

  /**
   * Get player's snapshots
   */
  async getPlayerSnapshots(playerAddress) {
    try {
      const snapshotIds = await this.contract.getPlayerSnapshots(playerAddress);
      return snapshotIds.map(id => Number(id));
    } catch (error) {
      console.error("Error fetching player snapshots:", error);
      return [];
    }
  }

  /**
   * Get total snapshots
   */
  async getTotalSnapshots() {
    try {
      const total = await this.contract.totalSnapshots();
      return Number(total);
    } catch (error) {
      console.error("Error fetching total snapshots:", error);
      return 0;
    }
  }

  /**
   * Get latest top 3
   */
  async getLatestTop3() {
    try {
      const [first, second, third] = await this.contract.getLatestTop3();
      return { first, second, third };
    } catch (error) {
      console.error("Error fetching latest top 3:", error);
      return { first: null, second: null, third: null };
    }
  }

  isReady() {
    return !!CONTRACT_ADDRESS && !!this.wallet && !!this.provider;
  }

  getContractInfo() {
    return {
      address: CONTRACT_ADDRESS,
      network: "0G Mainnet",
      chainId: 16661,
      explorerUrl: `https://chainscan.0g.ai/address/${CONTRACT_ADDRESS}`,
      rpcUrl: this.provider._getConnection().url
    };
  }
}

module.exports = new LeaderboardService();