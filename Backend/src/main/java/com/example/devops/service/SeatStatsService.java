package com.example.devops.service;

import com.example.devops.dto.SeatStatsResponse;
import com.example.devops.repo.SeatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SeatStatsService — รวมการคำนวณข้อมูลที่นั่งทั้งหมดของอีเวนต์
 * ใช้ใน Organizer Dashboard, Admin Zone Overview และ Reservation ตรวจสอบ
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeatStatsService {

    private final SeatsRepository seatsRepo;

    /**
     * ✅ สรุปข้อมูลที่นั่งระดับอีเวนต์ (ใช้ใน Dashboard)
     */
    public SeatStatsResponse getStats(Long eventId) {
        long total = seatsRepo.countTotalSeatsByEvent(eventId);
        long sold = seatsRepo.countSoldSeatsByEvent(eventId);
        long reserved = seatsRepo.countReservedSeatSlotsByEvent(eventId);
        long available = Math.max(0, total - sold - reserved);

        return SeatStatsResponse.builder()
                .total(total)
                .sold(sold)
                .reserved(reserved)
                .available(available)
                .build();
    }

    /**
     * ✅ คำนวณเปอร์เซ็นต์ที่ขายไปแล้ว
     */
    public double getSoldPercent(Long eventId) {
        long total = seatsRepo.countTotalSeatsByEvent(eventId);
        long sold = seatsRepo.countSoldSeatsByEvent(eventId);
        if (total == 0) return 0.0;
        return ((double) sold / total) * 100.0;
    }

    /**
     * ✅ คำนวณเปอร์เซ็นต์ที่ถูกจองไว้ (ยังไม่จ่าย)
     */
    public double getReservedPercent(Long eventId) {
        long total = seatsRepo.countTotalSeatsByEvent(eventId);
        long reserved = seatsRepo.countReservedSeatSlotsByEvent(eventId);
        if (total == 0) return 0.0;
        return ((double) reserved / total) * 100.0;
    }
}
