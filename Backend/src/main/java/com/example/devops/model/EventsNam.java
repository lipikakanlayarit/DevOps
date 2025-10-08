package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "events_nam")
public class EventsNam {

  public EventsNam() { }

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

  // getters
  public Long getEvent_id() { return event_id; }
  public Long getOrganizer_id() { return organizer_id; }
  public String getEvent_name() { return event_name; }
  public String getDescription() { return description; }
  public Long getCategory_id() { return category_id; }
  public Instant getStart_datetime() { return start_datetime; }
  public Instant getEnd_datetime() { return end_datetime; }
  public String getVenue_name() { return venue_name; }
  public String getVenue_address() { return venue_address; }
  public String getCover_image_url() { return cover_image_url; }
  public Integer getMax_capacity() { return max_capacity; }
  public String getStatus() { return status; }
  public Instant getCreated_at() { return created_at; }
  public Instant getUpdated_at() { return updated_at; }
}
