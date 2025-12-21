// routes/nftRoutes.js

const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nftController');

/**
 * NFT Metadata Routes
 * Base path: /nft
 */

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

module.exports = router;