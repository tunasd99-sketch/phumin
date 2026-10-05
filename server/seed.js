// รันครั้งเดียวหลังสร้างตารางแล้ว เพื่อใส่ข้อมูลตัวอย่าง: npm run seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log("กำลังใส่ข้อมูลตัวอย่าง...");

    await conn.query(
      `INSERT IGNORE INTO activity_types (id, name) VALUES
       ('AT1','เข้าค่าย'), ('AT2','กีฬาสี'), ('AT3','จิตอาสา'), ('AT4','ชุมนุม')`
    );

    await conn.query(
      `INSERT IGNORE INTO academic_years (id, label) VALUES
       ('AY1','2567'), ('AY2','2568')`
    );

    await conn.query(
      `INSERT IGNORE INTO teachers (id, name) VALUES
       ('T1','อาจารย์สมศรี ใจงาม'),
       ('T2','อาจารย์วิชัย พัฒนกิจ'),
       ('T3','อาจารย์มานะ อดทน')`
    );

    await conn.query(
      `INSERT IGNORE INTO students (id, name, major) VALUES
       ('S1','สมชาย ใจดี','วิศวกรรมคอมพิวเตอร์ ปี 2'),
       ('S2','สมหญิง รักเรียน','วิศวกรรมคอมพิวเตอร์ ปี 2'),
       ('S3','อรุณ แจ่มใส','บริหารธุรกิจ ปี 3')`
    );

    await conn.query(
      `INSERT IGNORE INTO activities (id, name, type_id, activity_date, activity_time, location, year_id) VALUES
       ('A1','ค่ายวิทยาศาสตร์','AT1','2025-08-10','08:00','หอประชุม','AY2'),
       ('A2','กีฬาสีประจำปี','AT2','2025-09-05','08:30','สนามกีฬา','AY2')`
    );

    await conn.query(
      `INSERT IGNORE INTO activity_teachers (activity_id, teacher_id, role) VALUES
       ('A1','T1','หัวหน้ากิจกรรม'),
       ('A1','T2','ผู้ช่วย'),
       ('A2','T3','หัวหน้ากิจกรรม')`
    );

    // รหัสผ่านตัวอย่าง: admin123 / staff123 / student123
    const [adminHash, staffHash, studentHash] = await Promise.all([
      bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin123", 10),
      bcrypt.hash(process.env.SEED_STAFF_PASSWORD || "staff123", 10),
      bcrypt.hash(process.env.SEED_STUDENT_PASSWORD || "student123", 10),
    ]);

    await conn.query(
      `INSERT IGNORE INTO users (username, password_hash, name, role, student_id) VALUES
       ('admin', ?, 'ผู้ดูแลระบบ', 'admin', NULL),
       ('staff', ?, 'อาจารย์สมศรี ใจงาม', 'staff', NULL),
       ('student1', ?, 'สมชาย ใจดี', 'student', 'S1')`,
      [adminHash, staffHash, studentHash]
    );

    await conn.query(
      `INSERT IGNORE INTO participations (student_id, activity_id, status, score, hours, record_date, recorded_by) VALUES
       ('S1','A1','เข้าร่วมแล้ว',8,6,'2025-08-10',1),
       ('S2','A1','เข้าร่วมแล้ว',9,6,'2025-08-10',1),
       ('S1','A2','ลงทะเบียน',0,0,'2025-08-01',NULL)`
    );

    console.log("ใส่ข้อมูลตัวอย่างสำเร็จ");
    console.log("บัญชีทดลอง: admin/admin123, staff/staff123, student1/student123");
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err.message);
  } finally {
    conn.release();
    pool.end();
  }
}

seed();
