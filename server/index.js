require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const metaRoutes = require("./routes/meta");
const teacherRoutes = require("./routes/teachers");
const studentRoutes = require("./routes/students");
const activityRoutes = require("./routes/activities");
const participationRoutes = require("./routes/participation");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith("change_this")) {
  console.error("ต้องตั้งค่า JWT_SECRET เป็นค่าสุ่มยาวๆ ก่อนรันเซิร์ฟเวอร์");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1); // อยู่หลัง proxy ของ cloud (ให้ rate limit เห็น IP จริง)

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  })
);
app.use(express.json());

app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
  })
);
app.use("/api/auth", authRoutes);
app.use("/api", metaRoutes); // /api/activity-types, /api/academic-years
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/participation", participationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// เสิร์ฟหน้าเว็บ frontend (ไฟล์ static ในโฟลเดอร์ ../public)
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// error handler กลาง — กันเซิร์ฟเวอร์ล่มเวลา route ไหน throw โดยไม่ได้ตั้งใจ
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  if (process.env.AUTO_SETUP === "true") {
    try {
      await require("./setup")();
    } catch (err) {
      console.error("AUTO_SETUP ล้มเหลว:", err.message);
    }
  }
  app.listen(PORT, () => {
    console.log(`RMUTR SAMS API กำลังรันที่พอร์ต ${PORT}`);
  });
}

start();
