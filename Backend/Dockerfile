# ---- Build stage ----
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src

# คอมไพล์ด้วย Java 17 และสร้าง Spring Boot fat JAR
RUN mvn -q -Dmaven.compiler.release=17 clean package spring-boot:repackage -DskipTests

# เลือกไฟล์ jar ที่ไม่ใช่ .original มาเป็น app.jar
RUN cp $(ls target/*.jar | grep -v '\.original$' | head -n1) app.jar \
 && echo "Using JAR:" && ls -l app.jar

# ---- Run stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
