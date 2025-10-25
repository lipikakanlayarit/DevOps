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
import java.util.UUID;

@Service
public class ReservationService {

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
        if (req == null || req.eventId == null || req.quantity == null || req.quantity <= 0) {
            throw new IllegalArgumentException("Invalid reservation payload");
        }
        final int count = (req.seats != null) ? req.seats.size() : 0;
        if (count != req.quantity) {
            throw new IllegalArgumentException("quantity and seats count mismatch");
        }

        // === คำนวณ seat_id ทั้งหมดจาก payload (ก่อนเซฟ) ===
        List<Long> seatIdsToReserve = new ArrayList<>();
        if (req.seats != null) {
            for (ReservationRequest.SeatPick sp : req.seats) {
                if (sp.zoneId == null || sp.row == null || sp.col == null) {
                    throw new IllegalArgumentException("Invalid seat pick");
                }
                int seatNumber = sp.col + 1;          // FE 0-based -> DB 1-based
                char rowChar = (char) ('A' + sp.row); // เช่น 0->A, 1->B

                Long seatId = seatsRepo.findSeatIdFlexible(
                        sp.zoneId, sp.row, String.valueOf(rowChar), seatNumber
                );
                if (seatId == null) {
                    seatId = seatsRepo.findSeatIdByZoneRowCol(sp.zoneId, sp.row, seatNumber);
                }
                if (seatId == null) {
                    throw new IllegalArgumentException(
                            "Seat not found for zone=" + sp.zoneId + " row=" + sp.row + " col=" + sp.col
                    );
                }
                seatIdsToReserve.add(seatId);
            }
        }

        // === กันจองทับที่นั่งที่ "ชำระเงินแล้ว" ภายในอีเวนต์เดียวกัน ===
        if (!seatIdsToReserve.isEmpty()) {
            List<Long> paidTaken = seatsRepo.findPaidTakenAmong(req.eventId, seatIdsToReserve.toArray(Long[]::new));
            if (!paidTaken.isEmpty()) {
                throw new IllegalArgumentException("Some seats are already PAID by others: " + paidTaken);
            }
        }

        // 1) create reserved (UNPAID)
        Reserved r = new Reserved();
        r.setUserId(userId);
        r.setEventId(req.eventId);
        r.setTicketTypeId(null);
        r.setQuantity(req.quantity);
        r.setTotalAmount(req.totalAmount != null ? req.totalAmount : BigDecimal.ZERO);
        r.setPaymentStatus("UNPAID");
        r.setRegistrationDatetime(Instant.now());
        r.setPaymentDatetime(null);
        r.setConfirmationCode(null);
        r.setNotes(null);
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

        if (!"PAID".equalsIgnoreCase(r.getPaymentStatus())) {
            r.setPaymentStatus("PAID");
            r.setPaymentDatetime(Instant.now());
            r.setConfirmationCode(("CONF-" + UUID.randomUUID().toString().replace("-", "")).substring(0, 12).toUpperCase());
            reservedRepo.save(r);

            Payments p = new Payments();
            p.setReservedId(r.getReservedId());
            p.setAmount(r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO);
            p.setPaymentMethod(method != null ? method : "MOCK");
            p.setTransactionId("MOCK-" + UUID.randomUUID());
            p.setPaymentStatus("SUCCESS");
            p.setPaymentDatetime(r.getPaymentDatetime());
            p.setGatewayResponse("{\"mock\":true}");
            paymentsRepo.save(p);
        }

        return ReservedResponse.from(r);
    }
}
