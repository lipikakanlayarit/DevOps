package com.example.devops.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "categories")
public class Categories {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "category_id")
  private Long category_id;

  @Column(name = "category_name")
  private String category_name;

  @Column(name = "description")
  private String description;

  @Column(name = "is_active")
  private Boolean is_active;

  @Column(name = "created_at")
  private Instant created_at;
}
