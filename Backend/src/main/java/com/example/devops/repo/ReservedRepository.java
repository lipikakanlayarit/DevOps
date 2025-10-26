package com.example.devops.repo;

import com.example.devops.model.Reserved;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ReservedRepository extends JpaRepository<Reserved, Long> {

    /** ✅ ดึงรายการจองทั้งหมดของอีเวนต์ */
    @Transactional(readOnly = true)
    List<Reserved> findAllByEventId(Long eventId);

    /** ✅ นับจำนวนใบจองตามสถานะ (เช่น PAID / UNPAID) */
    @Transactional(readOnly = true)
    long countByEventIdAndPaymentStatusIgnoreCase(Long eventId, String paymentStatus);

    /** ✅ ตรวจสอบรหัสยืนยันซ้ำ */
    @Transactional(readOnly = true)
    boolean existsByConfirmationCode(String confirmationCode);

    /** ✅ (เผื่อใช้) ดึงเฉพาะที่จ่ายแล้ว */
    @Transactional(readOnly = true)
    @Query("SELECT r FROM Reserved r WHERE r.eventId = :eventId AND UPPER(r.paymentStatus) = 'PAID'")
    List<Reserved> findPaidByEventId(Long eventId);
}
