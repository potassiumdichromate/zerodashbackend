// controllers/nftController.js

/**
 * NFT Metadata Controller
 * Generates dynamic metadata for Zero Dash Pass NFTs
 * Includes Merkle Tree whitelist functionality
 * Includes Gasless Minting via Backend Relayer
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Your IPFS CIDs from Pinata
const IMAGE_CID = 'bafybeieqg5azdxn63o64aznbupzdxbigwyjdh3bbhb6u2x5yftrexiuhfy';

// Load Merkle proofs for whitelist verification
let merkleProofs = {};

try {
  const proofsPath = path.join(__dirname, '../../merkle-data/merkle-proofs.json');
  merkleProofs = JSON.parse(fs.readFileSync(proofsPath, 'utf-8'));
  console.log('✅ Loaded Merkle proofs for', Object.keys(merkleProofs).length, 'addresses');
} catch (error) {
  console.warn('⚠️  Merkle proofs not found. Whitelisted minting will not work.');
  console.warn('   Please upload merkle-proofs.json to backend/merkle-data/');
}

// ============================================
// GASLESS MINTING CONFIGURATION
// ============================================

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = '0x0d2145097468D78266cbf6c89974E880e3Ae5bb0';
const RPC_URL = 'https://evmrpc.0g.ai';
const CHAIN_ID = 16661;

const NFT_ABI = [
  "function mint(bytes32[] calldata merkleProof) external payable",
  "function hasMinted(address account) external view returns (bool)",
  "function totalMinted() external view returns (uint256)",
  "function isWhitelisted(address account, bytes32[] calldata proof) external view returns (bool)"
];

let provider;
let relayerWallet;
let nftContract;

const initializeRelayer = () => {
  if (!RELAYER_PRIVATE_KEY) {
    console.error('❌ RELAYER_PRIVATE_KEY not set in environment variables!');
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    nftContract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, relayerWallet);
    
    console.log('✅ Relayer initialized');
    console.log('   Relayer address:', relayerWallet.address);
    console.log('   Contract:', CONTRACT_ADDRESS);
    
    return true;
  } catch (error) {
    console.error('❌ Relayer initialization failed:', error);
    return false;
  }
};

// Initialize on module load
initializeRelayer();

// ============================================
// EXISTING NFT METADATA FUNCTIONS
// ============================================

/**
 * Get NFT metadata for a specific token ID
 * @route GET /nft/metadata/:tokenId
 */
exports.getNFTMetadata = async (req, res) => {
  try {
    const { tokenId } = req.params;

    // Validate token ID
    if (!tokenId || isNaN(tokenId) || parseInt(tokenId) < 0) {
      return res.status(400).json({ 
        error: 'Invalid token ID',
        message: 'Token ID must be a positive number'
      });
    }

    // Generate metadata
    const metadata = {
      name: `Zero Dash Exclusive Pass #${tokenId}`,
      description: "Exclusive Zero Dash Exclusive Pass NFT - Unlock premium game features including special characters, exclusive levels, bonus rewards, and priority access to new content. Powered by 0G Blockchain.",
      
      // IPFS URIs
      image: `ipfs://${IMAGE_CID}`,
      
      // External link
      external_url: "https://zerodashgame.xyz",
      
      // NFT Attributes
      attributes: [
        {
          trait_type: "Type",
          value: "Premium Pass"
        },
        {
          trait_type: "Tier",
          value: "Exclusive"
        },
        {
          trait_type: "Network",
          value: "0G Blockchain"
        },
        {
          trait_type: "Benefits",
          value: "Full Access"
        },
        {
          trait_type: "Coin Multiplier",
          value: "2x"
        },
        {
          trait_type: "Special Levels",
          value: "Unlocked"
        },
        {
          trait_type: "Exclusive Characters",
          value: "Available"
        },
        {
          trait_type: "Priority Access",
          value: "Enabled"
        },
        {
          display_type: "number",
          trait_type: "Token ID",
          value: parseInt(tokenId)
        }
      ],
      
      // Background color (hex without #)
      background_color: "0A1628"
    };

    // Set cache headers (1 hour)
    res.set('Cache-Control', 'public, max-age=3600');
    
    // Return JSON
    res.status(200).json(metadata);

  } catch (error) {
    console.error('Error generating NFT metadata:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to generate NFT metadata'
    });
  }
};

/**
 * Get IPFS gateway URL for testing
 * @route GET /nft/gateway/:tokenId
 */
