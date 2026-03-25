import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json({ limit: '50mb' }));

let pool;

// ─────────────────────────────────────────────
//  DATABASE BOOTSTRAP
// ─────────────────────────────────────────────

async function initDatabase() {
  const host     = process.env.DB_HOST     || "127.0.0.1";
  const user     = process.env.DB_USER     || "root";
  const password = process.env.DB_PASS     || "";
  const database = process.env.DB_NAME     || "wifi_surveillance";

  // Create DB if not existing
  const admin = await mysql.createConnection({ host, user, password });
  await admin.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await admin.end();

  pool = mysql.createPool({
    host, user, password, database,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

async function bootstrapDatabase() {
  // ── Main clients table ──────────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS wifi_clients (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      ip_address    VARCHAR(45)  NOT NULL,
      mac_address   VARCHAR(17)  NOT NULL DEFAULT '',
      name          VARCHAR(100) NOT NULL,
      roll_no       VARCHAR(10)  NOT NULL,
      branch        VARCHAR(20)  NOT NULL DEFAULT 'Unknown',
      year          SMALLINT     NOT NULL DEFAULT 0,
      room_no       VARCHAR(10)  NOT NULL,
      hostel        ENUM('JH','CH','BH') NOT NULL,
      device_name   VARCHAR(120) NOT NULL,
      device_type   ENUM('Phone','Laptop','Tablet','Other') NOT NULL DEFAULT 'Other',
      os_hint       VARCHAR(50)  NOT NULL DEFAULT '',
      bandwidth_mb  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      image_data    LONGBLOB DEFAULT NULL,
      image_mime_type VARCHAR(60) NOT NULL DEFAULT 'image/jpeg',
      first_seen    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_flagged    TINYINT(1)   NOT NULL DEFAULT 0,
      INDEX idx_ip      (ip_address),
      INDEX idx_mac     (mac_address),
      INDEX idx_roll    (roll_no),
      INDEX idx_hostel  (hostel),
      INDEX idx_room    (room_no),
      INDEX idx_name    (name),
      INDEX idx_device  (device_name),
      INDEX idx_flagged (is_flagged),
      INDEX idx_branch  (branch),
      INDEX idx_year    (year),
      UNIQUE KEY uniq_roll (roll_no),
      UNIQUE KEY uniq_ip   (ip_address),
      UNIQUE KEY uniq_mac  (mac_address)
    )
  `);

  // Ensure image_data column exists (for migration from older schema)
  try {
    await pool.execute(`ALTER TABLE wifi_clients ADD COLUMN image_data LONGBLOB DEFAULT NULL`);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  try {
    await pool.execute(`ALTER TABLE wifi_clients ADD COLUMN image_mime_type VARCHAR(60) NOT NULL DEFAULT 'image/jpeg'`);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  // ── Sessions table: one row per connection event ────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      client_id    INT NOT NULL,
      ip_address   VARCHAR(45) NOT NULL,
      connected_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      duration_min INT         NOT NULL DEFAULT 0,
      bytes_up     BIGINT      NOT NULL DEFAULT 0,
      bytes_down   BIGINT      NOT NULL DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES wifi_clients(id) ON DELETE CASCADE,
      INDEX idx_client    (client_id),
      INDEX idx_connected (connected_at)
    )
  `);

  // ── Alerts table: flagged suspicious activity ───────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS alerts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      client_id   INT         NOT NULL,
      alert_type  ENUM('HIGH_BANDWIDTH','MULTIPLE_DEVICES','UNKNOWN_MAC','AFTER_HOURS','SPOOFED_IP') NOT NULL,
      description TEXT,
      severity    ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'LOW',
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved    TINYINT(1) NOT NULL DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES wifi_clients(id) ON DELETE CASCADE,
      INDEX idx_alert_client   (client_id),
      INDEX idx_alert_type     (alert_type),
      INDEX idx_alert_severity (severity)
    )
  `);

  // ── Seed core records ───────────────────────────────────────────────────────
  const seeds = [
    { ip:"10.0.0.11", mac:"A4:C3:F0:11:22:33", name:"Aarav Mehta",   roll:"24101", branch:"CSE",      year:2024, room:"101", hostel:"JH", device:"iPhone 14",       dtype:"Phone",   os:"iOS",     bw:1200.50 },
    { ip:"10.0.0.12", mac:"B8:27:EB:44:55:66", name:"Riya Patel",    roll:"23252", branch:"IT",       year:2023, room:"202", hostel:"CH", device:"MacBook Air M2",   dtype:"Laptop",  os:"macOS",   bw:4800.00 },
    { ip:"10.0.0.13", mac:"DC:A6:32:77:88:99", name:"Kabir Singh",   roll:"25334", branch:"ECE",      year:2025, room:"305", hostel:"BH", device:"Dell XPS 15",      dtype:"Laptop",  os:"Windows", bw:3100.75 },
    { ip:"10.0.0.14", mac:"E4:5F:01:AA:BB:CC", name:"Ishan Verma",   roll:"24123", branch:"CSE",      year:2024, room:"125", hostel:"JH", device:"iPad Pro 12.9",    dtype:"Tablet",  os:"iPadOS",  bw:980.20  },
    { ip:"10.0.0.15", mac:"F8:1A:67:DD:EE:FF", name:"Maya Rao",      roll:"22445", branch:"CyberSec", year:2022, room:"018", hostel:"CH", device:"ThinkPad T14s",    dtype:"Laptop",  os:"Linux",   bw:7200.00 },
    { ip:"10.0.0.16", mac:"3C:22:FB:10:20:30", name:"Dev Khanna",    roll:"23332", branch:"ECE",      year:2023, room:"219", hostel:"BH", device:"OnePlus 11",       dtype:"Phone",   os:"Android", bw:650.90  },
    { ip:"10.0.0.17", mac:"AC:87:A3:40:50:60", name:"Sara Thomas",   roll:"25112", branch:"CSE",      year:2025, room:"320", hostel:"JH", device:"Surface Laptop 5", dtype:"Laptop",  os:"Windows", bw:2900.00 },
    { ip:"10.0.0.18", mac:"60:F1:89:70:80:90", name:"Arjun Nair",    roll:"24255", branch:"IT",       year:2024, room:"112", hostel:"CH", device:"Galaxy S23 Ultra",  dtype:"Phone",   os:"Android", bw:1450.30 },
    { ip:"10.0.0.19", mac:"00:1A:2B:3C:4D:5E", name:"Neha Gupta",    roll:"23125", branch:"CSE",      year:2023, room:"223", hostel:"BH", device:"iPhone 13 Pro",    dtype:"Phone",   os:"iOS",     bw:880.60  },
    { ip:"10.0.0.20", mac:"11:22:33:44:55:66", name:"Vikram Das",    roll:"22131", branch:"CSE",      year:2022, room:"101", hostel:"CH", device:"iPad Air 5",       dtype:"Tablet",  os:"iPadOS",  bw:540.00  },
    { ip:"10.0.1.01", mac:"22:33:44:55:66:77", name:"Priya Sharma",  roll:"24532", branch:"DS",       year:2024, room:"115", hostel:"JH", device:"Pixel 7 Pro",      dtype:"Phone",   os:"Android", bw:2100.40 },
    { ip:"10.0.1.02", mac:"33:44:55:66:77:88", name:"Rohan Iyer",    roll:"23432", branch:"DS",       year:2023, room:"309", hostel:"BH", device:"Asus ROG Zephyrus",dtype:"Laptop",  os:"Windows", bw:9800.00 },
    { ip:"10.0.1.03", mac:"44:55:66:77:88:99", name:"Ananya Bose",   roll:"25231", branch:"IT",       year:2025, room:"215", hostel:"CH", device:"Redmi Note 12 Pro",dtype:"Phone",   os:"Android", bw:390.75  },
    { ip:"10.0.1.04", mac:"55:66:77:88:99:AA", name:"Karan Joshi",   roll:"22332", branch:"ECE",      year:2022, room:"022", hostel:"JH", device:"MacBook Pro 14",   dtype:"Laptop",  os:"macOS",   bw:5600.00 },
    { ip:"10.0.1.05", mac:"66:77:88:99:AA:BB", name:"Divya Malik",   roll:"24431", branch:"CyberSec", year:2024, room:"118", hostel:"CH", device:"Realme GT 3",      dtype:"Phone",   os:"Android", bw:720.10  },
  ];

  for (const r of seeds) {
    const [exists] = await pool.execute(
      `SELECT id FROM wifi_clients WHERE roll_no = ? AND device_name = ? LIMIT 1`,
      [r.roll, r.device]
    );
    if (exists.length === 0) {
      const [res] = await pool.execute(
        `INSERT INTO wifi_clients
           (ip_address,mac_address,name,roll_no,branch,year,room_no,hostel,device_name,device_type,os_hint,bandwidth_mb)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [r.ip, r.mac, r.name, r.roll, r.branch, r.year, r.room, r.hostel, r.device, r.dtype, r.os, r.bw]
      );
      // Add some sessions for each seeded client
      const cid = res.insertId;
      for (let s = 0; s < 3; s++) {
        await pool.execute(
          `INSERT INTO sessions (client_id, ip_address, connected_at, duration_min, bytes_up, bytes_down)
           VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR), ?, ?, ?)`,
          [cid, r.ip, s * 8 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 240) + 10,
           Math.floor(Math.random() * 50000000), Math.floor(Math.random() * 200000000)]
        );
      }
    }
  }

  // Seed alerts for high-bandwidth and suspicious users
  await pool.execute(`
    INSERT INTO alerts (client_id, alert_type, description, severity)
    SELECT c.id, 'HIGH_BANDWIDTH',
      CONCAT('Client used ', ROUND(c.bandwidth_mb,0), ' MB — exceeds 5GB threshold'),
      'HIGH'
    FROM wifi_clients c
    WHERE c.bandwidth_mb > 5000
      AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.client_id = c.id AND a.alert_type = 'HIGH_BANDWIDTH')
  `);

  await pool.execute(`
    INSERT INTO alerts (client_id, alert_type, description, severity)
    SELECT c.id, 'AFTER_HOURS',
      'Device active between 02:00–05:00 — possible policy violation',
      'MEDIUM'
    FROM wifi_clients c
    WHERE c.id % 7 = 0
      AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.client_id = c.id AND a.alert_type = 'AFTER_HOURS')
    LIMIT 5
  `);

  // Bulk generated records
  await bulkSeed();
  await diversifyHeavyBandwidth();
  await ensureRouters();
  await assignRandomDefaultImages();
}

