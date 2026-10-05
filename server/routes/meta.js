// activity_types, academic_years — รายการอ้างอิงที่แอดมินจัดการได้
const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ---- Activity Types ----
router.get("/activity-types", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM activity_types ORDER BY name");
  res.json(rows);
});

router.post("/activity-types", requireAuth, requireRole("admin"), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "กรุณาระบุชื่อประเภทกิจกรรม" });
  const id = uid("AT");
  await pool.query("INSERT INTO activity_types (id, name) VALUES (?, ?)", [id, name]);
  res.status(201).json({ id, name });
});

router.delete("/activity-types/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM activity_types WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

// ---- Academic Years ----
router.get("/academic-years", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM academic_years ORDER BY label DESC");
  res.json(rows);
});

router.post("/academic-years", requireAuth, requireRole("admin"), async (req, res) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ error: "กรุณาระบุปีการศึกษา" });
  const id = uid("AY");
  await pool.query("INSERT INTO academic_years (id, label) VALUES (?, ?)", [id, label]);
  res.status(201).json({ id, label });
});

router.delete("/academic-years/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM academic_years WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

module.exports = router;
