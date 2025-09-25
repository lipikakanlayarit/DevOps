package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "events_nam")
public class EventsNam {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "event_id")
  private Long event_id;

  @Column(name = "organizer_id")
  private Long organizer_id;

  @Column(name = "event_name")
  private String event_name;

  @Column(name = "description")
  private String description;

  @Column(name = "category_id")
  private Long category_id;

  @Column(name = "start_datetime")
  private Instant start_datetime;

  @Column(name = "end_datetime")
  private Instant end_datetime;

  @Column(name = "venue_name")
  private String venue_name;

  @Column(name = "venue_address")
  private String venue_address;

  @Column(name = "cover_image_url")
  private String cover_image_url;

  @Column(name = "max_capacity")
  private Integer max_capacity;

  @Column(name = "status")
  private String status;

  @Column(name = "created_at")
  private Instant created_at;

  @Column(name = "updated_at")
  private Instant updated_at;
}