// ─────────────────────────────────────────────
//  BULK SEED GENERATOR
// ─────────────────────────────────────────────

// Default avatar images (simple JPEG placeholders - different colors)
const DEFAULT_AVATAR_IMAGES = [
  // Blue avatar
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  // Green avatar
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  // Purple avatar
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  // Orange avatar
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  // Pink avatar
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
];

const BRANCHES  = ["CSE","IT","ECE","CyberSec","DS"];
const HOSTELS   = ["JH","CH","BH"];
const YEARS     = [2022, 2023, 2024, 2025];
const DTYPES    = ["Phone","Laptop","Tablet","Other"];
const FIRST     = ["Aarav","Riya","Kabir","Ishan","Maya","Dev","Sara","Arjun","Neha","Vikram",
                   "Priya","Rohan","Ananya","Karan","Divya","Sana","Yash","Pooja","Amit","Sneha",
                   "Raj","Meera","Tarun","Alisha","Neel","Komal","Harsh","Shruti","Varun","Tara"];
const LAST      = ["Mehta","Patel","Singh","Verma","Rao","Khanna","Thomas","Nair","Gupta","Das",
                   "Shah","Iyer","Bose","Joshi","Malik","Sharma","Dubey","Reddy","Pillai","Kumar"];
const DEVICES   = ["iPhone 15","Galaxy S24","OnePlus 12","Pixel 8","Redmi Note 13",
                   "MacBook Air M3","Dell XPS 15","ThinkPad X1","Asus VivoBook","HP Spectre",
                   "iPad Pro","Surface Pro 9","Realme 11 Pro","Moto Edge 40","Vivo V29"];
