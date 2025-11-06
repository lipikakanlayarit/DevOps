package com.example.devops.service;

import com.example.devops.dto.ReservationRequest;
import com.example.devops.dto.ReservedResponse;
import com.example.devops.model.Payments;
import com.example.devops.model.Reserved;
import com.example.devops.repo.PaymentsRepository;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedSeatsRepository;
import com.example.devops.repo.SeatsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Array;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@Slf4j
public class ReservationService {

    private static final Set<String> ALLOWED_METHODS = Set.of("Credit Card", "Bank Transfer", "QR Payment", "MOCK");
    private static final int DEFAULT_LOCK_TIMEOUT_MINUTES = 5;

    private final ReservedRepository reservedRepo;
    private final ReservedSeatsRepository reservedSeatsRepo; // kept for compatibility
    private final SeatsRepository seatsRepo;
    private final PaymentsRepository paymentsRepo;
    private final JdbcTemplate jdbc;

    public ReservationService(
            ReservedRepository reservedRepo,
            ReservedSeatsRepository reservedSeatsRepo,
            SeatsRepository seatsRepo,
            PaymentsRepository paymentsRepo,
            JdbcTemplate jdbc
    ) {
        this.reservedRepo = reservedRepo;
        this.reservedSeatsRepo = reservedSeatsRepo;
        this.seatsRepo = seatsRepo;
        this.paymentsRepo = paymentsRepo;
        this.jdbc = jdbc;
    }

