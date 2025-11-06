package com.example.devops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ============================================================
 *  BackendApplication
 * ============================================================
 * ✅ จุดเริ่มต้นของ Spring Boot (main class)
 * ✅ เปิดให้ระบบ Scheduling ทำงาน (สำหรับ SeatLockService)
 * ============================================================
 */
@EnableScheduling  // ✅ เปิดให้ Spring Boot รัน @Scheduled tasks อัตโนมัติ
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("🚀 Devops Backend started successfully with scheduling enabled!");
    }
}
