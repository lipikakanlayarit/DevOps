package com.example.devops.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "events_nam")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventsNam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long id;

    @Column(name = "organizer_id")
    private Long organizerId;

    @Column(name = "event_name", nullable = false, length = 200)
    private String eventName;

    @Column(name = "description")
    private String description;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "start_datetime")
    private Instant startDatetime;

    @Column(name = "end_datetime")
    private Instant endDatetime;

    /* ======================== ช่วงเวลาขายบัตร ======================== */
    @Column(name = "sales_start_datetime")
    private Instant salesStartDatetime;

    @Column(name = "sales_end_datetime")
    private Instant salesEndDatetime;
    /* ================================================================= */

    @Column(name = "venue_name", length = 200)
    private String venueName;

    @Column(name = "venue_address")
    private String venueAddress;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "status", length = 50)
    private String status; // PENDING / APPROVED / REJECTED / PUBLISHED

    // -------- Cover image (BYTEA) --------
    @Basic(fetch = FetchType.LAZY)
    @Lob
    @JdbcTypeCode(SqlTypes.BINARY)
    @JsonIgnore                 // ❗ กันไม่ให้ serialize ไปเป็น JSON (และมักลดโอกาสถูก log)
    @Column(name = "cover_image", columnDefinition = "bytea")
    private byte[] cover_image;

    @Column(name = "cover_image_type", length = 100)
    private String cover_image_type;

    @Column(name = "cover_updated_at")
    private Instant cover_updated_at;

    // -------- Admin review fields --------
    @Column(name = "review")
    private String review;

    @Column(name = "reviewed_at")
    private Instant reviewed_at;

    @Column(name = "reviewed_by")
    private Integer reviewed_by; // FK -> admin_users.admin_id
}
