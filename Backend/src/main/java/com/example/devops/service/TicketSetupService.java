package com.example.devops.service;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.model.*;
import com.example.devops.repo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketSetupService {

    private final SeatZonesRepository seatZonesRepo;
    private final SeatRowsRepository seatRowsRepo;
    private final SeatsRepository seatsRepo;
    private final ZoneTicketTypesRepository zoneTicketTypesRepo;
    private final TicketTypesRepository ticketTypesRepo;
    private final EventsNamRepository eventsRepo;

    /* ===========================
       PUBLIC SETUP (for SeatMap)
       =========================== */
    @Transactional(readOnly = true)
    public Map<String, Object> getSetup(Long eventId) {
        try {
            List<SeatZones> zones = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId));
            List<Seats> seats = safeList(() -> seatsRepo.findAllSeatsByEventId(eventId));
            if (zones.isEmpty() && seats.isEmpty()) return null;

            int seatRows = 0;
            int seatColumns = 0;

            List<SeatRows> rows = safeList(() -> seatRowsRepo.findAllRowsByEventId(eventId));
            if (!rows.isEmpty()) {
                seatRows = rows.size();
            } else if (!seats.isEmpty()) {
                Set<String> rowLabels = seats.stream()
                        .map(Seats::getSeatLabel)
                        .filter(Objects::nonNull)
                        .map(s -> s.isEmpty() ? "" : s.substring(0, 1))
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toCollection(LinkedHashSet::new));
                seatRows = rowLabels.size();
            }

            if (!seats.isEmpty()) {
                seatColumns = seats.stream()
                        .map(Seats::getSeatNumber)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .max().orElse(0);
            }

            // ✅ ที่นั่งที่ขายแล้ว (PAID) — คืนเป็นพิกัด 0-based ต่อโซน
            Map<Long, List<Map<String, Integer>>> occupiedByZone = new HashMap<>();
            try {
                List<Object[]> occ = seatsRepo.findOccupiedWithZoneRowColByEventId(eventId);
                for (Object[] row : occ) {
                    Long zoneId = ((Number) row[0]).longValue();
                    int r1 = ((Number) row[1]).intValue(); // 1-based
                    int c1 = ((Number) row[2]).intValue(); // 1-based
                    int r = Math.max(0, r1 - 1);
                    int c = Math.max(0, c1 - 1);
                    occupiedByZone.computeIfAbsent(zoneId, k -> new ArrayList<>())
                            .add(Map.of("r", r, "c", c));
                }
            } catch (Exception ex) {
                log.warn("occupiedSeats query failed: {}", ex.getMessage());
            }

            // ✅ รวม seatIds ที่ PAID + LOCKED(ยังไม่หมดอายุ) แล้วแปลงเป็นพิกัด
            try {
                List<Long> paidIds   = safeList(() -> seatsRepo.findPaidTakenSeatIdsByEvent(eventId));
                List<Long> lockedIds = safeList(() -> seatsRepo.findLockedSeatIdsByEvent(eventId));
                Set<Long> union = new LinkedHashSet<>();
                union.addAll(paidIds);
                union.addAll(lockedIds);
                if (!union.isEmpty()) {
                    List<Object[]> mapped = seatsRepo.findZoneRowColForSeatIds(eventId, union.toArray(Long[]::new));
                    for (Object[] r : mapped) {
                        Long zoneId = ((Number) r[1]).longValue();
                        int r1 = ((Number) r[2]).intValue();
                        int c1 = ((Number) r[3]).intValue();
                        int rr = Math.max(0, r1 - 1);
                        int cc = Math.max(0, c1 - 1);
                        occupiedByZone.computeIfAbsent(zoneId, k -> new ArrayList<>())
                                .add(Map.of("r", rr, "c", cc));
                    }
                }
            } catch (Exception ex) {
                log.warn("map seatIds to coords failed: {}", ex.getMessage());
            }

            // ===== zones DTO =====
            List<Map<String, Object>> zoneDtos = new ArrayList<>();
            for (SeatZones z : zones) {
                Long zoneId = z.getZoneId();

                Long ticketTypeId = null;
                try {
                    List<Long> tts = zoneTicketTypesRepo.findTicketTypeIdsByZoneId(zoneId);
                    if (tts != null && !tts.isEmpty()) ticketTypeId = tts.get(0);
                } catch (Throwable ignore) {}

                Integer price = null;
                try {
                    // 1) จาก mapping zone↔type
                    BigDecimal p = zoneTicketTypesRepo.findFirstPriceByZoneId(zoneId);
                    if (p != null) price = p.intValue();
                    else {
                        // 2) Fallback: หาใน ticket_types ด้วย typeKey (code > name > GENERAL)
                        String typeKey = safeUpper(firstNonEmpty(z.getDescription(), z.getZoneName(), "GENERAL"));
                        BigDecimal p2 = zoneTicketTypesRepo.findPriceByEventAndTypeKey(eventId, typeKey);
                        if (p2 != null) price = p2.intValue();
                    }
                } catch (Throwable ignore) {}

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", zoneId);
                m.put("code", safe(z.getDescription()));
                m.put("name", safe(z.getZoneName()));
                m.put("price", price);                 // ✅ now FE จะเห็นราคา
                m.put("ticketTypeId", ticketTypeId);
                m.put("hasSeats", !"STANDING".equalsIgnoreCase(safe(z.getDescription())));
                m.put("sortOrder", z.getSortOrder() == null ? 0 : z.getSortOrder());
                m.put("occupiedSeats", occupiedByZone.getOrDefault(zoneId, List.of()));

                zoneDtos.add(m);
            }

            // TicketTypes defaults
            Integer minPer = null, maxPer = null;
            Boolean active = null;
            Instant saleStart = null, saleEnd = null;

            List<TicketTypes> types = ticketTypesRepo.findByEventId(eventId);
            if (!types.isEmpty()) {
                TicketTypes t0 = types.get(0);
                minPer = t0.getMinPerOrder();
                maxPer = t0.getMaxPerOrder();
                active = t0.getIsActive();
                saleStart = t0.getSaleStartDatetime();
                saleEnd = t0.getSaleEndDatetime();
            }

            if (saleStart == null || saleEnd == null) {
                var ev = eventsRepo.findById(eventId).orElse(null);
                if (ev != null) {
                    if (saleStart == null) saleStart = ev.getSalesStartDatetime();
                    if (saleEnd == null)   saleEnd   = ev.getSalesEndDatetime();
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
            log.error("getSetup error: {}", ex.getMessage(), ex);
            return emptySetup();
        }
    }

    /* ================
       GRID FOR ORG
       ================ */
    @Transactional(readOnly = true)
    public Map<String, Object> getSeatGrid(Long eventId) {
        Map<String, Object> resp = new LinkedHashMap<>();
        List<Map<String, Object>> zoneBlocks = new ArrayList<>();

        List<SeatZones> zones = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId));
        List<SeatRows> allRows = safeList(() -> seatRowsRepo.findAllRowsByEventId(eventId));
        List<Seats> allSeats = safeList(() -> seatsRepo.findAllSeatsByEventId(eventId));

        for (SeatZones z : zones) {
            String desc = safe(z.getDescription());
            boolean hasSeats = !"STANDING".equalsIgnoreCase(desc);

            Map<String, Object> zoneBlock = new LinkedHashMap<>();
            zoneBlock.put("zoneId", z.getZoneId());
            zoneBlock.put("zoneName", safe(z.getZoneName()));
            zoneBlock.put("zoneCode", desc);
            zoneBlock.put("hasSeats", hasSeats);

            if (hasSeats) {
                List<Map<String, Object>> rows = new ArrayList<>();

                List<SeatRows> zoneRows = allRows.stream()
                        .filter(r -> Objects.equals(r.getZoneId(), z.getZoneId()))
                        .sorted(Comparator.comparing(r -> Optional.ofNullable(r.getSortOrder()).orElse(0)))
                        .toList();

                for (SeatRows r : zoneRows) {
                    List<Seats> seats = allSeats.stream()
                            .filter(s -> Objects.equals(s.getRowId(), r.getRowId()))
                            .sorted(Comparator.comparing(Seats::getSeatNumber))
                            .toList();

                    List<Map<String, Object>> seatCells = new ArrayList<>();
                    for (Seats s : seats) {
                        Map<String, Object> cell = new LinkedHashMap<>();
                        cell.put("seatId", s.getSeatId());
                        cell.put("label", s.getSeatLabel());
                        cell.put("number", s.getSeatNumber());
                        cell.put("active", Boolean.TRUE.equals(s.getIsActive()));
                        seatCells.add(cell);
                    }

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("rowId", r.getRowId());
                    row.put("rowLabel", r.getRowLabel());
                    row.put("seats", seatCells);
                    rows.add(row);
                }

                zoneBlock.put("rows", rows);
                zoneBlock.put("rowCount", rows.size());
                zoneBlock.put("colCount", rows.stream()
                        .mapToInt(rr -> ((List<?>) rr.get("seats")).size())
                        .max().orElse(0));
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

    /* ===========================
       CREATE / UPDATE SETUP
       =========================== */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> setup(Long eventId, TicketSetupRequest req) {
        return persistSetup(eventId, req);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> update(Long eventId, TicketSetupRequest req) {
        return persistSetup(eventId, req);
    }

    private Map<String, Object> persistSetup(Long eventId, TicketSetupRequest req) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            var ev = eventsRepo.findById(eventId).orElse(null);
            if (ev == null) {
                result.put("status", "error");
                result.put("message", "EVENT_NOT_FOUND: " + eventId);
                return result;
            }

            if (req.getSalesStartDatetime() != null) ev.setSalesStartDatetime(req.getSalesStartDatetime());
            if (req.getSalesEndDatetime() != null)   ev.setSalesEndDatetime(req.getSalesEndDatetime());
            eventsRepo.save(ev);

            List<TicketTypes> existingTypes = ticketTypesRepo.findByEventId(eventId);
            Map<String, TicketTypes> typeByName = existingTypes.stream()
                    .filter(t -> t.getTypeName() != null)
                    .collect(Collectors.toMap(
                            t -> t.getTypeName().toUpperCase(Locale.ROOT),
                            t -> t, (a,b)->a, LinkedHashMap::new
                    ));

            Integer minPer = orElse(req.getMinPerOrder(), 1);
            Integer maxPer = orElse(req.getMaxPerOrder(), 10);
            Boolean active = orElse(req.getActive(), true);
            Instant saleStart = orElse(req.getSalesStartDatetime(), ev.getSalesStartDatetime());
            Instant saleEnd   = orElse(req.getSalesEndDatetime(),   ev.getSalesEndDatetime());

            Map<Long, SeatZones> zonesById = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAsc(eventId))
                    .stream().collect(Collectors.toMap(SeatZones::getZoneId, z -> z, (a,b)->a, LinkedHashMap::new));

            List<TicketSetupRequest.ZoneDTO> zoneReqs = Optional.ofNullable(req.getZones()).orElse(List.of());
            List<SeatZones> savedZones = new ArrayList<>();

            for (TicketSetupRequest.ZoneDTO z : zoneReqs) {
                // ✅ หาโซนเดิมก่อน (id -> code -> name)
                SeatZones zone = null;
                if (z.getId() != null && zonesById.containsKey(z.getId())) {
                    zone = zonesById.get(z.getId());
                } else {
                    String codeKey = safeUpper(firstNonEmpty(z.getCode(), ""));
                    String nameKey = safeUpper(firstNonEmpty(z.getName(), ""));
                    for (SeatZones exist : zonesById.values()) {
                        String existCode = safeUpper(firstNonEmpty(exist.getDescription(), ""));
                        String existName = safeUpper(firstNonEmpty(exist.getZoneName(), ""));
                        if (!codeKey.isBlank() && codeKey.equals(existCode)) { zone = exist; break; }
                        if (!nameKey.isBlank() && nameKey.equals(existName)) { zone = exist; break; }
                    }
                    if (zone == null) zone = new SeatZones(); // ไม่เจอจริง ๆ ค่อยสร้างใหม่
                }

                // ✅ อัปเดตข้อมูลโซน
                zone.setEventId(eventId);
                zone.setZoneName(safe(z.getName()));
                zone.setDescription(safe(z.getCode()));           // ใช้เป็น typeKey
                zone.setSortOrder(z.getSortOrder() == null ? 0 : z.getSortOrder());
                zone.setIsActive(true);
                zone.setUpdatedAt(Instant.now());
                if (zone.getCreatedAt() == null) zone.setCreatedAt(Instant.now());
                zone = seatZonesRepo.save(zone);
                savedZones.add(zone);
                zonesById.put(zone.getZoneId(), zone); // sync

                // ✅ บริหาร ticket type ด้วย typeKey
                String typeKey = safeUpper(firstNonEmpty(z.getCode(), z.getName(), "GENERAL"));
                TicketTypes t = typeByName.get(typeKey);
                if (t == null) {
                    t = new TicketTypes();
                    t.setEventId(eventId);
                    t.setTypeName(typeKey);
                    t.setDescription("Auto for zone " + safe(z.getName()));
                    t.setQuantityAvailable(0);
                    t.setQuantitySold(0);
                    t.setCreatedAt(Instant.now());
                    typeByName.put(typeKey, t);
                }
                if (z.getPrice() != null) t.setPrice(BigDecimal.valueOf(z.getPrice()));
                if (t.getPrice() == null) t.setPrice(BigDecimal.ZERO);
                t.setIsActive(active);
                t.setMinPerOrder(minPer);
                t.setMaxPerOrder(maxPer);
                t.setSaleStartDatetime(saleStart);
                t.setSaleEndDatetime(saleEnd);
                t.setUpdatedAt(Instant.now());
            }

            // ✅ เซฟ ticket types ก่อน
            ticketTypesRepo.saveAll(typeByName.values());

            // ✅ Re-link zone ↔ ticket_type ตาม typeKey (เคลียร์ของเดิมกันซ้อน)
            for (SeatZones zone : savedZones) {
                zoneTicketTypesRepo.deleteByZoneId(zone.getZoneId());
                String typeKey = safeUpper(firstNonEmpty(zone.getDescription(), zone.getZoneName(), "GENERAL"));
                TicketTypes t = typeByName.get(typeKey);
                if (t != null) {
                    ZoneTicketTypes ztt = new ZoneTicketTypes();
                    ztt.setId(new ZoneTicketTypesId(zone.getZoneId(), t.getTicketTypeId()));
                    zoneTicketTypesRepo.save(ztt);
                }
            }

            // ====== GEN SEATS (ถ้า req ระบุ grid ใหม่) ======
            int rowsCount = Optional.ofNullable(req.getSeatRows()).orElse(0);
            int colsCount = Optional.ofNullable(req.getSeatColumns()).orElse(0);
            if (rowsCount > 0 && colsCount > 0) {
                seatsRepo.deleteByEventId(eventId);
                seatRowsRepo.deleteByEventId(eventId);

                for (SeatZones z : savedZones) {
                    if ("STANDING".equalsIgnoreCase(safe(z.getDescription()))) continue;

                    for (int i = 1; i <= rowsCount; i++) {
                        SeatRows r = new SeatRows();
                        r.setZoneId(z.getZoneId());
                        r.setRowLabel(String.valueOf((char) ('A' + (i - 1))));
                        r.setSortOrder(i);
                        r.setCreatedAt(Instant.now());
                        r.setUpdatedAt(Instant.now());
                        r = seatRowsRepo.save(r);

                        for (int c = 1; c <= colsCount; c++) {
                            Seats s = new Seats();
                            s.setRowId(r.getRowId());
                            s.setSeatNumber(c);
                            s.setSeatLabel(r.getRowLabel() + c);
                            s.setIsActive(true);
                            s.setCreatedAt(Instant.now());
                            s.setUpdatedAt(Instant.now());
                            seatsRepo.save(s);
                        }
                    }
                }
            }

            result.put("status", "ok");
            result.put("eventId", eventId);
            result.put("message", "Ticket setup saved");
            return result;

        } catch (Exception ex) {
            log.error("persistSetup error: {}", ex.getMessage(), ex);
            result.put("status", "error");
            result.put("message", ex.getMessage());
            return result;
        }
    }

    /* =============
       Helpers
       ============= */
    private static String safe(String s) { return s == null ? "" : s; }
    private static String safeUpper(String s) { return safe(s).toUpperCase(Locale.ROOT); }
    private static <T> List<T> safeList(Supplier<List<T>> supplier) {
        try { return Optional.ofNullable(supplier.get()).orElse(List.of()); }
        catch (Throwable ignore) { return List.of(); }
    }
    private static <T> T orElse(T v, T def) { return v != null ? v : def; }
    private static String firstNonEmpty(String... arr) {
        if (arr == null) return "";
        for (String s : arr) if (s != null && !s.isBlank()) return s;
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
