module.exports = (req, res, next) => {
    const auth = req.headers.authorization;
  
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing wallet bearer token" });
    }
  
    const wallet = auth.replace("Bearer ", "").trim();
  
    if (!wallet) {
      return res.status(401).json({ error: "Invalid wallet" });
    }
  
    req.walletAddress = wallet.toLowerCase();
    next();
  };
  