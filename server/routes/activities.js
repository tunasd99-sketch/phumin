const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const uid = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase();

// GET /api/activities — รายการกิจกรรมทั้งหมด พร้อมชื่อประเภท/ปีการศึกษา (join)
router.get("/", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, t.name AS type_name, y.label AS year_label
     FROM activities a
     JOIN activity_types t ON t.id = a.type_id
     JOIN academic_years y ON y.id = a.year_id
     ORDER BY a.activity_date DESC`
  );
  res.json(rows);
});

// POST /api/activities — เพิ่มกิจกรรม (แอดมินเท่านั้น)
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, typeId, yearId, date, time, location } = req.body;
  if (!name || !typeId || !yearId) {
    return res.status(400).json({ error: "กรุณากรอกชื่อ ประเภท และปีการศึกษาของกิจกรรม" });
  }
  const id = uid("A");
  await pool.query(
    `INSERT INTO activities (id, name, type_id, activity_date, activity_time, location, year_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, typeId, date || null, time || null, location || null, yearId]
  );
  res.status(201).json({ id });
});

// DELETE /api/activities/:id — ลบกิจกรรม (ตารางลูกถูกลบตาม ON DELETE CASCADE)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM activities WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

module.exports = router;