const OS_MAP    = { "Phone":["iOS","Android"], "Laptop":["Windows","macOS","Linux"], "Tablet":["iPadOS","Android"], "Other":["Unknown"] };
const ROUTER_SEEDS = [
  { name:"JH-Core-01", hostel:"JH", location:"North Wing Rooftop", ip:"10.10.10.1", status:"ONLINE",      bandwidth: 820.5, hoursAgo:1 },
  { name:"JH-Core-02", hostel:"JH", location:"Library Annex",       ip:"10.10.10.2", status:"ONLINE",      bandwidth: 640.2, hoursAgo:3 },
  { name:"JH-Aux-01",  hostel:"JH", location:"Ground Floor Hub",    ip:"10.10.10.3", status:"MAINTENANCE", bandwidth: 120.0, hoursAgo:5 },
  { name:"CH-Core-01", hostel:"CH", location:"South Wing Rooftop",  ip:"10.20.20.1", status:"ONLINE",      bandwidth: 910.7, hoursAgo:2 },
  { name:"CH-Core-02", hostel:"CH", location:"Mess Hall",           ip:"10.20.20.2", status:"ONLINE",      bandwidth: 705.6, hoursAgo:4 },
  { name:"CH-Aux-01",  hostel:"CH", location:"Workshop Block",      ip:"10.20.20.3", status:"ONLINE",      bandwidth: 310.4, hoursAgo:6 },
  { name:"BH-Core-01", hostel:"BH", location:"Central Tower",       ip:"10.30.30.1", status:"ONLINE",      bandwidth: 780.9, hoursAgo:1 },
  { name:"BH-Core-02", hostel:"BH", location:"Lab Corridor",        ip:"10.30.30.2", status:"ONLINE",      bandwidth: 655.2, hoursAgo:2 },
  { name:"BH-Aux-01",  hostel:"BH", location:"Auditorium",         ip:"10.30.30.3", status:"OFFLINE",     bandwidth: 95.0,  hoursAgo:8 }
];

const TARGET_TOTAL_USERS = 930;
const BASE_BRANCH_YEAR_PLAN = {
  CSE: { 2022:70, 2023:70, 2024:70, 2025:70 },
  IT:  { 2022:70, 2023:70, 2024:70, 2025:70 },
  ECE: { 2022:70, 2023:70, 2024:70, 2025:70 },
  CyberSec: { 2024:30, 2025:30 },
  DS: { 2024:30, 2025:30 },
};
const PLAN_TOPUP_BRANCHES = ["CSE","IT","ECE"];

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fakeMAC(i) {
  const h = (n) => n.toString(16).padStart(2,"0").toUpperCase();
  return `${h((i>>16)&0xFF)}:${h((i>>8)&0xFF)}:${h(i&0xFF)}:${h((i*7)&0xFF)}:${h((i*13)&0xFF)}:${h((i*19)&0xFF)}`;
}

async function bulkSeed() {
  const plan = buildPopulationPlan();
  const branchYearCounts = await fetchBranchYearCounts();
  const hostelCounts = await fetchHostelCounts();
  let inserted = 0;

  for (const [branch, years] of Object.entries(plan)) {
    for (const [yearStr, targetCount] of Object.entries(years)) {
      const year = Number(yearStr);
      const key = `${branch}-${year}`;
      const existing = branchYearCounts[key] || 0;
      const needed = targetCount - existing;
      if (needed > 0) {
        const added = await insertPlannedStudents(branch, year, needed, branchYearCounts, hostelCounts);
        inserted += added;
      }
    }
  }

  if (inserted) {
    console.log(`Population aligned with plan (+${inserted}).`);
  } else {
    console.log("Population already meets plan targets.");
  }
}

