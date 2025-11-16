package com.example.devops.service;

import com.example.devops.dto.SeatStatsResponse;
import com.example.devops.repo.SeatsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class SeatStatsServiceTest {

    SeatsRepository seatsRepo;
    SeatStatsService service;

    @BeforeEach
    void setup() {
        seatsRepo = mock(SeatsRepository.class);
        service = new SeatStatsService(seatsRepo);
    }

    // ======================================================
    // getStats()
    // ======================================================
    @Test
    void testGetStats_normal() {
        when(seatsRepo.countTotalSeatsByEvent(1L)).thenReturn(100L);
        when(seatsRepo.countSoldSeatsByEvent(1L)).thenReturn(30L);
        when(seatsRepo.countReservedSeatSlotsByEvent(1L)).thenReturn(20L);

        SeatStatsResponse resp = service.getStats(1L);

        assertThat(resp.getTotal()).isEqualTo(100);
        assertThat(resp.getSold()).isEqualTo(30);
        assertThat(resp.getReserved()).isEqualTo(20);
        assertThat(resp.getAvailable()).isEqualTo(50);
    }

    @Test
    void testGetStats_availableNeverNegative() {
        when(seatsRepo.countTotalSeatsByEvent(1L)).thenReturn(50L);
        when(seatsRepo.countSoldSeatsByEvent(1L)).thenReturn(40L);
        when(seatsRepo.countReservedSeatSlotsByEvent(1L)).thenReturn(20L); // คิดรวมเกิน

        SeatStatsResponse resp = service.getStats(1L);

        assertThat(resp.getAvailable()).isEqualTo(0); // max(0, 50-40-20)
    }

    // ======================================================
    // getSoldPercent()
    // ======================================================
    @Test
    void testGetSoldPercent_normal() {
        when(seatsRepo.countTotalSeatsByEvent(2L)).thenReturn(200L);
        when(seatsRepo.countSoldSeatsByEvent(2L)).thenReturn(50L);

        double percent = service.getSoldPercent(2L);

        assertThat(percent).isEqualTo(25.0);
    }

    @Test
    void testGetSoldPercent_totalZero() {
        when(seatsRepo.countTotalSeatsByEvent(3L)).thenReturn(0L);

        double percent = service.getSoldPercent(3L);

        assertThat(percent).isEqualTo(0.0);
    }

    // ======================================================
    // getReservedPercent()
    // ======================================================
    @Test
    void testGetReservedPercent_normal() {
        when(seatsRepo.countTotalSeatsByEvent(4L)).thenReturn(400L);
        when(seatsRepo.countReservedSeatSlotsByEvent(4L)).thenReturn(80L);

        double percent = service.getReservedPercent(4L);

        assertThat(percent).isEqualTo(20.0);
    }

    @Test
    void testGetReservedPercent_totalZero() {
        when(seatsRepo.countTotalSeatsByEvent(5L)).thenReturn(0L);

        double percent = service.getReservedPercent(5L);

        assertThat(percent).isEqualTo(0.0);
    }
}
