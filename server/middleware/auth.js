const jwt = require("jsonwebtoken");

/** ตรวจ JWT token จาก header: Authorization: Bearer <token> */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, username, name, role, studentId }
    next();
  } catch (err) {
    return res.status(401).json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}

/** ใช้ต่อจาก requireAuth: จำกัดเฉพาะ role ที่กำหนด เช่น requireRole('admin') */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
