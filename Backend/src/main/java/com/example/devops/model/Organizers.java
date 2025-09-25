package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "organizers")
public class Organizers {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "organizer_id")
  private Long organizer_id;

  @Column(name = "email")
  private String email;

  @Column(name = "password_hash")
  private String password_hash;

  @Column(name = "first_name")
  private String first_name;

  @Column(name = "last_name")
  private String last_name;

  @Column(name = "phone_number")
  private String phone_number;

  @Column(name = "address")
  private String address;

  @Column(name = "company_name")
  private String company_name;

  @Column(name = "tax_id")
  private String tax_id;

  @Column(name = "verification_status")
  private String verification_status;

  @Column(name = "created_at")
  private Instant created_at;

  @Column(name = "updated_at")
  private Instant updated_at;
}
