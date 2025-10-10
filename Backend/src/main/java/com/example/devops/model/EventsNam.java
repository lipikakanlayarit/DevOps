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

  @Column(name = "max_capacity")
  private Integer max_capacity;

  @Column(name = "status")
  private String status;

  // -------- Getters and Setters --------
  public Long getEvent_id() { return event_id; }
  public void setEvent_id(Long event_id) { this.event_id = event_id; }

  public Long getOrganizer_id() { return organizer_id; }
  public void setOrganizer_id(Long organizer_id) { this.organizer_id = organizer_id; }

  public String getEvent_name() { return event_name; }
  public void setEvent_name(String event_name) { this.event_name = event_name; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public Long getCategory_id() { return category_id; }
  public void setCategory_id(Long category_id) { this.category_id = category_id; }

  public Instant getStart_datetime() { return start_datetime; }
  public void setStart_datetime(Instant start_datetime) { this.start_datetime = start_datetime; }

  public Instant getEnd_datetime() { return end_datetime; }
  public void setEnd_datetime(Instant end_datetime) { this.end_datetime = end_datetime; }

  public String getVenue_name() { return venue_name; }
  public void setVenue_name(String venue_name) { this.venue_name = venue_name; }

  public String getVenue_address() { return venue_address; }
  public void setVenue_address(String venue_address) { this.venue_address = venue_address; }

  public Integer getMax_capacity() { return max_capacity; }
  public void setMax_capacity(Integer max_capacity) { this.max_capacity = max_capacity; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}
