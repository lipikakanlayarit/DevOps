package com.example.devops.repo;

import com.example.devops.model.Payments;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser
class PaymentsRepositoryIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentsRepository paymentsRepository;

    @BeforeEach
    void setUp() {
        paymentsRepository.deleteAll();
    }



    @Test
    void testGetPaymentById_NotFound() throws Exception {
        mockMvc.perform(get("/api/payments/999"))
                .andExpect(status().isInternalServerError());
    }


    @Test
    void testUpdatePaymentStatus_NotFound() throws Exception {
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", "COMPLETED");
        statusUpdate.put("gatewayResponse", "Payment successful");

        mockMvc.perform(patch("/api/payments/999/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isInternalServerError());
    }
    @Test
    void testDeletePayment_NotFound() throws Exception {
        mockMvc.perform(delete("/api/payments/999"))
                .andExpect(status().isInternalServerError());
    }


    private Payments createTestPayment(Long reservedId, BigDecimal amount, String paymentMethod) {
        Payments payment = new Payments();
        payment.setReservedId(reservedId);
        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setTransactionId("TXN" + System.currentTimeMillis());
        payment.setPaymentStatus("PENDING");
        payment.setPaymentDatetime(Instant.now());
        return paymentsRepository.save(payment);
    }
}