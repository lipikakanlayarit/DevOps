// src/main/java/com/example/devops/service/SeatStatsService.java
package com.example.devops.service;

import com.example.devops.dto.SeatStatsResponse;
import com.example.devops.repo.SeatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SeatStatsService {

    private final SeatsRepository seatsRepo;

    @Transactional(readOnly = true)
    public SeatStatsResponse getStats(Long eventId) {
        long total    = seatsRepo.countTotalSeatsByEvent(eventId);
        long sold     = seatsRepo.countSoldSeatsByEvent(eventId);
        // เดิมเรียกเมธอดที่ไม่มีชื่อ countReservedSeatsByEvent -> แก้เป็นอันที่มีอยู่จริง
        long reserved = seatsRepo.countReservedSeatSlotsByEvent(eventId);

        long available = Math.max(0, total - sold - reserved);

        return SeatStatsResponse.builder()
                .total(total)
                .sold(sold)
                .reserved(reserved)
                .available(available)
                .build();
    }
}
