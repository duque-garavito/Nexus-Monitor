const express = require("express");
const cors = require("cors");
require("dotenv").config();

const hostRoutes = require("./routes/hostRoutes");
const problemRoutes = require("./routes/problemRoutes");
const { ejecutarMonitoreo } = require("./services/monitoring/monitoringEngine");

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 NEXUS Monitor ejecutándose en http://localhost:${PORT}`);
});

// ========================================
// MONITORING ENGINE
// ========================================
setInterval(() => {
  ejecutarMonitoreo();
}, 10000);
