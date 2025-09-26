package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_sessions")
public class UserSessions {
  @Id
  @Column(name = "session_id")
  private String session_id;

  @Column(name = "user_id")
  private Long user_id;

  @Column(name = "created_at")
  private Instant created_at;

  @Column(name = "expires_at")
  private Instant expires_at;

  @Column(name = "is_active")
  private Boolean is_active;

  @Column(name = "last_activity")
  private Instant last_activity;

  @Column(name = "ip_address")
  private String ip_address;

  @Column(name = "user_agent")
  private String user_agent;
}