async function insertPlannedStudents(branch, year, count, branchYearCounts, hostelCounts) {
  if (count <= 0) return 0;
  const values = [];
  const params = [];

  for (let i = 0; i < count; i++) {
    const hostel = chooseHostel(hostelCounts);
    const roll   = nextRoll(branch, year, branchYearCounts);
    const occupancy = hostelCounts[hostel] || 0;
    const client = buildSyntheticClient({ roll, branch, year, hostel, occupancy });

    values.push("(?,?,?,?,?,?,?,?,?,?,?,?)");
    params.push(
      client.ip_address,
      client.mac_address,
      client.name,
      roll,
      branch,
      year,
      client.room_no,
      hostel,
      client.device_name,
      client.device_type,
      client.os_hint,
      client.bandwidth_mb
    );

    hostelCounts[hostel] = (hostelCounts[hostel] || 0) + 1;
  }

  await pool.execute(
    `INSERT INTO wifi_clients
       (ip_address,mac_address,name,roll_no,branch,year,room_no,hostel,device_name,device_type,os_hint,bandwidth_mb)
     VALUES ${values.join(",")}`,
    params
  );
  return count;
}

async function fetchBranchYearCounts() {
  const counts = {};
  const [rows] = await pool.execute(`SELECT branch, year, COUNT(*) AS count FROM wifi_clients GROUP BY branch, year`);
  for (const row of rows) {
    counts[`${row.branch}-${row.year}`] = Number(row.count);
  }
  return counts;
}

async function fetchHostelCounts() {
  const counts = { JH:0, CH:0, BH:0 };
  const [rows] = await pool.execute(`SELECT hostel, COUNT(*) AS count FROM wifi_clients GROUP BY hostel`);
  for (const row of rows) {
    if (counts[row.hostel] !== undefined) counts[row.hostel] = Number(row.count);
  }
  return counts;
}

function chooseHostel(hostelCounts) {
  const targetPerHostel = TARGET_TOTAL_USERS / HOSTELS.length;
  let best = [];
  let bestRatio = Infinity;
  for (const hostel of HOSTELS) {
    const ratio = (hostelCounts[hostel] || 0) / targetPerHostel;
    if (ratio + 0.01 < bestRatio) {
      best = [hostel];
      bestRatio = ratio;
    } else if (Math.abs(ratio - bestRatio) <= 0.01) {
      best.push(hostel);
    }
  }
  return pick(best.length ? best : HOSTELS);
}

function nextRoll(branch, year, branchYearCounts) {
  const key = `${branch}-${year}`;
  const next = (branchYearCounts[key] || 0) + 1;
  branchYearCounts[key] = next;
  const branchCode = Math.max(1, BRANCHES.indexOf(branch) + 1);
  const serial = String(next).padStart(2, "0");
  return `${String(year).slice(2)}${branchCode}${serial}`;
}

function buildSyntheticClient({ roll, branch, year, hostel, occupancy }) {
  const dtype = pick(DTYPES);
  const device_name = `${pick(DEVICES)}-${randInt(10, 99)}`;
  const osOptions = OS_MAP[dtype] || ["Unknown"];
  const os_hint = pick(osOptions);
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const ip_address = stableIpForHostel(hostel, occupancy);
  const mac_address = macFromRoll(roll, occupancy);
  const room_no = generateRoomNumber(occupancy);
  const bandwidth_mb = generateBandwidth();
  return { name, ip_address, mac_address, device_name, device_type:dtype, os_hint, room_no, bandwidth_mb };
}

function stableIpForHostel(hostel, occupancy = 0) {
  const hostIndex = Math.max(0, HOSTELS.indexOf(hostel));
  const thirdOctet = 50 + hostIndex * 10 + Math.floor(occupancy / 200);
  const fourthOctet = (occupancy % 200) + 10;
  return `10.${hostIndex + 1}.${thirdOctet}.${fourthOctet}`;
}

function macFromRoll(roll, occupancy = 0) {
  const base = parseInt(String(roll), 10) || randInt(10000, 99999);
  return fakeMAC(base + occupancy * 7);
}

function generateRoomNumber(currentCount = 0) {
  const floor = Math.floor((currentCount % 300) / 25);
  const roomIndex = (currentCount % 25) + 1;
  if (floor === 0) return String(roomIndex).padStart(3, "0");
  return `${floor}${String(roomIndex).padStart(2, "0")}`;
}

function generateBandwidth() {
  const heavy = Math.random() < 0.18;
  const base = heavy ? (8000 + Math.random() * 8000) : (250 + Math.random() * 6500);
  return parseFloat(base.toFixed(2));
}

function buildPopulationPlan() {
  const plan = {};
  let total = 0;
  for (const [branch, years] of Object.entries(BASE_BRANCH_YEAR_PLAN)) {
    plan[branch] = plan[branch] || {};
    for (const [yearStr, count] of Object.entries(years)) {
      const year = Number(yearStr);
      plan[branch][year] = count;
      total += count;
    }
  }

  if (total < TARGET_TOTAL_USERS) {
    const combos = [];
    for (const branch of PLAN_TOPUP_BRANCHES) {
      const years = Object.keys(plan[branch] || {}).map(Number).sort((a,b) => a - b);
      years.forEach(year => combos.push({ branch, year }));
    }
    let idx = 0;
    while (total < TARGET_TOTAL_USERS && combos.length) {
      const combo = combos[idx % combos.length];
      plan[combo.branch][combo.year] = (plan[combo.branch][combo.year] || 0) + 1;
      total++;
      idx++;
    }
  }

  return plan;
}

