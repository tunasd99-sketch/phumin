# RMUTR - ระบบจัดการกิจกรรมในมหาวิทยาลัย

ระบบนี้แบ่งเป็น 2 ส่วน:
- **server/** — backend API (Node.js + Express + MySQL)
- **public/** — frontend (HTML/CSS/JS ล้วน เรียก API ด้วย `fetch`)

เซิร์ฟเวอร์ Express จะเสิร์ฟทั้ง API (`/api/...`) และไฟล์หน้าเว็บ (`public/`) จากพอร์ตเดียวกัน จึงต้องรันแค่โปรเซสเดียว

---

## 1. รันบนเครื่องตัวเอง (localhost) เพื่อทดสอบก่อน

### 1.1 เตรียม MySQL
ต้องมี MySQL Server ติดตั้งอยู่แล้ว (เครื่องตัวเอง หรือ Docker ก็ได้)

```bash
mysql -u root -p -e "CREATE DATABASE rmutr_sams CHARACTER SET utf8mb4;"
mysql -u root -p rmutr_sams < server/schema.sql
```

### 1.2 ตั้งค่าเซิร์ฟเวอร์
```bash
cd server
cp .env.example .env
# แก้ไฟล์ .env ให้ตรงกับรหัสผ่าน MySQL ของคุณ และตั้ง JWT_SECRET เป็นค่าสุ่ม
npm install
npm run seed      # ใส่ข้อมูลตัวอย่าง + สร้างบัญชีทดลอง
npm start
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:4000` จะเจอหน้าเว็บทันที (เซิร์ฟเวอร์เสิร์ฟไฟล์ frontend ให้เอง)

**บัญชีทดลองหลัง `npm run seed`:**
| บทบาท | username | password |
|---|---|---|
| แอดมิน | admin | admin123 |
| อาจารย์/เจ้าหน้าที่ | staff | staff123 |
| นักศึกษา | student1 | student123 |

---

## 2. เอาขึ้น VPS / Cloud ที่รัน Node.js ได้ (เช่น Railway, Render, DigitalOcean)

ภาพรวมขั้นตอนจะเหมือนกันแทบทุกเจ้า ต่างกันแค่หน้าตาของ dashboard:

### ขั้นที่ 1 — สร้างฐานข้อมูล MySQL บน cloud
ส่วนใหญ่ผู้ให้บริการจะมี MySQL แบบ managed service ให้เลือกแยกต่างหาก (เช่น Railway มี "MySQL" ให้เพิ่มเป็นปลั๊กอินในโปรเจกต์เดียวกัน, Render มี PostgreSQL ฟรีแต่ MySQL ต้องใช้บริการภายนอกอย่าง PlanetScale หรือ Railway)

หลังสร้างแล้วจะได้ค่าการเชื่อมต่อมา 5 ค่า: host, port, username, password, database name — **เก็บไว้ ต้องใช้ในขั้นต่อไป**

### ขั้นที่ 2 — สร้างตารางในฐานข้อมูล
เชื่อมต่อฐานข้อมูล cloud ด้วยค่าที่ได้มา แล้วรันไฟล์ `server/schema.sql`:
```bash
mysql -h <host> -P <port> -u <username> -p <database> < server/schema.sql
```
(หรือใช้โปรแกรม GUI เช่น TablePlus / MySQL Workbench วาง SQL แล้วรันก็ได้)

### ขั้นที่ 3 — อัปโหลดโค้ดและตั้งค่า
1. ผลักโค้ดทั้งโฟลเดอร์ `rmutr-system/` ขึ้น GitHub repository
2. เชื่อม repository นั้นกับบริการ (Railway/Render ฯลฯ) ให้ deploy จากโฟลเดอร์ `server/` เป็น root
3. ตั้งค่า **Environment Variables** บน dashboard ของบริการนั้น ให้ตรงกับที่อยู่ใน `.env.example`:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — ค่าจากขั้นที่ 1
   - `JWT_SECRET` — สุ่มค่าใหม่ยาวๆ (ห้ามใช้ค่าตัวอย่าง)
   - `PORT` — ส่วนใหญ่บริการจะกำหนดให้เองผ่านตัวแปรนี้อัตโนมัติ ไม่ต้องตั้งเอง
   - `CORS_ORIGIN` — ใส่โดเมนจริงที่จะใช้เข้าเว็บ (หรือ `*` ถ้ายังไม่แน่ใจ)
4. ตั้งค่า **Start Command** เป็น `npm start` และ **Build Command** เป็น `npm install`
5. Deploy แล้วรอจนสถานะ "Running" / "Live"

### ขั้นที่ 4 — ใส่ข้อมูลตัวอย่าง (ครั้งเดียว)
เปิด terminal/console ของบริการนั้น (ส่วนใหญ่มีปุ่ม "Shell" หรือ "Console" ให้ในหน้า dashboard) แล้วรัน:
```bash
npm run seed
```
หรือถ้าไม่มี shell ให้เชื่อมต่อฐานข้อมูลโดยตรงแล้ว insert ข้อมูลด้วยมือ/สคริปต์แยก

### ขั้นที่ 5 — ทดสอบ
เปิด URL ที่บริการให้มา (เช่น `https://your-app.up.railway.app`) จะต้องเจอหน้า login ของระบบทันที

---

## 3. โครงสร้างฐานข้อมูล (3NF)

ดูรายละเอียดเต็มใน `server/schema.sql` — ตารางหลัก:

| ตาราง | หน้าที่ |
|---|---|
| `students` | ข้อมูลนักศึกษา |
| `teachers` | ข้อมูลอาจารย์ |
| `activity_types` | ประเภทกิจกรรม |
| `academic_years` | ปีการศึกษา |
| `activities` | กิจกรรม (FK → type, year) |
| `activity_teachers` | ตารางเชื่อม M:N ระหว่างกิจกรรม-อาจารย์ |
| `participations` | ตารางเชื่อม M:N ระหว่างนักศึกษา-กิจกรรม (เก็บคะแนน/ชั่วโมง/สถานะ) |
| `users` | บัญชีผู้ใช้ระบบ (แอดมิน/อาจารย์/นักศึกษา) รหัสผ่านเข้ารหัสด้วย bcrypt |

## 4. ความปลอดภัยที่ทำไว้แล้ว / สิ่งที่ควรทำเพิ่มก่อนใช้งานจริง

**ทำไว้แล้ว:**
- รหัสผ่านเข้ารหัสด้วย bcrypt ไม่เก็บเป็น plain text
- ยืนยันตัวตนด้วย JWT token มีวันหมดอายุ
- แบ่งสิทธิ์การเข้าถึง API ตาม role (`admin` / `staff` / `student`) ที่ฝั่งเซิร์ฟเวอร์จริง ไม่ใช่แค่ซ่อนปุ่มฝั่งหน้าเว็บ
- ใช้ parameterized query ทุกจุด ป้องกัน SQL injection

**ควรทำเพิ่มก่อนใช้งานจริงในวงกว้าง:**
- จำกัดจำนวนครั้งการ login ผิด (rate limiting) กันการเดารหัสผ่าน
- ตั้งค่า `CORS_ORIGIN` ให้เจาะจงโดเมนจริง ไม่ใช่ `*`
- เปิดใช้ HTTPS เสมอ (บริการ cloud ส่วนใหญ่ทำให้อัตโนมัติ)
- เพิ่มระบบ reset password

## 5. คำสั่งที่ใช้บ่อย

```bash
npm start       # รันเซิร์ฟเวอร์ (production)
npm run dev     # รันแบบ auto-restart เมื่อแก้โค้ด
npm run seed    # ใส่ข้อมูลตัวอย่าง (รันครั้งเดียวพอ ใส่ซ้ำได้ไม่ error เพราะใช้ INSERT IGNORE)
```
