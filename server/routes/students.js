const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const uid = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase();

// GET /api/students — แอดมิน/อาจารย์เห็นทั้งหมด, นักศึกษาเห็นแค่ตัวเอง
router.get("/", requireAuth, async (req, res) => {
  let rows;
  if (req.user.role === "student") {
    [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.user.studentId]);
  } else {
    [rows] = await pool.query("SELECT * FROM students ORDER BY name");
  }
  res.json(rows);
});

// POST /api/students
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, major } = req.body;
  if (!name) return res.status(400).json({ error: "กรุณากรอกชื่อนักศึกษา" });
  const id = uid("S");
  await pool.query("INSERT INTO students (id, name, major) VALUES (?, ?, ?)", [
    id,
    name,
    major || "-",
  ]);
  res.status(201).json({ id, name, major: major || "-" });
});

// DELETE /api/students/:id
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM students WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

module.exports = router;