    /* ===========================
       CREATE RESERVATION (fixed)
       =========================== */
    @Transactional
    public ReservedResponse createReservation(Long userId, ReservationRequest req) {
        if (req == null || req.getEventId() == null || req.getEventId() <= 0 || req.getQuantity() == null || req.getQuantity() <= 0) {
            throw new IllegalArgumentException("Invalid reservation payload");
        }
        final List<ReservationRequest.SeatPick> picks = Optional.ofNullable(req.getSeats()).orElse(List.of());
        if (picks.size() != req.getQuantity()) {
            throw new IllegalArgumentException("quantity and seats count mismatch");
        }
        if (userId == null) {
            throw new IllegalArgumentException("AUTH_REQUIRED: userId is required (send Authorization Bearer token or X-User-Id)");
        }

        // === Map FE (row/col 0-based) -> DB seat_id (row sort_order 0-based, seat_number 1-based) และกัน seat ซ้ำ ===
        List<Long> seatIdsToReserve = new ArrayList<>();
        Set<String> dupGuard = new HashSet<>();
        for (ReservationRequest.SeatPick sp : picks) {
            if (sp == null || sp.getZoneId() == null || sp.getRow() == null || sp.getCol() == null) {
                throw new IllegalArgumentException("Invalid seat pick");
            }
            if (sp.getRow() < 0 || sp.getCol() < 0) {
                throw new IllegalArgumentException("row/col must be >= 0");
            }

            final long zoneId = sp.getZoneId();
            final int rowNo  = sp.getRow();       // ✅ DB uses 0-based sort_order
            final int seatNo1 = sp.getCol() + 1;  // ✅ DB seat_number is 1-based

            // กันซ้ำใน request (ยึด 0-based ให้ตรงกับ DB row sort_order)
            String key = zoneId + ":" + rowNo + ":" + seatNo1;
            if (!dupGuard.add(key)) {
                throw new IllegalArgumentException("Duplicate seat in request: " + key);
            }

            // 1) ใช้เมธอดตาม zone/sort_order/seat_number เป็นหลัก (rowNo คือ 0-based)
            Long seatId = seatsRepo.findSeatIdByZoneRowCol(zoneId, rowNo, seatNo1);

            // 2) Fallback ด้วย rowLabel (A,B,...) กรณีข้อมูล row sort_order ผิด/ไม่ครบ
            if (seatId == null) {
                char rowChar = (char) ('A' + sp.getRow()); // 0->A,1->B
                seatId = seatsRepo.findSeatIdFlexible(zoneId, null, String.valueOf(rowChar), seatNo1);
            }

            if (seatId == null) {
                throw new IllegalArgumentException("Seat not found for zone=" + zoneId + " row=" + rowNo + " col=" + seatNo1);
            }
            seatIdsToReserve.add(seatId);
        }

        // === ตรวจที่นั่งว่าง: PAID / RESERVED + LOCKED โดยคนอื่น ===
        if (!seatIdsToReserve.isEmpty()) {
            // paid/reserved
            List<Long> takenPaidOrReserved = seatsRepo.findPaidTakenAmong(req.getEventId(),
                    seatIdsToReserve.toArray(Long[]::new));
            if (!takenPaidOrReserved.isEmpty()) {
                throw new IllegalArgumentException("Some seats are already taken (paid/reserved): " + takenPaidOrReserved);
            }
            // locked
            List<Long> lockedNow = seatsRepo.findLockedSeatIdsByEvent(req.getEventId());
            for (Long sid : seatIdsToReserve) {
                if (lockedNow.contains(sid)) {
                    throw new IllegalArgumentException("Some seats are currently locked by others: " + sid);
                }
            }
        }

        // 1) ล็อกที่นั่งทั้งหมด (ต้องได้ครบ)
        int locked = lockSeats(userId, req.getEventId(), seatIdsToReserve, DEFAULT_LOCK_TIMEOUT_MINUTES);
        if (locked != seatIdsToReserve.size()) {
            // ให้ fail เพื่อ rollback การล็อกที่เพิ่งทำ (transactional)
            throw new IllegalStateException("Requested " + seatIdsToReserve.size() + " seats but locked " + locked);
        }

        // 2) สร้าง reserved
        Reserved r = new Reserved();
        r.setUserId(userId);
        r.setEventId(req.getEventId());
        r.setTicketTypeId(null);
        r.setQuantity(req.getQuantity());
        r.setTotalAmount(req.getTotalAmount() != null ? req.getTotalAmount() : BigDecimal.ZERO);
        r.setPaymentStatus("RESERVED");
        r.setRegistrationDatetime(Instant.now());
        r.setPaymentDatetime(null);
        r.setConfirmationCode("RSV-" + System.currentTimeMillis());
        r.setNotes("Seat lock expires in " + DEFAULT_LOCK_TIMEOUT_MINUTES + " minutes");
        r.setPaymentMethod(null);
        r = reservedRepo.save(r);

        // 3) map seats -> reserved_seats (seat_status = 'PENDING')
        String insertRsSql = """
            INSERT INTO reserved_seats (reserved_id, seat_id, seat_status)
            VALUES (?, ?, 'PENDING')
            ON CONFLICT (reserved_id, seat_id) DO NOTHING
        """;
        int mapped = 0;
        for (Long seatId : seatIdsToReserve) {
            mapped += jdbc.update(insertRsSql, r.getReservedId(), seatId);
        }

        log.info("✅ Created reservation {} with {} locked seats (expires in {} min), mapped {} seats",
                r.getReservedId(), locked, DEFAULT_LOCK_TIMEOUT_MINUTES, mapped);

        return ReservedResponse.from(r);
    }

