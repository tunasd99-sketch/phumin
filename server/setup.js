// สร้างตาราง + ใส่ข้อมูลตั้งต้นอัตโนมัติ (เรียกจาก index.js เมื่อ AUTO_SETUP=true)
// ปลอดภัยที่จะรันซ้ำ: schema ใช้ CREATE TABLE IF NOT EXISTS และ seed ใช้ INSERT IGNORE
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const seed = require("./seed");

module.exports = async function setup() {
  console.log("AUTO_SETUP: กำลังสร้างตาราง...");
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rmutr_sams",
    multipleStatements: true,
  });
  try {
    const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await conn.query(sql);
  } finally {
    await conn.end();
  }
  console.log("AUTO_SETUP: สร้างตารางเรียบร้อย กำลังใส่ข้อมูลตั้งต้น...");
  await seed();
  console.log("AUTO_SETUP: เสร็จสิ้น");
};
