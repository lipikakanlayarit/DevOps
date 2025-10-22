# ---- Build stage ----
# ใช้ ECR mirror ของ official Maven + Temurin 17
FROM public.ecr.aws/docker/library/maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app

# ดึง dependencies ล่วงหน้าเพื่อ cache layer
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

# คัดลอกซอร์สและ build เป็น Spring Boot fat JAR (Java 17)
COPY src ./src
RUN mvn -q -Dmaven.compiler.release=17 clean package spring-boot:repackage -DskipTests

# เลือก JAR ที่ไม่ใช่ .original มาเป็น app.jar
RUN cp $(ls target/*.jar | grep -v '\.original$' | head -n1) app.jar \
 && echo "Using JAR:" && ls -l app.jar

# ---- Run stage ----
# ใช้ ECR mirror ของ Temurin 17 JRE
FROM public.ecr.aws/docker/library/eclipse-temurin:17-jre
WORKDIR /app

# คัดลอก JAR จาก build stage
COPY --from=builder /app/app.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
