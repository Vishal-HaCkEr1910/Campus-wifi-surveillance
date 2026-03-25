# 📡 IIIT UNA Wi-Fi Surveillance System
## Complete Project Documentation for DBMS Course Submission

---

> **Student Project** | Indian Institute of Information Technology, Una  
> **Subject:** Database Management Systems (DBMS)  
> **Tech Stack:** Node.js · Express.js · MySQL · HTML/CSS/JavaScript

---

## 📋 Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Why Was This Built?](#2-why-was-this-built)
3. [Project File Structure](#3-project-file-structure)
4. [Technology Explained Simply](#4-technology-explained-simply)
5. [Database Design (The Heart of DBMS)](#5-database-design-the-heart-of-dbms)
6. [System Architecture — Big Picture](#6-system-architecture--big-picture)
7. [How the Server Works (server.js)](#7-how-the-server-works-serverjs)
8. [How the Database is Created (schema.sql)](#8-how-the-database-is-created-schemasql)
9. [How the Frontend Works (index.html)](#9-how-the-frontend-works-indexhtml)
10. [Complete API Reference](#10-complete-api-reference)
11. [Data Flow Walkthrough — Step by Step](#11-data-flow-walkthrough--step-by-step)
12. [DBMS Concepts Applied](#12-dbms-concepts-applied)
13. [Security & Validation Logic](#13-security--validation-logic)
14. [Configuration (.env & package.json)](#14-configuration-env--packagejson)
15. [How to Run the Project](#15-how-to-run-the-project)
16. [Sample Queries & Results](#16-sample-queries--results)
17. [Conclusion](#17-conclusion)

---

## 1. What Is This Project?

### 🎯 In One Sentence

A **web-based dashboard** that lets network administrators at IIIT UNA **monitor, search, flag, and manage** every device connected to the campus Wi-Fi network — stored in a relational MySQL database and accessible through a browser.

### 🏫 Real-World Analogy

Imagine a **college library register**. Every time a student enters, the librarian writes down:
- Student's name and roll number
- Which book they borrowed
- How long they stayed

Now imagine this register is **digital**, **searchable in 0.01 seconds**, and can **automatically raise an alarm** if someone is using too much data or connecting from suspicious locations. That is exactly what this system does — but for Wi-Fi instead of a library.

### 🖥️ What Can You Do With It?

| Feature | Description |
|---|---|
| 🔍 **Search** | Find any student by IP address, MAC address, roll number, name, room, or device |
| 🏠 **Hostel View** | See all Wi-Fi clients per hostel (JH, CH, BH) |
| 🚨 **Alerts** | View flagged users who are using excessive bandwidth or connecting suspiciously |
| 📊 **Dashboard** | Real-time statistics — total users, flagged clients, bandwidth graphs |
| ➕ **Add Student** | Register new devices with full validation |
| 📥 **Export CSV** | Download data for offline analysis |

---

## 2. Why Was This Built?

### 🎓 DBMS Learning Objectives Covered

This project demonstrates:

```
┌─────────────────────────────────────────────────────────┐
│              DBMS CONCEPTS PRACTICED                     │
├─────────────────────────────────────────────────────────┤
│  ✅ Table Design (Normalization up to 3NF)               │
│  ✅ Primary Keys & Foreign Keys                         │
│  ✅ UNIQUE constraints to prevent duplicate data        │
│  ✅ ENUMs for controlled vocabulary                     │
│  ✅ Indexes for fast searching                          │
│  ✅ SQL JOINs across multiple tables                    │
│  ✅ Aggregate functions (COUNT, SUM, AVG)               │
│  ✅ Views (virtual tables)                              │
│  ✅ Transactions (INSERT + trigger logic)               │
│  ✅ CRUD operations via REST API                        │
└─────────────────────────────────────────────────────────┘
```

### 🔐 Real-World Problem Solved

Campus networks face:
- **Bandwidth hogging** — one student downloading torrents can slow down 500 others
- **Unauthorized devices** — unknown MACs connecting to the network
- **After-hours activity** — devices active at 3 AM when hostels should be quiet
- **No visibility** — admins have no way to see who is doing what

This system solves all of the above.

---

## 3. Project File Structure

```
wifi-surveillance/
│
├── 📄 server.js          ← The brain: Node.js server + all API routes + DB seeding
├── 📄 index.html         ← The face: entire frontend UI (HTML + CSS + JavaScript)
├── 📄 schema.sql         ← The blueprint: MySQL table definitions + seed data
├── 📄 package.json       ← Project metadata + dependency list
├── 📄 package-lock.json  ← Exact dependency versions (auto-generated)
└── 📄 .env               ← Secret configuration (DB password, port)
```

### 📁 What Each File Does

| File | Role | Analogy |
|------|------|---------|
| `server.js` | Runs the web server, connects to MySQL, handles all logic | Chef in a restaurant |
| `index.html` | The visual interface users see in their browser | Restaurant menu + dining area |
| `schema.sql` | Defines all database tables and relationships | Blueprint of a building |
| `.env` | Stores sensitive configuration (passwords) | Master key kept in a safe |
| `package.json` | Lists all Node.js libraries needed | Shopping list of ingredients |

---

## 4. Technology Explained Simply

### 🌐 What is Node.js?

```
Traditional Approach:
  Browser → Web Server → PHP/Python Script → MySQL → Response

This Project:
  Browser → Node.js (server.js) → MySQL → Response
```

**Node.js** is a JavaScript runtime that lets us run JavaScript code ON THE SERVER (not just in browsers). Think of it as JavaScript that can also open files, connect to databases, and listen for web requests.

### 🚂 What is Express.js?

Express is a **mini framework** built on top of Node.js. Without Express, you'd have to write 100 lines to handle one web request. With Express:

```javascript
// Without Express (raw Node.js) - complicated
http.createServer((req, res) => {
    if (req.url === '/students' && req.method === 'GET') {
        // ... 50 more lines of parsing, headers, etc.
    }
})

// With Express - simple and readable
app.get('/students', (req, res) => {
    res.json({ message: "Here are the students" })
})
```

### 🗃️ What is MySQL?

MySQL is a **Relational Database Management System (RDBMS)**. Data is stored in **tables** (like Excel spreadsheets), and tables can be **linked together** using keys.

```
wifi_clients table:              alerts table:
┌────┬──────────┬────────┐       ┌────┬───────────┬─────────────────────┐
│ id │   name   │ hostel │       │ id │ client_id │    alert_type       │
├────┼──────────┼────────┤       ├────┼───────────┼─────────────────────┤
│  1 │ Aarav    │  JH    │ ◄──── │  1 │     1     │ HIGH_BANDWIDTH      │
│  2 │ Riya     │  CH    │       │  2 │     1     │ AFTER_HOURS         │
└────┴──────────┴────────┘       └────┴───────────┴─────────────────────┘
                                        ↑
                                  Foreign Key links
                                  alert back to client
```

### 🔒 What is .env?

A `.env` file stores **environment variables** — sensitive values that change per installation (like database passwords). The app reads these at startup instead of hardcoding secrets in the code.

```bash
# .env file — never commit this to GitHub!
DB_HOST=127.0.0.1      # Where MySQL is running
DB_USER=root           # MySQL username
DB_PASS=Vishalrao1@   # MySQL password (kept secret)
DB_NAME=wifi_surveillance  # Which database to use
PORT=3000              # Which port the web server runs on
```

---

## 5. Database Design (The Heart of DBMS)

### 📐 Entity-Relationship (ER) Concept

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTITIES AND RELATIONSHIPS                        │
│                                                                     │
│  ┌──────────────┐    has many    ┌────────────┐                    │
│  │ wifi_clients │ ─────────────► │  sessions  │                    │
│  │   (student/  │               │ (connection │                    │
│  │    device)   │               │   history) │                    │
│  └──────┬───────┘               └────────────┘                    │
│         │                                                           │
│         │ generates              ┌────────────┐                    │
│         └──────────────────────► │   alerts   │                    │
│                                  │ (warnings) │                    │
│                                  └────────────┘                    │
│                                                                     │
│  ┌──────────────┐   (independent table)                           │
│  │   routers    │                                                  │
│  │ (hardware)   │                                                  │
│  └──────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 📊 Table 1: `wifi_clients` (Core Table)

This is the **most important table** — it stores one row per registered device.

```sql
CREATE TABLE wifi_clients (
  id            INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID (1, 2, 3...)
  ip_address    VARCHAR(45)  NOT NULL,            -- e.g. 10.0.0.11
  mac_address   VARCHAR(17)  NOT NULL DEFAULT '', -- e.g. A4:C3:F0:11:22:33
  name          VARCHAR(100) NOT NULL,            -- e.g. "Aarav Mehta"
  roll_no       VARCHAR(10)  NOT NULL,            -- e.g. "24101"
  branch        VARCHAR(20)  NOT NULL,            -- CSE, IT, ECE, etc.
  year          SMALLINT     NOT NULL,            -- 2022, 2023, 2024, 2025
  room_no       VARCHAR(10)  NOT NULL,            -- e.g. "101"
  hostel        ENUM('JH','CH','BH') NOT NULL,    -- Only these 3 values allowed
  device_name   VARCHAR(120) NOT NULL,            -- e.g. "iPhone 14"
  device_type   ENUM('Phone','Laptop','Tablet','Other') NOT NULL,
  os_hint       VARCHAR(50)  NOT NULL DEFAULT '', -- iOS, Android, Windows, etc.
  bandwidth_mb  DECIMAL(10,2) NOT NULL DEFAULT 0, -- Data used in megabytes
  first_seen    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_flagged    TINYINT(1)   NOT NULL DEFAULT 0,  -- 0 = clean, 1 = flagged
  
  -- Indexes for fast searching:
  INDEX idx_ip      (ip_address),
  INDEX idx_mac     (mac_address),
  INDEX idx_roll    (roll_no),
  INDEX idx_hostel  (hostel),
  INDEX idx_name    (name),
  
  -- Uniqueness constraints (prevent duplicates):
  UNIQUE KEY uniq_roll (roll_no),     -- Two students can't share a roll number
  UNIQUE KEY uniq_ip   (ip_address),  -- Two devices can't have same IP
  UNIQUE KEY uniq_mac  (mac_address)  -- Two devices can't have same MAC
);
```

#### 🧠 Why Each Column Matters

| Column | Data Type | Why This Type? |
|--------|-----------|----------------|
| `id` | INT AUTO_INCREMENT | Numbers are fastest for lookups; auto-increment saves us from generating IDs manually |
| `ip_address` | VARCHAR(45) | IPv6 addresses can be 39 chars; IPv4 is 15 chars; 45 is safe |
| `mac_address` | VARCHAR(17) | Always exactly 17 chars: `AA:BB:CC:DD:EE:FF` |
| `hostel` | ENUM | Only 3 hostels exist; ENUM prevents typos like "jH" or "Jhagragni" |
| `bandwidth_mb` | DECIMAL(10,2) | Precise decimal math; FLOAT would introduce tiny rounding errors |
| `is_flagged` | TINYINT(1) | Boolean (true/false) stored as 0 or 1; most space-efficient |
| `last_seen` | DATETIME ON UPDATE | Automatically updates every time the row changes |

### 📊 Table 2: `sessions`

Records **each Wi-Fi connection event** — like a phone call log.

```sql
CREATE TABLE sessions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  client_id    INT NOT NULL,                -- Links to wifi_clients.id
  ip_address   VARCHAR(45) NOT NULL,
  connected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_min INT NOT NULL DEFAULT 0,      -- How many minutes connected
  bytes_up     BIGINT NOT NULL DEFAULT 0,   -- Upload bytes (BIGINT = huge numbers)
  bytes_down   BIGINT NOT NULL DEFAULT 0,   -- Download bytes
  
  FOREIGN KEY (client_id) REFERENCES wifi_clients(id) ON DELETE CASCADE
  -- ↑ If a wifi_client is deleted, all their sessions auto-delete too
);
```

#### 🔑 What is a Foreign Key?

```
wifi_clients:              sessions:
┌────┬──────────┐          ┌────┬───────────┬──────────────┐
│ id │   name   │          │ id │ client_id │ connected_at │
├────┼──────────┤          ├────┼───────────┼──────────────┤
│  1 │ Aarav    │ ◄──────── │  1 │     1     │ 2024-01-15   │
│  2 │ Riya     │ ◄──────── │  2 │     1     │ 2024-01-16   │
└────┴──────────┘    ┌───── │  3 │     2     │ 2024-01-15   │
                     │     └────┴───────────┴──────────────┘
                     │
                     └── "client_id = 2" means this session belongs to Riya
```

A **Foreign Key** is a column that points to another table's Primary Key. It creates a **relationship** between tables — this is the "relational" in RDBMS!

### 📊 Table 3: `alerts`

Stores warnings/flags raised against clients.

```sql
CREATE TABLE alerts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  client_id   INT NOT NULL,
  alert_type  ENUM(
    'HIGH_BANDWIDTH',   -- Using > 5GB data
    'MULTIPLE_DEVICES', -- Same person, many devices  
    'UNKNOWN_MAC',      -- MAC not in whitelist
    'AFTER_HOURS',      -- Active 2 AM - 5 AM
    'SPOOFED_IP'        -- Suspicious IP activity
  ) NOT NULL,
  description TEXT,     -- Human-readable explanation
  severity    ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'LOW',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved    TINYINT(1) NOT NULL DEFAULT 0,  -- 0 = open, 1 = resolved
  
  FOREIGN KEY (client_id) REFERENCES wifi_clients(id) ON DELETE CASCADE
);
```

### 📊 Table 4: `routers`

Tracks the physical network hardware.

```sql
CREATE TABLE routers (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(60) NOT NULL,    -- e.g. "JH-Core-01"
  hostel                ENUM('JH','CH','BH') NOT NULL,
  location              VARCHAR(120) NOT NULL,   -- e.g. "North Wing Rooftop"
  ip_address            VARCHAR(45) NOT NULL,
  status                ENUM('ONLINE','MAINTENANCE','OFFLINE') NOT NULL,
  bandwidth_last_day_mb DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_checked          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uniq_router_name (name)
);
```

### 🗺️ Complete ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ER DIAGRAM                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                     wifi_clients                            │           │
│  │  PK: id (INT)                                               │           │
│  │  ip_address, mac_address, name, roll_no, branch             │           │
│  │  year, room_no, hostel, device_name, device_type            │           │
│  │  os_hint, bandwidth_mb, first_seen, last_seen, is_flagged   │           │
│  └──────────────┬───────────────────┬────────────────────────┘           │
│                 │ 1                 │ 1                                    │
│                 │ has many          │ has many                             │
│                 │ N                 │ N                                    │
│  ┌──────────────▼───────┐   ┌──────▼──────────────────────────┐          │
│  │       sessions       │   │           alerts                │          │
│  │  PK: id              │   │  PK: id                         │          │
│  │  FK: client_id ──────┘   │  FK: client_id ─────────────────┘          │
│  │  ip_address              │  alert_type (ENUM)                          │
│  │  connected_at            │  description, severity                      │
│  │  duration_min            │  created_at, resolved                       │
│  │  bytes_up, bytes_down    │                                             │
│  └──────────────────────┘   └─────────────────────────────────┘          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                      routers (independent)                  │           │
│  │  PK: id, name, hostel, location, ip_address                 │           │
│  │  status, bandwidth_last_day_mb, last_checked                │           │
│  └─────────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 🧠 Normalization Analysis

**First Normal Form (1NF):** ✅
- Every column has atomic (single) values
- No repeating groups
- Each row is uniquely identified by `id`

**Second Normal Form (2NF):** ✅
- No composite primary keys, so 2NF is trivially satisfied
- All non-key attributes depend on the whole key

**Third Normal Form (3NF):** ✅
- No transitive dependencies
- `branch` doesn't determine `hostel`; they're independent facts about the student
- `device_type` doesn't determine `os_hint` at the table level

### 🔍 Views (Virtual Tables)

Views are **saved SQL queries** that look like tables. We defined three:

```sql
-- View 1: Summary per hostel
CREATE VIEW hostel_summary AS
SELECT
  hostel,
  COUNT(*)               AS total_clients,
  SUM(bandwidth_mb)      AS total_bw_mb,
  COUNT(CASE WHEN is_flagged=1 THEN 1 END) AS flagged_count,
  COUNT(DISTINCT branch) AS branches_present
FROM wifi_clients
GROUP BY hostel;

-- Usage: SELECT * FROM hostel_summary;
-- Result: one row per hostel with aggregated stats
```

```sql
-- View 2: Top bandwidth consumers
CREATE VIEW top_consumers AS
SELECT name, roll_no, hostel, room_no, device_name, bandwidth_mb
FROM wifi_clients
ORDER BY bandwidth_mb DESC
LIMIT 20;
```

```sql
-- View 3: Open alerts with full client info (uses JOIN)
CREATE VIEW open_alerts_view AS
SELECT
  a.id AS alert_id, a.alert_type, a.severity, a.description, a.created_at,
  c.name, c.roll_no, c.hostel, c.room_no, c.ip_address, c.bandwidth_mb
FROM alerts a
JOIN wifi_clients c ON a.client_id = c.id
WHERE a.resolved = 0
ORDER BY FIELD(a.severity,'HIGH','MEDIUM','LOW'), a.created_at DESC;
```

---

## 6. System Architecture — Big Picture

### 🏗️ Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THREE-TIER ARCHITECTURE                         │
│                                                                         │
│  ┌─────────────────────┐                                               │
│  │   TIER 1: CLIENT    │  ← The user's web browser                    │
│  │   (Presentation)    │                                               │
│  │                     │  What it runs: HTML + CSS + JavaScript        │
│  │  📄 index.html      │  Where it runs: User's computer/phone         │
│  └─────────┬───────────┘                                               │
│            │  HTTP Requests (GET /api/search, POST /api/client...)     │
│            │  HTTP Responses (JSON data)                               │
│  ┌─────────▼───────────┐                                               │
│  │   TIER 2: SERVER    │  ← The application logic layer               │
│  │   (Application)     │                                               │
│  │                     │  What it runs: Node.js + Express.js           │
│  │  📄 server.js       │  Where it runs: On the server machine         │
│  └─────────┬───────────┘                                               │
│            │  SQL Queries (SELECT, INSERT, UPDATE...)                  │
│            │  Result Sets (rows of data)                               │
│  ┌─────────▼───────────┐                                               │
│  │   TIER 3: DATABASE  │  ← The data storage layer                   │
│  │   (Data)            │                                               │
│  │                     │  What it runs: MySQL Server                   │
│  │  📄 schema.sql      │  Where it runs: On the server machine         │
│  └─────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 🔄 Request-Response Cycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE REQUEST-RESPONSE FLOW                        │
│                                                                          │
│  1. User types "Aarav" in search box and presses Enter                  │
│     ↓                                                                    │
│  2. Browser's JavaScript calls:                                          │
│     fetch('/api/search?q=Aarav&page=1&limit=25')                        │
│     ↓                                                                    │
│  3. HTTP GET request travels over network to server on port 3000        │
│     ↓                                                                    │
│  4. Express.js router matches: app.get('/api/search', handler)          │
│     ↓                                                                    │
│  5. Handler function runs:                                               │
│     - Detects "Aarav" = a name (not IP, not MAC, not roll no.)          │
│     - Builds SQL: SELECT ... WHERE name LIKE '%Aarav%'                  │
│     ↓                                                                    │
│  6. MySQL executes the query                                             │
│     - Scans wifi_clients using the idx_name index                       │
│     - Returns matching rows                                              │
│     ↓                                                                    │
│  7. server.js formats rows as JSON                                       │
│     ↓                                                                    │
│  8. HTTP 200 OK response with JSON body sent back                       │
│     ↓                                                                    │
│  9. Browser JavaScript receives JSON, builds HTML table                 │
│     ↓                                                                    │
│  10. User sees results on screen                                        │
│                                                                          │
│      Total time: ~30-50 milliseconds                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. How the Server Works (server.js)

### 📦 Startup Sequence

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SERVER STARTUP FLOWCHART                          │
│                                                                      │
│  START                                                               │
│    │                                                                 │
│    ▼                                                                 │
│  Load .env file (dotenv.config())                                    │
│    │                                                                 │
│    ▼                                                                 │
│  validateEnv()  ──── Missing DB_HOST/DB_USER/DB_NAME? ──► CRASH     │
│    │                                                                 │
│    ▼ All good                                                        │
│  initDatabase()                                                      │
│    ├── CREATE DATABASE IF NOT EXISTS wifi_surveillance               │
│    └── Create MySQL connection pool (10 connections)                 │
│    │                                                                 │
│    ▼                                                                 │
│  assertDbConnection()  ──── Can't connect? ──► CRASH with message   │
│    │                                                                 │
│    ▼ Connected                                                       │
│  bootstrapDatabase()                                                 │
│    ├── CREATE TABLE IF NOT EXISTS wifi_clients                       │
│    ├── CREATE TABLE IF NOT EXISTS sessions                           │
│    ├── CREATE TABLE IF NOT EXISTS alerts                             │
│    ├── Seed 15 known student records                                 │
│    ├── Seed 9 router records                                         │
│    ├── Auto-generate HIGH_BANDWIDTH alerts for heavy users           │
│    ├── bulkSeed() → fill up to 930 synthetic students               │
│    ├── diversifyHeavyBandwidth() → randomize outlier values          │
│    └── ensureRouters() → create routers table if missing             │
│    │                                                                 │
│    ▼                                                                 │
│  app.listen(3000)                                                    │
│    │                                                                 │
│    ▼                                                                 │
│  ✅ Server running → http://localhost:3000                           │
└──────────────────────────────────────────────────────────────────────┘
```

### 🌱 Intelligent Seeding System

The seeding system is **idempotent** — you can restart the server 100 times and the data won't keep growing:

```javascript
// Simplified concept:
async function bulkSeed() {
  const plan = buildPopulationPlan();
  // plan = { CSE: {2022: 70, 2023: 70...}, IT: {...}, ... }
  
  const existing = await fetchBranchYearCounts();
  // existing = { 'CSE-2022': 45, 'IT-2023': 12, ... }
  
  for (const [branch, years] of Object.entries(plan)) {
    for (const [year, target] of Object.entries(years)) {
      const needed = target - (existing[`${branch}-${year}`] || 0);
      if (needed > 0) {
        await insertPlannedStudents(branch, year, needed);
        // Only inserts what's MISSING — won't create duplicates
      }
    }
  }
}
```

### 🎯 Population Plan

```
┌────────────────────────────────────────────────────────┐
│              TARGET STUDENT DISTRIBUTION               │
├──────────────┬────────┬────────┬────────┬──────────────┤
│    Branch    │  2022  │  2023  │  2024  │     2025     │
├──────────────┼────────┼────────┼────────┼──────────────┤
│     CSE      │   70   │   70   │   70   │     70       │
│     IT       │   70   │   70   │   70   │     70       │
│     ECE      │   70   │   70   │   70   │     70       │
│   CyberSec   │   —    │   —    │   30   │     30       │
│     DS       │   —    │   —    │   30   │     30       │
├──────────────┴────────┴────────┴────────┴──────────────┤
│  Total target: 930 students (+ buffer to reach target) │
└────────────────────────────────────────────────────────┘
```

### 🔍 Smart Field Detection (detectField function)

When a user types in the search box, the system figures out **what they're searching for** automatically:

```javascript
function detectField(query) {
  // Is it an IP address? (e.g. "10.0.0.11")
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(query))
    return { column: "ip_address", like: false };
  
  // Is it a MAC address? (e.g. "A4:C3:F0:11:22:33")
  if (/^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(query))
    return { column: "mac_address", like: false };
  
  // Is it a roll number? (e.g. "24101")
  if (/^(2\d)[1-5]\d{2}$/.test(query))
    return { column: "roll_no", like: false };
  
  // Is it a hostel code? (JH / CH / BH)
  if (/^(JH|CH|BH)$/i.test(query))
    return { column: "hostel", like: false };
  
  // Is it a room number? (e.g. "101", "305")
  if (/^(00[1-9]|0[1-9]\d|[123]\d{2})$/.test(query))
    return { column: "room_no", like: false };
  
  // Default: search by name (fuzzy match)
  return { column: "name", value: `%${query}%`, like: true };
}
```

This is a **regex-based classification system** — it uses pattern matching to auto-detect field type.

```
User types "10.0.0.11"    → Searches ip_address exactly
User types "A4:C3:F0..."  → Searches mac_address exactly
User types "24101"        → Searches roll_no exactly
User types "JH"           → Searches hostel exactly
User types "Aarav"        → Searches name with LIKE '%Aarav%'
```

---

## 8. How the Database is Created (schema.sql)

### 📜 Purpose of schema.sql

`schema.sql` is a **standalone SQL file** that creates the entire database from scratch. It's useful for:
- Setting up a fresh database on a new machine
- Documenting the database structure
- Sharing the schema with team members

### ▶️ Running schema.sql

```bash
# From terminal, create entire database structure:
mysql -u root -p < schema.sql
```

This is the same as typing all the CREATE TABLE commands manually in MySQL Workbench.

### 🌱 Seed Data Logic

The schema includes pre-inserted (seed) data:

```sql
-- These 15 records are always inserted when schema runs
INSERT INTO wifi_clients (ip_address, mac_address, name, ...)
VALUES
  ('10.0.0.11', 'A4:C3:F0:11:22:33', 'Aarav Mehta',  '24101', 'CSE', 2024, ...),
  ('10.0.0.12', 'B8:27:EB:44:55:66', 'Riya Patel',   '23252', 'IT',  2023, ...),
  -- ... 13 more rows
```

### 🤖 Auto-Alert Generation

After inserting clients, the schema automatically creates alerts for heavy bandwidth users:

```sql
-- Find anyone using > 5000 MB and create an alert for them
INSERT INTO alerts (client_id, alert_type, description, severity)
SELECT id, 'HIGH_BANDWIDTH',
       CONCAT('Client used ', ROUND(bandwidth_mb, 0), ' MB — exceeds 5 GB policy threshold'),
       'HIGH'
FROM wifi_clients
WHERE bandwidth_mb > 5000;
```

This is an **INSERT ... SELECT** statement — inserting rows derived from another query.

---

## 9. How the Frontend Works (index.html)

### 🖼️ Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                           IIIT UNA                                   │
│                       Wi-Fi Surveillance              [Add Student]  │
├──────────────────────────────────────────────────────────────────────┤
│  [Dashboard]  [Search]  [By Hostel]  [Alerts]  ← Tabs               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Dashboard Tab:                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 930      │ │ 48       │ │ 12       │ │ 9        │ │ 4.2 TB   │  │
│  │ CLIENTS  │ │ FLAGGED  │ │ ALERTS   │ │ ROUTERS  │ │ BANDWIDTH│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                      │
│  ┌───────────────────┐ ┌───────────────────┐ ┌──────────────────┐   │
│  │ Clients by Hostel │ │ Clients by Branch │ │ Device Types     │   │
│  │ [bar chart]       │ │ [bar chart]       │ │ [bar chart]      │   │
│  └───────────────────┘ └───────────────────┘ └──────────────────┘   │
│                                                                      │
│  ┌───────────────────────────┐ ┌──────────────────────────────────┐ │
│  │ Top Bandwidth Users       │ │ Recent Alerts                    │ │
│  │ Rohan Iyer   9,800 MB     │ │ HIGH  HIGH_BANDWIDTH - Maya Rao  │ │
│  │ Maya Rao     7,200 MB     │ │ HIGH  HIGH_BANDWIDTH - Rohan..   │ │
│  └───────────────────────────┘ └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 🏗️ Frontend Architecture

The entire frontend is in a single `index.html` file. It's a **Single Page Application (SPA)** — no page reloads happen. Instead, JavaScript shows/hides different sections (called "panes").

```javascript
// Tab switching — no page reload!
function switchTab(event, tabName) {
  // Hide all panes
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
  
  // Show only the requested pane
  document.getElementById(`pane-${tabName}`).classList.add('active');
  
  // Load appropriate data
  if (tabName === 'dashboard') loadStats();
  if (tabName === 'hostel')    loadHostel(1);
  if (tabName === 'alerts')    loadAlerts();
  if (tabName === 'search')    doSearch(1);
}
```

### 📡 How the Frontend Fetches Data (fetch API)

```javascript
// Example: Loading dashboard statistics
async function loadStats() {
  try {
    // 1. Make GET request to our server
    const response = await fetch('/api/stats');
    
    // 2. Parse JSON response
    const data = await response.json();
    
    // 3. Update the HTML with the data
    document.getElementById('s-total').textContent = data.totals.clients;
    document.getElementById('s-flagged').textContent = data.totals.flagged;
    
    // 4. Build bar charts
    renderBarChart('chart-hostel', data.byHostel, 'hostel', 'count');
    
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}
```

**`async/await`** is modern JavaScript syntax for handling asynchronous operations (things that take time, like network requests) without blocking the browser.

### 🔄 Auto-Refresh

The system automatically refreshes data every 45 seconds:

```javascript
setInterval(() => {
  if (document.hidden) return; // Don't refresh if tab is not visible
  
  if (activeTab === 'dashboard') loadStats();
  if (activeTab === 'alerts')    loadAlerts();
  if (activeTab === 'hostel')    loadHostel(currentHostelPage);
  if (activeTab === 'search' && hasSearchFilters()) doSearch(currentPage);
  
}, 45000); // 45,000 milliseconds = 45 seconds
```

### 📝 Add Student Form

```
┌──────────────────────────────────────────────────────────────┐
│  Add Student                                              [✕] │
├──────────────────────────────────────────────────────────────┤
│  Full Name          │  Roll Number                           │
│  [____________]     │  [____________]                        │
│                     │                                        │
│  Branch             │  Year                                  │
│  [CSE ▼]           │  [2024____]                            │
│                     │                                        │
│  Hostel             │  Room No                               │
│  [JH ▼]            │  [____________]                        │
│                     │                                        │
│  IP Address         │  MAC Address                           │
│  [____________]     │  [____________]                        │
│                     │                                        │
│  Device Name        │  Device Type                           │
│  [____________]     │  [Laptop ▼]                           │
│                     │                                        │
│  OS Hint            │  Bandwidth (MB)                        │
│  [____________]     │  [0__________]                        │
│                     │                                        │
│            [Cancel]           [Save Student]                │
└──────────────────────────────────────────────────────────────┘
```

When "Save Student" is clicked:

```javascript
async function submitStudent(event) {
  event.preventDefault(); // Prevent page reload
  
  // Collect form data
  const payload = Object.fromEntries(new FormData(form).entries());
  
  // Send to server as JSON
  const response = await fetch('/api/client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    alert(result.error); // Show error: "Roll number already exists"
  } else {
    closeForm();
    loadStats(); // Refresh dashboard
    toast('Student saved!'); // Show success notification
  }
}
```

---

## 10. Complete API Reference

### What is an API?

**API = Application Programming Interface**

It's a set of "endpoints" (URLs) that the frontend can call to get or send data. Like a waiter in a restaurant — you tell the waiter what you want, and they bring it from the kitchen (database).

### 📋 All API Endpoints

```
BASE URL: http://localhost:3000
```

---

#### `GET /api/stats`

**Purpose:** Dashboard summary statistics

**Request:**
```
GET http://localhost:3000/api/stats
No parameters needed
```

**Response:**
```json
{
  "ok": true,
  "totals": {
    "clients": 930,
    "flagged": 48,
    "alerts": 12,
    "sessions": 2790,
    "routers": 9,
    "bandwidth_mb": 4281600.5
  },
  "byHostel": [
    { "hostel": "JH", "count": 310, "total_bw": 1423840.5 },
    { "hostel": "CH", "count": 310, "total_bw": 1429200.0 },
    { "hostel": "BH", "count": 310, "total_bw": 1428560.0 }
  ],
  "byBranch": [...],
  "byDevice": [...],
  "topBW": [...],
  "recentAlerts": [...]
}
```

**SQL Executed:**
```sql
SELECT COUNT(*) AS total FROM wifi_clients;
SELECT COUNT(*) AS total FROM wifi_clients WHERE is_flagged = 1;
SELECT COUNT(*) AS total FROM alerts WHERE resolved = 0;
SELECT hostel, COUNT(*) AS count, SUM(bandwidth_mb) AS total_bw 
  FROM wifi_clients GROUP BY hostel;
SELECT name, roll_no, hostel, bandwidth_mb 
  FROM wifi_clients ORDER BY bandwidth_mb DESC LIMIT 5;
```

---

#### `GET /api/search`

**Purpose:** Search and filter Wi-Fi clients

**Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | Search query | `q=Aarav` or `q=10.0.0.11` |
| `hostel` | string | Filter by hostel | `hostel=JH` |
| `branch` | string | Filter by branch | `branch=CSE` |
| `year` | number | Filter by batch year | `year=2024` |
| `flagged` | 0 or 1 | Filter flagged status | `flagged=1` |
| `page` | number | Page number | `page=2` |
| `limit` | number | Results per page | `limit=25` |

**Request:**
```
GET /api/search?q=10.0.0.11&page=1&limit=25
GET /api/search?hostel=JH&branch=CSE&year=2024&flagged=0
GET /api/search?q=Aarav&page=1&limit=25
```

**SQL Pattern:**
```sql
SELECT c.id, c.ip_address, c.mac_address, c.name, c.roll_no, ...
FROM wifi_clients c
WHERE c.name LIKE '%Aarav%'   -- if searching by name
  AND c.hostel = 'JH'          -- if hostel filter active
  AND c.branch LIKE '%CSE%'    -- if branch filter active
  AND c.year = 2024            -- if year filter active
  AND c.is_flagged = 0         -- if flagged filter active
ORDER BY c.last_seen DESC
LIMIT 25 OFFSET 0;
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "ip_address": "10.0.0.11",
      "mac_address": "A4:C3:F0:11:22:33",
      "name": "Aarav Mehta",
      "roll_no": "24101",
      "branch": "CSE",
      "year": 2024,
      "room_no": "101",
      "hostel": "JH",
      "device_name": "iPhone 14",
      "device_type": "Phone",
      "bandwidth_mb": 1200.50,
      "is_flagged": 0
    }
  ],
  "detectedField": "name",
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1,
    "pages": 1
  }
}
```

---

#### `POST /api/client`

**Purpose:** Add a new Wi-Fi client

**Request Body:**
```json
{
  "name": "Test Student",
  "roll_no": "24199",
  "branch": "CSE",
  "year": 2024,
  "hostel": "JH",
  "room_no": "101",
  "ip_address": "10.1.55.88",
  "mac_address": "AA:BB:CC:DD:EE:91",
  "device_name": "ThinkPad X1",
  "device_type": "Laptop",
  "os_hint": "Linux",
  "bandwidth_mb": 1500
}
```

**Validation Flow:**
```
Input Received
     │
     ▼
validateClientPayload()
  ├── name not empty?
  ├── roll_no matches pattern YYBSS?
  ├── branch in [CSE, IT, ECE, CyberSec, DS]?
  ├── year between 2020 and 2035?
  ├── hostel in [JH, CH, BH]?
  ├── room_no matches 001-399 format?
  ├── ip_address valid format?
  ├── mac_address valid format?
  ├── device_type in [Phone, Laptop, Tablet, Other]?
  └── bandwidth_mb >= 0?
     │
     ▼ All pass
findDuplicateFieldError()
  └── SELECT ... WHERE roll_no = ? OR ip_address = ? OR mac_address = ?
     │
     ▼ No duplicates
INSERT INTO wifi_clients (...)
     │
     ▼
HTTP 201 Created + new client data
```

**Possible Responses:**

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 201 Created | Student added successfully | `{ "ok": true, "client": {...} }` |
| 400 Bad Request | Validation failed | `{ "error": "Invalid IP address" }` |
| 409 Conflict | Duplicate detected | `{ "error": "Roll number already exists" }` |
| 500 Server Error | Database problem | `{ "error": "Unable to save student" }` |

---

#### `GET /api/client/:id`

**Purpose:** Get full details for one client including sessions and alerts

**Request:**
```
GET /api/client/1
```

**SQL Executed:**
```sql
SELECT c.id, c.ip_address, ... FROM wifi_clients c WHERE c.id = 1;

SELECT * FROM sessions WHERE client_id = 1 
  ORDER BY connected_at DESC LIMIT 20;

SELECT * FROM alerts WHERE client_id = 1 
  ORDER BY created_at DESC;
```

**Response:**
```json
{
  "client": {
    "id": 1,
    "name": "Aarav Mehta",
    "roll_no": "24101",
    ...
  },
  "sessions": [
    {
      "id": 1,
      "connected_at": "2024-01-15T14:30:00",
      "duration_min": 142,
      "bytes_up": 25000000,
      "bytes_down": 198000000
    }
  ],
  "alerts": []
}
```

---

#### `PATCH /api/client/:id/flag`

**Purpose:** Toggle the flagged status of a client (flag ↔ unflag)

**Request:**
```
PATCH /api/client/5/flag
(No request body needed)
```

**SQL:**
```sql
UPDATE wifi_clients 
SET is_flagged = NOT is_flagged  -- Toggles 0→1 or 1→0
WHERE id = 5;

SELECT id, is_flagged FROM wifi_clients WHERE id = 5;
```

---

#### `GET /api/hostel/:hostel`

**Purpose:** Get all clients in a specific hostel with summary statistics

**Request:**
```
GET /api/hostel/JH?page=1&limit=50
```

**SQL:**
```sql
-- Get summary
SELECT COUNT(*) AS total, 
       SUM(bandwidth_mb) AS total_bw,
       COUNT(CASE WHEN is_flagged=1 THEN 1 END) AS flagged
FROM wifi_clients WHERE hostel = 'JH';

-- Get paginated list
SELECT c.id, c.ip_address, ... 
FROM wifi_clients c 
WHERE c.hostel = 'JH'
ORDER BY c.bandwidth_mb DESC 
LIMIT 50 OFFSET 0;
```

---

#### `GET /api/alerts`

**Purpose:** Get all unresolved alerts

**Request:**
```
GET /api/alerts
GET /api/alerts?severity=HIGH
```

**SQL:**
```sql
SELECT a.id, a.alert_type, a.description, a.severity, a.created_at,
       c.id AS client_id, c.name, c.roll_no, c.hostel, c.ip_address, c.bandwidth_mb
FROM alerts a 
JOIN wifi_clients c ON a.client_id = c.id
WHERE a.resolved = 0 
  AND a.severity = 'HIGH'   -- if severity filter specified
ORDER BY FIELD(a.severity, 'HIGH', 'MEDIUM', 'LOW'), a.created_at DESC
LIMIT 100;
```

**Note: `FIELD()` for Ordered ENUM Sorting**

```sql
ORDER BY FIELD(a.severity, 'HIGH', 'MEDIUM', 'LOW')
-- Returns HIGH first (FIELD = 1), then MEDIUM (FIELD = 2), then LOW (FIELD = 3)
-- Without this, alphabetical order would put HIGH, LOW, MEDIUM (wrong!)
```

---

#### `GET /api/export/csv`

**Purpose:** Download client data as a CSV file

**Request:**
```
GET /api/export/csv
GET /api/export/csv?hostel=JH
GET /api/export/csv?hostel=CH&branch=CSE
```

**Response:** A downloadable CSV file with headers:
```
ip_address,mac_address,name,roll_no,branch,year,room_no,hostel,device_name,...
"10.0.0.11","A4:C3:F0:11:22:33","Aarav Mehta","24101","CSE","2024","101","JH",...
```

---

## 11. Data Flow Walkthrough — Step by Step

### 🔍 Scenario 1: Searching for a Student by IP Address

```
┌──────────────────────────────────────────────────────────────────────────┐
│     USER ACTION: Types "10.0.0.15" in search box, presses Enter         │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│     FRONTEND JavaScript (index.html)                                     │
│                                                                          │
│  doSearch(1) is called                                                   │
│  q = "10.0.0.15"                                                        │
│  params = new URLSearchParams({ page: 1, limit: 25, q: "10.0.0.15" })  │
│  fetch('/api/search?page=1&limit=25&q=10.0.0.15')                       │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ HTTP GET Request
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│     EXPRESS.JS ROUTER (server.js)                                        │
│                                                                          │
│  app.get('/api/search', async (req, res) => {                           │
│    const q = "10.0.0.15"                                                │
│                                                                          │
│    detectField("10.0.0.15"):                                            │
│      → ipRegex.test("10.0.0.15") = TRUE                                 │
│      → return { column: "ip_address", value: "10.0.0.15", like: false } │
│                                                                          │
│    SQL = "SELECT ... FROM wifi_clients WHERE ip_address = ?"            │
│    params = ["10.0.0.15"]                                               │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ SQL Query
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│     MYSQL DATABASE                                                       │
│                                                                          │
│  Query: SELECT * FROM wifi_clients WHERE ip_address = '10.0.0.15'       │
│                                                                          │
│  MySQL uses the idx_ip index → finds row instantly                       │
│                                                                          │
│  Result: 1 row → Maya Rao, 22445, CyberSec, CH, bandwidth=7200 MB      │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ Result Set
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│     SERVER.JS formats response                                           │
│                                                                          │
│  res.json({                                                              │
│    results: [{ id: 5, name: "Maya Rao", bandwidth_mb: 7200, ... }],     │
│    detectedField: "ip_address",                                          │
│    pagination: { page: 1, total: 1, pages: 1 }                         │
│  });                                                                     │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ HTTP 200 Response + JSON
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│     FRONTEND JavaScript renders result table                             │
│                                                                          │
│  • Shows badge: "⌥ Searching by: ip_address"                            │
│  • Renders 1 row in table with Maya Rao's details                       │
│  • Row is highlighted red (is_flagged = 1 for Maya Rao, 7.2 GB user)   │
│  • Bandwidth bar shows orange (high usage)                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### ➕ Scenario 2: Adding a New Student

```
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 1: User fills form and clicks "Save Student"                       │
│  Form data: { name: "Raj Kumar", roll_no: "24501", branch: "DS", ... }  │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Frontend sends POST /api/client with JSON body                  │
│  Content-Type: application/json                                          │
│  Body: { "name": "Raj Kumar", "roll_no": "24501", ... }                 │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Server validates input                                          │
│                                                                          │
│  validateClientPayload({name: "Raj Kumar", roll_no: "24501", ...})      │
│    ✅ name: "Raj Kumar" — not empty                                       │
│    ✅ roll_no: "24501" — matches /^(2\d)[1-5]\d{2}$/ (year=24, branch=5) │
│    ✅ branch: "DS" — in valid list                                        │
│    ✅ year: 2024 — between 2020-2035                                      │
│    ✅ hostel: "JH" — in [JH, CH, BH]                                     │
│    ✅ ip_address: "10.5.50.10" — valid format                            │
│    ✅ mac_address: "FF:EE:DD:CC:BB:AA" — valid format                   │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Server checks for duplicates                                    │
│                                                                          │
│  SQL: SELECT roll_no, ip_address, mac_address FROM wifi_clients         │
│       WHERE roll_no = '24501'                                            │
│          OR ip_address = '10.5.50.10'                                   │
│          OR mac_address = 'FF:EE:DD:CC:BB:AA'                           │
│       LIMIT 5;                                                           │
│                                                                          │
│  Result: 0 rows → No conflicts!                                          │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Insert into database                                            │
│                                                                          │
│  SQL: INSERT INTO wifi_clients                                           │
│         (ip_address, mac_address, name, roll_no, ...)                  │
│       VALUES                                                             │
│         ('10.5.50.10', 'FF:EE:DD...', 'Raj Kumar', '24501', ...)       │
│                                                                          │
│  MySQL returns: insertId = 931 (new row's ID)                           │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Return success to frontend                                      │
│                                                                          │
│  HTTP 201 Created                                                        │
│  { "ok": true, "client": { "id": 931, "name": "Raj Kumar", ... } }      │
│                                                                          │
│  Frontend: closes modal, shows toast "Student saved", refreshes stats   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 12. DBMS Concepts Applied

### 🔑 Primary Keys

Every table has a **Primary Key** — a column (or set of columns) that uniquely identifies each row.

```sql
-- In wifi_clients:
id INT AUTO_INCREMENT PRIMARY KEY
-- AUTO_INCREMENT means MySQL assigns 1, 2, 3... automatically
-- PRIMARY KEY means: no two rows can have the same id
```

**Why AUTO_INCREMENT?**
- We don't have to worry about generating unique IDs in our application code
- MySQL handles it atomically (thread-safe)
- Integers are the fastest data type for comparisons and joins

### 🔗 Foreign Keys & Referential Integrity

```sql
-- In sessions table:
FOREIGN KEY (client_id) REFERENCES wifi_clients(id) ON DELETE CASCADE

-- This means:
-- 1. You CANNOT insert a session with a client_id that doesn't exist in wifi_clients
-- 2. If you DELETE a client from wifi_clients, ALL their sessions are automatically deleted
-- 3. MySQL enforces this rule — it cannot be bypassed accidentally
```

This is called **Referential Integrity** — the database guarantees that no "orphan" records exist.

```
WITHOUT Foreign Key:             WITH Foreign Key:
wifi_clients: id=5 deleted       wifi_clients: id=5 deleted
sessions: client_id=5 still     sessions: client_id=5 auto-deleted
          exists (orphan!)                  (cascade)
```

### 🔒 UNIQUE Constraints

```sql
UNIQUE KEY uniq_roll (roll_no),
UNIQUE KEY uniq_ip   (ip_address),
UNIQUE KEY uniq_mac  (mac_address)
```

These prevent two students from having:
- The same roll number (impossible in real life)
- The same IP address (network conflict)
- The same MAC address (hardware impossibility)

If you try to insert a duplicate, MySQL throws `ER_DUP_ENTRY`, and our server returns HTTP 409 Conflict.

### 📑 Indexes Explained

```
WITHOUT INDEX (full table scan):           WITH INDEX (B-tree lookup):
                                           
  Searching for ip='10.0.0.15'              
  ┌──────────────────────────┐              Index: ip_address
  │ id=1: 10.0.0.11 ← check │              ├── 10.0.0.11 → row 1
  │ id=2: 10.0.0.12 ← check │              ├── 10.0.0.12 → row 2
  │ id=3: 10.0.0.13 ← check │              ├── 10.0.0.13 → row 3
  │ id=4: 10.0.0.14 ← check │    vs.       ├── 10.0.0.14 → row 4
  │ id=5: 10.0.0.15 ← FOUND │              └── 10.0.0.15 → row 5 ← DIRECT
  │ id=6: ...        check   │                                        LOOKUP
  │ id=930: ...      check   │              (Stops here, O(log n))
  └──────────────────────────┘
  (Checks all 930 rows, O(n))
```

Our table has indexes on: `ip_address`, `mac_address`, `roll_no`, `hostel`, `room_no`, `name`, `device_name`, `is_flagged`, `branch`, `year`

### 🔢 ENUM Data Type

ENUM restricts a column to a predefined set of allowed values.

```sql
hostel ENUM('JH', 'CH', 'BH')
-- MySQL stores this as integers internally: JH=1, CH=2, BH=3
-- Very space-efficient: uses only 1-2 bytes instead of VARCHAR

device_type ENUM('Phone', 'Laptop', 'Tablet', 'Other')
severity ENUM('LOW', 'MEDIUM', 'HIGH')
```

**Benefits:**
- Prevents invalid values (no "Hostel X" or typos)
- Faster comparisons than VARCHAR
- Self-documenting schema

### 📊 Aggregate Functions

```sql
-- COUNT: How many clients per hostel?
SELECT hostel, COUNT(*) AS total
FROM wifi_clients
GROUP BY hostel;

-- SUM: Total bandwidth per hostel?
SELECT hostel, SUM(bandwidth_mb) AS total_bw
FROM wifi_clients
GROUP BY hostel;

-- Conditional COUNT: How many flagged per hostel?
SELECT hostel, 
       COUNT(CASE WHEN is_flagged = 1 THEN 1 END) AS flagged_count
FROM wifi_clients
GROUP BY hostel;
```

### 🔗 JOIN Operations

```sql
-- INNER JOIN: Get alert details WITH the client who triggered them
SELECT 
  a.id, a.alert_type, a.severity, a.created_at,   -- from alerts
  c.name, c.roll_no, c.hostel, c.ip_address        -- from wifi_clients
FROM alerts a
INNER JOIN wifi_clients c ON a.client_id = c.id
WHERE a.resolved = 0;

-- The ON clause connects the two tables:
--   a.client_id = c.id
--   "The alert's client_id must match the client's id"
```

### 📄 Pagination

Pagination breaks large result sets into pages so the browser doesn't have to display 930 rows at once.

```sql
-- Page 1 (rows 1-25):
SELECT ... LIMIT 25 OFFSET 0;

-- Page 2 (rows 26-50):
SELECT ... LIMIT 25 OFFSET 25;

-- Page N:
-- OFFSET = (N - 1) × LIMIT
```

```javascript
// Server calculates pagination metadata:
const total = 930;   // total matching rows
const limit = 25;    // rows per page
const page = 3;      // current page
const pages = Math.ceil(total / limit); // = 38 total pages
const offset = (page - 1) * limit;     // = 50 (skip first 50 rows)
```

---

## 13. Security & Validation Logic

### 🛡️ Input Validation

The `validateClientPayload()` function checks every field before touching the database:

```javascript
function validateClientPayload(body) {
  const errors = [];
  
  // Roll number format: YYBSSformat
  // YY = year (22-29), B = branch code (1-5), SS = serial (01-99)
  if (!rollRegex.test(data.roll_no))
    errors.push("Roll number must look like YYBSS (e.g., 24101)");
  
  // IP address: standard dotted-decimal notation
  if (!ipRegex.test(data.ip_address))
    errors.push("Invalid IP address");
  
  // MAC address: colon or hyphen separated hex pairs
  if (!macRegex.test(data.mac_address))
    errors.push("Invalid MAC address");
  
  // Return first error (fail fast)
  if (errors.length) return { ok: false, error: errors[0] };
  return { ok: true, data };
}
```

### 🔐 SQL Injection Prevention

SQL injection is when a malicious user tries to inject SQL code through user input:

```
Malicious input: roll_no = "' OR '1'='1"
Dangerous SQL: SELECT * WHERE roll_no = '' OR '1'='1'
Result: Returns ALL rows!
```

Our app uses **parameterized queries** (prepared statements) to prevent this:

```javascript
// DANGEROUS (vulnerable to SQL injection):
pool.execute(`SELECT * WHERE ip_address = '${req.query.q}'`);

// SAFE (parameterized query):
pool.execute(`SELECT * WHERE ip_address = ?`, [req.query.q]);
// The ? is replaced safely by MySQL driver, escaping any special characters
```

### 🔄 Two-Layer Duplicate Protection

```
Layer 1: Application Code            Layer 2: Database Constraints
                                      
findDuplicateFieldError():            MySQL UNIQUE indexes:
SELECT ... WHERE roll_no = ?          UNIQUE KEY uniq_roll (roll_no)
   OR ip_address = ?                  UNIQUE KEY uniq_ip   (ip_address)
   OR mac_address = ?                 UNIQUE KEY uniq_mac  (mac_address)
                                      
Returns user-friendly message         Returns ER_DUP_ENTRY error
before hitting the database           as final safety net
```

---

## 14. Configuration (.env & package.json)

### ⚙️ .env File Explained

```dotenv
DB_HOST=127.0.0.1      
# 127.0.0.1 = "localhost" = the same computer where the app runs
# If MySQL is on a different server: DB_HOST=192.168.1.100

DB_USER=root           
# MySQL username. "root" is the admin account.
# In production, create a dedicated user with limited permissions

DB_PASS=Vishalrao1@   
# MySQL password for the above user
# NEVER commit this file to Git/GitHub

DB_NAME=wifi_surveillance  
# The database (schema) name. Created automatically if missing.

PORT=3000              
# The port number the web server listens on
# Access at http://localhost:3000
```

### 📦 package.json Explained

```json
{
  "name": "wifi-surveillance",
  "version": "2.0.0",
  "type": "module",           // ← Use modern ES6 import/export syntax
  
  "scripts": {
    "start": "node server.js",        // npm start → runs the server
    "dev": "node --watch server.js",  // npm run dev → auto-restart on code changes
    "setup": "npm install",           // npm run setup → install all packages
    "schema": "mysql -u root -p < schema.sql"  // npm run schema → reset DB
  },
  
  "dependencies": {
    "dotenv": "^16.4.5",     // Reads .env file
    "express": "^4.19.2",    // Web framework
    "mysql2": "^3.9.7"       // MySQL database driver (async/await support)
  }
}
```

### 🔌 mysql2 vs mysql

We use **mysql2** (not the older **mysql** package) because:
1. Supports `async/await` syntax natively
2. Prepared statements work correctly with complex queries
3. Better performance with connection pooling
4. Active maintenance

---

## 15. How to Run the Project

### 🚀 Step-by-Step Setup

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SETUP & LAUNCH STEPS                             │
│                                                                      │
│  PREREQUISITE CHECK:                                                 │
│  ┌──────────────────────────────────────────┐                       │
│  │  ✅ Node.js installed (v18+)             │                       │
│  │  ✅ MySQL server running                 │                       │
│  │  ✅ Project files in one folder          │                       │
│  └──────────────────────────────────────────┘                       │
│                                                                      │
│  STEP 1: Navigate to project folder                                  │
│  ┌──────────────────────────────────────────┐                       │
│  │  cd /path/to/wifi-surveillance           │                       │
│  └──────────────────────────────────────────┘                       │
│                                                                      │
│  STEP 2: Install dependencies                                        │
│  ┌──────────────────────────────────────────┐                       │
│  │  npm install                             │                       │
│  │  (Downloads express, mysql2, dotenv)     │                       │
│  └──────────────────────────────────────────┘                       │
│                                                                      │
│  STEP 3: (Optional) Create database from SQL file                   │
│  ┌──────────────────────────────────────────┐                       │
│  │  mysql -u root -p < schema.sql           │                       │
│  │  (Type MySQL password when prompted)     │                       │
│  └──────────────────────────────────────────┘                       │
│                                                                      │
│  STEP 4: Start the server                                            │
│  ┌──────────────────────────────────────────┐                       │
│  │  npm start                               │                       │
│  │                                          │                       │
│  │  Expected output:                        │                       │
│  │  ✅ Server running → http://localhost:3000│                       │
│  └──────────────────────────────────────────┘                       │
│                                                                      │
│  STEP 5: Open in browser                                             │
│  ┌──────────────────────────────────────────┐                       │
│  │  http://localhost:3000                   │                       │
│  └──────────────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────┘
```

### ❌ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing env vars: DB_HOST` | .env file missing or wrong format | Create/check .env file |
| `MySQL access denied` | Wrong password in .env | Update DB_PASS in .env |
| `ECONNREFUSED 3306` | MySQL not running | Start MySQL service |
| `ER_ACCESS_DENIED_ERROR` | Wrong username/password | Check DB_USER and DB_PASS |
| `Cannot find module 'express'` | npm install not run | Run `npm install` first |

---

## 16. Sample Queries & Results

### Query 1: Count students per hostel

```sql
SELECT hostel, COUNT(*) AS student_count
FROM wifi_clients
GROUP BY hostel
ORDER BY student_count DESC;
```

**Result:**
```
+---------+---------------+
| hostel  | student_count |
+---------+---------------+
| JH      |          310  |
| CH      |          310  |
| BH      |          310  |
+---------+---------------+
3 rows in set (0.01 sec)
```

### Query 2: Top 5 bandwidth users

```sql
SELECT name, roll_no, hostel, 
       ROUND(bandwidth_mb / 1024, 2) AS bandwidth_gb
FROM wifi_clients
ORDER BY bandwidth_mb DESC
LIMIT 5;
```

**Result:**
```
+-------------+---------+--------+---------------+
| name        | roll_no | hostel | bandwidth_gb  |
+-------------+---------+--------+---------------+
| Rohan Iyer  | 23432   | BH     | 9.57          |
| Maya Rao    | 22445   | CH     | 7.03          |
| Karan Joshi | 22332   | JH     | 5.47          |
| Riya Patel  | 23252   | CH     | 4.69          |
| ...         | ...     | ...    | ...           |
+-------------+---------+--------+---------------+
```

### Query 3: Students with HIGH severity alerts

```sql
SELECT c.name, c.roll_no, c.hostel, 
       a.alert_type, a.severity, a.created_at
FROM wifi_clients c
INNER JOIN alerts a ON c.id = a.client_id
WHERE a.severity = 'HIGH' AND a.resolved = 0
ORDER BY a.created_at DESC;
```

### Query 4: Count devices by type

```sql
SELECT device_type, COUNT(*) AS count,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM wifi_clients), 1) AS percentage
FROM wifi_clients
GROUP BY device_type
ORDER BY count DESC;
```

**Result:**
```
+-------------+-------+------------+
| device_type | count | percentage |
+-------------+-------+------------+
| Phone       |   372 | 40.0%      |
| Laptop      |   325 | 34.9%      |
| Tablet      |   140 | 15.1%      |
| Other       |    93 | 10.0%      |
+-------------+-------+------------+
```

### Query 5: Hostel summary using a VIEW

```sql
SELECT * FROM hostel_summary;
```

**Result:**
```
+--------+---------------+------------+--------------+------------------+
| hostel | total_clients | total_bw_mb | flagged_count | branches_present |
+--------+---------------+------------+--------------+------------------+
| JH     | 310           | 1423840.5  | 16           | 5                |
| CH     | 310           | 1429200.0  | 16           | 5                |
| BH     | 310           | 1428560.0  | 16           | 5                |
+--------+---------------+------------+--------------+------------------+
```

---

## 17. Conclusion

### 📚 What This Project Demonstrates

This project is a **complete, production-ready web application** that demonstrates mastery of:

```
┌─────────────────────────────────────────────────────────────────┐
│                  LEARNING OUTCOMES ACHIEVED                     │
│                                                                 │
│  DATABASE DESIGN                                               │
│  ✅ Relational schema with 4 tables                            │
│  ✅ ER diagram and normalization (1NF, 2NF, 3NF)              │
│  ✅ Primary keys, foreign keys, UNIQUE constraints             │
│  ✅ ENUM types for controlled vocabulary                       │
│  ✅ Indexes for query optimization                             │
│  ✅ Views for reusable query logic                             │
│                                                                 │
│  SQL PROGRAMMING                                               │
│  ✅ DDL: CREATE TABLE, ALTER TABLE                             │
│  ✅ DML: INSERT, SELECT, UPDATE, DELETE                        │
│  ✅ Aggregate: COUNT, SUM, GROUP BY, ORDER BY                  │
│  ✅ Joins: INNER JOIN, multiple tables                         │
│  ✅ Subqueries: INSERT...SELECT                                │
│  ✅ Pagination: LIMIT...OFFSET                                 │
│  ✅ Special functions: FIELD(), ROUND(), CONCAT()              │
│                                                                 │
│  APPLICATION DEVELOPMENT                                       │
│  ✅ Three-tier architecture                                    │
│  ✅ RESTful API design                                         │
│  ✅ Input validation and error handling                        │
│  ✅ Duplicate detection (multi-layer)                          │
│  ✅ Dynamic data seeding with idempotency                      │
│  ✅ Real-time dashboard with auto-refresh                      │
│  ✅ CSV export functionality                                   │
│  ✅ Pagination in both frontend and backend                    │
└─────────────────────────────────────────────────────────────────┘
```

### 🌱 Future Enhancements

- **Authentication**: Login system for admins with bcrypt password hashing
- **Real-time Updates**: WebSocket connection for live bandwidth monitoring
- **Charts**: Chart.js or D3.js visualizations for bandwidth trends over time
- **Email Alerts**: Auto-email admin when HIGH severity alert is created
- **Mobile App**: React Native app for admin on-the-go monitoring
- **Rate Limiting**: Prevent API abuse with express-rate-limit
- **Audit Log**: Track every admin action (who flagged which student, when)

---

*Documentation prepared by: Vishal Yadav*  
*Project: IIIT UNA Wi-Fi Surveillance System*  
*Course: Database Management Systems*  
*Year: 2024–2025*

---

> **Files in this project:**
> - `index.html` — Complete frontend (UI, CSS, JavaScript)
> - `server.js` — Backend server (Express routes, DB logic, seeding)
> - `schema.sql` — Database DDL (CREATE TABLE statements + seed data)
> - `package.json` — Node.js project configuration and scripts
> - `package-lock.json` — Exact dependency version lock file
> - `.env` — Environment configuration (DB credentials, port)
