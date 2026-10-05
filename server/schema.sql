-- ========================================================================
-- RMUTR Activity Management System - Database Schema (3NF)
-- ========================================================================
-- รันไฟล์นี้ใน MySQL ก่อนเริ่มเซิร์ฟเวอร์ครั้งแรก เช่น:
--   mysql -u root -p -e "CREATE DATABASE rmutr_sams CHARACTER SET utf8mb4;"
--   mysql -u root -p rmutr_sams < schema.sql
-- ========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- ตารางหลัก (ไม่มี FK) ----------

CREATE TABLE IF NOT EXISTS activity_types (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS academic_years (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,
  label         VARCHAR(20)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teachers (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  major         VARCHAR(150) NOT NULL DEFAULT '-'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ตารางที่มี FK ชั้นที่ 1 ----------

CREATE TABLE IF NOT EXISTS activities (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  type_id       VARCHAR(20)  NOT NULL,
  activity_date DATE         NULL,
  activity_time VARCHAR(10)  NULL,
  location      VARCHAR(200) NULL,
  year_id       VARCHAR(20)  NOT NULL,
  FOREIGN KEY (type_id) REFERENCES activity_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ผู้ใช้ระบบ: แอดมิน / เจ้าหน้าที่-อาจารย์ / นักศึกษา (ผูกกับ student_id ถ้าเป็นนักศึกษา)
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(150) NOT NULL,
  role          ENUM('admin','staff','student') NOT NULL DEFAULT 'staff',
  student_id    VARCHAR(20)  NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ตารางเชื่อม (M:N) ----------

CREATE TABLE IF NOT EXISTS activity_teachers (
  activity_id   VARCHAR(20)  NOT NULL,
  teacher_id    VARCHAR(20)  NOT NULL,
  role          VARCHAR(100) NOT NULL DEFAULT 'ผู้ดูแล',
  PRIMARY KEY (activity_id, teacher_id),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id)  REFERENCES teachers(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS participations (
  student_id    VARCHAR(20)  NOT NULL,
  activity_id   VARCHAR(20)  NOT NULL,
  status        ENUM('ลงทะเบียน','เข้าร่วมแล้ว','ไม่มา') NOT NULL DEFAULT 'ลงทะเบียน',
  score         INT          NOT NULL DEFAULT 0,
  hours         INT          NOT NULL DEFAULT 0,
  record_date   DATE         NULL,
  recorded_by   INT          NULL,
  PRIMARY KEY (student_id, activity_id),
  FOREIGN KEY (student_id)  REFERENCES students(id)   ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
