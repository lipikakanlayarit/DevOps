# คู่มือย่อ: SQL (PostgreSQL) · Docker Compose · Git (พร้อมคำสั่งก๊อปวางได้)

> โปรเจกต์นี้ใช้บริการหลัก: **db (PostgreSQL)**, **backend (Spring Boot)**, **frontend (Vite)**, และ **pgadmin**

---

## 1) PostgreSQL: เข้า psql / ตรวจ DB

### เข้า psql (แนะนำ: อ้างชื่อ service)

```bash
docker compose exec db psql -U devuser -d devopsdb
```

### เข้า psql (อ้างชื่อคอนเทนเนอร์)

```bash
docker exec -it postgres-db psql -U devuser -d devopsdb
```

### เข้า psql จากเครื่องเรา (ถ้าเปิดพอร์ต 5432:5432)

```bash
PGPASSWORD=devpass psql -h localhost -p 5432 -U devuser -d devopsdb
```

### คำสั่งพื้นฐานใน psql

```sql
\l                  -- ดูรายการฐานข้อมูล
\c devopsdb         -- เข้า DB นี้
\dt                 -- ดูตารางทั้งหมดใน schema public
\d table_name       -- ดูโครงสร้างตาราง
SELECT 1;           -- ทดสอบต่อได้
SELECT * FROM users LIMIT 5;  -- ตัวอย่างอ่านข้อมูล
\q                  -- ออก
```

### pgAdmin (UI)

