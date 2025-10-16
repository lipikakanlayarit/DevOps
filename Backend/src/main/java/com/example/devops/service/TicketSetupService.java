package com.example.devops.service;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.model.*;
import com.example.devops.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * จัดการผังที่นั่ง (Seat Map) และโซนตั๋วของอีเวนต์
 * ตารางที่เกี่ยวข้อง:
 *   seat_zones(event_id) -> seat_rows(zone_id) -> seats(row_id)
 *   zone_ticket_types(zone_id, ticket_type_id) -> ticket_types(price, min/max_per_order, is_active)
 */
@Service
@RequiredArgsConstructor
public class TicketSetupService {

    private final SeatZonesRepository seatZonesRepo;
    private final SeatRowsRepository seatRowsRepo;
    private final SeatsRepository seatsRepo;
    private final ZoneTicketTypesRepository zoneTicketTypesRepo;
    private final TicketTypesRepository ticketTypesRepo;

    // ------------------------------------------------------------
    // READ: สำหรับ prefill Ticket Detail (ดึง seatRows/seatColumns + โซน + ราคา + Advanced Setting)
    // ------------------------------------------------------------
    @Transactional(readOnly = true)
    public Map<String, Object> getSetup(Long eventId) {
        List<SeatZones> zones = seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId);
        List<Seats> seats = seatsRepo.findAllSeatsByEventId(eventId);

        if ((zones == null || zones.isEmpty()) && (seats == null || seats.isEmpty())) {
            return null; // ยังไม่เคยตั้งค่า
        }

        int seatRows = 0;
        int seatColumns = 0;
        if (seats != null && !seats.isEmpty()) {
            Set<String> rowLabels = seats.stream()
                    .map(Seats::getSeat_label)
                    .filter(Objects::nonNull)
                    .map(lbl -> lbl.isEmpty() ? "" : lbl.substring(0, 1))
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            seatRows = rowLabels.size();

            seatColumns = seats.stream()
                    .map(Seats::getSeat_number)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .max()
                    .orElse(0);
        }

