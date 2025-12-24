# 🎫 Zero Dash Pass - Gasless NFT Minting System

## 📋 Overview

Zero Dash Pass is a premium NFT on the 0G Blockchain that unlocks exclusive game features. The system implements **completely gasless minting** where users pay ZERO gas fees - the deployer covers all transaction costs.

---

## 🔗 Contract Information

### **Deployed Contract**
- **Address**: `0xbfe7aAfEB3145962943412413d69582630C5830D`
- **Network**: 0G Blockchain Mainnet
- **Chain ID**: 16661
- **RPC URL**: https://evmrpc.0g.ai
- **Explorer**: https://explorer.0g.ai/address/0xbfe7aAfEB3145962943412413d69582630C5830D

### **Contract Features**
- **Max Supply**: 100,000 NFTs
- **Merkle Tree Whitelist**: 28,237 whitelisted addresses
- **Merkle Root**: `0x8287eee7c269bda2c46c0952ee75d10c2cf7b5e85271602ab261f6a25ddd3219`
- **One NFT per Wallet**: Each address can only mint once

---

## 💰 Pricing Structure

### **For Whitelisted Users:**
- **Mint Price**: FREE (0 0G)
- **Gas Fee**: ZERO (Deployer pays)
- **Total Cost to User**: **0 0G** ✨

### **For Non-Whitelisted Users:**
- **Mint Price**: FREE (Deployer pays 5 0G)
- **Gas Fee**: ZERO (Deployer pays)
- **Total Cost to User**: **0 0G** ✨

**The deployer wallet pays ALL costs for ALL users!**

---

## 🔐 How Gasless Minting Works

### **Traditional Minting (NOT USED)**
```
User → Pays Gas + Mint Price → NFT Minted
```

### **Gasless Minting (IMPLEMENTED)**
```
1. User signs a message (no blockchain transaction)
2. Backend verifies signature
3. Backend sends transaction from relayer wallet
4. Deployer pays gas + mint price
5. NFT minted to user's wallet
6. Database updated (nftPass = true)
```

### **Technical Flow:**
1. **User Action**: Sign message "Mint Zero Dash Pass NFT to {walletAddress}"
2. **Signature Verification**: Backend verifies user owns the wallet
3. **Whitelist Check**: Contract verifies Merkle proof
4. **Transaction Execution**: Relayer wallet calls `mint(recipient, merkleProof)`
5. **Cost Payment**: Deployer pays 0 0G (whitelisted) or 5 0G + gas (non-whitelisted)
6. **NFT Transfer**: NFT minted directly to user's wallet
7. **Database Update**: Player.nftPass set to true

---

## 🌐 Backend API Endpoints

### **Base URL**
```
https://zerodashbackend.onrender.com
```

---

### **1. Get Merkle Proof**
```http
GET /nft/proof/:address
```

**Description**: Get whitelist proof for an address

**Parameters**:
- `address` (path): Wallet address to check

**Response (Whitelisted)**:
```json
{
  "success": true,
  "isWhitelisted": true,
  "proof": [
    "0x177d1e6023f64dca9a61eec1cba3b94606e59bce8aac926d83870637952b9dd1",
    "0x7180a561ab8f172126e64e8e6d462e330ca95b43802f7b381910cc6beeb00ee3",
    ...
  ],
  "message": "Address whitelisted! Deployer pays gas for FREE mint!"
}
```

**Response (Not Whitelisted)**:
```json
{
  "success": true,
  "isWhitelisted": false,
  "proof": [],
  "message": "Address not whitelisted. Deployer pays 5 0G + gas for you!"
}
```

---

### **2. Gasless Mint**
```http
POST /nft/mint-gasless
```

