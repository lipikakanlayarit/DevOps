package com.example.devops;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

public class HealthE2EIT extends PostgresTestContainerConfig {

    @Value("${local.server.port}")
    int port;

    @BeforeEach
    void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    @Test
    void health_shouldReturnOk() {
        given()
        .when()
            .get("/api/health")
        .then()
            .statusCode(200)
            .body("status", equalTo("ok"));
    }
}
