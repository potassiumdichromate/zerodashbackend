// controllers/nftController.js

/**
 * NFT Metadata Controller
 * Generates dynamic metadata for Zero Dash Pass NFTs
 * Includes Merkle Tree whitelist functionality
 */

const fs = require('fs');
const path = require('path');

// Your IPFS CIDs from Pinata
const IMAGE_CID = 'bafybeieqg5azdxn63o64aznbupzdxbigwyjdh3bbhb6u2x5yftrexiuhfy'; // Replace with actual CID

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
        message: 'Address not whitelisted. Mint price: 5 0G'
      });
    }
    
    // Whitelisted!
    return res.json({
      success: true,
      isWhitelisted: true,
      proof: proof,
      message: 'Address whitelisted! Mint for FREE'
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
      contractAddress: '0x09904F6f4013ce41dc2d7ac0fF09C26F3aD86e53',
      network: '0G Blockchain',
      chainId: 16661
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