// routes/nftRoutes.js

const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nftController');

/**
 * NFT Metadata Routes
 * Base path: /nft
 */

// ============================================
// METADATA ROUTES (Existing)
// ============================================

/**
 * @route   GET /nft/metadata/:tokenId
 * @desc    Get NFT metadata for a specific token ID
 * @access  Public
 * @example /nft/metadata/0
 * @example /nft/metadata/123
 */
router.get('/metadata/:tokenId', nftController.getNFTMetadata);

/**
 * @route   GET /nft/gateway/:tokenId
 * @desc    Get IPFS gateway URLs for testing
 * @access  Public
 * @example /nft/gateway/0
 */
router.get('/gateway/:tokenId', nftController.getGatewayURL);

/**
 * @route   GET /nft/health
 * @desc    Health check for NFT metadata service
 * @access  Public
 */
router.get('/health', nftController.healthCheck);

// ============================================
// MERKLE TREE WHITELIST ROUTES (New)
// ============================================

/**
 * @route   GET /nft/proof/:address
 * @desc    Get Merkle proof for an address (for whitelisted minting)
 * @access  Public
 * @example /nft/proof/0x63F63DC442299cCFe470657a769fdC6591d65eCa
 * @returns {Object} { success, isWhitelisted, proof[], message }
 */
router.get('/proof/:address', nftController.getMerkleProof);

/**
 * @route   GET /nft/whitelist/check/:address
 * @desc    Check if an address is whitelisted
 * @access  Public
 * @example /nft/whitelist/check/0x63F63DC442299cCFe470657a769fdC6591d65eCa
 * @returns {Object} { success, address, isWhitelisted, message }
 */
router.get('/whitelist/check/:address', nftController.checkWhitelist);

/**
 * @route   GET /nft/whitelist/stats
 * @desc    Get whitelist statistics
 * @access  Public
 * @returns {Object} { success, totalWhitelisted, contractAddress, network, chainId }
 */
router.get('/whitelist/stats', nftController.getWhitelistStats);

// ============================================
// GASLESS MINTING ROUTES (NEW)
// ============================================

/**
 * @route   POST /nft/mint-gasless
 * @desc    Mint NFT without gas fees - deployer pays all gas
 * @access  Public
 * @body    { walletAddress, merkleProof[], signature }
 * @example POST /nft/mint-gasless
 *          Body: {
 *            "walletAddress": "0x123...",
 *            "merkleProof": ["0xabc...", "0xdef..."],
 *            "signature": "0x456..."
 *          }
 */
router.post('/mint-gasless', nftController.mintGasless);

/**
 * @route   GET /nft/relayer/status
 * @desc    Get relayer wallet status and balance
 * @access  Public
 * @example GET /nft/relayer/status
 */
router.get('/relayer/status', nftController.getRelayerStatus);

module.exports = router;