async function diversifyHeavyBandwidth() {
  await pool.execute(`
    UPDATE wifi_clients
    SET bandwidth_mb = ROUND(7000 + (RAND() * 9000), 2)
    WHERE bandwidth_mb BETWEEN 9950 AND 10050
  `);
}

async function ensureRouters() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS routers (
      id                       INT AUTO_INCREMENT PRIMARY KEY,
      name                     VARCHAR(60) NOT NULL,
      hostel                   ENUM('JH','CH','BH') NOT NULL,
      location                 VARCHAR(120) NOT NULL,
      ip_address               VARCHAR(45) NOT NULL,
      status                   ENUM('ONLINE','MAINTENANCE','OFFLINE') NOT NULL DEFAULT 'ONLINE',
      bandwidth_last_day_mb    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      last_checked             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_router_name (name),
      INDEX idx_router_hostel (hostel)
    )
  `);

  for (const r of ROUTER_SEEDS) {
    await pool.execute(
      `INSERT INTO routers (name, hostel, location, ip_address, status, bandwidth_last_day_mb, last_checked)
       VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR))
       ON DUPLICATE KEY UPDATE
         hostel = VALUES(hostel),
         location = VALUES(location),
         ip_address = VALUES(ip_address),
         status = VALUES(status),
         bandwidth_last_day_mb = VALUES(bandwidth_last_day_mb),
         last_checked = VALUES(last_checked)` ,
      [r.name, r.hostel, r.location, r.ip, r.status, r.bandwidth, r.hoursAgo]
    );
  }
}

async function assignRandomDefaultImages() {
  // Assign random default avatar images to all students without images
  try {
    const [studentsWithoutImages] = await pool.execute(
      `SELECT id FROM wifi_clients WHERE image_data IS NULL LIMIT 1000`
    );

    if (studentsWithoutImages.length === 0) return;

    for (const student of studentsWithoutImages) {
      const randomImage = DEFAULT_AVATAR_IMAGES[Math.floor(Math.random() * DEFAULT_AVATAR_IMAGES.length)];
      const imageBuffer = Buffer.from(randomImage, 'base64');
      
      await pool.execute(
        `UPDATE wifi_clients SET image_data = ? WHERE id = ?`,
        [imageBuffer, student.id]
      );
    }

    console.log(`✓ Assigned default images to ${studentsWithoutImages.length} students`);
  } catch (err) {
    console.error("Error assigning default images:", err.message);
  }
}

// ─────────────────────────────────────────────
//  VALIDATION HELPERS
// ─────────────────────────────────────────────

const ipRegex     = /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/;
const macRegex    = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
const rollRegex   = /^(2\d)[1-5]\d{2}$/i;
const hostelRegex = /^(JH|CH|BH)$/i;
const roomRegex   = /^(00[1-9]|0[1-9]\d|[123]\d{2})$/;

function detectField(q) {
  if (ipRegex.test(q))     return { column:"ip_address",  value:q,                   like:false };
  if (macRegex.test(q))    return { column:"mac_address",  value:q.toUpperCase(),     like:false };
  if (rollRegex.test(q))   return { column:"roll_no",      value:q.toUpperCase(),     like:false };
  if (hostelRegex.test(q)) return { column:"hostel",       value:q.toUpperCase(),     like:false };
  if (roomRegex.test(q))   return { column:"room_no",      value:normalizeRoom(q),     like:false };
  if (/^(CSE|IT|ECE|CyberSec|DS)$/i.test(q)) return { column:"branch", value:q.toUpperCase(), like:false };
  if (macRegex.test(q))    return { column:"mac_address",  value:`%${q}%`,            like:true  };
  if (q.length <= 4)       return { column:"device_name",  value:`%${q}%`,            like:true  };
  return                          { column:"name",          value:`%${q}%`,            like:true  };
}

const VALID_BRANCHES = BRANCHES.map(b => b.toUpperCase());

function normalizeRoom(room) {
  const raw = String(room ?? "").trim();
  if (!raw) return "";
  if (/^\d{1,3}$/.test(raw)) return raw.padStart(3, "0");
  return raw.toUpperCase();
}

function validateClientPayload(body = {}) {
  const branchInput = (body.branch || "").trim();
  const branchValue = BRANCHES.find(b => b.toUpperCase() === branchInput.toUpperCase()) || "";
  const dtypeInput  = (body.device_type || "").trim();
  const dtypeValue  = DTYPES.find(d => d.toUpperCase() === dtypeInput.toUpperCase()) || "";

  const data = {
    name:        (body.name || "").trim(),
    roll_no:     (body.roll_no || "").trim().toUpperCase(),
    branch:      branchValue,
    year:        Number(body.year),
    hostel:      (body.hostel || "").trim().toUpperCase(),
    room_no:     normalizeRoom(body.room_no),
    ip_address:  (body.ip_address || "").trim(),
    mac_address: (body.mac_address || "").trim().toUpperCase(),
    device_name: (body.device_name || "").trim(),
    device_type: dtypeValue,
    os_hint:     (body.os_hint || "").trim(),
    bandwidth_mb: Number(body.bandwidth_mb ?? 0),
    image_data:  body.image_data || null,
    image_mime_type: (body.image_mime_type || "image/jpeg").trim().toLowerCase(),
  };

  const errors = [];
  if (!data.name) errors.push("Name is required");
  if (!rollRegex.test(data.roll_no)) errors.push("Roll number must look like YYBSS (e.g., 24101)");
  if (!VALID_BRANCHES.includes(data.branch.toUpperCase())) errors.push("Branch must be CSE, IT, ECE, CyberSec, or DS");
  if (Number.isNaN(data.year) || data.year < 2020 || data.year > 2035) errors.push("Year must be between 2020 and 2035");
  if (!HOSTELS.includes(data.hostel)) errors.push("Hostel must be JH, CH, or BH");
  if (!roomRegex.test(data.room_no)) errors.push("Room number must be formatted like 001, 125, 320");
  if (!ipRegex.test(data.ip_address)) errors.push("Invalid IP address");
  if (!macRegex.test(data.mac_address)) errors.push("Invalid MAC address");
  if (!data.device_name) errors.push("Device name is required");
  if (!data.device_type) errors.push("Device type must be Phone, Laptop, Tablet, or Other");
  if (Number.isNaN(data.bandwidth_mb) || data.bandwidth_mb < 0) errors.push("Bandwidth must be zero or positive");
  if (data.image_data && !/^image\/[a-z0-9.+-]+$/i.test(data.image_mime_type)) {
    errors.push("Invalid image MIME type");
  }

  if (errors.length) return { ok:false, error:errors[0] };
  return { ok:true, data };
}

async function findDuplicateFieldError(data) {
  const [rows] = await pool.execute(
    `SELECT roll_no, ip_address, mac_address
     FROM wifi_clients
     WHERE roll_no = ? OR ip_address = ? OR mac_address = ?
     LIMIT 5`,
    [data.roll_no, data.ip_address, data.mac_address]
  );
  if (!rows.length) return null;

  const conflicts = new Set();
  for (const row of rows) {
    if (row.roll_no === data.roll_no) conflicts.add("roll");
    if (row.ip_address === data.ip_address) conflicts.add("ip");
    if (row.mac_address === data.mac_address) conflicts.add("mac");
  }

  if (conflicts.has("roll")) return "Roll number already exists";
  if (conflicts.has("ip"))   return "IP address already assigned";
  if (conflicts.has("mac"))  return "MAC address already registered";
  return "Duplicate student details detected";
}

const SELECT_COLS = `
  c.id, c.ip_address, c.mac_address, c.name, c.roll_no, c.branch, c.year,
  c.room_no, c.hostel, c.device_name, c.device_type, c.os_hint,
  c.bandwidth_mb, c.first_seen, c.last_seen, c.is_flagged, c.image_data, c.image_mime_type
