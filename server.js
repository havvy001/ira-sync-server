const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbDir = path.join(__dirname, 'data');
const fs = require('fs');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
const dbPath = path.join(dbDir, 'inspections.db');
const db = new sqlite3.Database(dbPath);

db.run(`
  CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    policyNumber TEXT,
    insurerName TEXT,
    assetType TEXT,
    county TEXT,
    latitude REAL,
    longitude REAL,
    hazard TEXT,
    activeAlert TEXT,
    inspectorName TEXT,
    inspectorUsername TEXT,
    timestamp TEXT,
    hasPhoto INTEGER,
    createdAt TEXT
  )
`);

// Routes
app.get('/inspections', (req, res) => {
  db.all('SELECT * FROM inspections ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/inspections', (req, res) => {
  const inspection = req.body;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO inspections 
    (id, policyNumber, insurerName, assetType, county, latitude, longitude, hazard, activeAlert, inspectorName, inspectorUsername, timestamp, hasPhoto, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    inspection.id,
    inspection.policyNumber,
    inspection.insurerName,
    inspection.assetType,
    inspection.county,
    inspection.latitude,
    inspection.longitude,
    inspection.hazard,
    inspection.activeAlert,
    inspection.inspectorName,
    inspection.inspectorUsername || '',
    inspection.timestamp,
    inspection.hasPhoto ? 1 : 0,
    inspection.createdAt || new Date().toISOString()
  );
  stmt.finalize();
  res.status(201).json({ success: true, id: inspection.id });
});

app.delete('/inspections/:id', (req, res) => {
  db.run('DELETE FROM inspections WHERE id = ?', req.params.id);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sync server running on http://localhost:${PORT}`);
  console.log(`To allow devices on same network, use your local IP: http://<YOUR_IP>:${PORT}`);
});
