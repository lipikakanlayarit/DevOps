package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
@RequiredArgsConstructor
public class EventQueryController {

    private final EventsNamRepository eventsNamRepository;
    private final OrganizerRepo organizerRepo;

    /**
     * คืนรายการอีเวนต์ของผู้จัด (organizer) ที่ล็อกอินอยู่
     * รองรับฟิลเตอร์แบบเบา ๆ:
     *   - ?status=APPROVED (ไม่ส่ง = ทั้งหมด)
     *   - ?q=keyword        (ค้นหาจากชื่ออีเวนต์แบบ contains)
     */
    @GetMapping("/mine")
    public ResponseEntity<?> getMyEvents(
            Authentication auth,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "q", required = false) String q
    ) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        String key = auth.getName().trim();
        Long orgId = organizerRepo.findIdByEmailOrUsernameIgnoreCase(key).orElse(null);
        if (orgId == null) {
            // ไม่มีสิทธิ์เป็น organizer หรือไม่พบ -> คืนลิสต์ว่าง
            return ResponseEntity.ok(List.of());
        }

        // ต้องมีเมธอดนี้ใน EventsNamRepository:
        // List<EventsNam> findByOrganizerIdOrderByIdDesc(Long organizerId);
        List<EventsNam> list = eventsNamRepository.findByOrganizerIdOrderByIdDesc(orgId);

        // ฟิลเตอร์ตาม status ถ้ามีส่งมา
        if (status != null && !status.isBlank()) {
            final String st = status.trim().toUpperCase(Locale.ROOT);
            list = list.stream()
                    .filter(ev -> {
                        String s = Optional.ofNullable(ev.getStatus()).orElse("");
                        return st.equalsIgnoreCase(s);
                    })
                    .collect(Collectors.toList());
        }

        // ฟิลเตอร์ keyword (q) ถ้ามีส่งมา
        if (q != null && !q.isBlank()) {
            final String needle = q.trim().toLowerCase(Locale.ROOT);
            list = list.stream()
                    .filter(ev -> Optional.ofNullable(ev.getEventName())
                            .map(String::toLowerCase)
                            .orElse("")
                            .contains(needle))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> result = list.stream().map(ev -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id",                ev.getId());
            map.put("eventName",         ev.getEventName());
            map.put("status",            ev.getStatus());
            map.put("categoryId",        ev.getCategoryId());
            map.put("startDateTime",     ev.getStartDatetime());
            map.put("endDateTime",       ev.getEndDatetime());
            // เก็บทั้งคู่เพื่อไม่ให้ FE เดิมพัง และให้ชื่อชัดขึ้นด้วย
            map.put("venue",             ev.getVenueName());
            map.put("venueName",         ev.getVenueName());
            // เพิ่มข้อมูลที่ FE อาจอยากใช้ในอนาคต
            map.put("salesStartDateTime", ev.getSalesStartDatetime());
            map.put("salesEndDateTime",   ev.getSalesEndDatetime());
            map.put("updatedAt",          safeUpdatedAt(ev));
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    private Instant safeUpdatedAt(EventsNam ev) {
        // ถ้ามีฟิลด์ updatedAt ใน entity ก็ส่งคืนตรง ๆ
        // ถ้าไม่มี ใช้ cover_updated_at เป็น proxy หรือ null
        try {
            // ถ้า EventsNam มี getter updatedAt() ให้ใช้ (ป้องกัน NPE ด้วย try/catch)
            return (Instant) EventsNam.class.getMethod("getUpdatedAt").invoke(ev);
        } catch (Exception ignore) {
            return ev.getCover_updated_at();
        }
    }
}
