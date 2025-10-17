package com.example.devops.controller;

import com.example.devops.dto.EventMapper;
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

    /* ==================== USER MANAGEMENT ==================== */

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
        }).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("users", data, "total", data.size()));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable("id") Long id) {
        var userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User u = userOpt.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("email", u.getEmail());
        m.put("role", u.getRole());
        m.put("firstName", u.getFirstName());
        m.put("lastName", u.getLastName());
        m.put("phoneNumber", u.getPhoneNumber());
        m.put("idCard", u.getIdCardPassport());
        return ResponseEntity.ok(m);
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable("id") Long id,
                                            @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        var userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        String upperRole = newRole.toUpperCase();

        if (!List.of("USER", "ADMIN", "MODERATOR", "ORGANIZER").contains(upperRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role. Use: USER, ORGANIZER, ADMIN, MODERATOR"));
        }

        user.setRole(upperRole);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "User role updated to " + upperRole));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("id") Long id) {
        var userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        userRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    /* ==================== ORGANIZER MANAGEMENT ==================== */

    @GetMapping("/organizers")
    public ResponseEntity<?> getAllOrganizers() {
        List<Organizer> orgs = organizerRepo.findAll();
        var data = orgs.stream().map(o -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", o.getId());
            m.put("username", o.getUsername());
            m.put("email", o.getEmail());
            m.put("firstName", o.getFirstName());
            m.put("lastName", o.getLastName());
            m.put("companyName", o.getCompanyName());
            m.put("taxId", o.getTaxId());
            m.put("phoneNumber", o.getPhoneNumber());
            m.put("address", o.getAddress());
            m.put("verificationStatus", o.getVerificationStatus());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("organizers", data, "total", data.size()));
    }

    @GetMapping("/organizers/{id}")
    public ResponseEntity<?> getOrganizerById(@PathVariable("id") Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        Organizer o = orgOpt.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", o.getId());
        m.put("username", o.getUsername());
        m.put("email", o.getEmail());
        m.put("firstName", o.getFirstName());
        m.put("lastName", o.getLastName());
        m.put("companyName", o.getCompanyName());
        m.put("taxId", o.getTaxId());
        m.put("phoneNumber", o.getPhoneNumber());
        m.put("address", o.getAddress());
        m.put("verificationStatus", o.getVerificationStatus());
        return ResponseEntity.ok(m);
    }

    @PatchMapping("/organizers/{id}/verify")
    public ResponseEntity<?> verifyOrganizer(@PathVariable("id") Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        Organizer org = orgOpt.get();
        org.setVerificationStatus("VERIFIED");
        organizerRepo.save(org);
        return ResponseEntity.ok(Map.of("message", "Organizer verified successfully"));
    }

    @PatchMapping("/organizers/{id}/reject")
    public ResponseEntity<?> rejectOrganizer(@PathVariable("id") Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        Organizer org = orgOpt.get();
        org.setVerificationStatus("REJECTED");
        organizerRepo.save(org);
        return ResponseEntity.ok(Map.of("message", "Organizer rejected"));
    }

    @PatchMapping("/organizers/{id}/status")
    public ResponseEntity<?> updateOrganizerStatus(@PathVariable("id") Long id,
                                                   @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }

        String upperStatus = status.toUpperCase();
        if (!List.of("PENDING", "VERIFIED", "REJECTED", "SUSPENDED").contains(upperStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Use: PENDING, VERIFIED, REJECTED, SUSPENDED"));
        }

        Organizer org = orgOpt.get();
        org.setVerificationStatus(upperStatus);
        organizerRepo.save(org);
        return ResponseEntity.ok(Map.of("message", "Organizer status updated to " + upperStatus));
    }

    @DeleteMapping("/organizers/{id}")
    public ResponseEntity<?> deleteOrganizer(@PathVariable("id") Long id) {
        var orgOpt = organizerRepo.findById(id);
        if (orgOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Organizer not found"));
        }
        organizerRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Organizer deleted successfully"));
    }

    /* ==================== STATISTICS ==================== */

    @GetMapping("/stats")
    public ResponseEntity<?> getStatistics() {
        long totalUsers = userRepo.count();
        long totalOrganizers = organizerRepo.count();

        List<Organizer> orgs = organizerRepo.findAll();
        long pendingOrganizers = orgs.stream().filter(o -> "PENDING".equalsIgnoreCase(o.getVerificationStatus())).count();
        long verifiedOrganizers = orgs.stream().filter(o -> "VERIFIED".equalsIgnoreCase(o.getVerificationStatus())).count();
        long rejectedOrganizers = orgs.stream().filter(o -> "REJECTED".equalsIgnoreCase(o.getVerificationStatus())).count();

        List<User> users = userRepo.findAll();
        long adminCount = users.stream().filter(u -> "ADMIN".equalsIgnoreCase(u.getRole())).count();
        long regularUsers = users.stream().filter(u -> "USER".equalsIgnoreCase(u.getRole())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalOrganizers", totalOrganizers);
        stats.put("adminCount", adminCount);
        stats.put("regularUsers", regularUsers);
        stats.put("pendingOrganizers", pendingOrganizers);
        stats.put("verifiedOrganizers", verifiedOrganizers);
        stats.put("rejectedOrganizers", rejectedOrganizers);

        return ResponseEntity.ok(stats);
    }

    /* ****************** EVENT MODERATION ****************** */

    // ดึงอีเวนต์ตามสถานะ (รองรับไม่ส่ง status = ALL)
    @GetMapping("/events")
    public ResponseEntity<?> listEventsByStatus(
            @RequestParam(name = "status", required = false, defaultValue = "ALL") String status
    ) {
        String st = (status == null ? "ALL" : status.toUpperCase(Locale.ROOT));
        List<EventsNam> list;

        if ("ALL".equals(st)) {
            list = eventsRepo.findAllByOrderByEventIdDesc();
        } else {
            if (!List.of("PENDING", "APPROVED", "REJECTED", "PUBLISHED").contains(st)) {
                return ResponseEntity.badRequest().body(Map.of("message", "invalid status"));
            }
            list = eventsRepo.findAllByStatus(st);
        }

        var body = list.stream().map(EventMapper::toDto).toList();
        return ResponseEntity.ok(body);
    }

    // อนุมัติ
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

    // ปฏิเสธ (ต้องมีเหตุผล)
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

    // ดูเหตุผล
    @GetMapping("/events/{id}/review")
    public ResponseEntity<?> getReview(@PathVariable("id") Long id) {
        var opt = eventsRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message","event not found"));
        var e = opt.get();
        Map<String,Object> m = new HashMap<>();
        m.put("eventId", e.getId());
        m.put("status", e.getStatus());
        m.put("review", e.getReview());
        m.put("reviewedAt", e.getReviewed_at());
        m.put("reviewedBy", e.getReviewed_by());
        return ResponseEntity.ok(m);
    }

    /* ==================== EVENT COVER IMAGE (NEW) ==================== */

    @GetMapping("/events/{id}/cover")
    public ResponseEntity<byte[]> getEventCover(@PathVariable("id") Long id) {
        var opt = eventsRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        var e = opt.get();
        byte[] bytes = e.getCover_image();
        if (bytes == null || bytes.length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                e.getCover_image_type() != null ? e.getCover_image_type() : "image/png"));
        headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic());

        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    /* ==================== UTIL ==================== */

    private Integer extractAdminId(Authentication auth) {
        // TODO: map จาก JWT/principal ของจริง
        return 1;
    }
}
