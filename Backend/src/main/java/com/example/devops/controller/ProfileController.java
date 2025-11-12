package com.example.devops.controller;

import com.example.devops.model.Organizer;
import com.example.devops.model.User;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping(path = "/api/profile", produces = MediaType.APPLICATION_JSON_VALUE)
public class ProfileController {

    private final UserRepository userRepo;
    private final OrganizerRepo organizerRepo;
    private final JdbcTemplate jdbc;

    public ProfileController(UserRepository userRepo,
                             OrganizerRepo organizerRepo,
                             JdbcTemplate jdbc) {
        this.userRepo = userRepo;
        this.organizerRepo = organizerRepo;
        this.jdbc = jdbc;
    }

    /* ==================== GET PROFILE ==================== */
    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String username = auth.getName();

        var userOpt = userRepo.findByUsernameIgnoreCase(username);
        if (userOpt.isPresent()) return ResponseEntity.ok(buildUserResponse(userOpt.get()));

        var orgOpt = organizerRepo.findByUsernameIgnoreCase(username);
        if (orgOpt.isPresent()) return ResponseEntity.ok(buildOrganizerResponse(orgOpt.get()));

        return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    }

    /* ==================== MY TICKETS (seat-level) ==================== */
    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets(Authentication auth, HttpServletRequest request) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = auth.getName();
        Long userId = userRepo.findByUsernameIgnoreCase(username).map(User::getId).orElse(null);
        if (userId == null) return ResponseEntity.ok(List.of());

        // แสดงเฉพาะ:
        //  - จ่ายแล้ว (PAID)
        //  - หรือยังไม่จ่าย แต่ยังอยู่ในช่วงจ่ายได้ (ภายใน 5 นาทีหลังจอง และไม่เกิน sales_end_datetime)
        // กรณีหมดหน้าต่างชำระแล้วจะไม่ติดมาในผลลัพธ์
        String sql = """
            SELECT
                r.reserved_id                              AS reserveId,
                r.confirmation_code                         AS confirmationCode,
                UPPER(COALESCE(r.payment_status,'UNPAID'))  AS paymentStatus,
                r.total_amount                              AS total,
                ev.event_id                                 AS eventId,
                ev.event_name                               AS title,
                ev.venue_name                               AS venue,
                to_char(ev.start_datetime AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') AS showDate,
                COALESCE(sz.description, sz.zone_name,'')   AS zoneName,
                sr.row_label                                AS rowLabel,
                s.seat_number                               AS seatNumber,
                s.seat_id                                   AS seatId,
                COALESCE(sz.price, 0)                       AS unitPrice,
                LEAST(r.registration_datetime + INTERVAL '5 minutes', ev.sales_end_datetime) AS expire_at
            FROM reserved r
            JOIN events_nam ev         ON ev.event_id = r.event_id
            LEFT JOIN reserved_seats rs ON rs.reserved_id = r.reserved_id
            LEFT JOIN seats s            ON s.seat_id = rs.seat_id
            LEFT JOIN seat_rows sr       ON sr.row_id = s.row_id
            LEFT JOIN seat_zones sz      ON sz.zone_id = sr.zone_id
            WHERE r.user_id = ?
              AND (
                    UPPER(COALESCE(r.payment_status,'UNPAID')) = 'PAID'
                    OR ( UPPER(COALESCE(r.payment_status,'UNPAID')) <> 'PAID'
                         AND NOW() < LEAST(r.registration_datetime + INTERVAL '5 minutes', ev.sales_end_datetime)
                       )
                  )
              -- กันผลลัพธ์ที่ไม่มีที่นั่ง (เช่น เคลียร์ที่นั่งหลังหมดเวลา)
              AND s.seat_id IS NOT NULL
            ORDER BY ev.start_datetime DESC, r.reserved_id DESC, sz.zone_name, sr.row_label, s.seat_number
        """;

        var rows = jdbc.queryForList(sql, userId);
        List<Map<String,Object>> out = new ArrayList<>(rows.size());

        for (Map<String,Object> r : rows) {
            Map<String,Object> m = new LinkedHashMap<>();
            Object eventId = r.get("eventId");
            String posterUrl = (eventId == null) ? "" : ("/api/events/" + eventId + "/cover");

            m.put("posterUrl", posterUrl);
            m.put("reserveId", str(r.get("reserveId")));
            m.put("eventId", eventId);
            m.put("title", str(r.get("title")));
            m.put("venue", str(r.get("venue")));
            m.put("showDate", str(r.get("showDate")));
            m.put("zone", str(r.get("zoneName")));
            m.put("rowLabel", r.get("rowLabel"));
            m.put("seatNumber", r.get("seatNumber"));
            m.put("seatId", r.get("seatId"));
            m.put("unitPrice", r.get("unitPrice"));
            m.put("type", "concert");
            // หน้านี้ไม่ต้องใช้สถานะขายของอีเวนต์เท่าไร ใส่ค่าเดียวพอ
            m.put("effectiveStatus", "ONSALE");
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }

    /* ==================== UPDATE USER PROFILE ==================== */
    @PutMapping("/user")
    public ResponseEntity<?> updateUserProfile(
            @Valid @RequestBody UpdateUserRequest req, Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body(Map.of("error","Unauthorized"));

        String username = auth.getName();
        var userOpt = userRepo.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","User not found"));

        User user = userOpt.get();

        if (!user.getEmail().equalsIgnoreCase(req.getEmail())) {
            if (userRepo.findByEmailIgnoreCase(req.getEmail()).isPresent())
                return ResponseEntity.badRequest().body(Map.of("error","Email already exists"));
            if (organizerRepo.findByEmailIgnoreCase(req.getEmail()).isPresent())
                return ResponseEntity.badRequest().body(Map.of("error","Email already taken by an organizer"));
        }

        user.setEmail(trim(req.getEmail()));
        user.setFirstName(trim(req.getFirstName()));
        user.setLastName(trim(req.getLastName()));
        user.setPhoneNumber(trim(req.getPhoneNumber()));
        if (req.getIdCard()!=null && !req.getIdCard().trim().isEmpty()) {
            user.setIdCardPassport(trim(req.getIdCard()));
        }
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message","Profile updated successfully","user",buildUserResponse(user)));
    }

    /* ==================== UPDATE ORGANIZER PROFILE ==================== */
    @PutMapping("/organizer")
    public ResponseEntity<?> updateOrganizerProfile(
            @Valid @RequestBody UpdateOrganizerRequest req, Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).body(Map.of("error","Unauthorized"));

        String username = auth.getName();
        var orgOpt = organizerRepo.findByUsernameIgnoreCase(username);
        if (orgOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","Organizer not found"));

        Organizer org = orgOpt.get();

        if (!org.getEmail().equalsIgnoreCase(req.getEmail())) {
            if (organizerRepo.findByEmailIgnoreCase(req.getEmail()).isPresent())
                return ResponseEntity.badRequest().body(Map.of("error","Email already exists"));
            if (userRepo.findByEmailIgnoreCase(req.getEmail()).isPresent())
                return ResponseEntity.badRequest().body(Map.of("error","Email already taken by a user"));
        }

        org.setEmail(trim(req.getEmail()));
        org.setFirstName(trim(req.getFirstName()));
        org.setLastName(trim(req.getLastName()));
        org.setPhoneNumber(trim(req.getPhoneNumber()));
        org.setAddress(trim(req.getAddress()));
        org.setCompanyName(trim(req.getCompanyName()));
        org.setTaxId(trim(req.getTaxId()));
        organizerRepo.save(org);

        return ResponseEntity.ok(Map.of("message","Profile updated successfully","organizer",buildOrganizerResponse(org)));
    }

    public static class UpdateUserRequest {
        @Email @NotBlank private String email;
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String phoneNumber;
        private String idCard;
        public String getEmail(){return email;} public void setEmail(String v){email=v;}
        public String getFirstName(){return firstName;} public void setFirstName(String v){firstName=v;}
        public String getLastName(){return lastName;} public void setLastName(String v){lastName=v;}
        public String getPhoneNumber(){return phoneNumber;} public void setPhoneNumber(String v){phoneNumber=v;}
        public String getIdCard(){return idCard;} public void setIdCard(String v){idCard=v;}
    }
    public static class UpdateOrganizerRequest {
        @Email @NotBlank private String email;
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String phoneNumber;
        @NotBlank private String address;
        @NotBlank private String companyName;
        @NotBlank private String taxId;
        public String getEmail(){return email;} public void setEmail(String v){email=v;}
        public String getFirstName(){return firstName;} public void setFirstName(String v){firstName=v;}
        public String getLastName(){return lastName;} public void setLastName(String v){lastName=v;}
        public String getPhoneNumber(){return phoneNumber;} public void setPhoneNumber(String v){phoneNumber=v;}
        public String getAddress(){return address;} public void setAddress(String v){address=v;}
        public String getCompanyName(){return companyName;} public void setCompanyName(String v){companyName=v;}
        public String getTaxId(){return taxId;} public void setTaxId(String v){taxId=v;}
    }

    private static String trim(String s){ return s==null ? "" : s.trim(); }

    private Map<String,Object> buildUserResponse(User u){
        Map<String,Object> m = new HashMap<>();
        m.put("id", u.getId().toString());
        m.put("username", u.getUsername());
        m.put("email", u.getEmail());
        m.put("role", u.getRole());
        m.put("firstName", u.getFirstName());
        m.put("lastName", u.getLastName());
        m.put("phoneNumber", u.getPhoneNumber());
        m.put("idCard", u.getIdCardPassport());
        return m;
    }
    private Map<String,Object> buildOrganizerResponse(Organizer o){
        Map<String,Object> m = new HashMap<>();
        m.put("id", o.getId().toString());
        m.put("username", o.getUsername());
        m.put("email", o.getEmail());
        m.put("role", "ORGANIZER");
        m.put("firstName", o.getFirstName());
        m.put("lastName", o.getLastName());
        m.put("phoneNumber", o.getPhoneNumber());
        m.put("companyName", o.getCompanyName());
        m.put("taxId", o.getTaxId());
        m.put("address", o.getAddress());
        m.put("verificationStatus", o.getVerificationStatus());
        return m;
    }
}
