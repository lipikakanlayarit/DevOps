package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedSeatsRepository;
import com.example.devops.repo.SeatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * Organizer Dashboard Controller
 * แสดงสรุปยอดขายและสถานะที่นั่งของแต่ละอีเวนต์
 */
@Slf4j
@RestController
@RequestMapping("/api/organizer/events")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true"
)
@RequiredArgsConstructor
public class OrganizerDashboardController {

    private final EventsNamRepository eventsRepo;
    private final ReservedRepository reservedRepo;
    private final ReservedSeatsRepository reservedSeatsRepo;
    private final SeatsRepository seatsRepo;

    /**
     * ✅ GET /api/organizer/events/{eventId}/dashboard
     * ดึงข้อมูลสรุปยอดขาย, ที่นั่ง, และสถานะการชำระเงิน
     */
    @GetMapping("/{eventId}/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getDashboard(@PathVariable Long eventId) {
        log.info("📊 Dashboard summary requested for eventId={}", eventId);

        var eventOpt = eventsRepo.findById(eventId);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "EVENT_NOT_FOUND"));
        }

        EventsNam ev = eventOpt.get();

        // 🟢 1️⃣ นับจำนวนที่นั่งทั้งหมด (ใช้เมธอดที่มีอยู่จริง)
        long totalSeatCount = seatsRepo.countTotalSeatsByEvent(eventId);
        long soldSeatCount = seatsRepo.countSoldSeatsByEvent(eventId);
        long reservedSeatCount = seatsRepo.countReservedSeatSlotsByEvent(eventId);
        long availableSeatCount = Math.max(0, totalSeatCount - soldSeatCount - reservedSeatCount);

        // 🟢 2️⃣ รวมยอดเงินจากใบจองที่ชำระแล้ว
        BigDecimal totalPaid = reservedRepo.sumPaidAmountByEvent(eventId);
        if (totalPaid == null) totalPaid = BigDecimal.ZERO;

        // 🟢 3️⃣ ดึงรายการจองทั้งหมด (ตาราง Reservations)
        List<Map<String, Object>> rows = reservedRepo.findReservationSummaryByEvent(eventId);

        // 🟢 4️⃣ รวมข้อมูลเป็น Response JSON
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("eventId", eventId);
        result.put("eventName", ev.getEventName());
        result.put("ticketTarget", totalSeatCount);
        result.put("sold", soldSeatCount);
        result.put("reserved", reservedSeatCount);
        result.put("available", availableSeatCount);
        result.put("netPayout", totalPaid);
        result.put("ticketSoldNow", soldSeatCount);
        result.put("rows", rows);

        return ResponseEntity.ok(result);
    }
}
