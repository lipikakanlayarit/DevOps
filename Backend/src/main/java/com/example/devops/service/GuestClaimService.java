package com.example.devops.service;

import com.example.devops.repo.ReservedRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GuestClaimService {

    private final ReservedRepository reservedRepo;

    public GuestClaimService(ReservedRepository reservedRepo) {
        this.reservedRepo = reservedRepo;
    }

    /** ✅ เรียกหลังจาก signup/login สำเร็จ เพื่อโอนจอง guest ทั้งหมดเข้า user */
    @Transactional
    public int linkGuestReservationsToUser(Long userId, String email) {
        if (userId == null || email == null || email.isBlank()) return 0;
        return reservedRepo.claimAllByEmail(email.trim(), userId);
    }
}
