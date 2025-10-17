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
 *   zone_ticket_types(zone_id, ticket_type_id) -> ticket_types(price, min/max_per_order, is_active, sale_*_datetime)
 */
@Service
@RequiredArgsConstructor
public class TicketSetupService {

    private final SeatZonesRepository seatZonesRepo;
    private final SeatRowsRepository seatRowsRepo;
    private final SeatsRepository seatsRepo;
    private final ZoneTicketTypesRepository zoneTicketTypesRepo;
    private final TicketTypesRepository ticketTypesRepo;

    // 🆕 เพิ่ม repo นี้เพื่ออัปเดต sales period ลง events_nam
    private final EventsNamRepository eventsRepo;

    // ------------------------------------------------------------
    // READ: Prefill หน้า Ticket Detail
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

        // Advanced + Sales Period จาก ticket_types (ตัวแรก) — ถ้าไม่มีให้ fallback จาก events_nam
        Integer minPer = null, maxPer = null;
        Boolean active = null;
        Instant saleStart = null, saleEnd = null;

        List<TicketTypes> types = ticketTypesRepo.findByEventId(eventId);
        if (types != null && !types.isEmpty()) {
            TicketTypes t0 = types.get(0);
            minPer    = t0.getMin_per_order();
            maxPer    = t0.getMax_per_order();
            active    = t0.getIs_active();
            saleStart = t0.getSale_start_datetime();
            saleEnd   = t0.getSale_end_datetime();
        }

