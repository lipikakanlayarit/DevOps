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
public class AdminController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;
    private final EventsNamRepository eventsRepo;

    public AdminController(UserRepository userRepo,
                           OrganizerRepo organizerRepo,
                           EventsNamRepository eventsRepo) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
        this.eventsRepo = eventsRepo;
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
            m.put("role", u.getRole());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("phoneNumber", u.getPhoneNumber());
            m.put("idCard", u.getIdCardPassport());
            return m;
        }).toList();
        return ResponseEntity.ok(Map.of("users", data, "total", data.size()));
    }

    /* ============== ORGANIZERS (list + detail) ============== */

    @GetMapping("/organizers")
    public ResponseEntity<?> getAllOrganizers() {
        List<Organizer> orgs = organizerRepo.findAll();
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

    /** ✅ Organizer detail สำหรับหน้า admin-eventdetail (Organizer detail modal) */
    @GetMapping("/organizers/{id}")
    public ResponseEntity<?> getOrganizerById(@PathVariable("id") Long id) {
        return organizerRepo.findById(id)
                .<ResponseEntity<?>>map(o -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("companyName", ns(o.getCompanyName()));
                    m.put("phoneNumber", ns(o.getPhoneNumber()));  // <- ต้องมี field นี้ใน entity
                    m.put("address", ns(o.getAddress()));          // <- ต้องมี field นี้ใน entity
                    m.put("email", ns(o.getEmail()));
                    m.put("username", ns(o.getUsername()));
                    m.put("firstName", ns(o.getFirstName()));
                    m.put("lastName", ns(o.getLastName()));
                    m.put("verificationStatus", ns(o.getVerificationStatus()));
                    return ResponseEntity.ok(m);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message","organizer not found")));
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

        // 1) map entity -> DTO
        List<EventResponse> body = list.stream().map(EventMapper::toDto).toList();

        // 2) เติม organizerName แบบ bulk
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

    /** ✅ GET event เดี่ยว (ใช้หน้า admin-eventdetail) */
    @GetMapping("/events/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        return eventsRepo.findById(id)
                .map(ev -> {
                    var dto = EventMapper.toDto(ev); // มี organizerId แล้ว
                    if (dto.getOrganizerId() != null) {
                        organizerRepo.findById(dto.getOrganizerId()).ifPresent(o -> {
                            String company  = o.getCompanyName() == null ? "" : o.getCompanyName();
                            String username = o.getUsername()    == null ? "" : o.getUsername();

                            // ชื่อสำหรับแสดง (ใช้ company ถ้ามี ไม่งั้น fallback เป็น username)
                            dto.setOrganizerName(company.isBlank() ? username : company);

                            // ✅ เติมข้อมูลให้ modal
                            dto.setOrganizerCompany(company.isBlank() ? username : company);
                            dto.setOrganizerPhone(o.getPhoneNumber());
                            dto.setOrganizerAddress(o.getAddress());
                        });
                    }
                    return ResponseEntity.ok(dto);
                })
                // ❗️อย่า .body(Map.of(...)) เพราะ method นี้ต้องคืน EventResponse
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
        if (n == 0) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message","event not found"));
        return ResponseEntity.ok(Map.of("message","approved","eventId", id));
    }

    @PostMapping("/events/{id}/reject")
    @Transactional
    public ResponseEntity<?> reject(@PathVariable("id") Long id,
                                    @RequestBody Map<String, Object> body,
                                    Authentication auth) {
        String review = body == null ? null : Objects.toString(body.get("review"), null);
        if (review == null || review.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message","review is required for rejection"));
        }
        Integer adminId = extractAdminId(auth);
        int n = eventsRepo.reject(id, review, adminId);
        if (n == 0) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message","event not found"));
        return ResponseEntity.ok(Map.of("message","rejected","eventId", id));
    }

    @GetMapping("/events/{id}/review")
    public ResponseEntity<?> getReview(@PathVariable("id") Long id) {
        return eventsRepo.findById(id)
                .<ResponseEntity<?>>map(e -> {
                    Map<String,Object> m = new HashMap<>();
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
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message","event not found")));
    }

    /* ============== COVER IMAGE ============== */

    @GetMapping("/events/{id}/cover")
    public ResponseEntity<byte[]> getEventCover(@PathVariable("id") Long id) {
        var opt = eventsRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        var e = opt.get();
        byte[] bytes = e.getCover_image();
        if (bytes == null || bytes.length == 0) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

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
    private static String ns(String s) { return s == null ? "" : s; }
}
