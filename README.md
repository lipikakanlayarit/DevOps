# Front and back can communicate with each other mocktest4

ถ้าทำใน Interlij ข้ามขั้นตอนนี้
mvn -v
2. ดาวน์โหลดและติดตั้ง Maven

ไปโหลด Apache Maven
 (เลือก Binary zip archive)

แตก zip ไว้ เช่น C:\apache-maven-3.9.9

จำ path ของโฟลเดอร์ bin เช่น

C:\apache-maven-3.9.9\bin

3. ตั้งค่า Environment Variables (Windows)

กด Win + R → พิมพ์ sysdm.cpl → กด Enter

ไปที่ Advanced → Environment Variables

ที่ System variables → หา Path → กด Edit

กด New แล้วใส่ path ของ bin เช่น:

C:\apache-maven-3.9.9\bin


กด OK ปิดทุกหน้าต่าง

4. ปิด-เปิด PowerShell ใหม่ แล้วลอง
mvn -v


ถ้าแสดง version ของ Maven → ใช้งานได้แล้ว ✅

จากนั้นรัน Spring Boot ได้เลย:

mvn spring-boot:run




cd Backend
mvn spring-boot:run
cd ../Frontend 
npm run dev


# จากโฟลเดอร์ Backend/Backend
.\mvnw -v
.\mvnw clean package -DskipTests
.\mvnw spring-boot:run