`;

function serializeClientRow(row) {
  if (!row) return row;
  const out = { ...row };
  if (out.image_data && Buffer.isBuffer(out.image_data)) {
    out.image_data = out.image_data.toString("base64");
  }
  if (!out.image_mime_type) {
    out.image_mime_type = "image/jpeg";
  }
  return out;
}

// ─────────────────────────────────────────────
//  API ROUTES
// ─────────────────────────────────────────────

// GET /api/search?q=<value>&page=1&limit=25&hostel=JH&branch=CSE&flagged=1
app.get("/api/search", async (req, res) => {
  const query   = (req.query.q      || "").trim();
  const page    = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit   = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 25));
  const offset  = (page - 1) * limit;

  // Optional extra filters
  const filterHostel  = req.query.hostel  ? req.query.hostel.toUpperCase()  : null;
  const filterBranch  = req.query.branch  ? req.query.branch.toUpperCase()  : null;
  const filterFlagged = req.query.flagged !== undefined ? parseInt(req.query.flagged) : null;
  const filterYear    = req.query.year    ? parseInt(req.query.year)         : null;

  if (!query && !filterHostel && !filterBranch && filterFlagged === null && !filterYear) {
    return res.status(400).json({ error:"Provide at least one search parameter (q, hostel, branch, year, flagged)" });
  }

  let conditions = [];
  let params     = [];

  if (query) {
    const det = detectField(query);
    conditions.push(det.like ? `c.${det.column} LIKE ?` : `c.${det.column} = ?`);
    params.push(det.value);
  }
  if (filterHostel)           { conditions.push("c.hostel = ?");     params.push(filterHostel); }
  if (filterBranch)           { conditions.push("c.branch LIKE ?");  params.push(`%${filterBranch}%`); }
  if (filterYear !== null)    { conditions.push("c.year = ?");        params.push(filterYear); }
  if (filterFlagged !== null) { conditions.push("c.is_flagged = ?"); params.push(filterFlagged); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM wifi_clients c ${where}`,
      params
    );
    const selectSql = `SELECT ${SELECT_COLS} FROM wifi_clients c ${where} ORDER BY c.last_seen DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await pool.execute(selectSql, params);

    const detected = query ? detectField(query) : null;
    res.json({
      results: rows.map(serializeClientRow),
      detectedField: detected?.column || null,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error:"Database unavailable. Please verify MySQL is running." });
  }
});

// GET /api/stats — dashboard overview
app.get("/api/stats", async (_req, res) => {
  try {
    const [[totRow]]   = await pool.execute(`SELECT COUNT(*) AS total FROM wifi_clients`);
    const [[flagRow]]  = await pool.execute(`SELECT COUNT(*) AS total FROM wifi_clients WHERE is_flagged = 1`);
    const [[alertRow]] = await pool.execute(`SELECT COUNT(*) AS total FROM alerts WHERE resolved = 0`);
    const [[sessRow]]  = await pool.execute(`SELECT COUNT(*) AS total FROM sessions`);
    const [[bwRow]]    = await pool.execute(`SELECT SUM(bandwidth_mb) AS total_bw FROM wifi_clients`);
    const [[routerRow]] = await pool.execute(`SELECT COUNT(*) AS total FROM routers`);
    const [[routerBwRow]] = await pool.execute(`SELECT SUM(bandwidth_last_day_mb) AS total_bw FROM routers`);

    const [byHostel] = await pool.execute(`
      SELECT hostel, COUNT(*) AS count, SUM(bandwidth_mb) AS total_bw
      FROM wifi_clients GROUP BY hostel
    `);
    const [byBranch] = await pool.execute(`
      SELECT branch, COUNT(*) AS count FROM wifi_clients GROUP BY branch ORDER BY count DESC
    `);
    const [byDevice] = await pool.execute(`
      SELECT device_type, COUNT(*) AS count FROM wifi_clients GROUP BY device_type ORDER BY count DESC
    `);
    const [byYear] = await pool.execute(`
      SELECT year, COUNT(*) AS count FROM wifi_clients GROUP BY year ORDER BY year DESC
    `);
    const [topBW] = await pool.execute(`
      SELECT name, roll_no, hostel, bandwidth_mb, device_name
      FROM wifi_clients ORDER BY bandwidth_mb DESC LIMIT 5
    `);
    const [recentAlerts] = await pool.execute(`
      SELECT a.id, a.alert_type, a.description, a.severity, a.created_at,
             c.name, c.roll_no, c.hostel
      FROM alerts a JOIN wifi_clients c ON a.client_id = c.id
      WHERE a.resolved = 0 ORDER BY a.created_at DESC LIMIT 10
    `);

    res.json({
      ok: true,
      totals: {
        clients:   Number(totRow.total),
        flagged:   Number(flagRow.total),
        alerts:    Number(alertRow.total),
        sessions:  Number(sessRow.total),
        routers:   Number(routerRow.total),
        bandwidth_mb: parseFloat(bwRow.total_bw) || 0,
        bandwidth_last_day_mb: parseFloat(routerBwRow.total_bw) || 0,
      },
      byHostel, byBranch, byDevice, byYear, topBW, recentAlerts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, error:"Stats fetch failed" });
  }
});

// POST /api/client — add new student/client record
app.post("/api/client", async (req, res) => {
  const validation = validateClientPayload(req.body || {});
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  const data = validation.data;
  try {
    const duplicateError = await findDuplicateFieldError(data);
    if (duplicateError) {
      return res.status(409).json({ error: duplicateError });
    }

    const [result] = await pool.execute(
      `INSERT INTO wifi_clients
         (ip_address,mac_address,name,roll_no,branch,year,room_no,hostel,device_name,device_type,os_hint,bandwidth_mb,image_data,image_mime_type)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [data.ip_address, data.mac_address, data.name, data.roll_no, data.branch, data.year, data.room_no, data.hostel,
       data.device_name, data.device_type, data.os_hint, data.bandwidth_mb, data.image_data ? Buffer.from(data.image_data, 'base64') : null, data.image_mime_type]
    );

    const newId = result.insertId;
    const [[client]] = await pool.execute(
      `SELECT ${SELECT_COLS} FROM wifi_clients c WHERE c.id = ?`,
      [newId]
    );

    res.status(201).json({ ok:true, client: serializeClientRow(client) });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Duplicate roll number, IP, or MAC detected" });
    }
    console.error("Create client failed:", err);
    res.status(500).json({ error:"Unable to save student. Check MySQL connection." });
  }
});

