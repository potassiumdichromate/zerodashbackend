// ============================================
// BACKEND RELAYER - GASLESS NFT MINTING
// Add to your backend: backend/src/controllers/nftController.js
// ============================================

const { ethers } = require('ethers');

// Configuration
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY; // Your deployer wallet private key
const CONTRACT_ADDRESS = '0x09904F6f4013ce41dc2d7ac0fF09C26F3aD86e53';
const RPC_URL = 'https://evmrpc.0g.ai';
const CHAIN_ID = 16661;

// Contract ABI
const NFT_ABI = [
  "function mint(bytes32[] calldata merkleProof) external payable",
  "function hasMinted(address account) external view returns (bool)",
  "function totalMinted() external view returns (uint256)",
  "function isWhitelisted(address account, bytes32[] calldata proof) external view returns (bool)"
];

// Initialize provider and relayer wallet
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

    // 10. Update database
    try {
      await Player.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { 
          nftPass: true, 
          nftTransactionHash: tx.hash,
          nftTokenId: tokenId,
          nftMintedAt: new Date()
        },
        { upsert: true }
      );
      console.log('   ✅ Database updated');
    } catch (error) {
      console.warn('   ⚠️  Database update failed:', error.message);
    }

    // 11. Success response
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

module.exports = {
  mintGasless: exports.mintGasless,
  getRelayerStatus: exports.getRelayerStatus
};