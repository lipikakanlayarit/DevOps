package com.example.devops.service;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.model.*;
import com.example.devops.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * สร้างผังที่นั่ง (Seat Map) สำหรับอีเวนต์
 * ตารางที่ใช้:
 *   seat_zones(event_id) -> seat_rows(zone_id) -> seats(row_id)
 *   zone_ticket_types(zone_id, ticket_type_id) (ถ้ามี mapping ราคา)
 */
@Service
@RequiredArgsConstructor
public class TicketSetupService {

    private final SeatZonesRepository seatZonesRepo;
    private final SeatRowsRepository seatRowsRepo;
    private final SeatsRepository seatsRepo;
    private final ZoneTicketTypesRepository zoneTicketTypesRepo;
    private final TicketTypesRepository ticketTypesRepo; // เผื่อใช้ต่อยอด

    /**
     * ลบข้อมูลเก่า แล้วสร้างโซน/แถว/ที่นั่งใหม่ทั้งหมดตามคำขอ
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> setup(Long eventId, TicketSetupRequest req) {
        System.out.println("[TicketSetupService] setup start eventId=" + eventId);

        // 1) ลบของเก่าตามลำดับ FK: seats -> seat_rows -> zone_ticket_types -> seat_zones
        System.out.println("[TicketSetupService] deleting seats...");
        seatsRepo.deleteByEventId(eventId);

        System.out.println("[TicketSetupService] deleting seat_rows...");
        seatRowsRepo.deleteByEventId(eventId);

        System.out.println("[TicketSetupService] deleting zone_ticket_types...");
        zoneTicketTypesRepo.deleteByEventId(eventId);

        System.out.println("[TicketSetupService] deleting seat_zones...");
        seatZonesRepo.deleteByEventId(eventId);

        // 2) ตรวจ input
        final Instant now = Instant.now();
        final int totalRows = req.getSeatRows();
        final int totalCols = req.getSeatColumns();
        if (totalRows <= 0 || totalCols <= 0) {
            throw new IllegalArgumentException("seatRows/seatColumns ต้องมากกว่า 0");
        }

        // 3) สร้างโซน
        List<SeatZones> zones = new ArrayList<>();
        if (req.getZones() != null && !req.getZones().isEmpty()) {
            for (TicketSetupRequest.ZoneConfig z : req.getZones()) {
                SeatZones zone = new SeatZones();
                zone.setEvent_id(eventId);
                zone.setZone_name(z.getName());
                zone.setDescription(z.getCode());
                // ✅ กันกรณี rowStart เป็น null (เช่นผู้ใช้ใส่แค่ชื่อโซน/ราคา)
                zone.setSort_order(z.getRowStart() != null ? z.getRowStart() : 1);
                zone.setIs_active(true);
                zone.setCreated_at(now);
                zone.setUpdated_at(now);
                seatZonesRepo.save(zone);
                zones.add(zone);

                // mapping zone <-> ticket type (ถ้ามี)
                if (z.getTicketTypeId() != null) {
                    ZoneTicketTypesId id = new ZoneTicketTypesId(zone.getZone_id(), z.getTicketTypeId());
                    zoneTicketTypesRepo.save(new ZoneTicketTypes(id));
                }
            }
        } else {
            // โซนเดียวครอบทั้งหมด
            SeatZones zone = new SeatZones();
            zone.setEvent_id(eventId);
            zone.setZone_name(req.getZone() != null ? req.getZone() : "GENERAL");
            zone.setDescription("AUTO");
            zone.setSort_order(1);
            zone.setIs_active(true);
            zone.setCreated_at(now);
            zone.setUpdated_at(now);
            seatZonesRepo.save(zone);
            zones.add(zone);
        }

        // map zone name -> config (หา rowStart/rowEnd ต่อไป)
        Map<String, TicketSetupRequest.ZoneConfig> cfgByName = new HashMap<>();
        if (req.getZones() != null) {
            for (TicketSetupRequest.ZoneConfig zc : req.getZones()) {
                if (zc.getName() != null) {
                    cfgByName.put(zc.getName().toLowerCase(), zc);
                }
            }
        }

        // 4) สร้างแถว (SeatRows)
        List<SeatRows> allRows = new ArrayList<>();
        for (SeatZones zone : zones) {
            int start = 1, end = totalRows;
            var cfg = cfgByName.get(zone.getZone_name() == null ? "" : zone.getZone_name().toLowerCase());
            if (cfg != null) {
                if (cfg.getRowStart() != null) start = cfg.getRowStart();
                if (cfg.getRowEnd()   != null) end   = cfg.getRowEnd();
            }
            start = Math.max(1, start);
            end   = Math.min(totalRows, end);
            if (start > end) continue;

            for (int i = start; i <= end; i++) {
                SeatRows row = new SeatRows();
                row.setZone_id(zone.getZone_id());
                row.setRow_label(String.valueOf((char) ('A' + (i - 1))));
                row.setSort_order(i);
                row.setCreated_at(now);
                row.setUpdated_at(now);
                seatRowsRepo.save(row);
                allRows.add(row);
            }
        }

        // 5) สร้างที่นั่ง (Seats)
        int totalSeats = 0;
        for (SeatRows row : allRows) {
            for (int c = 1; c <= totalCols; c++) {
                Seats seat = new Seats();
                seat.setRow_id(row.getRow_id());
                seat.setSeat_number(c);
                seat.setSeat_label(row.getRow_label() + c);
                seat.setIs_active(true);
                seat.setCreated_at(now);
                seat.setUpdated_at(now);
                seatsRepo.save(seat);
                totalSeats++;
            }
        }

        System.out.printf("[TicketSetupService] DONE zones=%d rows=%d seats=%d%n",
                zones.size(), allRows.size(), totalSeats);

        return Map.of(
                "status", "ok",
                "eventId", eventId,
                "zones", zones.size(),
                "rows", allRows.size(),
                "seats", totalSeats
        );
    }

    /**
     * ดึงผังที่นั่ง (group เป็นแถว)
     */
    public List<Map<String, Object>> getSeatGrid(Long eventId) {
        List<Seats> seats = seatsRepo.findAllSeatsByEventId(eventId);
        Map<String, List<Seats>> grouped = new LinkedHashMap<>();

        for (Seats s : seats) {
            grouped.computeIfAbsent(s.getSeat_label().substring(0, 1), k -> new ArrayList<>()).add(s);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Seats>> e : grouped.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rowLabel", e.getKey());
            row.put("seats", e.getValue().stream().map(s ->
                    Map.of(
                            "seatNumber", s.getSeat_number(),
                            "seatLabel", s.getSeat_label(),
                            "active", s.getIs_active()
                    )).toList());
            result.add(row);
        }
        return result;
    }

    /**
     * ดึงรายการโซนของอีเวนต์ (ใช้ทำ legend/ราคา)
     */
    public List<SeatZones> getZones(Long eventId) {
        return seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId);
    }
}