**Description**: Mint NFT with zero gas fees (deployer pays everything)

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {walletAddress}"
}
```

**Body**:
```json
{
  "walletAddress": "0xYourWalletAddress",
  "merkleProof": ["0x...", "0x..."],
  "signature": "0xUserSignature"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "NFT minted successfully! Zero cost to you - deployer paid everything!",
  "transactionHash": "0x...",
  "tokenId": 0,
  "explorerUrl": "https://explorer.0g.ai/tx/0x...",
  "gasPaidByDeployer": "0.0001 0G",
  "mintPricePaidByDeployer": "0 0G",
  "totalPaidByDeployer": "0.0001 0G",
  "userPaid": "0 0G",
  "whitelisted": true
}
```

**Error Responses**:
```json
// Already minted
{
  "success": false,
  "message": "You already minted your NFT Pass"
}

// Invalid signature
{
  "success": false,
  "message": "Signature verification failed. Sign with correct wallet."
}

// Relayer out of funds
{
  "success": false,
  "message": "Relayer out of funds. Contact admin."
}
```

---

### **3. Check Whitelist Status**
```http
GET /nft/whitelist/check/:address
```

**Description**: Check if address is whitelisted

**Response**:
```json
{
  "success": true,
  "address": "0x...",
  "isWhitelisted": true,
  "message": "Whitelisted - FREE mint!"
}
```

---

### **4. Get Whitelist Statistics**
```http
GET /nft/whitelist/stats
```

**Description**: Get overall whitelist statistics

**Response**:
```json
{
  "success": true,
  "totalWhitelisted": 28237,
  "merkleRootConfigured": true,
  "contractAddress": "0xbfe7aAfEB3145962943412413d69582630C5830D",
  "network": "0G Blockchain",
  "chainId": 16661
}
```

---

### **5. Get Relayer Status**
```http
GET /nft/relayer/status
```

**Description**: Check relayer wallet balance and status

**Response**:
```json
{
  "success": true,
  "relayerAddress": "0x63F63DC442299cCFe470657a769fdC6591d65eCa",
  "balance": "6.82 0G",
  "totalMinted": "0",
  "contractAddress": "0xbfe7aAfEB3145962943412413d69582630C5830D",
  "network": "0G Blockchain",
  "chainId": 16661
}
```

---

### **6. Get NFT Metadata**
```http
GET /nft/metadata/:tokenId
```

**Description**: Get metadata for a specific NFT

**Response**:
```json
{
  "name": "Zero Dash Exclusive Pass #0",
  "description": "Exclusive Zero Dash Exclusive Pass NFT...",
  "image": "ipfs://bafybeieqg5azdxn63o64aznbupzdxbigwyjdh3bbhb6u2x5yftrexiuhfy",
  "external_url": "https://zerodashgame.xyz",
  "attributes": [...],
  "background_color": "0A1628"
}
```

---

### **7. Health Check**
```http
GET /nft/health
```

**Description**: Check NFT service health

**Response**:
```json
{
  "status": "ok",
  "service": "NFT Metadata API",
  "timestamp": "2025-12-24T...",
  "ipfs": {
    "image_cid": "bafybeieqg5azdxn63o64aznbupzdxbigwyjdh3bbhb6u2x5yftrexiuhfy",
    "image_configured": true
  },
  "merkle": {
    "proofs_loaded": true,
    "total_whitelisted": 28237,
    "status": "active"
  },
  "gasless": {
    "relayer_initialized": true,
    "relayer_address": "0x63F63DC442299cCFe470657a769fdC6591d65eCa",
    "contract": "0xbfe7aAfEB3145962943412413d69582630C5830D"
  }
}
```

---

## 🎮 Premium Benefits

NFT holders receive:

- ✅ **Exclusive Levels** - Access premium game content
- ✅ **Special Characters** - Unlock unique heroes
- ✅ **Bonus Rewards** - 2x coin multiplier
- ✅ **Priority Access** - Early feature releases

---

## 🔧 Technical Implementation

### **Smart Contract Function**
```solidity
function mint(
    address recipient,           // User's wallet
    bytes32[] calldata merkleProof  // Whitelist proof
) external payable
```

### **Backend Relayer Wallet**
- **Address**: `0x63F63DC442299cCFe470657a769fdC6591d65eCa`
- **Role**: Pays all gas fees and mint prices
- **Balance**: Maintained with 0G tokens

### **Database Update After Minting**
```javascript
Player.findOneAndUpdate(
  { walletAddress },
  { 
    nftPass: true,              // Unlock premium features
    nftTransactionHash: "0x...",
    nftTokenId: 0,
    nftMintedAt: new Date()
  }
)
```

---

## 💡 Cost Analysis

### **Per Mint Costs (Paid by Deployer)**

**Whitelisted User:**
- Mint Price: 0 0G
- Gas Fee: ~0.0001 0G
- **Total**: ~0.0001 0G per mint

**Non-Whitelisted User:**
- Mint Price: 5 0G
- Gas Fee: ~0.0001 0G
- **Total**: ~5.0001 0G per mint

### **Total Deployment Costs**
- Contract Deployment: ~0.01 0G
- Setting Merkle Root: ~0.0005 0G
- **Per 1,000 Whitelisted Mints**: ~0.1 0G
- **Per 1,000 Non-Whitelisted Mints**: ~5,000.1 0G

---

## 🚀 User Experience

### **Minting Steps (User Perspective)**

1. **Connect Wallet** - User connects Privy wallet
2. **Check Whitelist** - Automatic check (instant)
3. **Click Mint** - User clicks "MINT FREE (NO GAS!)" button
4. **Sign Message** - User signs message in wallet (NO GAS!)
5. **Wait** - Backend processes (~5-10 seconds)
6. **Success** - NFT appears in wallet + Premium features unlocked!

**User pays: 0 0G**
**User experience: Seamless, no blockchain knowledge required**

---

## 🔐 Security Features

1. **Signature Verification** - Proves user owns wallet
2. **One Mint Per Wallet** - Prevents duplicate mints
3. **Merkle Proof Validation** - Efficient whitelist verification
4. **Relayer Balance Check** - Ensures funds available
5. **Transaction Timeout** - 60 second limit
6. **ReentrancyGuard** - Prevents reentrancy attacks

---

## 📊 Monitoring

### **Check Relayer Balance**
```bash
curl https://zerodashbackend.onrender.com/nft/relayer/status
```

### **Check Total Minted**
View on explorer or call `/nft/relayer/status`

### **View Transaction**
```
https://explorer.0g.ai/tx/{transactionHash}
```

---

## ⚙️ Environment Variables

### **Required in Backend .env**
```env
RELAYER_PRIVATE_KEY=0xYourPrivateKey
```

---

## 📁 File Structure

```
Backend/
├── src/
│   ├── controllers/
│   │   └── nftController.js      # All NFT logic + gasless minting
│   ├── routes/
│   │   └── nftRoutes.js          # API endpoints
│   └── models/
│       └── Player.js             # Player database model
├── merkle-data/
│   ├── merkle-root.json          # Merkle root + metadata
│   └── merkle-proofs.json        # 28,237 whitelisted addresses
└── .env                          # RELAYER_PRIVATE_KEY