        // 🆕 fallback จาก events_nam ถ้า ticket_types ไม่มีค่า
        if (saleStart == null || saleEnd == null) {
            EventsNam ev = eventsRepo.findById(eventId).orElse(null);
            if (ev != null) {
                if (saleStart == null) saleStart = ev.getSalesStartDatetime();
                if (saleEnd   == null) saleEnd   = ev.getSalesEndDatetime();
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("seatRows", seatRows);
        out.put("seatColumns", seatColumns);
        out.put("zones", zoneDtos);
        out.put("minPerOrder", minPer);
        out.put("maxPerOrder", maxPer);
        out.put("active", active);
        out.put("salesStartDatetime", saleStart);
        out.put("salesEndDatetime", saleEnd);
        return out;
    }

    // ------------------------------------------------------------
    // UPDATE = Regenerate (เหมือน POST)
    // ------------------------------------------------------------
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> update(Long eventId, TicketSetupRequest req) {
        return setup(eventId, req);
    }

    // ------------------------------------------------------------
    // CREATE/REGENERATE ทั้งชุด
    // ------------------------------------------------------------
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> setup(Long eventId, TicketSetupRequest req) {
        final Instant now = Instant.now();
        validateBasics(req);

        // ลบของเก่าเรียงตาม FK
        seatsRepo.deleteByEventId(eventId);
        seatRowsRepo.deleteByEventId(eventId);
        zoneTicketTypesRepo.deleteByEventId(eventId);
        ticketTypesRepo.deleteByEventId(eventId);
        seatZonesRepo.deleteByEventId(eventId);

        final int totalRows = req.getSeatRows();
        final int totalCols = req.getSeatColumns();

        // Advanced (ค่าเริ่มต้น)
        Integer minPer = defaultInt(req.getMinPerOrder(), 1);
        Integer maxPer = defaultInt(req.getMaxPerOrder(), 1);
        Boolean active = (req.getActive() == null) ? Boolean.TRUE : req.getActive();

        // Sales period (validate)
        Instant saleStart = req.getSalesStartDatetime();
        Instant saleEnd   = req.getSalesEndDatetime();
        if (saleStart != null && saleEnd != null && !saleEnd.isAfter(saleStart)) {
            throw new IllegalArgumentException("salesEndDatetime ต้องมากกว่า salesStartDatetime");
        }

        // 🆕 อัปเดตลง events_nam เสมอ (admin/list จะเห็นค่าถูกต้อง)
        eventsRepo.updateSalesPeriod(eventId, saleStart, saleEnd);

        // -----------------------------
        // 1) seat_zones (+ ticket_types/mapping)
        // -----------------------------
        List<SeatZones> zones = new ArrayList<>();
        List<ZoneTicketTypes> mappings = new ArrayList<>();

        if (req.getZones() != null && !req.getZones().isEmpty()) {
            for (TicketSetupRequest.ZoneConfig z : req.getZones()) {
                String zoneName = nz(trim(z.getName()), "GENERAL");
                String zoneCode = trim(z.getCode());

                SeatZones zone = new SeatZones();
                zone.setEvent_id(eventId);
                zone.setZone_name(zoneName);
                zone.setDescription(zoneCode);
                zone.setSort_order((z.getRowStart() != null) ? z.getRowStart() : 1);
                zone.setIs_active(true);
                zone.setCreated_at(now);
                zone.setUpdated_at(now);
                seatZonesRepo.save(zone);
                zones.add(zone);

                Long ticketTypeId = z.getTicketTypeId();

                if (ticketTypeId != null) {
                    // ปรับค่ากลาง + sales period ให้ ticket type ที่มีอยู่
                    TicketTypes tt = ticketTypesRepo.findById(ticketTypeId).orElse(null);
                    if (tt != null) {
                        if (z.getPrice() != null) tt.setPrice(BigDecimal.valueOf(z.getPrice()));
                        tt.setMin_per_order(minPer);
                        tt.setMax_per_order(maxPer);
                        tt.setIs_active(active);
                        tt.setSale_start_datetime(saleStart);
                        tt.setSale_end_datetime(saleEnd);
                        tt.setUpdated_at(now);
                        ticketTypesRepo.save(tt);

                        mappings.add(new ZoneTicketTypes(new ZoneTicketTypesId(zone.getZone_id(), tt.getTicket_type_id())));
                    }
                } else if (z.getPrice() != null) {
                    // สร้าง ticket_types ใหม่
                    TicketTypes tt = new TicketTypes();
                    tt.setEvent_id(eventId);
                    tt.setType_name(zoneName);
                    tt.setDescription("Auto-created from Ticket Setup");
                    tt.setPrice(BigDecimal.valueOf(z.getPrice()));
                    tt.setQuantity_available(null);
                    tt.setQuantity_sold(0);
                    tt.setSale_start_datetime(saleStart);
                    tt.setSale_end_datetime(saleEnd);
                    tt.setIs_active(active);
                    tt.setMin_per_order(minPer);
                    tt.setMax_per_order(maxPer);
                    tt.setCreated_at(now);
                    tt.setUpdated_at(now);
                    ticketTypesRepo.save(tt);

                    mappings.add(new ZoneTicketTypes(new ZoneTicketTypesId(zone.getZone_id(), tt.getTicket_type_id())));
                }
            }
        } else {
            // โซนเดียว (compat โค้ดเก่า)
            SeatZones zone = new SeatZones();
            zone.setEvent_id(eventId);
            zone.setZone_name(nz(trim(req.getZone()), "GENERAL"));
            zone.setDescription("AUTO");
            zone.setSort_order(1);
            zone.setIs_active(true);
            zone.setCreated_at(now);
            zone.setUpdated_at(now);
            seatZonesRepo.save(zone);
            zones.add(zone);

            if (req.getPrice() != null) {
                TicketTypes tt = new TicketTypes();
                tt.setEvent_id(eventId);
                tt.setType_name(zone.getZone_name());
                tt.setDescription("Auto-created from Ticket Setup (single zone)");
                tt.setPrice(BigDecimal.valueOf(req.getPrice()));
                tt.setIs_active(active);
                tt.setMin_per_order(minPer);
                tt.setMax_per_order(maxPer);
                tt.setSale_start_datetime(saleStart);
                tt.setSale_end_datetime(saleEnd);
                tt.setCreated_at(now);
                tt.setUpdated_at(now);
                ticketTypesRepo.save(tt);

                mappings.add(new ZoneTicketTypes(new ZoneTicketTypesId(zone.getZone_id(), tt.getTicket_type_id())));
            }
        }

        if (!mappings.isEmpty()) {
            zoneTicketTypesRepo.saveAll(mappings);
        }

        // -----------------------------
        // 2) seat_rows
        // -----------------------------
        Map<String, TicketSetupRequest.ZoneConfig> cfgByName = new HashMap<>();
        if (req.getZones() != null) {
            for (TicketSetupRequest.ZoneConfig zc : req.getZones()) {
                if (zc.getName() != null) cfgByName.put(zc.getName().toLowerCase(), zc);
            }
        }

        List<SeatRows> allRows = new ArrayList<>();
        for (SeatZones zone : zones) {
            int start = 1, end = totalRows;
            TicketSetupRequest.ZoneConfig cfg = cfgByName.getOrDefault(nz(zone.getZone_name(), "").toLowerCase(), null);
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
                allRows.add(row);
            }
        }
        if (!allRows.isEmpty()) seatRowsRepo.saveAll(allRows);

        // -----------------------------
        // 3) seats (batch)
        // -----------------------------
        int totalSeats = 0;
        final int batchSize = 500;
        List<Seats> seatBatch = new ArrayList<>(batchSize);

        for (SeatRows row : allRows) {
            for (int c = 1; c <= totalCols; c++) {
                Seats seat = new Seats();
                seat.setRow_id(row.getRow_id());
                seat.setSeat_number(c);
                seat.setSeat_label(row.getRow_label() + c);
                seat.setIs_active(true);
                seat.setCreated_at(now);
                seat.setUpdated_at(now);

                seatBatch.add(seat);
                totalSeats++;

                if (seatBatch.size() == batchSize) {
                    seatsRepo.saveAll(seatBatch);
                    seatBatch.clear();
                }
            }
        }
        if (!seatBatch.isEmpty()) seatsRepo.saveAll(seatBatch);

        return Map.of(
                "status", "ok",
                "eventId", eventId,
                "zones", zones.size(),
                "rows", allRows.size(),
                "seats", totalSeats
        );
    }

