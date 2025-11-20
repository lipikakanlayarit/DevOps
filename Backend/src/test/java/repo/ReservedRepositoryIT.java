package com.example.devops.repo;

import com.example.devops.model.Reserved;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource("classpath:application-test.properties")
@Sql(scripts = {
        "/schema_reserved_test.sql",
        "/data_reserved_test.sql"
})
public class ReservedRepositoryIT {

    @Autowired
    ReservedRepository repo;

    /* ==================== findAllByEventId ==================== */

    /* ==================== countByEventIdAndPaymentStatusIgnoreCase ==================== */
    @Test
    void testCountPaid() {
        long count = repo.countByEventIdAndPaymentStatusIgnoreCase(100L, "PAID");
        assertThat(count).isEqualTo(1);
    }

    /* ==================== existsByConfirmationCode ==================== */
    @Test
    void testExistsByConfirmationCode() {
        assertThat(repo.existsByConfirmationCode("CONF-111")).isTrue();
        assertThat(repo.existsByConfirmationCode("CONF-XYZ")).isFalse();
    }

    /* ==================== findPaidByEventId ==================== */
    @Test
    void testFindPaidByEventId() {
        List<Reserved> list = repo.findPaidByEventId(100L);
        assertThat(list).hasSize(1);
        assertThat(list.get(0).getPaymentStatus()).isEqualTo("PAID");
    }

    /* ==================== sumPaidAmountByEvent ==================== */
    @Test
    void testSumPaidAmountByEvent() {
        BigDecimal sum = repo.sumPaidAmountByEvent(100L);
        assertThat(sum).isEqualTo(new BigDecimal("500.00"));
    }

    /* ==================== deleteReservationHard ==================== */
    @Test
    void testDeleteReservationHard() {
        repo.deleteReservationHard(1L);
        assertThat(repo.findById(1L)).isEmpty();
    }

    /* ==================== claimAllByEmail ==================== */
    @Test
    void testClaimAllByEmail() {
        int updated = repo.claimAllByEmail("guest@mail.com", 99L);
        assertThat(updated).isEqualTo(1);

        Reserved r = repo.findById(3L).orElseThrow();
        assertThat(r.getUserId()).isEqualTo(99L);
    }


}
