const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/users — แอดมินเท่านั้น
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.name, u.role, u.student_id, s.name AS student_name
     FROM users u LEFT JOIN students s ON s.id = u.student_id
     ORDER BY u.created_at`
  );
  res.json(rows);
});

// POST /api/users — เพิ่มผู้ใช้งาน (แอดมินเท่านั้น)
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { username, password, name, role, studentId } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
  }
  if (!["admin", "staff", "student"].includes(role)) {
    return res.status(400).json({ error: "สิทธิ์การใช้งานไม่ถูกต้อง" });
  }
  if (role === "student" && !studentId) {
    return res.status(400).json({ error: "กรุณาเลือกนักศึกษาที่จะผูกกับบัญชีนี้" });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, password_hash, name, role, student_id) VALUES (?, ?, ?, ?, ?)",
      [username, hash, name, role, role === "student" ? studentId : null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "มีชื่อผู้ใช้นี้อยู่แล้ว" });
    }
    throw err;
  }
});

// DELETE /api/users/:id — ลบผู้ใช้งาน (ห้ามลบบัญชีตัวเอง)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" });
  }
  await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

module.exports = router;
