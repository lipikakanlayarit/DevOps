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

    @JsonAlias("salesStartDatetime")
    private Instant salesStartDateTime;

    @JsonAlias("salesEndDatetime")
    private Instant salesEndDateTime;

    @NotBlank
    private String venueName;

    private String venueAddress;
    private Integer maxCapacity;

    // 🧩 เพิ่ม getter ทั้งสองรูปแบบให้ Mapper ใช้ได้ทุกแบบ
    public Instant getSalesStartDateTime() {
        return salesStartDateTime;
    }
    public Instant getSalesEndDateTime() {
        return salesEndDateTime;
    }
    public Instant getSalesStartDatetime() {
        return salesStartDateTime;
    }
    public Instant getSalesEndDatetime() {
        return salesEndDateTime;
    }
}
