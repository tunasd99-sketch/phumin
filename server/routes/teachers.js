const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const uid = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase();

// GET /api/teachers — รายชื่ออาจารย์ พร้อมกิจกรรมที่ดูแล
router.get("/", requireAuth, async (req, res) => {
  const [teachers] = await pool.query("SELECT * FROM teachers ORDER BY name");
  const [assigns] = await pool.query(
    `SELECT at.teacher_id, at.role, a.id AS activity_id, a.name AS activity_name
     FROM activity_teachers at JOIN activities a ON a.id = at.activity_id`
  );
  const byTeacher = {};
  assigns.forEach((row) => {
    (byTeacher[row.teacher_id] ||= []).push({
      activityId: row.activity_id,
      activityName: row.activity_name,
      role: row.role,
    });
  });
  res.json(teachers.map((t) => ({ ...t, assignments: byTeacher[t.id] || [] })));
});

// POST /api/teachers — เพิ่มอาจารย์ (แอดมินเท่านั้น)
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "กรุณากรอกชื่ออาจารย์" });
  const id = uid("T");
  await pool.query("INSERT INTO teachers (id, name) VALUES (?, ?)", [id, name]);
  res.status(201).json({ id, name });
});

// DELETE /api/teachers/:id
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM teachers WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

// POST /api/teachers/assign — มอบหมายอาจารย์ดูแลกิจกรรม
router.post("/assign", requireAuth, requireRole("admin"), async (req, res) => {
  const { activityId, teacherId, role } = req.body;
  if (!activityId || !teacherId) {
    return res.status(400).json({ error: "ต้องระบุกิจกรรมและอาจารย์" });
  }
  try {
    await pool.query(
      "INSERT INTO activity_teachers (activity_id, teacher_id, role) VALUES (?, ?, ?)",
      [activityId, teacherId, role || "ผู้ดูแล"]
    );
    res.status(201).json({ activityId, teacherId, role: role || "ผู้ดูแล" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "อาจารย์คนนี้ถูกมอบหมายกิจกรรมนี้แล้ว" });
    }
    throw err;
  }
});

module.exports = router;
