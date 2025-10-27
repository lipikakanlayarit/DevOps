package com.example.devops.service;

import com.example.devops.dto.ReservationRequest;
import com.example.devops.dto.ReservedResponse;
import com.example.devops.model.Payments;
import com.example.devops.model.Reserved;
import com.example.devops.model.ReservedSeats;
import com.example.devops.repo.PaymentsRepository;
import com.example.devops.repo.ReservedRepository;
import com.example.devops.repo.ReservedSeatsRepository;
import com.example.devops.repo.SeatsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ReservationService {

    private static final Set<String> ALLOWED_METHODS = Set.of("Credit Card", "Bank Transfer", "QR Payment");

    private final ReservedRepository reservedRepo;
    private final ReservedSeatsRepository reservedSeatsRepo;
    private final SeatsRepository seatsRepo;
    private final PaymentsRepository paymentsRepo;

    public ReservationService(
            ReservedRepository reservedRepo,
            ReservedSeatsRepository reservedSeatsRepo,
            SeatsRepository seatsRepo,
            PaymentsRepository paymentsRepo
    ) {
        this.reservedRepo = reservedRepo;
        this.reservedSeatsRepo = reservedSeatsRepo;
        this.seatsRepo = seatsRepo;
        this.paymentsRepo = paymentsRepo;
    }

    @Transactional
    public ReservedResponse createReservation(Long userId, ReservationRequest req) {
        if (req == null || req.getEventId() == null || req.getQuantity() == null || req.getQuantity() <= 0) {
            throw new IllegalArgumentException("Invalid reservation payload");
        }
        final int count = (req.getSeats() != null) ? req.getSeats().size() : 0;
        if (count != req.getQuantity()) {
            throw new IllegalArgumentException("quantity and seats count mismatch");
        }

        // ❗️ต้องมี userId (แก้ปัญหา reserved.user_id เป็น NULL)
        if (userId == null) {
            throw new IllegalArgumentException("AUTH_REQUIRED: userId is required (send Authorization Bearer token or X-User-Id)");
        }

        // === คำนวณ seat_id ทั้งหมดจาก payload (ก่อนเซฟ) ===
        List<Long> seatIdsToReserve = new ArrayList<>();
        if (req.getSeats() != null) {
            for (ReservationRequest.SeatPick sp : req.getSeats()) {
                if (sp.getZoneId() == null || sp.getRow() == null || sp.getCol() == null) {
                    throw new IllegalArgumentException("Invalid seat pick");
                }
                int seatNumber = sp.getCol() + 1;          // FE 0-based -> DB 1-based
                char rowChar = (char) ('A' + sp.getRow()); // 0->A, 1->B

                Long seatId = seatsRepo.findSeatIdFlexible(
                        sp.getZoneId(), sp.getRow(), String.valueOf(rowChar), seatNumber
                );
                if (seatId == null) {
                    seatId = seatsRepo.findSeatIdByZoneRowCol(sp.getZoneId(), sp.getRow(), seatNumber);
                }
                if (seatId == null) {
                    throw new IllegalArgumentException(
                            "Seat not found for zone=" + sp.getZoneId() + " row=" + sp.getRow() + " col=" + sp.getCol()
                    );
                }
                seatIdsToReserve.add(seatId);
            }
        }

        // === กันจองทับที่นั่งที่ "ชำระเงินแล้ว" ภายในอีเวนต์เดียวกัน ===
        if (!seatIdsToReserve.isEmpty()) {
            List<Long> paidTaken = seatsRepo.findPaidTakenAmong(req.getEventId(), seatIdsToReserve.toArray(Long[]::new));
            if (!paidTaken.isEmpty()) {
                throw new IllegalArgumentException("Some seats are already PAID by others: " + paidTaken);
            }
        }

        // 1) create reserved (UNPAID)
        Reserved r = new Reserved();
        r.setUserId(userId); // ✅ จุดสำคัญ: บันทึก userId ลง DB
        r.setEventId(req.getEventId());
        r.setTicketTypeId(null);
        r.setQuantity(req.getQuantity());
        r.setTotalAmount(req.getTotalAmount() != null ? req.getTotalAmount() : BigDecimal.ZERO);
        r.setPaymentStatus("UNPAID");
        r.setRegistrationDatetime(Instant.now());
        r.setPaymentDatetime(null);
        r.setConfirmationCode(null);
        r.setNotes(null);
        r.setPaymentMethod(null);
        r = reservedRepo.save(r);

        // 2) map seats -> reserved_seats
        for (Long seatId : seatIdsToReserve) {
            ReservedSeats rs = new ReservedSeats();
            rs.setReservedId(r.getReservedId());
            rs.setSeatId(seatId);
            reservedSeatsRepo.save(rs);
        }

        return ReservedResponse.from(r);
    }

    @Transactional(readOnly = true)
    public ReservedResponse getReservation(Long reservedId) {
        Reserved r = reservedRepo.findById(reservedId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        return ReservedResponse.from(r);
    }

    @Transactional
    public ReservedResponse payMock(Long reservedId, String method) {
        Reserved r = reservedRepo.findById(reservedId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        String normalized = (method == null || method.isBlank()) ? "MOCK" : method.trim();

        if (!"PAID".equalsIgnoreCase(r.getPaymentStatus())) {
            r.setPaymentStatus("PAID");
            r.setPaymentDatetime(Instant.now());
            r.setConfirmationCode(("CONF-" + UUID.randomUUID().toString().replace("-", "")).substring(0, 12).toUpperCase());
            r.setPaymentMethod(normalized);
            reservedRepo.save(r);

            Payments p = new Payments();
            p.setReservedId(r.getReservedId());
            p.setAmount(r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO);
            p.setPaymentMethod(normalized);
            p.setTransactionId("MOCK-" + UUID.randomUUID());
            p.setPaymentStatus("SUCCESS");
            p.setPaymentDatetime(r.getPaymentDatetime());
            p.setGatewayResponse("{\"mock\":true}");
            paymentsRepo.save(p);
        } else {
            // กรณีจ่ายแล้ว แต่อาจแก้ไขวิธีชำระเงิน
            if (normalized != null && (r.getPaymentMethod() == null || !normalized.equals(r.getPaymentMethod()))) {
                r.setPaymentMethod(normalized);
                reservedRepo.save(r);
            }
        }

        return ReservedResponse.from(r);
    }
}
