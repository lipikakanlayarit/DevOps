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
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * บริการตั้งค่า Ticket / Seat Layout สำหรับอีเวนต์
 */
@Service
@RequiredArgsConstructor
public class TicketSetupService {

    private final SeatZonesRepository seatZonesRepo;
    private final SeatRowsRepository seatRowsRepo;
    private final SeatsRepository seatsRepo;
    private final ZoneTicketTypesRepository zoneTicketTypesRepo;
    private final TicketTypesRepository ticketTypesRepo;
    private final EventsNamRepository eventsRepo;

    /* ============================================================
       READ: getSetup()
       ============================================================ */
    @Transactional(readOnly = true)
    public Map<String, Object> getSetup(Long eventId) {
        try {
            List<SeatZones> zones = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId));
            List<Seats> seats = safeList(() -> seatsRepo.findAllSeatsByEventId(eventId));
            if (zones.isEmpty() && seats.isEmpty()) return null;

            int seatRows = 0;
            int seatColumns = 0;

            if (!seats.isEmpty()) {
                Set<String> rowLabels = seats.stream()
                        .map(Seats::getSeat_label)
                        .filter(Objects::nonNull)
                        .map(s -> s.isEmpty() ? "" : s.substring(0, 1))
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toCollection(LinkedHashSet::new));
                seatRows = rowLabels.size();
                seatColumns = seats.stream()
                        .map(Seats::getSeat_number)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .max().orElse(0);
            }

            List<Map<String, Object>> zoneDtos = new ArrayList<>();
            for (SeatZones z : zones) {
                Long zoneId = z.getZone_id();
                Long ticketTypeId = null;
                try {
                    List<Long> tts = zoneTicketTypesRepo.findTicketTypeIdsByZoneId(zoneId);
                    if (tts != null && !tts.isEmpty()) ticketTypeId = tts.get(0);
                } catch (Throwable ignore) {}

                Integer price = null;
                try {
                    BigDecimal p = zoneTicketTypesRepo.findFirstPriceByZoneId(zoneId);
                    if (p != null) price = p.intValue();
                } catch (Throwable ignore) {}

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", zoneId);
                m.put("code", safe(z.getDescription()));
                m.put("name", safe(z.getZone_name()));
                m.put("price", price);
                m.put("ticketTypeId", ticketTypeId);
                m.put("hasSeats", !"STANDING".equalsIgnoreCase(safe(z.getDescription())));
                m.put("sortOrder", z.getSort_order() == null ? 0 : z.getSort_order());
                zoneDtos.add(m);
            }

            Integer minPer = null, maxPer = null;
            Boolean active = null;
            Instant saleStart = null, saleEnd = null;

            List<TicketTypes> types = ticketTypesRepo.findByEventId(eventId);
            if (!types.isEmpty()) {
                TicketTypes t0 = types.get(0);
                minPer = t0.getMin_per_order();
                maxPer = t0.getMax_per_order();
                active = t0.getIs_active();
                saleStart = t0.getSale_start_datetime();
                saleEnd = t0.getSale_end_datetime();
            }

            if (saleStart == null || saleEnd == null) {
                EventsNam ev = eventsRepo.findById(eventId).orElse(null);
                if (ev != null) {
                    if (saleStart == null) saleStart = ev.getSalesStartDatetime();
                    if (saleEnd == null) saleEnd = ev.getSalesEndDatetime();
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
        } catch (Exception ex) {
            return emptySetup();
        }
    }

    /* ============================================================
       READ: helpers for other pages
       ============================================================ */

    /** ใช้เรนเดอร์เก้าอี้เป็นกริดในหน้าอื่น */
    @Transactional(readOnly = true)
    public Map<String, Object> getSeatGrid(Long eventId) {
        Map<String, Object> resp = new LinkedHashMap<>();
        List<Map<String, Object>> zoneBlocks = new ArrayList<>();

        List<SeatZones> zones = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId));
        for (SeatZones z : zones) {
            String desc = safe(z.getDescription());
            boolean hasSeats = !"STANDING".equalsIgnoreCase(desc);

            Map<String, Object> zoneBlock = new LinkedHashMap<>();
            zoneBlock.put("zoneId", z.getZone_id());
            zoneBlock.put("zoneName", safe(z.getZone_name()));
            zoneBlock.put("zoneCode", desc);
            zoneBlock.put("hasSeats", hasSeats);

            if (hasSeats) {
                // ดึง row ทั้งหมดของโซน และที่นั่งในแต่ละแถว
                List<Map<String, Object>> rows = new ArrayList<>();
                List<SeatRows> zoneRows = safeList(() -> seatRowsRepo.findAllRowsByEventId(eventId))
                        .stream().filter(r -> Objects.equals(r.getZone_id(), z.getZone_id()))
                        .sorted(Comparator.comparing(r -> Optional.ofNullable(r.getSort_order()).orElse(0)))
                        .toList();

                for (SeatRows r : zoneRows) {
                    List<Seats> seats = safeList(() -> seatsRepo.findAllSeatsByEventId(eventId))
                            .stream().filter(s -> Objects.equals(s.getRow_id(), r.getRow_id()))
                            .sorted(Comparator.comparing(Seats::getSeat_number))
                            .toList();
                    List<Map<String, Object>> seatCells = new ArrayList<>();
                    for (Seats s : seats) {
                        Map<String, Object> cell = new LinkedHashMap<>();
                        cell.put("seatId", s.getSeat_id());
                        cell.put("label", s.getSeat_label());
                        cell.put("number", s.getSeat_number());
                        cell.put("active", Boolean.TRUE.equals(s.getIs_active()));
                        seatCells.add(cell);
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("rowId", r.getRow_id());
                    row.put("rowLabel", r.getRow_label());
                    row.put("seats", seatCells);
                    rows.add(row);
                }
                zoneBlock.put("rows", rows);
                zoneBlock.put("rowCount", rows.size());
                zoneBlock.put("colCount", rows.stream().mapToInt(rr -> ((List<?>)rr.get("seats")).size()).max().orElse(0));
            } else {
                zoneBlock.put("rows", List.of());
                zoneBlock.put("rowCount", 0);
                zoneBlock.put("colCount", 0);
            }

            zoneBlocks.add(zoneBlock);
        }

        resp.put("eventId", eventId);
        resp.put("zones", zoneBlocks);
        return resp;
    }

    /** สำหรับ TicketController /zones */
    @Transactional(readOnly = true)
    public List<SeatZones> getZones(Long eventId) {
        return seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId);
    }

    /* ============================================================
       WRITE: setup / update
       ============================================================ */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> setup(Long eventId, TicketSetupRequest req) {
        return persistSetup(eventId, req);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> update(Long eventId, TicketSetupRequest req) {
        return persistSetup(eventId, req);
    }

    /**
     * - สร้าง/อัปเดต TicketTypes ให้ "type_name" = zone code (uppercase) หรือ zone name
     * - ราคา ticket type ตามราคาใน zone
     * - แมป Zone ↔ TicketType ตามชื่อเดียวกัน
     * - regenerate seat grid เมื่อส่ง rows/cols > 0
     */
    private Map<String, Object> persistSetup(Long eventId, TicketSetupRequest req) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            EventsNam ev = eventsRepo.findById(eventId).orElse(null);
            if (ev == null) {
                result.put("status", "error");
                result.put("message", "EVENT_NOT_FOUND: " + eventId);
                return result;
            }

            // 1) update sales period on events_nam
            if (req.getSalesStartDatetime() != null) ev.setSalesStartDatetime(req.getSalesStartDatetime());
            if (req.getSalesEndDatetime() != null)   ev.setSalesEndDatetime(req.getSalesEndDatetime());
            eventsRepo.save(ev);

            // 2) load existing ticket types of this event as a map by UPPER(type_name)
            List<TicketTypes> existingTypes = ticketTypesRepo.findByEventId(eventId);
            Map<String, TicketTypes> typeByName = existingTypes.stream()
                    .filter(t -> t.getType_name() != null)
                    .collect(Collectors.toMap(t -> t.getType_name().toUpperCase(Locale.ROOT), t -> t, (a,b)->a, LinkedHashMap::new));

            // defaults
            Integer minPer = orElse(req.getMinPerOrder(), 1);
            Integer maxPer = orElse(req.getMaxPerOrder(), 10);
            Boolean active = orElse(req.getActive(), true);
            Instant saleStart = orElse(req.getSalesStartDatetime(), ev.getSalesStartDatetime());
            Instant saleEnd   = orElse(req.getSalesEndDatetime(),   ev.getSalesEndDatetime());

            // 3) upsert zones
            Map<Long, SeatZones> zonesById = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId))
                    .stream().collect(Collectors.toMap(SeatZones::getZone_id, z -> z, (a,b)->a, LinkedHashMap::new));

            List<TicketSetupRequest.ZoneDTO> zoneReqs = Optional.ofNullable(req.getZones()).orElse(List.of());
            List<SeatZones> savedZones = new ArrayList<>();
            for (TicketSetupRequest.ZoneDTO z : zoneReqs) {
                SeatZones zone = (z.getId() != null && zonesById.containsKey(z.getId()))
                        ? zonesById.get(z.getId())
                        : new SeatZones();

                zone.setEvent_id(eventId);
                zone.setZone_name(safe(z.getName()));
                zone.setDescription(safe(z.getCode())); // ใช้เป็นรหัส zone (จะกลายเป็น type_name ด้วย)
                zone.setSort_order(z.getSortOrder() == null ? 0 : z.getSortOrder());
                zone.setIs_active(true);
                zone.setUpdated_at(Instant.now());
                if (zone.getCreated_at() == null) zone.setCreated_at(Instant.now());
                zone = seatZonesRepo.save(zone);
                savedZones.add(zone);

                // ----- upsert TicketType สำหรับ zone นี้ -----
                String typeKey = safeUpper(firstNonEmpty(z.getCode(), z.getName(), "GENERAL"));
                TicketTypes t = typeByName.get(typeKey);
                if (t == null) {
                    t = new TicketTypes();
                    t.setEvent_id(eventId);
                    t.setType_name(typeKey);
                    t.setDescription("Auto for zone " + safe(z.getName()));
                    t.setQuantity_available(0);
                    t.setQuantity_sold(0);
                    t.setCreated_at(Instant.now());
                    typeByName.put(typeKey, t);
                }
                if (z.getPrice() != null) t.setPrice(BigDecimal.valueOf(z.getPrice()));
                if (t.getPrice() == null) t.setPrice(BigDecimal.ZERO);
                t.setIs_active(active);
                t.setMin_per_order(minPer);
                t.setMax_per_order(maxPer);
                t.setSale_start_datetime(saleStart);
                t.setSale_end_datetime(saleEnd);
                t.setUpdated_at(Instant.now());
            }
            // save all ticket types (new/updated)
            ticketTypesRepo.saveAll(typeByName.values());

            // 4) Map Zone ↔ TicketType (ล้างของเดิมแล้วผูกใหม่ตามชื่อ)
            for (SeatZones zone : savedZones) {
                zoneTicketTypesRepo.deleteByZoneId(zone.getZone_id());
                String typeKey = safeUpper(firstNonEmpty(zone.getDescription(), zone.getZone_name(), "GENERAL"));
                TicketTypes t = typeByName.get(typeKey);
                if (t == null && !typeByName.isEmpty()) {
                    t = typeByName.values().iterator().next(); // กันพลาด
                }
                if (t != null) {
                    ZoneTicketTypes ztt = new ZoneTicketTypes();
                    ztt.setId(new ZoneTicketTypesId(zone.getZone_id(), t.getTicket_type_id()));
                    zoneTicketTypesRepo.save(ztt);
                }
            }

            // 5) Seat grid regenerate
            int rows = Optional.ofNullable(req.getSeatRows()).orElse(0);
            int cols = Optional.ofNullable(req.getSeatColumns()).orElse(0);
            if (rows > 0 && cols > 0) {
                seatsRepo.deleteByEventId(eventId);
                seatRowsRepo.deleteByEventId(eventId);

                for (SeatZones z : savedZones) {
                    if ("STANDING".equalsIgnoreCase(safe(z.getDescription()))) continue;

                    for (int i = 1; i <= rows; i++) {
                        SeatRows r = new SeatRows();
                        r.setZone_id(z.getZone_id());
                        r.setRow_label(String.valueOf((char) ('A' + (i - 1))));
                        r.setSort_order(i);
                        r.setCreated_at(Instant.now());
                        r.setUpdated_at(Instant.now());
                        r = seatRowsRepo.save(r);

                        for (int c = 1; c <= cols; c++) {
                            Seats s = new Seats();
                            s.setRow_id(r.getRow_id());
                            s.setSeat_number(c);
                            s.setSeat_label(r.getRow_label() + c);
                            s.setIs_active(true);
                            s.setCreated_at(Instant.now());
                            s.setUpdated_at(Instant.now());
                            seatsRepo.save(s);
                        }
                    }
                }
            }

            result.put("status", "ok");
            result.put("eventId", eventId);
            result.put("ticketTypes", typeByName.keySet()); // debug
            return result;
        } catch (Exception ex) {
            result.put("status", "error");
            result.put("message", ex.getMessage());
            return result;
        }
    }

    /* ============================================================
       Helpers
       ============================================================ */
    private static String safe(String s) { return s == null ? "" : s; }
    private static String safeUpper(String s) { return safe(s).toUpperCase(Locale.ROOT); }

    private static <T> List<T> safeList(Supplier<List<T>> supplier) {
        try { return Optional.ofNullable(supplier.get()).orElse(List.of()); }
        catch (Throwable ignore) { return List.of(); }
    }

    private static <T> T orElse(T v, T def) { return v != null ? v : def; }

    private static String firstNonEmpty(String... arr) {
        if (arr == null) return "";
        for (String s : arr) {
            if (s != null && !s.isBlank()) return s;
        }
        return "";
    }

    private static Map<String, Object> emptySetup() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("seatRows", 0);
        m.put("seatColumns", 0);
        m.put("zones", List.of());
        m.put("minPerOrder", null);
        m.put("maxPerOrder", null);
        m.put("active", null);
        m.put("salesStartDatetime", null);
        m.put("salesEndDatetime", null);
        return m;
    }
}