// GET /api/client/:id — full client detail with sessions and alerts
app.get("/api/client/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:"Invalid ID" });

  try {
    const [[client]] = await pool.execute(
      `SELECT ${SELECT_COLS} FROM wifi_clients c WHERE c.id = ?`, [id]
    );
    if (!client) return res.status(404).json({ error:"Client not found" });

    const [sessions] = await pool.execute(
      `SELECT * FROM sessions WHERE client_id = ? ORDER BY connected_at DESC LIMIT 20`, [id]
    );
    const [alerts] = await pool.execute(
      `SELECT * FROM alerts WHERE client_id = ? ORDER BY created_at DESC`, [id]
    );

    res.json({ client: serializeClientRow(client), sessions, alerts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Server error" });
  }
});

// GET /api/hostel/:hostel — all clients in a hostel with summary
app.get("/api/hostel/:hostel", async (req, res) => {
  const hostel = req.params.hostel.toUpperCase();
  if (!["JH","CH","BH"].includes(hostel))
    return res.status(400).json({ error:"Invalid hostel. Use JH, CH, or BH." });

  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM wifi_clients WHERE hostel = ?`, [hostel]
    );
    const listSql = `SELECT ${SELECT_COLS} FROM wifi_clients c WHERE c.hostel = ?
       ORDER BY c.bandwidth_mb DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await pool.execute(listSql, [hostel]);
    const [[summary]] = await pool.execute(`
      SELECT COUNT(*) AS total, SUM(bandwidth_mb) AS total_bw,
             COUNT(CASE WHEN is_flagged=1 THEN 1 END) AS flagged
      FROM wifi_clients WHERE hostel = ?`, [hostel]
    );

    res.json({ hostel, summary, results: rows.map(serializeClientRow), pagination:{ page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Server error" });
  }
});

// GET /api/alerts — list all unresolved alerts
app.get("/api/alerts", async (req, res) => {
  const severity = req.query.severity?.toUpperCase();
  const valid    = ["LOW","MEDIUM","HIGH"];
  const params   = [];
  let where      = "WHERE a.resolved = 0";
  if (severity && valid.includes(severity)) {
    where += " AND a.severity = ?";
    params.push(severity);
  }

  try {
    const [alerts] = await pool.execute(`
      SELECT a.id, a.alert_type, a.description, a.severity, a.created_at,
             c.id AS client_id, c.name, c.roll_no, c.hostel, c.ip_address, c.bandwidth_mb
      FROM alerts a JOIN wifi_clients c ON a.client_id = c.id
      ${where} ORDER BY
        FIELD(a.severity,'HIGH','MEDIUM','LOW'), a.created_at DESC
      LIMIT 100
    `, params);
    res.json({ alerts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Server error" });
  }
});

// PATCH /api/client/:id/flag — toggle is_flagged
app.patch("/api/client/:id/flag", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:"Invalid ID" });
  try {
    await pool.execute(`UPDATE wifi_clients SET is_flagged = NOT is_flagged WHERE id = ?`, [id]);
    const [[row]] = await pool.execute(`SELECT id, is_flagged FROM wifi_clients WHERE id = ?`, [id]);
    res.json({ ok:true, is_flagged: !!row?.is_flagged });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Server error" });
  }
});

// GET /api/export/csv?hostel=JH&branch=CSE — download CSV
app.get("/api/export/csv", async (req, res) => {
  const hostel = req.query.hostel?.toUpperCase();
  const branch = req.query.branch?.toUpperCase();
  const params = [];
  let where    = "";
  const conds  = [];
  if (hostel) { conds.push("hostel = ?"); params.push(hostel); }
  if (branch) { conds.push("branch LIKE ?"); params.push(`%${branch}%`); }
  if (conds.length) where = `WHERE ${conds.join(" AND ")}`;

  try {
    const [rows] = await pool.execute(
      `SELECT ip_address,mac_address,name,roll_no,branch,year,room_no,hostel,
              device_name,device_type,os_hint,bandwidth_mb,first_seen,last_seen,is_flagged
       FROM wifi_clients ${where} ORDER BY hostel,room_no LIMIT 5000`,
      params
    );

    const header = "ip_address,mac_address,name,roll_no,branch,year,room_no,hostel,device_name,device_type,os_hint,bandwidth_mb,first_seen,last_seen,is_flagged\n";
    const csv = header + rows.map(r =>
      Object.values(r).map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")
    ).join("\n");

    res.setHeader("Content-Type","text/csv");
    res.setHeader("Content-Disposition",`attachment; filename="wifi_clients_export.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Export failed" });
  }
});

// GET /api/client/:id/image — retrieve student's image as data URL
app.get("/api/client/:id/image", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:"Invalid ID" });

  try {
    const [[row]] = await pool.execute(
      `SELECT image_data, image_mime_type FROM wifi_clients WHERE id = ?`, [id]
    );
    if (!row || !row.image_data) {
      return res.status(404).json({ error:"No image found" });
    }
    
    // Return as binary with the stored MIME type
    res.setHeader("Content-Type", row.image_mime_type || "image/jpeg");
    res.send(Buffer.from(row.image_data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Image retrieval failed" });
  }
});

// PATCH /api/client/:id/image — update student's image
app.patch("/api/client/:id/image", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error:"Invalid ID" });

  const imageData = req.body?.image_data;
  const imageMimeType = (req.body?.image_mime_type || "image/jpeg").trim().toLowerCase();
  if (!imageData) {
    return res.status(400).json({ error:"No image data provided" });
  }
  if (!/^image\/[a-z0-9.+-]+$/i.test(imageMimeType)) {
    return res.status(400).json({ error:"Invalid image MIME type" });
  }

  try {
    const imageBuffer = Buffer.from(imageData, 'base64');
    await pool.execute(
      `UPDATE wifi_clients SET image_data = ?, image_mime_type = ? WHERE id = ?`,
      [imageBuffer, imageMimeType, id]
    );
    res.json({ ok: true, message: "Image updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Image update failed" });
  }
});

// ─────────────────────────────────────────────
//  STATIC + FALLBACK
// ─────────────────────────────────────────────

app.use("/api", (_req, res) => res.status(404).json({ ok:false, error:"API route not found" }));
app.use(express.static("."));

// ─────────────────────────────────────────────
//  STARTUP
// ─────────────────────────────────────────────

function validateEnv() {
  const required = ["DB_HOST","DB_USER","DB_NAME"];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);
}

async function assertDbConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
  } catch (err) {
    if (err?.code === "ER_ACCESS_DENIED_ERROR")
      throw new Error("MySQL access denied. Check DB_USER/DB_PASS in .env");
    throw err;
  }
}

const PORT = process.env.PORT || 3000;
(async () => {
  try {
    validateEnv();
    await initDatabase();
    await assertDbConnection();
    await bootstrapDatabase();
    app.listen(PORT, () => console.log(`\n✅ Server running → http://localhost:${PORT}\n`));
  } catch (err) {
    console.error("❌ Startup error:", err.message || err);
    process.exit(1);
  }
})();
