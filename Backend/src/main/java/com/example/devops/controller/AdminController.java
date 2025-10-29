package com.example.devops.controller;

import com.example.devops.dto.EventMapper;
import com.example.devops.dto.EventResponse;
import com.example.devops.model.EventsNam;
import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true"
)
public class AdminController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;
    private final EventsNamRepository eventsRepo;
    private final JdbcTemplate jdbcTemplate;

    public AdminController(UserRepository userRepo,
                           OrganizerRepo organizerRepo,
                           EventsNamRepository eventsRepo,
                           JdbcTemplate jdbcTemplate) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
        this.eventsRepo = eventsRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    /* ============== USERS ============== */

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepo.findAll();
        var data = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("role", u.getRole()); // ถ้าเก็บเป็น roles string เดียว ให้ปรับ getter ตามจริง
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("phoneNumber", u.getPhoneNumber());
            m.put("idCard", u.getIdCardPassport());
            m.put("lastLogin", null);
            return m;
        }).toList();
        return ResponseEntity.ok(Map.of("users", data, "total", data.size()));
    }

    /** ✅ Ticket History (อิง reservations / reservation_tickets รุ่นล่าสุด)
     *  - เพิ่ม eventId + coverUpdatedAt เพื่อสร้าง poster URL
     *  - ถ้าไม่มีตารางหรือเกิดข้อผิดพลาด จะส่งลิสต์ว่าง ไม่ล้มทั้งหน้า
     */
    @GetMapping("/users/{id}/tickets")
    public ResponseEntity<?> getUserTickets(@PathVariable("id") Long userId) {
        try {
            if (!tableExists("reservations") || !tableExists("events_nam")) {
                return ResponseEntity.ok(List.of());
            }

            // ตรวจคอลัมน์ที่อาจต่างกันตามรุ่น
            boolean hasStatus = columnExists("reservations", "status");
            boolean hasPaymentStatus = columnExists("reservations", "payment_status");
            boolean hasCreatedAt = columnExists("reservations", "created_at");
            boolean hasRegDatetime = columnExists("reservations", "registration_datetime");

            // เงื่อนไข Paid (รองรับทั้ง status/payment_status)
            String paidPredicate;
            if (hasStatus) {
                paidPredicate = "AND COALESCE(r.status,'') = 'PAID' ";
            } else if (hasPaymentStatus) {
                paidPredicate = "AND COALESCE(r.payment_status,'') = 'PAID' ";
            } else {
                paidPredicate = "";
            }

            // ORDER BY (รองรับ created_at หรือ registration_datetime)
            String orderBy;
            if (hasCreatedAt && hasRegDatetime) {
                orderBy = "ORDER BY COALESCE(r.created_at, r.registration_datetime) DESC NULLS LAST";
            } else if (hasCreatedAt) {
                orderBy = "ORDER BY r.created_at DESC NULLS LAST";
            } else if (hasRegDatetime) {
                orderBy = "ORDER BY r.registration_datetime DESC NULLS LAST";
            } else {
                orderBy = "ORDER BY r.reservation_id DESC";
            }

            // ต้องมี reservation_tickets
            if (!tableExists("reservation_tickets")) {
                return ResponseEntity.ok(List.of());
            }

            // ✅ เพิ่ม e.event_id และ e.cover_updated_at แล้วไปเติม poster ทีหลัง
            String sql = """
                SELECT
                  COALESCE(r.reserve_code, 'RSV-' || r.reservation_id::text)                AS "reserveId",
                  COALESCE(e.event_name, '-')                                              AS "title",
                  COALESCE(e.venue_name, '-')                                              AS "venue",
                  COALESCE(to_char(e.start_datetime, 'YYYY-MM-DD HH24:MI'), '-')           AS "showDate",
                  COALESCE(tt.type_name, '-')                                              AS "zone",
                  COALESCE(rt.seat_row, '-')                                               AS "row",
                  COALESCE(rt.seat_col, '-')                                               AS "column",
                  COALESCE(rt.price, tt.price, 0)                                          AS "total",
                  e.event_id                                                                AS "eventId",
                  e.cover_updated_at                                                        AS "coverUpdatedAt"
                FROM reservations r
                LEFT JOIN reservation_tickets rt ON rt.reservation_id = r.reservation_id
                LEFT JOIN ticket_types tt        ON tt.ticket_type_id = rt.ticket_type_id
                LEFT JOIN events_nam e           ON e.event_id = COALESCE(r.event_id, tt.event_id)
                WHERE r.user_id = ?
                """ + paidPredicate + "\n" + orderBy + "\n, rt.reservation_ticket_id ASC NULLS LAST";

            List<Map<String, Object>> data = jdbcTemplate.queryForList(sql, userId);

            // ✅ เติม poster URL ให้แต่ละแถว แล้วซ่อน field ช่วย
            for (Map<String, Object> m : data) {
                Object eid = m.get("eventId");
                String poster = "";
                if (eid != null) {
                    String ver = null;
                    Object cu = m.get("coverUpdatedAt");
                    if (cu != null) {
                        if (cu instanceof java.sql.Timestamp ts) {
                            ver = String.valueOf(ts.getTime());
                        } else if (cu instanceof java.time.Instant inst) {
                            ver = String.valueOf(inst.toEpochMilli());
                        } else {
                            ver = String.valueOf(cu);
                        }
                    }
                    poster = "/api/public/events/" + eid + "/cover" + (ver != null ? "?v=" + ver : "");
                }
                m.put("poster", poster);
                m.remove("eventId");
                m.remove("coverUpdatedAt");
            }

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            // กันไม่ให้ล้มทั้งหน้า admin
            return ResponseEntity.ok(List.of());
        }
    }

    /* ============== ORGANIZERS (list + detail) ============== */

    @GetMapping("/organizers")
    public ResponseEntity<?> getAllOrganizers() {
        var orgs = organizerRepo.findAll();
        var data = orgs.stream().map(o -> Map.of(
                "id", o.getId(),
                "username", o.getUsername(),
                "email", o.getEmail(),
                "firstName", o.getFirstName(),
                "lastName", o.getLastName(),
                "companyName", o.getCompanyName(),
                "verificationStatus", o.getVerificationStatus()
        )).toList();
        return ResponseEntity.ok(Map.of("organizers", data, "total", data.size()));
    }

    @GetMapping("/organizers/{id}")
    public ResponseEntity<?> getOrganizerById(@PathVariable("id") Long id) {
        return organizerRepo.findById(id)
                .<ResponseEntity<?>>map(o -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("companyName", ns(o.getCompanyName()));
                    m.put("phoneNumber", ns(o.getPhoneNumber()));
                    m.put("address", ns(o.getAddress()));
                    m.put("email", ns(o.getEmail()));
                    m.put("username", ns(o.getUsername()));
                    m.put("firstName", ns(o.getFirstName()));
                    m.put("lastName", ns(o.getLastName()));
                    m.put("verificationStatus", ns(o.getVerificationStatus()));
                    return ResponseEntity.ok(m);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "organizer not found")));
    }

    /* ============== EVENTS (Permission/List + detail) ============== */

    @GetMapping("/events")
    public ResponseEntity<?> listEventsByStatus(
            @RequestParam(name = "status", required = false, defaultValue = "ALL") String status
    ) {
        String st = status == null ? "ALL" : status.toUpperCase(Locale.ROOT);
        List<EventsNam> list;
        if ("ALL".equals(st)) {
            list = eventsRepo.findAllByOrderByEventIdDesc();
        } else {
            if (!List.of("PENDING", "APPROVED", "REJECTED", "PUBLISHED").contains(st)) {
                return ResponseEntity.badRequest().body(Map.of("message", "invalid status"));
            }
            list = eventsRepo.findAllByStatus(st);
        }

        List<EventResponse> body = list.stream().map(EventMapper::toDto).toList();

        // เติม organizerName
        Set<Long> orgIds = body.stream()
                .map(EventResponse::getOrganizerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (!orgIds.isEmpty()) {
            Map<Long, Organizer> orgMap = organizerRepo.findAllById(orgIds).stream()
                    .collect(Collectors.toMap(Organizer::getId, Function.identity()));

            for (EventResponse dto : body) {
                Long oid = dto.getOrganizerId();
                if (oid != null) {
                    Organizer o = orgMap.get(oid);
                    if (o != null) {
                        String company = ns(o.getCompanyName());
                        String username = ns(o.getUsername());
                        dto.setOrganizerName(company.isBlank() ? username : company);
                    }
                }
            }
        }

        return ResponseEntity.ok(body);
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        return eventsRepo.findById(id)
                .map(ev -> {
                    var dto = EventMapper.toDto(ev);
                    if (dto.getOrganizerId() != null) {
                        organizerRepo.findById(dto.getOrganizerId()).ifPresent(o -> {
                            String company = o.getCompanyName() == null ? "" : o.getCompanyName();
                            String username = o.getUsername() == null ? "" : o.getUsername();
                            dto.setOrganizerName(company.isBlank() ? username : company);
                            dto.setOrganizerCompany(company.isBlank() ? username : company);
                            dto.setOrganizerPhone(o.getPhoneNumber());
                            dto.setOrganizerAddress(o.getAddress());
                        });
                    }
                    return ResponseEntity.ok(dto);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/events/{id}/approve")
    @Transactional
    public ResponseEntity<?> approve(@PathVariable("id") Long id,
                                     @RequestBody(required = false) Map<String, Object> body,
                                     Authentication auth) {
        Integer adminId = extractAdminId(auth);
        String review = body == null ? null : Objects.toString(body.getOrDefault("review", null), null);
        int n = eventsRepo.approve(id, review, adminId);
        if (n == 0)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "event not found"));
        return ResponseEntity.ok(Map.of("message", "approved", "eventId", id));
    }

    @PostMapping("/events/{id}/reject")
    @Transactional
    public ResponseEntity<?> reject(@PathVariable("id") Long id,
                                    @RequestBody Map<String, Object> body,
                                    Authentication auth) {
        String review = body == null ? null : Objects.toString(body.get("review"), null);
        if (review == null || review.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "review is required for rejection"));
        }
        Integer adminId = extractAdminId(auth);
        int n = eventsRepo.reject(id, review, adminId);
        if (n == 0)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "event not found"));
        return ResponseEntity.ok(Map.of("message", "rejected", "eventId", id));
    }

    @GetMapping("/events/{id}/review")
    public ResponseEntity<?> getReview(@PathVariable("id") Long id) {
        return eventsRepo.findById(id)
                .<ResponseEntity<?>>map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("eventId", e.getId());
                    m.put("status", e.getStatus());
                    m.put("review", e.getReview());
                    m.put("reviewedAt", e.getReviewed_at());
                    m.put("reviewedBy", e.getReviewed_by());
                    m.put("organizerId", e.getOrganizerId());
                    if (e.getOrganizerId() != null) {
                        organizerRepo.findById(e.getOrganizerId()).ifPresent(o -> {
                            String company = ns(o.getCompanyName());
                            String username = ns(o.getUsername());
                            m.put("organizerName", company.isBlank() ? username : company);
                        });
                    }
                    return ResponseEntity.ok(m);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "event not found")));
    }

    /* ============== COVER IMAGE ============== */

    @GetMapping("/events/{id}/cover")
    public ResponseEntity<byte[]> getEventCover(@PathVariable("id") Long id) {
        var opt = eventsRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        var e = opt.get();
        byte[] bytes = e.getCover_image();
        if (bytes == null || bytes.length == 0)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                e.getCover_image_type() != null ? e.getCover_image_type() : "image/png"));
        headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic());
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    /* ============== UTIL ============== */

    private Integer extractAdminId(Authentication auth) {
        // TODO: map JWT จริง
        return 1;
    }

    private static String ns(String s) {
        return s == null ? "" : s;
    }

    private boolean tableExists(String table) {
        String sql = """
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.tables
              WHERE table_schema='public' AND table_name=?
            )
            """;
        Boolean ok = jdbcTemplate.queryForObject(sql, Boolean.class, table);
        return Boolean.TRUE.equals(ok);
    }

    private boolean columnExists(String table, String column) {
        String sql = """
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema='public' AND table_name=? AND column_name=?
            )
            """;
        Boolean ok = jdbcTemplate.queryForObject(sql, Boolean.class, table, column);
        return Boolean.TRUE.equals(ok);
    }
}
