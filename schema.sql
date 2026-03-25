-- ============================================================
--  NetWatch Wi-Fi Surveillance — Full Schema
--  Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wifi_surveillance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wifi_surveillance;

-- ─────────────────────────────────────────
--  TABLE: wifi_clients
-- ─────────────────────────────────────────
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
--  TABLE: sessions
-- ─────────────────────────────────────────
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
--  TABLE: alerts
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  client_id   INT NOT NULL,
  alert_type  ENUM('HIGH_BANDWIDTH','MULTIPLE_DEVICES','UNKNOWN_MAC','AFTER_HOURS','SPOOFED_IP') NOT NULL,
  description TEXT,
  severity    ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'LOW',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved    TINYINT(1) NOT NULL DEFAULT 0,

  FOREIGN KEY (client_id) REFERENCES wifi_clients(id) ON DELETE CASCADE,
  INDEX idx_alert_client   (client_id),
  INDEX idx_alert_type     (alert_type),
  INDEX idx_alert_severity (severity),
  INDEX idx_alert_resolved (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
--  TABLE: routers
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routers (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(60) NOT NULL,
  hostel                ENUM('JH','CH','BH') NOT NULL,
  location              VARCHAR(120) NOT NULL,
  ip_address            VARCHAR(45) NOT NULL,
  status                ENUM('ONLINE','MAINTENANCE','OFFLINE') NOT NULL DEFAULT 'ONLINE',
  bandwidth_last_day_mb DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_checked          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_router_name (name),
  INDEX idx_router_hostel (hostel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────
--  SEED DATA — Core records
-- ─────────────────────────────────────────
INSERT INTO wifi_clients
  (ip_address, mac_address, name, roll_no, branch, year, room_no, hostel, device_name, device_type, os_hint, bandwidth_mb)
VALUES
  ('10.0.0.11','A4:C3:F0:11:22:33','Aarav Mehta',  '24101','CSE',     2024,'101','JH','iPhone 14',        'Phone', 'iOS',    1200.50),
  ('10.0.0.12','B8:27:EB:44:55:66','Riya Patel',   '23252','IT',      2023,'202','CH','MacBook Air M2',    'Laptop','macOS',  4800.00),
  ('10.0.0.13','DC:A6:32:77:88:99','Kabir Singh',  '25334','ECE',     2025,'305','BH','Dell XPS 15',       'Laptop','Windows',3100.75),
  ('10.0.0.14','E4:5F:01:AA:BB:CC','Ishan Verma',  '24123','CSE',     2024,'125','JH','iPad Pro 12.9',     'Tablet','iPadOS', 980.20),
  ('10.0.0.15','F8:1A:67:DD:EE:FF','Maya Rao',     '22445','CyberSec',2022,'018','CH','ThinkPad T14s',     'Laptop','Linux',  7200.00),
  ('10.0.0.16','3C:22:FB:10:20:30','Dev Khanna',   '23332','ECE',     2023,'219','BH','OnePlus 11',        'Phone', 'Android',650.90),
  ('10.0.0.17','AC:87:A3:40:50:60','Sara Thomas',  '25112','CSE',     2025,'320','JH','Surface Laptop 5',  'Laptop','Windows',2900.00),
  ('10.0.0.18','60:F1:89:70:80:90','Arjun Nair',   '24255','IT',      2024,'112','CH','Galaxy S23 Ultra',  'Phone', 'Android',1450.30),
  ('10.0.0.19','00:1A:2B:3C:4D:5E','Neha Gupta',   '23125','CSE',     2023,'223','BH','iPhone 13 Pro',     'Phone', 'iOS',    880.60),
  ('10.0.0.20','11:22:33:44:55:66','Vikram Das',   '22131','CSE',     2022,'101','CH','iPad Air 5',        'Tablet','iPadOS', 540.00),
  ('10.0.1.01','22:33:44:55:66:77','Priya Sharma', '24532','DS',      2024,'115','JH','Pixel 7 Pro',       'Phone', 'Android',2100.40),
  ('10.0.1.02','33:44:55:66:77:88','Rohan Iyer',   '23432','DS',      2023,'309','BH','Asus ROG Zephyrus', 'Laptop','Windows',9800.00),
  ('10.0.1.03','44:55:66:77:88:99','Ananya Bose',  '25231','IT',      2025,'215','CH','Redmi Note 12 Pro', 'Phone', 'Android',390.75),
  ('10.0.1.04','55:66:77:88:99:AA','Karan Joshi',  '22332','ECE',     2022,'022','JH','MacBook Pro 14',    'Laptop','macOS',  5600.00),
  ('10.0.1.05','66:77:88:99:AA:BB','Divya Malik',  '24431','CyberSec',2024,'118','CH','Realme GT 3',       'Phone', 'Android',720.10);

-- Seed router inventory used by dashboard stats
INSERT INTO routers
  (name, hostel, location, ip_address, status, bandwidth_last_day_mb, last_checked)
VALUES
  ('JH-Core-01','JH','North Wing Rooftop','10.10.10.1','ONLINE',      820.50, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  ('JH-Core-02','JH','Library Annex',      '10.10.10.2','ONLINE',      640.20, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  ('JH-Aux-01', 'JH','Ground Floor Hub',   '10.10.10.3','MAINTENANCE', 120.00, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
  ('CH-Core-01','CH','South Wing Rooftop', '10.20.20.1','ONLINE',      910.70, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  ('CH-Core-02','CH','Mess Hall',          '10.20.20.2','ONLINE',      705.60, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  ('CH-Aux-01', 'CH','Workshop Block',     '10.20.20.3','ONLINE',      310.40, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
  ('BH-Core-01','BH','Central Tower',      '10.30.30.1','ONLINE',      780.90, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  ('BH-Core-02','BH','Lab Corridor',       '10.30.30.2','ONLINE',      655.20, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  ('BH-Aux-01', 'BH','Auditorium',         '10.30.30.3','OFFLINE',      95.00, DATE_SUB(NOW(), INTERVAL 8 HOUR))
ON DUPLICATE KEY UPDATE
  hostel = VALUES(hostel),
  location = VALUES(location),
  ip_address = VALUES(ip_address),
  status = VALUES(status),
  bandwidth_last_day_mb = VALUES(bandwidth_last_day_mb),
  last_checked = VALUES(last_checked);

-- Auto-generate HIGH_BANDWIDTH alerts for heavy users
INSERT INTO alerts (client_id, alert_type, description, severity)
SELECT id, 'HIGH_BANDWIDTH',
       CONCAT('Client used ', ROUND(bandwidth_mb,0), ' MB — exceeds 5 GB policy threshold'),
       'HIGH'
FROM wifi_clients
WHERE bandwidth_mb > 5000;

-- ─────────────────────────────────────────
--  USEFUL VIEWS
-- ─────────────────────────────────────────

-- Summary per hostel
CREATE OR REPLACE VIEW hostel_summary AS
SELECT
  hostel,
  COUNT(*)               AS total_clients,
  SUM(bandwidth_mb)      AS total_bw_mb,
  COUNT(CASE WHEN is_flagged=1 THEN 1 END) AS flagged_count,
  COUNT(DISTINCT branch) AS branches_present
FROM wifi_clients
GROUP BY hostel;

-- Top bandwidth consumers
CREATE OR REPLACE VIEW top_consumers AS
SELECT name, roll_no, hostel, room_no, device_name, bandwidth_mb
FROM wifi_clients
ORDER BY bandwidth_mb DESC
LIMIT 20;

-- Active alerts with full client info
CREATE OR REPLACE VIEW open_alerts_view AS
SELECT
  a.id            AS alert_id,
  a.alert_type,
  a.severity,
  a.description,
  a.created_at,
  c.name,
  c.roll_no,
  c.hostel,
  c.room_no,
  c.ip_address,
  c.bandwidth_mb
FROM alerts a
JOIN wifi_clients c ON a.client_id = c.id
WHERE a.resolved = 0
ORDER BY FIELD(a.severity,'HIGH','MEDIUM','LOW'), a.created_at DESC;
