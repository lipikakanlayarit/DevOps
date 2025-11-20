package com.example.devops.repo;

import com.example.devops.model.ReservedSeats;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ReservedSeatsRepositoryIT {

    @Autowired
    private ReservedSeatsRepository repo;

    /** utility: set field แบบไม่ต้องมี setter */
    private void set(Object obj, String field, Object value) {
        try {
            Field f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(obj, value);
        } catch (Exception ignored) {}
    }

    // ----------------------------
    //  SMOKE TEST สำหรับ native queries JOIN
    // ----------------------------

    @Test
    void testFindSoldSeatIdsByEvent_smoke() {
        // แค่ verify ว่า query call ได้ ไม่ error
        repo.findSoldSeatIdsByEvent(1L);
    }

    @Test
    void testCountSoldSeatsByEvent_smoke() {
        repo.countSoldSeatsByEvent(1L);
    }

    @Test
    void testCountReservedSeatsByEvent_smoke() {
        repo.countReservedSeatsByEvent(1L);
    }


}
