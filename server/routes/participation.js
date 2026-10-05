const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/participation — แอดมิน/อาจารย์เห็นทั้งหมด, นักศึกษาเห็นแค่ของตัวเอง
router.get("/", requireAuth, async (req, res) => {
  let sql = `
    SELECT p.*, s.name AS student_name, a.name AS activity_name
    FROM participations p
    JOIN students s ON s.id = p.student_id
    JOIN activities a ON a.id = p.activity_id`;
  const params = [];
  if (req.user.role === "student") {
    sql += " WHERE p.student_id = ?";
    params.push(req.user.studentId);
  }
  sql += " ORDER BY p.record_date DESC";
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// POST /api/participation — แอดมิน/อาจารย์บันทึกผล (สร้างใหม่หรืออัปเดตถ้ามีอยู่แล้ว)
router.post("/", requireAuth, requireRole("admin", "staff"), async (req, res) => {
  const { studentId, activityId, status, score, hours, date } = req.body;
  if (!studentId || !activityId) {
    return res.status(400).json({ error: "ต้องระบุนักศึกษาและกิจกรรม" });
  }
  await pool.query(
    `INSERT INTO participations (student_id, activity_id, status, score, hours, record_date, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status), score = VALUES(score), hours = VALUES(hours),
       record_date = VALUES(record_date), recorded_by = VALUES(recorded_by)`,
    [
      studentId,
      activityId,
      status || "ลงทะเบียน",
      Number(score) || 0,
      Number(hours) || 0,
      date || new Date().toISOString().slice(0, 10),
      req.user.id,
    ]
  );
  res.status(201).json({ ok: true });
});

// POST /api/participation/self-register — นักศึกษาลงทะเบียนกิจกรรมด้วยตัวเอง
router.post("/self-register", requireAuth, requireRole("student"), async (req, res) => {
  const { activityId } = req.body;
  if (!activityId) return res.status(400).json({ error: "ต้องระบุกิจกรรม" });
  try {
    await pool.query(
      `INSERT INTO participations (student_id, activity_id, status, score, hours, record_date)
       VALUES (?, ?, 'ลงทะเบียน', 0, 0, CURDATE())`,
      [req.user.studentId, activityId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "คุณลงทะเบียนกิจกรรมนี้ไปแล้ว" });
    }
    throw err;
  }
});

// DELETE /api/participation/:studentId/:activityId — ลบประวัติ (แอดมิน/อาจารย์)
router.delete("/:studentId/:activityId", requireAuth, requireRole("admin", "staff"), async (req, res) => {
  await pool.query("DELETE FROM participations WHERE student_id = ? AND activity_id = ?", [
    req.params.studentId,
    req.params.activityId,
  ]);
  res.status(204).end();
});

module.exports = router;
