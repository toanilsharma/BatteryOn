import express from "express";
import multer from "multer";
import Database from "better-sqlite3";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Database setup with support for persistent Docker volumes
const dbPath = process.env.DB_PATH || "industrial_battery.db";
// Ensure directory exists if using a custom path
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);
console.log(`Database initialized at: ${dbPath}`);

const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- SERVE STATIC FRONTEND (Production) ---
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// --- DATABASE INITIALIZATION (Commercial Grade) ---
db.exec(`
  -- Users & Auth
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT CHECK(role IN ('ADMIN','ENGINEER','TECHNICIAN','VIEWER')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Context Hierarchy
  CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    region TEXT
  );

  -- Assets (Expanded)
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id),
    name TEXT,
    chemistry TEXT,
    nominal_ah REAL,
    nominal_voltage REAL,
    install_date DATETIME,
    status TEXT DEFAULT 'ACTIVE'
  );
  
  -- Analysis Readings (Expanded)
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT REFERENCES assets(id),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    health_score INTEGER,
    grade TEXT,
    mean_voltage REAL,
    delta_v REAL,
    impedance_avg REAL,
    temp_avg REAL,
    json_data TEXT,
    uploaded_by TEXT
  );

  -- Alerts & Alarms
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT REFERENCES assets(id),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    severity TEXT CHECK(severity IN ('INFO','WARNING','CRITICAL')),
    message TEXT,
    status TEXT DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, RESOLVED
    acknowledged_by TEXT,
    acknowledged_at DATETIME
  );

  -- Audit Log (Compliance)
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    action TEXT,
    resource TEXT,
    details TEXT,
    ip_address TEXT
  );
`);

console.log('Database schema synchronized.');

// --- API ENDPOINTS ---

// GET /api/history
app.get("/api/history", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
            SELECT r.id, r.timestamp, r.asset_id, r.health_score, r.grade, a.chemistry 
            FROM readings r 
            JOIN assets a ON r.asset_id = a.id 
            ORDER BY r.timestamp DESC
            LIMIT 100
        `,
      )
      .all();
    res.json(rows);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// GET /api/report/:id
app.get("/api/report/:id", (req, res) => {
  try {
    const row = db
      .prepare("SELECT json_data FROM readings WHERE id = ?")
      .get(req.params.id);
    if (row) {
      res.json(JSON.parse(row.json_data));
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "DB Error" });
  }
});

// POST /api/analyze (Save results)
app.post("/api/analyze", (req, res) => {
  try {
    const { meta, analysisResult } = req.body;

    if (!meta || !analysisResult) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 1. Upsert Asset
    const insertAsset = db.prepare(`
            INSERT OR REPLACE INTO assets (id, site, chemistry, nominal_ah)
            VALUES (?, ?, ?, ?)
        `);
    insertAsset.run(
      meta.assetId,
      meta.siteId || "UNKNOWN",
      meta.chemistryId,
      meta.nominalCapacityAh,
    );

    // 2. Insert Reading
    const insertReading = db.prepare(`
            INSERT INTO readings (asset_id, health_score, grade, mean_voltage, delta_v, json_data)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

    const info = insertReading.run(
      meta.assetId,
      analysisResult.healthScore,
      analysisResult.grade,
      analysisResult.stats.meanVoltage,
      analysisResult.stats.deltaV,
      JSON.stringify(analysisResult),
    );

    res.json({ success: true, readingId: info.lastInsertRowid });
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// POST /api/upload/voltage
app.post("/api/upload/voltage", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  fs.unlinkSync(req.file.path);
  res.json({ message: "File uploaded" });
});

// Fallback for SPA routing
if (fs.existsSync(distPath)) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Industrial Battery Server running on port ${PORT}`);
});