Frontend/
└── src/
    └── components/
        └── NFTMintModal.jsx      # Minting UI

Contracts/
├── contracts/
│   └── ZeroDashPass.sol          # NFT smart contract
├── scripts/
│   ├── generate-merkle-tree.js   # Generate whitelist
│   └── deploy-merkle.js          # Deploy contract
└── merkle-data/                  # Same as backend
```

---

## 🎯 Summary

**Zero Dash Pass implements the most user-friendly NFT minting experience:**

✅ Users pay **ZERO** - no gas, no mint price, nothing
✅ Deployer covers **ALL** costs via backend relayer
✅ Whitelisted users get **FREE** mints
✅ Non-whitelisted users also pay **ZERO** (deployer pays 5 0G)
✅ Instant premium feature unlock in database
✅ 28,237 whitelisted addresses via gas-efficient Merkle tree
✅ Seamless UX - just sign a message!

**Total user cost: 0 0G 🎉**

---

## 📞 Support

- **Explorer**: https://explorer.0g.ai
- **Backend**: https://zerodashbackend.onrender.com
- **Game**: https://zerodashgame.xyz

---

*Last Updated: December 24, 2025*
*Contract Address: 0xbfe7aAfEB3145962943412413d69582630C5830D*
*Network: 0G Blockchain Mainnet*