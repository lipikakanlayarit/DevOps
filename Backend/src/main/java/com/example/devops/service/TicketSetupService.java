package com.example.devops.service;

import com.example.devops.dto.TicketSetupRequest;
import com.example.devops.model.*;
import com.example.devops.repo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbc;

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

            // ค่ากลางจาก seat_zones (ใช้ค่าสูงสุดเพื่อ prefill)
            if (!zones.isEmpty()) {
                seatRows = zones.stream()
                        .map(SeatZones::getRowStart).filter(Objects::nonNull).mapToInt(Integer::intValue).max().orElse(0);
                seatColumns = zones.stream()
                        .map(SeatZones::getRowEnd).filter(Objects::nonNull).mapToInt(Integer::intValue).max().orElse(0);
            }

            // fallback
            if (seatRows == 0) {
                List<SeatRows> rows = safeList(() -> seatRowsRepo.findAllRowsByEventId(eventId));
                if (!rows.isEmpty()) {
                    seatRows = rows.stream()
                            .collect(Collectors.groupingBy(SeatRows::getZoneId))
                            .values().stream().mapToInt(List::size).max().orElse(0);
                }
            }
            if (seatColumns == 0 && !seats.isEmpty()) {
                seatColumns = seats.stream()
                        .map(Seats::getSeatNumber).filter(Objects::nonNull).mapToInt(Integer::intValue).max().orElse(0);
            }

            /*
             * occupied map ต่อโซน
             *   r = row.sort_order (0-based, A=0, B=1, ...)
             *   c = seats.seat_number - 1 (0-based, ที่นั่ง 1 → c=0)
             */
            Map<Long, List<Map<String, Integer>>> occupiedByZone = new HashMap<>();
            // ใช้ set ป้องกัน duplicate กรณี seat เดียวถูกเพิ่มมาจากหลาย query
            Map<Long, Set<String>> occDedup = new HashMap<>();

            // helper: ใส่พิกัดลง map พร้อมกันซ้ำ
            final var addOcc = new Object() {
                void add(long zoneId, int r0, int c0) {
                    if (r0 < 0 || c0 < 0) return;
                    String key = r0 + ":" + c0;
                    occDedup.computeIfAbsent(zoneId, k -> new LinkedHashSet<>());
                    if (occDedup.get(zoneId).add(key)) {
                        occupiedByZone.computeIfAbsent(zoneId, k -> new ArrayList<>()).add(Map.of("r", r0, "c", c0));
                    }
                }
            };

            try {
                // ที่นั่งที่ถูกระบุ occupied จากสถานะในตาราง (เช่น CONFIRMED/PENDING/RESERVED เป็นต้น) → แปลงเป็น r/c
                List<Object[]> occ = seatsRepo.findOccupiedWithZoneRowColByEventId(eventId);
                for (Object[] row : occ) {
                    Long zoneId = ((Number) row[0]).longValue();
                    int r0 = ((Number) row[1]).intValue(); // 0-based sort_order
                    int c1 = ((Number) row[2]).intValue(); // 1-based seat_number
                    int c0 = Math.max(0, c1 - 1);         // -> 0-based
                    addOcc.add(zoneId, r0, c0);
                }
            } catch (Exception ex) {
                log.warn("occupiedSeats query failed: {}", ex.getMessage());
            }

            try {
                // รวม PAID + LOCKED ปัจจุบัน แล้ว map ไปยังพิกัด r/c 0-based
                List<Long> paidIds   = safeList(() -> seatsRepo.findPaidTakenSeatIdsByEvent(eventId));
                List<Long> lockedIds = safeList(() -> seatsRepo.findLockedSeatIdsByEvent(eventId));
                Set<Long> union = new LinkedHashSet<>();
                union.addAll(paidIds);
                union.addAll(lockedIds);

                if (!union.isEmpty()) {
                    List<Object[]> mapped = seatsRepo.findZoneRowColForSeatIds(eventId, union.toArray(Long[]::new));
                    for (Object[] r : mapped) {
                        Long zoneId = ((Number) r[1]).longValue();
                        int r0 = ((Number) r[2]).intValue(); // 0-based sort_order
                        int c1 = ((Number) r[3]).intValue(); // 1-based seat_number
                        int c0 = Math.max(0, c1 - 1);
                        addOcc.add(zoneId, r0, c0);
                    }
                }
            } catch (Exception ex) {
                log.warn("map seatIds to coords failed: {}", ex.getMessage());
            }

            // zone DTOs (ส่ง rows/cols ต่อโซนจริงกลับไปให้ FE ด้วย)
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
                    if (z.getPrice() != null) {
                        price = z.getPrice().intValue();
                    } else {
                        BigDecimal p = zoneTicketTypesRepo.findFirstPriceByZoneId(zoneId);
                        if (p != null) price = p.intValue();
                        else {
                            String typeKey = safeUpper(firstNonEmpty(z.getDescription(), z.getZoneName(), "GENERAL"));
                            BigDecimal p2 = zoneTicketTypesRepo.findPriceByEventAndTypeKey(eventId, typeKey);
                            if (p2 != null) price = p2.intValue();
                        }
                    }
                } catch (Throwable ignore) {}

                String code = safe(z.getDescription());
                String name = safe(z.getZoneName());
                String aliasZone = code.isBlank() ? name : code;

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", zoneId);
                m.put("zoneId", zoneId);
                m.put("code", code);
                m.put("name", name);
                m.put("zone", aliasZone);
                m.put("price", price);
                m.put("ticketTypeId", ticketTypeId);
                m.put("hasSeats", !"STANDING".equalsIgnoreCase(code));
                m.put("sortOrder", z.getSortOrder() == null ? 0 : z.getSortOrder());
                m.put("rows", z.getRowStart());
                m.put("cols", z.getRowEnd());
                m.put("occupiedSeats", occupiedByZone.getOrDefault(zoneId, List.of()));
                zoneDtos.add(m);
            }

            // ticket types defaults
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

        List<SeatZones> zones = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(eventId));
        List<SeatRows> allRows = safeList(() -> seatRowsRepo.findAllRowsByEventId(eventId));
        List<Seats> allSeats = safeList(() -> seatsRepo.findAllSeatsByEventId(eventId));

        for (SeatZones z : zones) {
            String desc = safe(z.getDescription());
            boolean hasSeats = !"STANDING".equalsIgnoreCase(desc);

            Map<String, Object> zoneBlock = new LinkedHashMap<>();
            zoneBlock.put("zoneId", z.getZoneId());
            zoneBlock.put("zoneName", safe(z.getZoneName()));
            zoneBlock.put("zoneCode", desc);
            zoneBlock.put("zone", desc.isBlank() ? safe(z.getZoneName()) : desc);
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

            // sales window -> events
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

            Map<Long, SeatZones> zonesById = safeList(() -> seatZonesRepo.findByEventIdOrderBySortOrderAscZoneIdAsc(eventId))
                    .stream().collect(Collectors.toMap(SeatZones::getZoneId, z -> z, (a,b)->a, LinkedHashMap::new));

            List<TicketSetupRequest.ZoneDTO> zoneReqs = Optional.ofNullable(req.getZones()).orElse(List.of());
            List<SeatZones> savedZones = new ArrayList<>();
            List<ZoneResize> resizedZones = new ArrayList<>();

            for (int idx = 0; idx < zoneReqs.size(); idx++) {
                TicketSetupRequest.ZoneDTO z = zoneReqs.get(idx);

                Long incomingId = z.getId();
                String codeNorm = safeUpper(trimOrEmpty(z.getCode()));
                String nameNorm = safeUpper(trimOrEmpty(z.getName()));
                // เผื่อ FE ส่ง field "zone"
                try {
                    var zoneField = z.getClass().getDeclaredField("zone");
                    zoneField.setAccessible(true);
                    Object zv = zoneField.get(z);
                    if (zv != null && codeNorm.isBlank() && nameNorm.isBlank()) {
                        codeNorm = safeUpper(trimOrEmpty(String.valueOf(zv)));
                    }
                } catch (Throwable ignore) {}

                // หาโซนเดิม
                SeatZones zone = null;
                if (incomingId != null && zonesById.containsKey(incomingId)) zone = zonesById.get(incomingId);
                if (zone == null) {
                    for (SeatZones exist : zonesById.values()) {
                        String existCode = safeUpper(firstNonEmpty(exist.getDescription(), ""));
                        String existName = safeUpper(firstNonEmpty(exist.getZoneName(), ""));
                        if (!codeNorm.isBlank() && codeNorm.equals(existCode)) { zone = exist; break; }
                        if (!nameNorm.isBlank() && nameNorm.equals(existName)) { zone = exist; break; }
                    }
                }
                boolean isNewZone = false;
                if (zone == null) { zone = new SeatZones(); isNewZone = true; }

                // ขนาดต่อโซน (กิน alias ผ่าน getRows()/getCols())
                Integer oldRows = zone.getRowStart();
                Integer oldCols = zone.getRowEnd();

                Integer zoneRows = firstNonNull(
                        z.getRows(),            // <= seatRow/seatRows/rows (per zone)
                        oldRows,                // ขนาดเดิม
                        req.getSeatRows(),      // ค่ากลางทั้งงาน
                        0
                );
                Integer zoneCols = firstNonNull(
                        z.getCols(),            // <= seatColumn/seatColumns/cols/columns (per zone)
                        oldCols,
                        req.getSeatColumns(),
                        0
                );
                if (zoneRows == null || zoneRows <= 0 || zoneCols == null || zoneCols <= 0) {
                    throw new IllegalArgumentException("Zone " + (codeNorm.isBlank() ? ("#" + (idx + 1)) : codeNorm)
                            + " must provide positive seatRows/seatColumns (got " + zoneRows + "x" + zoneCols + ")");
                }

                // อัปเดตโซน
                zone.setEventId(eventId);
                zone.setZoneName(trimOrEmpty(z.getName()));
                zone.setDescription(codeNorm);
                zone.setSortOrder(z.getSortOrder() == null ? idx : z.getSortOrder());
                zone.setIsActive(true);
                zone.setUpdatedAt(Instant.now());
                if (zone.getCreatedAt() == null) zone.setCreatedAt(Instant.now());
                zone.setRowStart(zoneRows);
                zone.setRowEnd(zoneCols);

                if (z.getPrice() != null) {
                    Number n = z.getPrice();
                    zone.setPrice((n instanceof BigDecimal) ? (BigDecimal) n : BigDecimal.valueOf(n.longValue()));
                }

                zone = seatZonesRepo.save(zone);
                savedZones.add(zone);
                zonesById.put(zone.getZoneId(), zone);

                // ticket type
                String typeKey = safeUpper(firstNonEmpty(zone.getDescription(), zone.getZoneName(), "GENERAL"));
                TicketTypes t = typeByName.get(typeKey);
                if (t == null) {
                    t = new TicketTypes();
                    t.setEventId(eventId);
                    t.setTypeName(typeKey);
                    t.setDescription("Auto for zone " + safe(zone.getZoneName()));
                    t.setQuantityAvailable(0);
                    t.setQuantitySold(0);
                    t.setCreatedAt(Instant.now());
                    typeByName.put(typeKey, t);
                }
                if (z.getPrice() != null) {
                    Number n = z.getPrice();
                    t.setPrice((n instanceof BigDecimal) ? (BigDecimal) n : BigDecimal.valueOf(n.longValue()));
                }
                if (t.getPrice() == null) t.setPrice(BigDecimal.ZERO);
                t.setIsActive(active);
                t.setMinPerOrder(minPer);
                t.setMaxPerOrder(maxPer);
                t.setSaleStartDatetime(saleStart);
                t.setSaleEndDatetime(saleEnd);
                t.setUpdatedAt(Instant.now());

                // mark regenerate
                if (isNewZone) {
                    resizedZones.add(new ZoneResize(zone, 0, 0, zoneRows, zoneCols, true));
                } else if (!Objects.equals(oldRows, zoneRows) || !Objects.equals(oldCols, zoneCols)) {
                    resizedZones.add(new ZoneResize(zone, nullSafe(oldRows), nullSafe(oldCols), zoneRows, zoneCols, false));
                }

                log.info("🧮 Zone '{}' will use size {}x{} (old {}x{}, new? {})",
                        codeNorm, zoneRows, zoneCols, nullSafe(oldRows), nullSafe(oldCols), isNewZone || !Objects.equals(oldRows, zoneRows) || !Objects.equals(oldCols, zoneCols));
            }

            // save types & link
            ticketTypesRepo.saveAll(typeByName.values());
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

            // generate / regenerate per zone
            for (ZoneResize zr : resizedZones) {
                if (zr.isNew) {
                    log.info("🎫 Generating seats for zone '{}': {}x{}",
                            safe(zr.zone.getDescription()).toLowerCase(Locale.ROOT), zr.newRows, zr.newCols);
                    generateSeatsForZone(zr.zone, zr.newRows, zr.newCols);
                } else {
                    log.info("♻️ Zone '{}' size changed {}x{} → {}x{} : regenerate only this zone",
                            zr.zone.getDescription(), zr.oldRows, zr.oldCols, zr.newRows, zr.newCols);
                    regenerateSeatsForZone(zr.zone, zr.newRows, zr.newCols);
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

    /* =========================
       Helpers: Seat generation
       ========================= */
    @Transactional
    protected void generateSeatsForZone(SeatZones zone, int rows, int cols) {
        for (int i = 0; i < rows; i++) {
            SeatRows r = new SeatRows();
            r.setZoneId(zone.getZoneId());
            r.setRowLabel(String.valueOf((char) ('A' + i)));
            r.setSortOrder(i);
            r.setIsActive(true);
            r.setCreatedAt(Instant.now());
            r.setUpdatedAt(Instant.now());
            r = seatRowsRepo.save(r);

            for (int c = 1; c <= cols; c++) {
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

    @Transactional
    protected void regenerateSeatsForZone(SeatZones zone, int newRows, int newCols) {
        try {
            jdbc.update("""
                DELETE FROM seats
                 WHERE row_id IN (SELECT row_id FROM seat_rows WHERE zone_id = ?)
            """, zone.getZoneId());
            jdbc.update("DELETE FROM seat_rows WHERE zone_id = ?", zone.getZoneId());
        } catch (Exception e) {
            log.warn("cleanup zone {} failed: {}", zone.getZoneId(), e.getMessage());
        }
        generateSeatsForZone(zone, newRows, newCols);
    }

    /* ============= helpers ============= */
    private static class ZoneResize {
        final SeatZones zone;
        final int oldRows, oldCols, newRows, newCols;
        final boolean isNew;
        ZoneResize(SeatZones z, int or, int oc, int nr, int nc, boolean isNew) {
            this.zone = z; this.oldRows = or; this.oldCols = oc; this.newRows = nr; this.newCols = nc; this.isNew = isNew;
        }
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... vals) {
        if (vals == null) return null;
        for (T v : vals) if (v != null) return v;
        return null;
    }

    private static int nullSafe(Integer n) { return n == null ? 0 : n; }
    private static String safe(String s) { return s == null ? "" : s; }
    private static String safeUpper(String s) { return safe(s).toUpperCase(Locale.ROOT); }
    private static String trimOrEmpty(String s) { return s == null ? "" : s.trim(); }
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
