# ZeroDash Blockchain API - Complete Reference

**Base URL**: `https://zerodashbackend.onrender.com`

**Blockchain Network**: 0G Mainnet  
**Contract Address**: `0x9D8090A0D65370A9c653f71e605718F397D1B69C`  
**Contract Owner**: `0x63F63DC442299cCFe470657a769fdC6591d65eCa`  
**Block Explorer**: https://scan.0g.ai/address/0x9D8090A0D65370A9c653f71e605718F397D1B69C

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Save Player Progress (Blockchain + DB)](#1-save-player-progress-blockchain--db)
3. [Get All On-Chain Sessions](#2-get-all-on-chain-sessions)
4. [Get Latest On-Chain Session](#3-get-latest-on-chain-session)
5. [Get Blockchain Statistics](#4-get-blockchain-statistics)
6. [Get Player Profile (DB + Blockchain Ready)](#5-get-player-profile-db--blockchain-ready)
7. [Blockchain Health Check](#6-blockchain-health-check)
8. [Web3 Integration Examples](#web3-integration-examples)
9. [Smart Contract ABI](#smart-contract-abi)
10. [Error Handling](#error-handling)

---

## 🔐 Authentication

All player-specific endpoints require JWT authentication.

**Header Format**:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**JWT Claims**:
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "iat": 1738598400,
  "exp": 1738684800
}
```

---

## 1. Save Player Progress (Blockchain + DB)

Saves player session to both MongoDB and 0G Blockchain simultaneously.

### Endpoint
```
POST /player/save
```

### Authentication
✅ Required

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "coins": 250,
  "highScore": 9500,
  "characters": {
    "unlocked": ["character1", "character2", "character3"],
    "currentIndex": 2
  },
  "dailyReward": {
    "nextRewardAt": "2026-02-05T00:00:00.000Z"
  }
}
```

**Field Descriptions**:
- `coins` (integer, required): Current coin balance
- `highScore` (integer, required): Player's best score
- `characters` (object, optional): Character unlock data
- `dailyReward` (object, optional): Next reward claim time

### Success Response (200 OK)
```json
{
  "success": true,
  "savedToBlockchain": true,
  "txHash": "0xf5e3a4b2c1d9876543210abcdef1234567890abc",
  "explorerUrl": "https://scan.0g.ai/tx/0xf5e3a4b2c1d9876543210abcdef1234567890abc"
}
```

**Response Fields**:
- `success` (boolean): Operation success status
- `savedToBlockchain` (boolean): Blockchain write confirmation
- `txHash` (string): Transaction hash on 0G blockchain
- `explorerUrl` (string): Direct link to transaction explorer

### Error Response (500 Internal Server Error)
```json
{
  "error": "Failed to save player profile"
}
```

### Error Response (401 Unauthorized)
```json
{
  "error": "No authentication token"
}
```

### cURL Example
```bash
curl -X POST https://zerodashbackend.onrender.com/player/save \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "coins": 250,
    "highScore": 9500
  }'
```

### JavaScript Example
```javascript
const saveProgress = async (coins, highScore) => {
  const response = await fetch('https://zerodashbackend.onrender.com/player/save', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ coins, highScore })
  });
  
  const data = await response.json();
  console.log('Transaction:', data.explorerUrl);
  return data;
};
```

### Python Example
```python
import requests

def save_progress(jwt_token, coins, highscore):
    url = "https://zerodashbackend.onrender.com/player/save"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "coins": coins,
        "highScore": highscore
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
```

### Blockchain Details
- **Gas Cost**: ~150,000 gas (paid by backend)
- **Block Time**: 2-3 seconds
- **Confirmation**: 1 block
- **Data Stored**: Wallet address, coins, best score, timestamp

---

## 2. Get All On-Chain Sessions

Retrieves complete session history from the blockchain for a player.

### Endpoint
```
GET /player/sessions
```

### Authentication
✅ Required

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Success Response (200 OK)
```json
{
  "success": true,
  "sessions": [
    {
      "player": "0x1234567890123456789012345678901234567890",
      "coins": 150,
      "bestScore": 7500,
      "timestamp": 1738598400,
      "date": "2026-02-03T14:20:00.000Z"
    },
    {
      "player": "0x1234567890123456789012345678901234567890",
      "coins": 200,
      "bestScore": 8200,
      "timestamp": 1738612800,
      "date": "2026-02-03T18:20:00.000Z"
    },
    {
      "player": "0x1234567890123456789012345678901234567890",
      "coins": 250,
      "bestScore": 9500,
      "timestamp": 1738684800,
      "date": "2026-02-04T14:20:00.000Z"
    }
  ],
  "count": 3,
  "contractAddress": "0x9D8090A0D65370A9c653f71e605718F397D1B69C",
  "explorerUrl": "https://scan.0g.ai/address/0x9D8090A0D65370A9c653f71e605718F397D1B69C"
}
```

**Response Fields**:
- `sessions` (array): All blockchain sessions
  - `player` (string): Wallet address
  - `coins` (integer): Coins at save time
  - `bestScore` (integer): Score at save time
  - `timestamp` (integer): Unix timestamp
  - `date` (string): ISO 8601 formatted date
- `count` (integer): Total session count
- `contractAddress` (string): Smart contract address
- `explorerUrl` (string): Contract explorer link

### Error Response (500 Internal Server Error)
```json
{
  "error": "Failed to fetch sessions"
}
```

### cURL Example
```bash
curl -X GET https://zerodashbackend.onrender.com/player/sessions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript Example
```javascript
const getSessions = async () => {
  const response = await fetch('https://zerodashbackend.onrender.com/player/sessions', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const data = await response.json();
  console.log(`Total sessions: ${data.count}`);
  
  // Display sessions
  data.sessions.forEach((session, index) => {
    console.log(`Session ${index + 1}:`, {
      coins: session.coins,
      score: session.bestScore,
      date: session.date
    });
  });
  
  return data;
};
```

### Unity C# Example
```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class Session
{
    public string player;
    public int coins;
    public int bestScore;
    public long timestamp;
    public string date;
}

[System.Serializable]
public class SessionsResponse
{
    public bool success;
    public Session[] sessions;
    public int count;
}

public IEnumerator GetSessions(string jwtToken)
{
    using (UnityWebRequest request = UnityWebRequest.Get(
        "https://zerodashbackend.onrender.com/player/sessions"))
    {
        request.SetRequestHeader("Authorization", $"Bearer {jwtToken}");
        
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            SessionsResponse response = JsonUtility.FromJson<SessionsResponse>(
                request.downloadHandler.text);
            
            Debug.Log($"Total Sessions: {response.count}");
            
            foreach (Session session in response.sessions)
            {
                Debug.Log($"Score: {session.bestScore}, Coins: {session.coins}");
            }
        }
    }
}
```

---

## 3. Get Latest On-Chain Session

Retrieves only the most recent blockchain session for a player.

### Endpoint
```
GET /player/latest-session
```

### Authentication
✅ Required

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Success Response (200 OK)
```json
{
  "success": true,
  "session": {
    "player": "0x1234567890123456789012345678901234567890",
    "coins": 250,
    "bestScore": 9500,
    "timestamp": 1738684800,
    "date": "2026-02-04T14:20:00.000Z"
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "No sessions found for this player"
}
```

### cURL Example
```bash
curl -X GET https://zerodashbackend.onrender.com/player/latest-session \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript Example
```javascript
const getLatestSession = async () => {
  const response = await fetch('https://zerodashbackend.onrender.com/player/latest-session', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Latest Session:', {
      coins: data.session.coins,
      score: data.session.bestScore,
      savedAt: data.session.date
    });
  }
  
  return data;
};
```

---

## 4. Get Blockchain Statistics

Retrieves comprehensive blockchain statistics and contract information.

### Endpoint
```
GET /player/blockchain-stats
```

### Authentication
✅ Required

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Success Response (200 OK)
```json
{
  "success": true,
  "stats": {
    "yourSessions": 8,
    "totalSessions": 2547,
    "contractOwner": "0x63F63DC442299cCFe470657a769fdC6591d65eCa",
    "address": "0x9D8090A0D65370A9c653f71e605718F397D1B69C",
    "network": "0G Mainnet",
    "explorerUrl": "https://scan.0g.ai/address/0x9D8090A0D65370A9c653f71e605718F397D1B69C",
    "rpcUrl": "https://evmrpc.0g.ai"
  }
}
```

**Response Fields**:
- `yourSessions` (integer): Player's total sessions
- `totalSessions` (integer): Global session count
- `contractOwner` (string): Contract deployer address
- `address` (string): Contract address
- `network` (string): Blockchain network name
- `explorerUrl` (string): Block explorer link
- `rpcUrl` (string): RPC endpoint

### Error Response (500 Internal Server Error)
```json
{
  "error": "Failed to fetch blockchain stats"
}
```

### cURL Example
```bash
curl -X GET https://zerodashbackend.onrender.com/player/blockchain-stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript Example
```javascript
const getBlockchainStats = async () => {
  const response = await fetch('https://zerodashbackend.onrender.com/player/blockchain-stats', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  const data = await response.json();
  
  console.log('Your Sessions:', data.stats.yourSessions);
  console.log('Global Sessions:', data.stats.totalSessions);
  console.log('Contract:', data.stats.explorerUrl);
  
  return data;
};
```

### Dashboard Example
```javascript
const displayBlockchainStats = async () => {
  const { stats } = await getBlockchainStats();
  
  document.getElementById('player-sessions').textContent = stats.yourSessions;
  document.getElementById('total-sessions').textContent = stats.totalSessions;
  document.getElementById('contract-link').href = stats.explorerUrl;
};
```

---

## 5. Get Player Profile (DB + Blockchain Ready)

Retrieves complete player profile from database.

### Endpoint
```
GET /player/profile
```

### Authentication
✅ Required

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Success Response (200 OK)
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "coins": 250,
  "highScore": 9500,
  "nftPass": true,
  "characters": {
    "unlocked": ["character1", "character2", "character3"],
    "currentIndex": 2
  },
  "dailyReward": {
    "nextRewardAt": "2026-02-05T00:00:00.000Z"
  },
  "createdAt": "2026-02-01T10:30:00.000Z",
  "updatedAt": "2026-02-04T14:20:00.000Z"
}
```

### cURL Example
```bash
curl -X GET https://zerodashbackend.onrender.com/player/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript Example
```javascript
const getProfile = async () => {
  const response = await fetch('https://zerodashbackend.onrender.com/player/profile', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  return await response.json();
};
```

---

## 6. Blockchain Health Check

Checks blockchain connection and contract status.

### Endpoint
```
GET /blockchain-info
```

### Authentication
❌ Not Required

### Success Response (200 OK)
```json
{
  "ready": true,
  "contractInfo": {
    "address": "0x9D8090A0D65370A9c653f71e605718F397D1B69C",
    "network": "0G Mainnet",
    "explorerUrl": "https://scan.0g.ai/address/0x9D8090A0D65370A9c653f71e605718F397D1B69C",
    "rpcUrl": "https://evmrpc.0g.ai"
  }
}
```

**Response Fields**:
- `ready` (boolean): Service operational status
- `contractInfo` (object): Contract details

### cURL Example
```bash
curl -X GET https://zerodashbackend.onrender.com/blockchain-info
```

### JavaScript Example
```javascript
const checkBlockchainHealth = async () => {
  const response = await fetch('https://zerodashbackend.onrender.com/blockchain-info');
  const data = await response.json();
  
  if (data.ready) {
    console.log('✅ Blockchain service operational');
  } else {
    console.log('❌ Blockchain service unavailable');
  }
  
  return data;
};
```

---

## Web3 Integration Examples

### Direct Contract Interaction (ethers.js)
```javascript
const { ethers } = require('ethers');

// Contract details
const CONTRACT_ADDRESS = '0x9D8090A0D65370A9c653f71e605718F397D1B69C';
const RPC_URL = 'https://evmrpc.0g.ai';

const ABI = [
  'function getPlayerSessions(address _player) external view returns (tuple(address player, uint256 coins, uint256 bestScore, uint256 timestamp)[])',
  'function getLatestSession(address _player) external view returns (tuple(address player, uint256 coins, uint256 bestScore, uint256 timestamp))',
  'function sessionCount(address _player) external view returns (uint256)',
  'function totalSessions() external view returns (uint256)',
  'event SessionSaved(address indexed player, uint256 coins, uint256 bestScore, uint256 timestamp, uint256 sessionId)'
];

// Read-only provider
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Get player sessions directly from blockchain
async function getSessionsFromBlockchain(playerAddress) {
  const sessions = await contract.getPlayerSessions(playerAddress);
  
  return sessions.map(s => ({
    player: s.player,
    coins: Number(s.coins),
    bestScore: Number(s.bestScore),
    timestamp: Number(s.timestamp)
  }));
}

// Listen to new session events
contract.on('SessionSaved', (player, coins, bestScore, timestamp, sessionId) => {
  console.log('New session saved:', {
    player,
    coins: coins.toString(),
    bestScore: bestScore.toString(),
    timestamp: timestamp.toString(),
    sessionId: sessionId.toString()
  });
});

// Get total sessions
async function getTotalSessions() {
  const total = await contract.totalSessions();
  return Number(total);
}
```

### Web3.js Integration
```javascript
const Web3 = require('web3');

const CONTRACT_ADDRESS = '0x9D8090A0D65370A9c653f71e605718F397D1B69C';
const RPC_URL = 'https://evmrpc.0g.ai';

const web3 = new Web3(RPC_URL);

const ABI = [
  {
    "inputs": [{"name": "_player", "type": "address"}],
    "name": "getPlayerSessions",
    "outputs": [{
      "components": [
        {"name": "player", "type": "address"},
        {"name": "coins", "type": "uint256"},
        {"name": "bestScore", "type": "uint256"},
        {"name": "timestamp", "type": "uint256"}
      ],
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

async function getPlayerData(playerAddress) {
  const sessions = await contract.methods.getPlayerSessions(playerAddress).call();
  return sessions;
}
```

---

## Smart Contract ABI

### Full Contract ABI
```json
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "coins", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "bestScore", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "sessionId", "type": "uint256"}
    ],
    "name": "SessionSaved",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_player", "type": "address"},
      {"internalType": "uint256", "name": "_coins", "type": "uint256"},
      {"internalType": "uint256", "name": "_bestScore", "type": "uint256"}
    ],
    "name": "saveSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_player", "type": "address"}],
    "name": "getPlayerSessions",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "player", "type": "address"},
        {"internalType": "uint256", "name": "coins", "type": "uint256"},
        {"internalType": "uint256", "name": "bestScore", "type": "uint256"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
      ],
      "internalType": "struct SessionTracker.Session[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_player", "type": "address"}],
    "name": "getLatestSession",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "player", "type": "address"},
        {"internalType": "uint256", "name": "coins", "type": "uint256"},
        {"internalType": "uint256", "name": "bestScore", "type": "uint256"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
      ],
      "internalType": "struct SessionTracker.Session",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_player", "type": "address"}],
    "name": "getPlayerBestScore",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_player", "type": "address"}],
    "name": "getPlayerTotalCoins",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "sessionCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSessions",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]
```

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "No authentication token"
}
```
**Solution**: Include valid JWT token in Authorization header

#### 401 Invalid Token
```json
{
  "error": "Invalid token"
}
```
**Solution**: Refresh JWT token or re-authenticate

#### 404 Not Found
```json
{
  "success": false,
  "message": "No sessions found for this player"
}
```
**Solution**: Player has no blockchain sessions yet

#### 500 Internal Server Error
```json
{
  "error": "Failed to save player profile"
}
```
**Solution**: Check request payload format, retry request

### Blockchain-Specific Errors

#### RPC Connection Failed
```json
{
  "success": false,
  "error": "Cannot connect to blockchain RPC"
}
```
**Solution**: Wait and retry, blockchain node may be temporarily unavailable

#### Gas Estimation Failed
```json
{
  "success": false,
  "error": "Gas estimation failed"
}
```
**Solution**: Backend issue, contact support

---

## Rate Limiting & Best Practices

### Recommendations

1. **Debounce Save Calls**: Don't save on every action
```javascript
   const debouncedSave = debounce(saveProgress, 5000); // 5 seconds
```

2. **Cache Session Data**: Don't fetch sessions repeatedly
```javascript
   const sessionCache = {
     data: null,
     timestamp: null,
     ttl: 60000 // 1 minute
   };
```

3. **Handle Errors Gracefully**: Blockchain calls may fail
```javascript
   try {
     await saveProgress(coins, score);
   } catch (error) {
     console.error('Save failed, will retry');
     // Queue for retry
   }
```

4. **Monitor Transaction Status**: Track transaction confirmations
```javascript
   const monitorTx = async (txHash) => {
     const provider = new ethers.JsonRpcProvider(RPC_URL);
     const receipt = await provider.waitForTransaction(txHash);
     console.log('Confirmed in block:', receipt.blockNumber);
   };
```

---

## Quick Reference Card
```
┌─────────────────────────────────────────────────────────────┐
│  ZeroDash Blockchain API - Quick Reference                  │
├─────────────────────────────────────────────────────────────┤
│  Base URL: https://zerodashbackend.onrender.com            │
│  Contract: 0x9D8090A0D65370A9c653f71e605718F397D1B69C      │
├─────────────────────────────────────────────────────────────┤
│  POST /player/save              → Save to blockchain        │
│  GET  /player/sessions          → Get all sessions          │
│  GET  /player/latest-session    → Get latest session        │
│  GET  /player/blockchain-stats  → Get blockchain stats      │
│  GET  /blockchain-info          → Health check              │
├─────────────────────────────────────────────────────────────┤
│  Auth: Authorization: Bearer <JWT_TOKEN>                    │
│  Network: 0G Mainnet (Chain ID: 16600)                      │
│  Explorer: https://scan.0g.ai                               │
└─────────────────────────────────────────────────────────────┘
```

---

**Made with 🔥 by Kult Games | Powered by 0G Network**