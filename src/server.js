require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/player", require("./routes/player.routes"));

app.get("/", (_, res) => res.send("🔥 Game Backend Running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
