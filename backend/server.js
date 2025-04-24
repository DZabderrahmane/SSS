// server.js
require('dotenv').config();          // ← Load .env variables
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Connect to MongoDB using ENV var
mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Define schema and model
const ScenarioSchema = new mongoose.Schema({
  name: String,
  attachment: {
    data: Buffer,
    contentType: String,
    fileName: String
  }
});
const Scenario = mongoose.model("Scenario", ScenarioSchema);

// ✅ Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
require("fs").existsSync(uploadsDir) || require("fs").mkdirSync(uploadsDir, { recursive: true });

// ✅ Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ✅ Save scenario to MongoDB
app.post("/api/save-scenario", upload.single("attachment"), async (req, res) => {
  const { name } = req.body;
  const file = req.file;
  if (!name || !file) return res.status(400).send("Missing scenario name or file attachment");

  try {
    const fileData = await fs.readFile(file.path);
    await Scenario.create({
      name,
      attachment: {
        data: fileData,
        contentType: file.mimetype,
        fileName: file.originalname
      }
    });
    console.log("✅ Scenario saved:", name);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error saving scenario:", err);
    res.status(500).send("Error saving scenario");
  }
});

// ✅ Get all saved scenarios (name + _id)
app.get("/api/scenarios", async (req, res) => {
  try {
    const scenarios = await Scenario.find({}, { name: 1 }).sort({ _id: -1 });
    res.json(scenarios);
  } catch (err) {
    console.error("❌ Error getting scenario list:", err);
    res.status(500).send("Error getting scenarios");
  }
});

// ✅ Load specific scenario by _id
app.get("/api/load-scenario/:id", async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) return res.status(404).send("Scenario not found");
    res.json(scenario);
  } catch (err) {
    console.error("❌ Error loading scenario:", err);
    res.status(500).send("Error loading scenario");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
