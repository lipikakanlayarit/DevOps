// src/main/java/com/example/devops/dto/EventUpdateRequest.java
package com.example.devops.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonAlias;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventUpdateRequest {

    @NotBlank
    private String eventName;

    private String description;
    private Long categoryId;

    @NotNull
    private Instant startDateTime;

    @NotNull
    private Instant endDateTime;

    /** รองรับได้ทั้ง salesStartDateTime และ salesStartDatetime จาก FE */
    @JsonAlias({"salesStartDatetime"})
    private Instant salesStartDateTime;

    /** รองรับได้ทั้ง salesEndDateTime และ salesEndDatetime จาก FE */
    @JsonAlias({"salesEndDatetime"})
    private Instant salesEndDateTime;

    @NotBlank
    private String venueName;

    private String venueAddress;
    private Integer maxCapacity;

    /* ===== Alias getters สำหรับโค้ดเดิมที่เรียก *Datetime (t เล็ก) ===== */
    public Instant getSalesStartDatetime() {
        return salesStartDateTime;
    }

    public Instant getSalesEndDatetime() {
        return salesEndDateTime;
    }

    /* (ไม่บังคับ) alias setters—เผื่ออนาคตมีโค้ดเรียกชื่อนี้ */
    public void setSalesStartDatetime(Instant salesStartDatetime) {
        this.salesStartDateTime = salesStartDatetime;
    }

    public void setSalesEndDatetime(Instant salesEndDatetime) {
        this.salesEndDateTime = salesEndDatetime;
    }
}
