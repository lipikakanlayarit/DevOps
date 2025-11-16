package com.example.devops.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class EventStatusServiceTest {

    private EventStatusService service;
    private Instant now;

    @BeforeEach
    void setup() {
        service = new EventStatusService();
        now = Instant.parse("2025-01-10T00:00:00Z");
    }

    @Test
    @DisplayName("ถ้า salesStart หรือ salesEnd เป็น null → OFFSALE")
    void testNullDates() {
        assertThat(service.computeEffectiveStatus("APPROVED", now, null, now))
                .isEqualTo(EventStatusService.Effective.OFFSALE);

        assertThat(service.computeEffectiveStatus("APPROVED", now, now, null))
                .isEqualTo(EventStatusService.Effective.OFFSALE);
    }

    @Test
    @DisplayName("ก่อนขายเกิน 7 วัน → OFFSALE")
    void testBeforeUpcomingWindow() {
        Instant salesStart = now.plus(10, ChronoUnit.DAYS); // 10 วันก่อนเริ่มขาย
        Instant salesEnd = now.plus(20, ChronoUnit.DAYS);

        assertThat(service.computeEffectiveStatus("APPROVED", now, salesStart, salesEnd))
                .isEqualTo(EventStatusService.Effective.OFFSALE);
    }

    @Test
    @DisplayName("ก่อนขายแต่ในช่วง 7 วันก่อนเริ่มขาย → UPCOMING")
    void testUpcoming() {
        Instant salesStart = now.plus(5, ChronoUnit.DAYS);
        Instant salesEnd = now.plus(10, ChronoUnit.DAYS);

        assertThat(service.computeEffectiveStatus("APPROVED", now, salesStart, salesEnd))
                .isEqualTo(EventStatusService.Effective.UPCOMING);
    }

    @Test
    @DisplayName("อยู่ในช่วงขาย และ rawStatus = APPROVED → ONSALE")
    void testOnSaleApproved() {
        Instant salesStart = now.minus(1, ChronoUnit.DAYS);
        Instant salesEnd = now.plus(5, ChronoUnit.DAYS);

        assertThat(service.computeEffectiveStatus("APPROVED", now, salesStart, salesEnd))
                .isEqualTo(EventStatusService.Effective.ONSALE);
    }

    @Test
    @DisplayName("อยู่ในช่วงขาย และ rawStatus = PUBLISHED → ONSALE")
    void testOnSalePublished() {
        Instant salesStart = now.minus(1, ChronoUnit.DAYS);
        Instant salesEnd = now.plus(5, ChronoUnit.DAYS);

        assertThat(service.computeEffectiveStatus("PUBLISHED", now, salesStart, salesEnd))
                .isEqualTo(EventStatusService.Effective.ONSALE);
    }

    @Test
    @DisplayName("อยู่ในช่วงขาย แต่ rawStatus ไม่ใช่ APPROVED/PUBLISHED → OFFSALE")
    void testWithinSaleButNotApproved() {
        Instant salesStart = now.minus(1, ChronoUnit.DAYS);
        Instant salesEnd = now.plus(5, ChronoUnit.DAYS);

        assertThat(service.computeEffectiveStatus("DRAFT", now, salesStart, salesEnd))
                .isEqualTo(EventStatusService.Effective.OFFSALE);
    }

    @Test
    @DisplayName("เลยช่วงขาย → OFFSALE")
    void testAfterSaleEnds() {
        Instant salesStart = now.minus(10, ChronoUnit.DAYS);
        Instant salesEnd = now.minus(1, ChronoUnit.DAYS);

        assertThat(service.computeEffectiveStatus("APPROVED", now, salesStart, salesEnd))
                .isEqualTo(EventStatusService.Effective.OFFSALE);
    }

    @Test
    @DisplayName("isPurchasable = true เมื่อ status = ONSALE")
    void testPurchasableTrue() {
        assertThat(service.isPurchasable(EventStatusService.Effective.ONSALE))
                .isTrue();
    }

    @Test
    @DisplayName("isPurchasable = false เมื่อไม่ใช่ ONSALE")
    void testPurchasableFalse() {
        assertThat(service.isPurchasable(EventStatusService.Effective.OFFSALE))
                .isFalse();
        assertThat(service.isPurchasable(EventStatusService.Effective.UPCOMING))
                .isFalse();
    }
}
