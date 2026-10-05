const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/reports/activities — สรุปแต่ละกิจกรรม: จำนวนผู้ลงทะเบียน/เข้าร่วม/คะแนนเฉลี่ย
router.get("/activities", requireAuth, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      a.id, a.name, t.name AS type_name,
      COUNT(p.student_id) AS total_registered,
      SUM(CASE WHEN p.status = 'เข้าร่วมแล้ว' THEN 1 ELSE 0 END) AS total_attended,
      ROUND(AVG(p.score), 1) AS avg_score
    FROM activities a
    JOIN activity_types t ON t.id = a.type_id
    LEFT JOIN participations p ON p.activity_id = a.id
    GROUP BY a.id, a.name, t.name
    ORDER BY a.activity_date DESC
  `);
  res.json(rows);
});

// GET /api/reports/students — คะแนน/ชั่วโมงสะสมของนักศึกษาแต่ละคน
router.get("/students", requireAuth, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      s.id, s.name, s.major,
      COUNT(p.activity_id) AS total_activities,
      COALESCE(SUM(p.score), 0) AS total_score,
      COALESCE(SUM(p.hours), 0) AS total_hours
    FROM students s
    LEFT JOIN participations p ON p.student_id = s.id
    GROUP BY s.id, s.name, s.major
    ORDER BY s.name
  `);
  res.json(rows);
});

// GET /api/reports/dashboard — ตัวเลขสรุปสำหรับหน้าแดชบอร์ด
router.get("/dashboard", requireAuth, async (req, res) => {
  const [[{ totalActivities }]] = await pool.query(
    "SELECT COUNT(*) AS totalActivities FROM activities"
  );
  const [[{ totalStudents }]] = await pool.query(
    "SELECT COUNT(*) AS totalStudents FROM students"
  );
  const [[{ totalTeachers }]] = await pool.query(
    "SELECT COUNT(*) AS totalTeachers FROM teachers"
  );
  const [[{ totalHours }]] = await pool.query(
    "SELECT COALESCE(SUM(hours),0) AS totalHours FROM participations"
  );
  const [recentActivities] = await pool.query(`
    SELECT a.id, a.name, a.activity_date, t.name AS type_name, y.label AS year_label
    FROM activities a
    JOIN activity_types t ON t.id = a.type_id
    JOIN academic_years y ON y.id = a.year_id
    ORDER BY a.activity_date DESC LIMIT 5
  `);
  res.json({ totalActivities, totalStudents, totalTeachers, totalHours, recentActivities });
});

module.exports = router;