    /* ===========================
       GET RESERVATION
       =========================== */
    @Transactional(readOnly = true)
    public ReservedResponse getReservation(Long reservedId) {
        Reserved r = reservedRepo.findById(reservedId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        return ReservedResponse.from(r);
    }

    /* ===========================
       PAY MOCK (update statuses)
       =========================== */
    @Transactional
    public ReservedResponse payMock(Long reservedId, String method) {
        Reserved r = reservedRepo.findById(reservedId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        String normalized = (method == null || method.isBlank()) ? "MOCK" : method.trim();
        if (!ALLOWED_METHODS.contains(normalized) && !"MOCK".equalsIgnoreCase(normalized)) {
            throw new IllegalArgumentException("Unsupported payment method: " + normalized);
        }

        if (!"PAID".equalsIgnoreCase(r.getPaymentStatus())) {
            // 1) อัปเดตใบจองเป็น PAID
            r.setPaymentStatus("PAID");
            r.setPaymentDatetime(Instant.now());
            r.setConfirmationCode(("CONF-" + UUID.randomUUID().toString().replace("-", "")).substring(0, 12).toUpperCase());
            r.setPaymentMethod(normalized);
            r.setNotes("Payment confirmed via " + normalized);
            r = reservedRepo.save(r);
            reservedRepo.flush();

            // 2) ดึง seat_ids ที่จอง
            String seatListSql = "SELECT seat_id FROM reserved_seats WHERE reserved_id = ?";
            List<Long> seatIds = jdbc.queryForList(seatListSql, Long.class, reservedId);

            // 3) เปลี่ยน seat_status -> CONFIRMED
            String confirmSql = """
                UPDATE reserved_seats
                   SET seat_status = 'CONFIRMED'
                 WHERE reserved_id = ?
            """;
            jdbc.update(confirmSql, reservedId);

            // 4) ปลดล็อกจาก seat_locks
            unlockSeats(r.getUserId(), seatIds);

            // 5) บันทึก payment
            Payments p = new Payments();
            p.setReservedId(r.getReservedId());
            p.setAmount(r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO);
            p.setPaymentMethod(normalized);
            p.setTransactionId("MOCK-" + UUID.randomUUID());
            p.setPaymentStatus("SUCCESS");
            p.setPaymentDatetime(r.getPaymentDatetime());
            p.setGatewayResponse("{\"mock\":true}");
            paymentsRepo.save(p);

            log.info("💰 Payment confirmed for reservation {} (method: {}, seats: {}, set CONFIRMED + unlocked)",
                    reservedId, normalized, seatIds.size());
        } else {
            // ถ้าจ่ายแล้ว แต่อยากปรับวิธีชำระ
            if (normalized != null && (r.getPaymentMethod() == null || !normalized.equals(r.getPaymentMethod()))) {
                r.setPaymentMethod(normalized);
                reservedRepo.save(r);
            }
        }

        return ReservedResponse.from(r);
    }

    /* ===========================
       SEAT LOCK FUNCTIONS
       =========================== */

    @Transactional
    public int lockSeats(Long userId, Long eventId, List<Long> seatIds, int timeoutMinutes) {
        if (seatIds == null || seatIds.isEmpty()) return 0;

        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(timeoutMinutes));
        Instant lockedAt = Instant.now();

        // ตรวจรายการที่ lock ได้จริง (ยังไม่ถูกคนอื่นจอง/ล็อก)
        String checkSql = """
            SELECT s.seat_id
              FROM seats s
             WHERE s.seat_id = ANY (?)
               AND NOT EXISTS (
                   SELECT 1
                     FROM reserved_seats rs
                    WHERE rs.seat_id = s.seat_id
                      AND rs.seat_status IN ('LOCKED','PENDING','CONFIRMED')
               )
               AND NOT EXISTS (
                   SELECT 1
                     FROM seat_locks sl
                    WHERE sl.seat_id    = s.seat_id
                      AND sl.status     = 'LOCKED'
                      AND sl.expires_at > NOW()
                      AND sl.user_id   <> ?
               )
        """;

        List<Long> availableSeats;
        try {
            availableSeats = jdbc.query(
                    checkSql,
                    ps -> {
                        Array array = ps.getConnection().createArrayOf("BIGINT", seatIds.toArray());
                        ps.setArray(1, array);
                        ps.setLong(2, userId);
                    },
                    (rs, rowNum) -> rs.getLong("seat_id")
            );
        } catch (Exception e) {
            log.error("❌ Failed to check available seats: {}", e.getMessage());
            return 0;
        }

        if (availableSeats.isEmpty()) {
            log.warn("⚠️ No available seats to lock for user {} (requested: {})", userId, seatIds.size());
            return 0;
        }

        String lockSql = """
            INSERT INTO seat_locks (seat_id, event_id, user_id, locked_at, expires_at, status)
            VALUES (?, ?, ?, ?, ?, 'LOCKED')
            ON CONFLICT (seat_id)
            DO UPDATE SET
                user_id    = EXCLUDED.user_id,
                locked_at  = EXCLUDED.locked_at,
                expires_at = EXCLUDED.expires_at,
                status     = 'LOCKED'
        """;

        int locked = 0;
        for (Long seatId : availableSeats) {
            try {
                jdbc.update(lockSql, seatId, eventId, userId,
                        Timestamp.from(lockedAt), Timestamp.from(expiresAt));
                locked++;
            } catch (Exception e) {
                log.error("❌ Failed to lock seat {}: {}", seatId, e.getMessage());
            }
        }

        log.info("🔒 Locked {} seats for user {} (expires in {} min)", locked, userId, timeoutMinutes);
        return locked;
    }

    @Transactional
    public void unlockSeats(Long userId, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) return;

        String sql = """
            UPDATE seat_locks
               SET status = 'UNLOCKED',
                   expires_at = NOW()
             WHERE seat_id = ANY (?)
               AND user_id = ?
               AND status = 'LOCKED'
        """;

        try {
            Array array = jdbc.getDataSource().getConnection().createArrayOf("BIGINT", seatIds.toArray());
            int unlocked = jdbc.update(sql, array, userId);
            log.info("🔓 Unlocked {} seats for user {}", unlocked, userId);
        } catch (Exception e) {
            log.error("❌ Failed to unlock seats: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Map<Long, String> checkSeatLocks(List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) return Map.of();

        String sql = """
            SELECT seat_id,
                   CASE WHEN user_id IS NULL THEN 'SYSTEM'
                        ELSE 'USER_' || user_id::text
                   END AS locked_by
              FROM seat_locks
             WHERE seat_id = ANY (?)
               AND status = 'LOCKED'
               AND expires_at > NOW()
        """;

        try {
            Array array = jdbc.getDataSource().getConnection().createArrayOf("BIGINT", seatIds.toArray());
            List<Map<String, Object>> rows = jdbc.queryForList(sql, array);

            Map<Long, String> locks = new HashMap<>();
            for (Map<String, Object> row : rows) {
                Long seatId = ((Number) row.get("seat_id")).longValue();
                String lockedBy = (String) row.get("locked_by");
                locks.put(seatId, lockedBy);
            }
            return locks;
        } catch (Exception e) {
            log.error("❌ Failed to check seat locks: {}", e.getMessage());
            return Map.of();
        }
    }

    /* ===========================
       CANCEL (update statuses)
       =========================== */
    @Transactional
    public void cancelReservation(Long reservedId) {
        Reserved r = reservedRepo.findById(reservedId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservedId));

        String sql = "SELECT seat_id FROM reserved_seats WHERE reserved_id = ?";
        List<Long> seatIds = jdbc.queryForList(sql, Long.class, reservedId);

        // mark reserved seats as CANCELLED
        String cancelSeatsSql = """
            UPDATE reserved_seats
               SET seat_status = 'CANCELLED'
             WHERE reserved_id = ?
        """;
        jdbc.update(cancelSeatsSql, reservedId);

        // unlock
        unlockSeats(r.getUserId(), seatIds);

        r.setPaymentStatus("CANCELLED");
        r.setNotes("Cancelled by user/system");
        reservedRepo.save(r);

        log.info("❌ Cancelled reservation {} (unlocked {} seats, set CANCELLED)", reservedId, seatIds.size());
    }

    /* ===========================
       Helpers
       =========================== */
    private List<Long> queryLongListANY(String sql, List<Long> ids) {
        try {
            return jdbc.query(
                    sql,
                    ps -> {
                        Array array = ps.getConnection().createArrayOf("BIGINT", ids.toArray());
                        ps.setArray(1, array);
                    },
                    (rs, rowNum) -> rs.getLong(1)
            );
        } catch (Exception e) {
            log.error("❌ Query failed: {}", e.getMessage());
            return List.of();
        }
    }
}
