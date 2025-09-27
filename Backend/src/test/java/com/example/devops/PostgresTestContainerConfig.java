package com.example.devops;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class PostgresTestContainerConfig {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("devopsdb")
            .withUsername("devuser")
            .withPassword("devpass");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

        // ทำ schema อัตโนมัติและแยกจาก Flyway ตอน test
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");
        registry.add("spring.sql.init.mode", () -> "never");

        // ปิดงานเบื้องหลังช่วงเทสต์ เพื่อให้ JVM ปิดไว
        registry.add("spring.task.scheduling.enabled", () -> "false");
        registry.add("spring.task.execution.shutdown.await-termination", () -> "true");
        registry.add("spring.task.execution.shutdown.await-termination-period", () -> "2s");

        // JWT สำหรับเทสต์
        registry.add("app.jwt.secret", () -> "e2e-secret-e2e-secret-e2e-secret-e2e");
        registry.add("app.jwt.expiration", () -> "3600000"); // 1h

        // timezone ที่คงที่
        registry.add("spring.jackson.time-zone", () -> "Asia/Bangkok");
    }
}
