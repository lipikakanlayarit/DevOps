// TicketSetupResponse.java
package com.example.devops.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketSetupResponse {
    private int seatRows;
    private int seatColumns;
    private List<ZonePrice> zones;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ZonePrice {
        private String code;
        private String name;
        private Integer price; // อาจเป็น null ถ้าไม่ได้ตั้ง
    }
}