exports.getGatewayURL = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const urls = {
      tokenId: parseInt(tokenId),
      metadata: `https://zerodashbackend.onrender.com/nft/metadata/${tokenId}`,
      image: `https://gateway.pinata.cloud/ipfs/${IMAGE_CID}`,
      ipfs_image: `ipfs://${IMAGE_CID}`,
    };

    res.status(200).json(urls);

  } catch (error) {
    console.error('Error getting gateway URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Health check for NFT metadata service
 * @route GET /nft/health
 */
exports.healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'ok',
      service: 'NFT Metadata API',
      timestamp: new Date().toISOString(),
      ipfs: {
        image_cid: IMAGE_CID,
        image_configured: IMAGE_CID !== 'YOUR_IMAGE_CID_FROM_PINATA',
      },
      merkle: {
        proofs_loaded: Object.keys(merkleProofs).length > 0,
        total_whitelisted: Object.keys(merkleProofs).length,
        status: Object.keys(merkleProofs).length > 0 ? 'active' : 'not configured'
      },
      gasless: {
        relayer_initialized: !!relayerWallet,
        relayer_address: relayerWallet?.address || 'not initialized',
        contract: CONTRACT_ADDRESS
      }
    };

    res.status(200).json(health);

  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
};

// ============================================
// MERKLE TREE WHITELIST FUNCTIONS
// ============================================

/**
 * Get Merkle proof for an address
 * @route GET /nft/proof/:address
 */
exports.getMerkleProof = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Get proof for this address
    const proof = merkleProofs[normalizedAddress];
    
    if (!proof) {
      // Not whitelisted - return empty proof
      return res.json({
        success: true,
        isWhitelisted: false,
        proof: [],
        message: 'Address not whitelisted. Mint price: 5 0G (No gas fees!)'
      });
    }
    
    // Whitelisted!
    return res.json({
      success: true,
      isWhitelisted: true,
      proof: proof,
      message: 'Address whitelisted! Mint for FREE (No gas fees!)'
    });
    
  } catch (error) {
    console.error('Error getting Merkle proof:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get Merkle proof',
      error: error.message
    });
  }
};

/**
 * Check if address is whitelisted
 * @route GET /nft/whitelist/check/:address
 */
exports.checkWhitelist = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    const normalizedAddress = address.toLowerCase();
    const isWhitelisted = !!merkleProofs[normalizedAddress];
    
    return res.json({
      success: true,
      address: normalizedAddress,
      isWhitelisted: isWhitelisted,
      message: isWhitelisted ? 'Whitelisted - FREE mint!' : 'Not whitelisted - 5 0G to mint'
    });
    
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check whitelist',
      error: error.message
    });
  }
};

/**
 * Get whitelist statistics
 * @route GET /nft/whitelist/stats
 */
exports.getWhitelistStats = async (req, res) => {
  try {
    const stats = {
      success: true,
      totalWhitelisted: Object.keys(merkleProofs).length,
      merkleRootConfigured: Object.keys(merkleProofs).length > 0,
      contractAddress: CONTRACT_ADDRESS,
      network: '0G Blockchain',
      chainId: CHAIN_ID
    };
    
    return res.json(stats);
    
  } catch (error) {
    console.error('Error getting whitelist stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get whitelist stats',
      error: error.message
    });
  }
};

// ============================================
// GASLESS MINTING FUNCTIONS
// ============================================

/**
 * POST /nft/mint-gasless
 * Gasless NFT minting - deployer pays ALL gas fees
 * User only pays 5 0G if not whitelisted (no gas)
 */
