package com.example.devops.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class EventStatusService {

    public enum Effective { ONSALE, OFFSALE, UPCOMING }

    /**
     * - ก่อนขาย 7 วัน → UPCOMING
     * - ช่วงขาย และ rawStatus = APPROVED/PUBLISHED → ONSALE
     * - อื่น ๆ → OFFSALE
     */
    public Effective computeEffectiveStatus(String rawStatus, Instant now, Instant salesStart, Instant salesEnd) {
        if (salesStart == null || salesEnd == null) return Effective.OFFSALE;

        if (now.isBefore(salesStart)) {
            Instant upcomingFrom = salesStart.minus(7, ChronoUnit.DAYS);
            if (!now.isBefore(upcomingFrom)) return Effective.UPCOMING;
            return Effective.OFFSALE;
        }

        boolean within = !now.isBefore(salesStart) && !now.isAfter(salesEnd);
        boolean approvedOrPublished =
                "APPROVED".equalsIgnoreCase(rawStatus) || "PUBLISHED".equalsIgnoreCase(rawStatus);
        if (within && approvedOrPublished) return Effective.ONSALE;

        return Effective.OFFSALE;
    }

    public boolean isPurchasable(Effective e) {
        return e == Effective.ONSALE;
    }
}