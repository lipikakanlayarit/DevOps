package com.example.devops.repo;

import com.example.devops.model.Reserved;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ReservedRepositoryIT {

    @Autowired
    private ReservedRepository reservedRepository;

    @Test
    void testSaveAndFindById() {
        // arrange
        Reserved rv = new Reserved();
        rv.setEventId(10L);
        rv.setPaymentStatus("PAID");
        rv.setTotalAmount(BigDecimal.valueOf(500));

        Reserved saved = reservedRepository.saveAndFlush(rv);

        // act
        var found = reservedRepository.findById(saved.getReservedId());

        // assert
        assertThat(found).isPresent();
        assertThat(found.get().getEventId()).isEqualTo(10L);
        assertThat(found.get().getPaymentStatus()).isEqualTo("PAID");
    }

    @Test
    void testExistsAfterSave() {
        Reserved rv = new Reserved();
        rv.setEventId(99L);
        rv.setPaymentStatus("UNPAID");

        Reserved saved = reservedRepository.save(rv);

        assertThat(reservedRepository.existsById(saved.getReservedId()))
                .isTrue();
    }

    @Test
    void testCountEmpty() {
        long count = reservedRepository.count();
        assertThat(count).isZero();
    }
}
