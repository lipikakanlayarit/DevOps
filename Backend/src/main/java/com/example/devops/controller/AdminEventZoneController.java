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
     * ✅ คืนรายการโซนของอีเวนต์ พร้อมสรุป Row/Column/Price (จริง) และ Sale (จากฐานข้อมูล)
     * GET /api/admin/events/{eventId}/zones
     */
    @GetMapping("/{eventId}/zones")
    public ResponseEntity<?> listZonesSummary(@PathVariable("eventId") Long eventId) {
        List<SeatZones> zones = seatZonesRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(eventId);

        List<Map<String, Object>> result = zones.stream().map(z -> {
            Long zoneId = z.getZoneId();

            // 1) จำนวนแถวของโซน
            int rowCount = seatRowsRepo.countByZoneId(zoneId);

            // 2) จำนวนคอลัมน์สูงสุดในโซน
            Integer maxSeatsPerRow = seatsRepo.findMaxSeatsPerRowByZoneId(zoneId);
            int columnCount = (maxSeatsPerRow == null ? 0 : maxSeatsPerRow);

            // 3) ราคาตั๋ว (เลือก ticket_type แรกหรือสูงสุดในโซน)
            BigDecimal price = zttRepo.findFirstPriceByZoneId(zoneId);
            String priceStr = price != null ? price.toPlainString() : "-";

            // 4) Sale จริงจากฐานข้อมูล
            int totalSeats = seatsRepo.countSeatsInZone(zoneId);
            int soldSeats = seatsRepo.countSoldSeatsInZone(zoneId);
            String sale = soldSeats + "/" + totalSeats;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("zone", z.getZoneName() != null ? z.getZoneName() : ("Zone #" + zoneId));
            m.put("row", rowCount);
            m.put("column", columnCount);
            m.put("price", priceStr);
            m.put("sale", sale);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
