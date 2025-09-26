package com.example.devops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payments {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "payment_id")
  private Long payment_id;

  @Column(name = "reserved_id")
  private Long reserved_id;

  @Column(name = "amount")
  private BigDecimal amount;

  @Column(name = "payment_method")
  private String payment_method;

  @Column(name = "transaction_id")
  private String transaction_id;

  @Column(name = "payment_status")
  private String payment_status;

  @Column(name = "payment_datetime")
  private Instant payment_datetime;

  @Column(name = "gateway_response")
  private String gateway_response;
}
