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

    @Test
    void testExistsBySeatId() {
        ReservedSeats rs = new ReservedSeats();
        set(rs, "reservedId", 1L);
        set(rs, "seatId", 99L);
        repo.saveAndFlush(rs);

        assertThat(repo.existsBySeatId(99L)).isTrue();
        assertThat(repo.existsBySeatId(100L)).isFalse();
    }

    @Test
    void testExistsBySeatIdAndReservedIdNot() {
        ReservedSeats rs = new ReservedSeats();
        set(rs, "reservedId", 50L);
        set(rs, "seatId", 200L);
        repo.saveAndFlush(rs);

        assertThat(repo.existsBySeatIdAndReservedIdNot(200L, 99L)).isTrue();
        assertThat(repo.existsBySeatIdAndReservedIdNot(200L, 50L)).isFalse();
    }

    @Test
    void testDeleteByReservedId() {
        ReservedSeats rs = new ReservedSeats();
        set(rs, "reservedId", 123L);
        set(rs, "seatId", 5L);
        repo.saveAndFlush(rs);

        repo.deleteByReservedId(123L);

        assertThat(repo.findByReservedId(123L)).isEmpty();
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

    @Test
    void testExistsActiveBySeatId_smoke() {
        repo.existsActiveBySeatId(10L);
    }

    @Test
    void testExistsActiveBySeatIdExcludingReservation_smoke() {
        repo.existsActiveBySeatIdExcludingReservation(10L, 99L);
    }

    @Test
    void testFindSoldActiveSeatIdsByEvent_smoke() {
        repo.findSoldActiveSeatIdsByEvent(1L);
    }

    @Test
    void testCountSoldActiveSeatsByEvent_smoke() {
        repo.countSoldActiveSeatsByEvent(1L);
    }

    @Test
    void testCountReservedActiveSeatsByEvent_smoke() {
        repo.countReservedActiveSeatsByEvent(1L);
    }

    @Test
    void testCountSoldActiveSeatsInZone_smoke() {
        repo.countSoldActiveSeatsInZone(1L, 1L);
    }

    @Test
    void testCountReservedActiveSeatsInZone_smoke() {
        repo.countReservedActiveSeatsInZone(1L, 1L);
    }
}
