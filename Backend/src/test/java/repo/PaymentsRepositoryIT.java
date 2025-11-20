package com.example.devops.repo;

import com.example.devops.model.Payments;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class PaymentsRepositoryIT {

    @Autowired
    private PaymentsRepository paymentsRepository;

    @Test
    @DisplayName("บันทึกและอ่าน Payments จาก H2 DB ได้สำเร็จ")
    void saveAndFindPayments() {
        // Arrange: สร้าง object payment ตัวอย่าง
        Payments payment = new Payments();
        payment.setReservedId(123L);
        payment.setAmount(new BigDecimal("1500.50"));
        payment.setPaymentMethod("CREDIT_CARD");
        payment.setTransactionId("TX-ABC-001");
        payment.setPaymentStatus("SUCCESS");
        payment.setGatewayResponse("{\"code\":\"00\"}");
        payment.setPaymentDatetime(Instant.now());

        // Act: เซฟลง DB
        Payments saved = paymentsRepository.saveAndFlush(payment);

        // Assert: เช็คว่ามี id ถูก generate
        assertThat(saved.getPaymentId()).isNotNull();

        // ดึงกลับมาด้วย findById
        Optional<Payments> foundOpt = paymentsRepository.findById(saved.getPaymentId());
        assertThat(foundOpt).isPresent();

        Payments found = foundOpt.get();
        assertThat(found.getReservedId()).isEqualTo(123L);
        assertThat(found.getAmount()).isEqualByComparingTo("1500.50");
        assertThat(found.getPaymentMethod()).isEqualTo("CREDIT_CARD");
        assertThat(found.getTransactionId()).isEqualTo("TX-ABC-001");
        assertThat(found.getPaymentStatus()).isEqualTo("SUCCESS");
        assertThat(found.getGatewayResponse()).contains("code");
        assertThat(found.getPaymentDatetime()).isNotNull();
    }
}
