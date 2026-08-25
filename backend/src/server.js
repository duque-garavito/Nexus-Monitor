const express = require("express");
const cors = require("cors");
require("dotenv").config();

const hostRoutes = require("./routes/hostRoutes");
const problemRoutes = require("./routes/problemRoutes");
const authRoutes = require("./routes/authRoutes");
const templateRoutes = require("./routes/templateRoutes");
const { iniciarScheduler } = require("./services/monitoring/scheduler");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NEXUS Monitor API funcionando 🚀"
  });
});

// Host routes (support both aliases)
app.use("/api/hosts", hostRoutes);
app.use("/api/devices", hostRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 NEXUS Monitor ejecutándose en http://localhost:${PORT}`);
  // Start the background monitoring Scheduler Engine
  await iniciarScheduler();
});
