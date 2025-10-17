package com.example.devops.controller;

import com.example.devops.model.SeatZones;
import com.example.devops.repo.SeatRowsRepository;
import com.example.devops.repo.SeatZonesRepository;
import com.example.devops.repo.SeatsRepository;
import com.example.devops.repo.ZoneTicketTypesRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/events")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEventZoneController {

    private final SeatZonesRepository seatZonesRepo;
    private final SeatRowsRepository seatRowsRepo;
    private final SeatsRepository seatsRepo;
    private final ZoneTicketTypesRepository zttRepo;

    public AdminEventZoneController(
            SeatZonesRepository seatZonesRepo,
            SeatRowsRepository seatRowsRepo,
            SeatsRepository seatsRepo,
            ZoneTicketTypesRepository zttRepo
    ) {
        this.seatZonesRepo = seatZonesRepo;
        this.seatRowsRepo = seatRowsRepo;
        this.seatsRepo = seatsRepo;
        this.zttRepo = zttRepo;
    }

    /**
     * คืนรายการโซนของอีเวนต์ พร้อมสรุป Row/Column/Price (จริง) และ Sale (mock)
     * GET /api/admin/events/{eventId}/zones
     */
    @GetMapping("/{eventId}/zones")
    public ResponseEntity<?> listZonesSummary(@PathVariable("eventId") Long eventId) {
        List<SeatZones> zones = seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId);
        List<Map<String, Object>> result = zones.stream().map(z -> {
            Long zoneId = z.getZone_id();

            // 1) จำนวนแถวจริงของโซน
            int rowCount = seatRowsRepo.countByZoneId(zoneId);

            // 2) คอลัมน์ = max(#seats) ต่อแถวในโซน
            Integer maxSeatsPerRow = seatsRepo.findMaxSeatsPerRowByZoneId(zoneId);
            int columnCount = (maxSeatsPerRow == null ? 0 : maxSeatsPerRow);

            // 3) ราคา: เลือก ticket_type ของโซนนั้นที่ราคา "สูงสุด" (ตามการ map)
            BigDecimal price = zttRepo.findFirstPriceByZoneId(zoneId);
            String priceStr = price == null ? null : price.toPlainString();

            // 4) Sale (mock): คิด sold ~30% ของความจุ
            int capacity = rowCount * columnCount;
            int sold = (int) Math.round(capacity * 0.30); // mock
            String sale = sold + "/" + capacity;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("zone", z.getZone_name() != null ? z.getZone_name() : ("Zone #" + zoneId));
            m.put("row", rowCount);
            m.put("column", columnCount);
            m.put("price", priceStr);
            m.put("sale", sale);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