exports.mintGasless = async (req, res) => {
  try {
    const { walletAddress, merkleProof, signature } = req.body;

    // Validate input
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address required' 
      });
    }

    if (!signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Signature required' 
      });
    }

    // Check if relayer is initialized
    if (!relayerWallet) {
      return res.status(500).json({ 
        success: false, 
        message: 'Relayer not initialized. Contact admin.' 
      });
    }

    console.log('\n🎫 Processing gasless mint request...');
    console.log('   User:', walletAddress);
    console.log('   Whitelisted:', merkleProof && merkleProof.length > 0);

    // 1. Verify user signature (proves they own the wallet)
    const message = `Mint Zero Dash Pass NFT to ${walletAddress}`;
    let recoveredAddress;
    
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature format' 
      });
    }
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Signature verification failed. Sign with correct wallet.' 
      });
    }

    console.log('   ✅ Signature verified');

    // 2. Check if already minted
    const hasMinted = await nftContract.hasMinted(walletAddress);
    if (hasMinted) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already minted your NFT Pass' 
      });
    }

    console.log('   ✅ Not minted yet');

    // 3. Check if whitelisted
    const isWhitelisted = merkleProof && merkleProof.length > 0;
    let mintPrice = 0;

    if (!isWhitelisted) {
      // Non-whitelisted users must pay 5 0G (but still no gas!)
      mintPrice = ethers.parseEther('5');
      console.log('   💎 Non-whitelisted: 5 0G mint price (user pays)');
    } else {
      console.log('   🎁 Whitelisted: FREE mint');
    }

    // 4. Check relayer balance
    const relayerBalance = await provider.getBalance(relayerWallet.address);
    const relayerBalanceEth = ethers.formatEther(relayerBalance);
    
    console.log('   👛 Relayer balance:', relayerBalanceEth, '0G');

    if (relayerBalance < ethers.parseEther('0.001')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Relayer out of funds. Contact admin.' 
      });
    }

    // 5. Estimate gas (for logging)
    let estimatedGas;
    try {
      estimatedGas = await nftContract.mint.estimateGas(
        merkleProof || [],
        { value: mintPrice }
      );
      console.log('   ⛽ Estimated gas:', estimatedGas.toString());
    } catch (error) {
      console.error('   ❌ Gas estimation failed:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction would fail: ' + error.message 
      });
    }

    // 6. Send transaction from relayer wallet (YOU PAY GAS!)
    console.log('   🚀 Sending transaction...');
    
    const tx = await nftContract.mint(merkleProof || [], {
      value: mintPrice, // 0 for whitelisted, 5 0G for non-whitelisted
      gasLimit: Math.floor(Number(estimatedGas) * 1.2) // 20% buffer
    });

    console.log('   ⏳ Transaction sent:', tx.hash);
    console.log('      Explorer:', `https://explorer.0g.ai/tx/${tx.hash}`);

    // 7. Wait for confirmation (with timeout)
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), 60000)
      )
    ]);

    console.log('   ✅ Transaction confirmed!');
    console.log('      Block:', receipt.blockNumber);
    console.log('      Gas used:', receipt.gasUsed.toString());

    // 8. Calculate actual gas cost
    const gasPrice = receipt.gasPrice || tx.gasPrice;
    const gasCost = receipt.gasUsed * gasPrice;
    const gasCostEth = ethers.formatEther(gasCost);
    
    console.log('   💰 Gas cost (paid by deployer):', gasCostEth, '0G');

    // 9. Extract token ID from logs
    let tokenId;
    try {
      // Find Transfer event: Transfer(address(0), to, tokenId)
      const transferLog = receipt.logs.find(log => 
        log.topics[0] === ethers.id('Transfer(address,address,uint256)')
      );
      if (transferLog) {
        tokenId = parseInt(transferLog.topics[3], 16);
      }
    } catch (error) {
      console.log('   ⚠️  Could not extract token ID');
    }

    // 10. Success response
    res.json({
      success: true,
      message: isWhitelisted 
        ? 'NFT minted successfully for FREE!' 
        : 'NFT minted successfully! 5 0G paid.',
      transactionHash: tx.hash,
      tokenId: tokenId,
      explorerUrl: `https://explorer.0g.ai/tx/${tx.hash}`,
      gasPaidByDeployer: gasCostEth + ' 0G',
      whitelisted: isWhitelisted,
      mintPrice: isWhitelisted ? '0 0G' : '5 0G'
    });

  } catch (error) {
    console.error('❌ Gasless mint error:', error);
    
    let errorMessage = 'Minting failed. Please try again.';
    
    if (error.code === 'CALL_EXCEPTION') {
      errorMessage = 'Contract call failed. You may have already minted.';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Relayer out of funds. Contact admin.';
    } else if (error.message?.includes('Already minted')) {
      errorMessage = 'You already minted your NFT Pass.';
    } else if (error.message?.includes('Max supply')) {
      errorMessage = 'All NFTs have been minted!';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * GET /nft/relayer/status
 * Check relayer wallet status
 */
exports.getRelayerStatus = async (req, res) => {
  try {
    if (!relayerWallet) {
      return res.json({
        success: false,
        message: 'Relayer not initialized'
      });
    }

    const balance = await provider.getBalance(relayerWallet.address);
    const balanceEth = ethers.formatEther(balance);
    
    const totalMinted = await nftContract.totalMinted();

    res.json({
      success: true,
      relayerAddress: relayerWallet.address,
      balance: balanceEth + ' 0G',
      totalMinted: totalMinted.toString(),
      contractAddress: CONTRACT_ADDRESS,
      network: '0G Blockchain',
      chainId: CHAIN_ID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};