        List<Map<String, Object>> zoneDtos = new ArrayList<>();
        if (zones != null) {
            for (SeatZones z : zones) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", safe(z.getDescription()));
                m.put("name", safe(z.getZone_name()));

                Integer price = null;
                try {
                    BigDecimal p = zoneTicketTypesRepo.findFirstPriceByZoneId(z.getZone_id());
                    if (p != null) price = p.intValue();
                } catch (Throwable ignore) { /* no-op */ }

                m.put("price", price);
                zoneDtos.add(m);
            }
        }

        // ----- Advanced Setting prefill จาก ticket_types ตัวแรกของอีเวนต์ -----
        Integer minPer = null, maxPer = null;
        Boolean active = null;
        List<TicketTypes> types = ticketTypesRepo.findByEventId(eventId);
        if (types != null && !types.isEmpty()) {
            TicketTypes t0 = types.get(0);
            minPer = t0.getMin_per_order();
            maxPer = t0.getMax_per_order();
            active = t0.getIs_active();
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("seatRows", seatRows);
        out.put("seatColumns", seatColumns);
        out.put("zones", zoneDtos);
        out.put("minPerOrder", minPer);
        out.put("maxPerOrder", maxPer);
        out.put("active", active);
        return out;
    }

    // ------------------------------------------------------------
    // UPDATE: ใช้วิธี regenerate ใหม่ทั้งหมด (delegate ไป setup)
    // ------------------------------------------------------------
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> update(Long eventId, TicketSetupRequest req) {
        return setup(eventId, req);
    }

    // ------------------------------------------------------------
    // CREATE/REGENERATE: ลบของเก่า → สร้างใหม่ทั้งหมด (โซน/row/seat + ticket_types + mapping)
    // ------------------------------------------------------------
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> setup(Long eventId, TicketSetupRequest req) {
        System.out.println("[TicketSetupService] setup start eventId=" + eventId);

        final Instant now = Instant.now();

        // 1) ลบของเก่าเรียงตาม FK
        seatsRepo.deleteByEventId(eventId);
        seatRowsRepo.deleteByEventId(eventId);
        zoneTicketTypesRepo.deleteByEventId(eventId);   // ลบ mapping ก่อน
        ticketTypesRepo.deleteByEventId(eventId);       // ลบ ticket_types ของอีเวนต์
        seatZonesRepo.deleteByEventId(eventId);         // แล้วค่อยลบโซน

        // 2) ตรวจ input
        final int totalRows = req.getSeatRows();
        final int totalCols = req.getSeatColumns();
        if (totalRows <= 0 || totalCols <= 0) {
            throw new IllegalArgumentException("seatRows/seatColumns ต้องมากกว่า 0");
        }

        // ✅ รับค่าจาก Advanced Setting (global) + default
        Integer minPer = req.getMinPerOrder() != null ? req.getMinPerOrder() : 1;
        Integer maxPer = req.getMaxPerOrder() != null ? req.getMaxPerOrder() : 1;
        Boolean active = req.getActive() == null ? Boolean.TRUE : req.getActive();

        // 3) สร้างโซน + ถ้ามีราคา → สร้าง ticket_types และ mapping
        List<SeatZones> zones = new ArrayList<>();

        if (req.getZones() != null && !req.getZones().isEmpty()) {
            for (TicketSetupRequest.ZoneConfig z : req.getZones()) {
                // seat_zones
                SeatZones zone = new SeatZones();
                zoneพไเ.setEvent_id(eventId);
                zone.setZone_name(z.getName());
                zone.setDescription(z.getCode());
                zone.setSort_order(z.getRowStart() != null ? z.getRowStart() : 1);
                zone.setIs_active(true);
                zone.setCreated_at(now);
                zone.setUpdated_at(now);
                seatZonesRepo.save(zone);
                zones.add(zone);

                // 3.1 ใช้ ticketTypeId ที่ส่งมาถ้ามี
                Long ticketTypeId = z.getTicketTypeId();

                // 3.2 ถ้า UI ส่ง price มา → สร้าง ticket_types ใหม่
                if (ticketTypeId == null && z.getPrice() != null) {
                    TicketTypes tt = new TicketTypes();
                    tt.setEvent_id(eventId);
                    tt.setType_name(z.getName() != null ? z.getName()
                            : (z.getCode() != null ? z.getCode() : "GENERAL"));
                    tt.setDescription("Auto-created from Ticket Setup");
                    tt.setPrice(BigDecimal.valueOf(z.getPrice()));
                    tt.setQuantity_available(null);
                    tt.setQuantity_sold(0);
                    tt.setSale_start_datetime(null);
                    tt.setSale_end_datetime(null);
                    tt.setIs_active(active);
                    tt.setMin_per_order(minPer);
                    tt.setMax_per_order(maxPer);
                    tt.setCreated_at(now);
                    tt.setUpdated_at(now);
                    ticketTypesRepo.save(tt);
                    ticketTypeId = tt.getTicket_type_id();
                }

                // 3.3 ทำ mapping โซน ↔ ticket_type ถ้ามี id แล้ว
                if (ticketTypeId != null) {
                    ZoneTicketTypesId id = new ZoneTicketTypesId(zone.getZone_id(), ticketTypeId);
                    zoneTicketTypesRepo.save(new ZoneTicketTypes(id));
                }
            }
        } else {
            // โซนเดียว (รองรับรูปแบบเก่า)
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

            // ถ้ามีราคาเดี่ยว ๆ → สร้าง ticket type + mapping
            if (req.getPrice() != null) {
                TicketTypes tt = new TicketTypes();
                tt.setEvent_id(eventId);
                tt.setType_name(zone.getZone_name());
                tt.setDescription("Auto-created from Ticket Setup (single zone)");
                tt.setPrice(BigDecimal.valueOf(req.getPrice()));
                tt.setIs_active(active);
                tt.setMin_per_order(minPer);
                tt.setMax_per_order(maxPer);
                tt.setCreated_at(now);
                tt.setUpdated_at(now);
                ticketTypesRepo.save(tt);

                ZoneTicketTypesId id = new ZoneTicketTypesId(zone.getZone_id(), tt.getTicket_type_id());
                zoneTicketTypesRepo.save(new ZoneTicketTypes(id));
            }
        }

        // 4) seat_rows
        Map<String, TicketSetupRequest.ZoneConfig> cfgByName = new HashMap<>();
        if (req.getZones() != null) {
            for (TicketSetupRequest.ZoneConfig zc : req.getZones()) {
                if (zc.getName() != null) cfgByName.put(zc.getName().toLowerCase(), zc);
            }
        }

        List<SeatRows> allRows = new ArrayList<>();
        for (SeatZones zone : zones) {
            int start = 1, end = totalRows;
            var cfg = cfgByName.get(zone.getZone_name() == null ? "" : zone.getZone_name().toLowerCase());
            if (cfg != null) {
                if (cfg.getRowStart() != null) start = cfg.getRowStart();
                if (cfg.getRowEnd() != null)   end   = cfg.getRowEnd();
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

        // 5) seats
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

    // ------------------------------------------------------------
    // ใช้ในหน้า Seat Map Viewer
    // ------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSeatGrid(Long eventId) {
        List<Seats> seats = seatsRepo.findAllSeatsByEventId(eventId);
        if (seats == null || seats.isEmpty()) return List.of();

        Map<String, List<Seats>> grouped = new LinkedHashMap<>();
        for (Seats s : seats) {
            String rowLabel = s.getSeat_label() != null && !s.getSeat_label().isEmpty()
                    ? s.getSeat_label().substring(0, 1) : "?";
            grouped.computeIfAbsent(rowLabel, k -> new ArrayList<>()).add(s);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Seats>> e : grouped.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rowLabel", e.getKey());
            row.put("seats", e.getValue().stream()
                    .sorted(Comparator.comparingInt(Seats::getSeat_number))
                    .map(s -> Map.of(
                            "seatNumber", s.getSeat_number(),
                            "seatLabel", s.getSeat_label(),
                            "active", s.getIs_active()
                    ))
                    .toList());
            result.add(row);
        }
        return result;
    }

    // ------------------------------------------------------------
    // ดึงโซนทั้งหมดของ event
    // ------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SeatZones> getZones(Long eventId) {
        return seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId);
    }

    // ------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------
    private static String safe(String s) {
        return s == null ? "" : s;
    }
}
