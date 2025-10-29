package com.example.devops.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserTicketRow {
    private String poster;     // image url/base64 (ตอนนี้เว้นไว้เป็น "")
    private String reserveId;  // reserve_code
    private String title;      // event_name
    private String venue;      // venue_name
    private String showDate;   // formatted start_datetime
    private String zone;       // ticket type name
    private String row;        // seat row (string)
    private String column;     // seat col (string/number)
    private BigDecimal total;  // price
}
