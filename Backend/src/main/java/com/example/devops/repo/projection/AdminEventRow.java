package com.example.devops.repo.projection;

import java.time.Instant;

/**
 * Projection สำหรับหน้า Admin list
 * ชื่อเมธอดต้องแม็พกับ alias คอลัมน์ใน SELECT (ไม่ต้องตรง case)
 */
public interface AdminEventRow {
    Long getEvent_id();
    String getEvent_name();
    Long getCategory_id();
    Long getOrganizer_id();
    Instant getStart_datetime();
    Instant getEnd_datetime();
    String getVenue_name();
    String getVenue_address();
    String getStatus();
}
