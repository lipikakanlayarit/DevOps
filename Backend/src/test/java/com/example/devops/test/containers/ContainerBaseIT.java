package com.example.devops.test.containers;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class สำหรับ Integration Test ทั้งหมด
 * - ยก PostgreSQL ด้วย Testcontainers
 * - Override spring.datasource.* ให้ Spring ใช้ DB จาก container
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class ContainerBaseIT {

    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("organicnow_it")
                    .withUsername("postgres")
                    .withPassword("postgres");

    @BeforeAll
    static void startContainer() {
        POSTGRES.start();
        System.setProperty("spring.datasource.url", POSTGRES.getJdbcUrl());
        System.setProperty("spring.datasource.username", POSTGRES.getUsername());
        System.setProperty("spring.datasource.password", POSTGRES.getPassword());
    }
}
