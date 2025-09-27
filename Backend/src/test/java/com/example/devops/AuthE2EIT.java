package com.example.devops;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.devops.model.User;
import com.example.devops.repo.UserRepository; // <- ใช้เฉพาะตัวนี้

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.hasKey;

public class AuthE2EIT extends PostgresTestContainerConfig {

    @Value("${local.server.port}")
    int port;

    @Autowired(required = false)
    PasswordEncoder passwordEncoderFromCtx;

    @Autowired
    UserRepository userRepository;

    PasswordEncoder encoder;

    @BeforeEach
    void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
        encoder = (passwordEncoderFromCtx != null) ? passwordEncoderFromCtx : new BCryptPasswordEncoder();
    }

    @Test
    void login_withUsername_shouldReturnToken() {
        // Arrange: seed user ให้ตรงสคีมาจริง (password_hash, roles)
        User u = new User();
        u.setUsername("alice");
        u.setEmail("alice@example.com");

        try {
            // ส่วนใหญ่สคีมาคุณใช้ password_hash / roles
            User.class.getMethod("setPasswordHash", String.class).invoke(u, encoder.encode("secret123"));
            User.class.getMethod("setRoles", String.class).invoke(u, "USER");
        } catch (ReflectiveOperationException e) {
            // เผื่อ entity ใช้ setPassword / setRole
            try { User.class.getMethod("setPassword", String.class).invoke(u, encoder.encode("secret123")); } catch (ReflectiveOperationException ignored) {}
            try { User.class.getMethod("setRole", String.class).invoke(u, "USER"); } catch (ReflectiveOperationException ignored) {}
        }

        userRepository.save(u);

        // Act + Assert
        given()
            .contentType("application/json")
            .body("{\"identifier\":\"alice\",\"password\":\"secret123\"}")
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("token", notNullValue())
            .body("username", equalTo("alice"))
            // รองรับได้ทั้ง response ที่คืน 'role' หรือ 'roles'
            .body("$", anyOf(hasKey("role"), hasKey("roles")));
            // ถ้าคุณต้องการเช็คค่าชัด ๆ ให้แก้เป็น:
            // .body("roles", equalTo("USER"));
    }
}