* URL: [http://localhost:8081](http://localhost:8081)
* Email: `admin@admin.com`, Password: `adminpassword`
* สร้าง Server ใหม่: Host=`db`, Port=`5432`, User=`devuser`, Pass=`devpass`, DB=`devopsdb`

> ⚠️ Seed เริ่มต้นถูกแมปที่: `./Backend/src/main/resources/db/init/butcon_postgres_INIT.sql` → `/docker-entrypoint-initdb.d/001_init.sql`

---

## 2) Docker Compose: รัน/หยุด/ลบ/บิลด์ใหม่

### รันทั้งสแตก (build ถ้ายังไม่มี image)

```bash
docker compose up -d --build
```

### ดูสถานะ / ดู log

```bash
docker compose ps
docker compose logs -f db
docker compose logs -f backend
docker compose logs -f frontend
```

### หยุด/ปิดทุกคอนเทนเนอร์ของโปรเจกต์นี้

```bash
docker compose down
```

### ลบทุกอย่าง + volume (รีเซ็ตฐานข้อมูล)

```bash
docker compose down -v
```

> ใช้เมื่อต้องการให้สคริปต์ init (seed) ทำงานใหม่ หรือ Credential DB เปลี่ยนแล้วไม่ตรงกับของเดิมใน volume

### ลบเฉพาะ image ที่ build ไว้ แล้ว build ใหม่สะอาด ๆ

```bash
docker compose down
docker image prune -f
docker compose build --no-cache
docker compose up -d
```

### เข้าเชลล์ในคอนเทนเนอร์ (debug)

```bash
docker compose exec backend sh
```

### ตรวจค่า ENV ในคอนเทนเนอร์ (เช่นตรวจ DB URL / JWT)

```bash
docker compose exec backend printenv | egrep 'SPRING_DATASOURCE|APP_JWT'
```

### ค่าที่ควรตั้งเกี่ยวกับ JWT (สำคัญ)

```yaml
# ใน docker-compose.yml → service: backend → environment
APP_JWT_EXPIRATION: "3600000"          # 1 ชั่วโมง (หน่วย: มิลลิวินาที)
APP_JWT_ALLOWEDCLOCKSKEWSECONDS: "60"  # เผื่อเวลาคลาดเคลื่อน 60 วินาที
SPRING_PROFILES_ACTIVE: "prod"         # ให้ Spring ใช้โปรไฟล์ prod
```

---

## 3) Git: สเตตัส/คอมมิต/พุช/พูล

### ตรวจสถานะ / ดู diff

```bash
git status
git diff
```

### เพิ่มไฟล์ทั้งหมด แล้วคอมมิต

```bash
git add .
git commit -m "<คำอธิบายการแก้ไข>"
```

### ตั้ง remote (ถ้ายังไม่ได้ตั้ง) แล้วพุชสาขาปัจจุบัน

```bash
git remote -v
# ถ้ายังไม่มี origin:
# git remote add origin https://github.com/<USER>/<REPO>.git

git push -u origin $(git branch --show-current)
```

### ดึงโค้ดล่าสุดจากสาขาปัจจุบัน

```bash
git pull --rebase
```

### สลับสาขา/สร้างสาขาใหม่

```bash
git checkout -b feature/my-change   # สร้างและย้ายไป
# หรือ
git checkout main                    # ย้ายไปสาขาที่มีอยู่
```

---

## 4) ทิปแก้ปัญหาที่พบบ่อย

* **Login แล้วเจอ 401 / Session expired ไว** → เช็ก `APP_JWT_EXPIRATION` ต้องเป็นหน่วยมิลลิวินาที เช่น `3600000` (ไม่ใช่ `3600`)
* **ต่อ DB ไม่ติดหลังแก้ user/pass** → ใช้ `docker compose down -v` เพื่อลบ volume เก่า แล้ว `up -d` ใหม่
* **สคริปต์ init ไม่รัน** → ลบ volume ก่อน (`down -v`) เพราะไฟล์ใน `/docker-entrypoint-initdb.d/` จะรันเฉพาะตอนสร้างคลังข้อมูลครั้งแรก
* **frontend 5173 ต่อ backend ไม่ได้** → ตรวจ proxy/`VITE_PROXY_TARGET` หรือ `vite.config.ts` ให้ยิง `http://backend:8080` เมื่อตอนรันใน compose

---

## 5) ขั้นตอนมาตรฐาน (ตั้งต้น–ทดสอบ–พุช)

```bash
# 1) อัปเดตโค้ด/แก้ไขไฟล์
# 2) บิวด์และรัน
docker compose up -d --build

# 3) ตรวจ log ให้พร้อมใช้งาน
docker compose logs -f backend

# 4) ทดสอบ DB
docker compose exec db psql -U devuser -d devopsdb -c 'SELECT 1;'

# 5) คอมมิตและพุช
git add .
git commit -m "feat: update docs + docker settings + sql init"
git push -u origin $(git branch --show-current)
```

---

> อัปเดตไฟล์นี้เมื่อมีการเปลี่ยนชื่อ service, port mapping, ENV key, หรือสคริปต์ init ใหม่ เพื่อให้ทีมใช้ชุดคำสั่งล่าสุดตรงกัน

---

## 3.1) Git: สร้าง/จัดการ Branch (ครบจบในหน้าเดียว)

> แนะนำให้แตก branch ใหม่จาก `main` ที่อัปเดตล่าสุดเสมอ

### ขั้นตอนมาตรฐาน (จาก `main`)

```bash
# อัปเดต main ให้ล่าสุดก่อน
git fetch origin
git checkout main
git pull --rebase origin main

# สร้าง branch ใหม่และสลับไปเลย
git checkout -b feature/my-new-branch

# ทำงาน แก้ไฟล์ → commit
git add .
git commit -m "feat: implement X"

# push ครั้งแรก พร้อมตั้ง upstream
git push -u origin feature/my-new-branch
```

### คำสั่งที่ใช้บ่อย

```bash
# ดูสาขาทั้งหมด (local+remote)
git branch -av

# สลับสาขา
git switch main           # Git รุ่นใหม่
# หรือ
git checkout main          # ใช้ได้ทุกเวอร์ชัน

# แสดงชื่อสาขาปัจจุบัน
git branch --show-current
```

### แตกสาขาจาก remote/main โดยตรง

```bash
git fetch origin
git checkout -b feature/my-new-branch origin/main
```

### แตกสาขาจาก commit/tag เฉพาะจุด

```bash
# จาก commit SHA
git checkout -b hotfix-123 1a2b3c4d

# จาก tag
git checkout -b release-1.2 v1.2.0
```

### ติดตามสาขาที่มีอยู่บน remote (สร้าง local ที่ track remote)

```bash
# วิธีที่ 1
git checkout -t origin/feature/existing-branch

# วิธีที่ 2 (git รุ่นใหม่)
git switch -c feature/existing-branch --track origin/feature/existing-branch
```

### รีเนมสาขา

```bash
# รีเนม local branch ปัจจุบัน
git branch -m new-name

# ถ้าเคย push แล้ว: ลบชื่อเก่าบน remote และ push ชื่อใหม่
git push origin :old-name new-name
git push -u origin new-name
```

### ลบสาขา

```bash
# ลบ local (ปลอดภัย: -d จะไม่ยอมลบถ้ามี commit ที่ยังไม่ merge)
git branch -d feature/old-branch
# บังคับลบ (ระวัง)
git branch -D feature/old-branch

# ลบบน remote
git push origin --delete feature/old-branch
```

### เก็บงานชั่วคราวก่อนสลับสาขา (stash)

```bash
git stash -u         # เก็บรวมไฟล์ที่ยังไม่ได้ track
git switch main
# กลับมาเอางานคืน
git stash pop
```

### เปิด Pull Request (ตัวเลือก)

* ผ่านเว็บ GitHub: เปิด repo → Compare & pull request
* ผ่าน CLI (ถ้ามี GitHub CLI)

```bash
gh pr create --fill
```

> เคล็ดลับ: ใช้ prefix ให้ชัดเจน เช่น `feat/`, `fix/`, `chore/`, `docs/`, `hotfix/` เพื่อให้ง่ายต่อการรีวิวและอัตโนมัติใน CI/CD
