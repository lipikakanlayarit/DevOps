package com.example.devops.dto;

import lombok.*;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketSetupResponse {

    private int seatRows;
    private int seatColumns;
    private List<ZonePrice> zones;

    // ---- Advanced Setting (prefill)
    private Integer minPerOrder;
    private Integer maxPerOrder;
    private Boolean active;

    // ---- Sales Period (prefill)
    private Instant salesStartDatetime;
    private Instant salesEndDatetime;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ZonePrice {
        /** ✅ zone_id จาก seat_zones */
        private Long id;

        /** แสดงไว้เผื่อ UI/compat โค้ดเก่า */
        private String code;
        private String name;

        /** ราคา (อาจเป็น null ถ้าไม่ตั้ง) */
        private Integer price;

        /** ✅ ชี้ไปที่ ticket_types.ticket_type_id */
        private Long ticketTypeId;
    }
}