    // ------------------------------------------------------------
    // ใช้ในหน้า Seat Map Viewer (เรนเดอร์เก้าอี้เป็นกริด)
    // ------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSeatGrid(Long eventId) {
        List<Seats> seats = seatsRepo.findAllSeatsByEventId(eventId);
        if (seats == null || seats.isEmpty()) return List.of();

        Map<String, List<Seats>> grouped = new LinkedHashMap<>();
        for (Seats s : seats) {
            String rowLabel = (s.getSeat_label() != null && !s.getSeat_label().isEmpty())
                    ? s.getSeat_label().substring(0, 1)
                    : "?";
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
    // ดึงโซนทั้งหมดของ event (ตาม sort order)
    // ------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<SeatZones> getZones(Long eventId) {
        return seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId);
    }

    // -----------------------------
    // helpers
    // -----------------------------
    private static String safe(String s) { return s == null ? "" : s; }

    private static String trim(String s) { return (s == null) ? null : s.trim(); }

    private static String nz(String s, String def) { return (s == null || s.isBlank()) ? def : s; }

    private static int defaultInt(Integer val, int def) { return val == null ? def : val; }

    private static void validateBasics(TicketSetupRequest req) {
        if (req == null) throw new IllegalArgumentException("payload is null");
        if (req.getSeatRows() <= 0) throw new IllegalArgumentException("seatRows ต้องมากกว่า 0");
        if (req.getSeatColumns() <= 0) throw new IllegalArgumentException("seatColumns ต้องมากกว่า 0");
        if (req.getZones() != null) {
            Set<String> dupCheck = new HashSet<>();
            for (TicketSetupRequest.ZoneConfig z : req.getZones()) {
                String nm = nz(trim(z.getName()), "GENERAL").toLowerCase();
                if (!dupCheck.add(nm)) {
                    // ถ้าต้องการเข้มงวดเรื่องชื่อโซนซ้ำ ให้ปลดคอมเมนต์
                    // throw new IllegalArgumentException("พบชื่อโซนซ้ำ: " + nm);
                }
            }
        }
    }
}
