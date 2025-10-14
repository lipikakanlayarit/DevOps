package com.example.devops.web;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.OrganizerRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventQueryController {

    private final EventsNamRepository eventsNamRepository;
    private final OrganizerRepo organizerRepo;

    @GetMapping("/mine")
    public ResponseEntity<?> getMyEvents(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        String key = Optional.ofNullable(auth.getName()).orElse("").trim();
        System.out.println("[EventQueryController] key = " + key);

        // ✅ ดึง organizer_id จาก email หรือ username
        Long orgId = organizerRepo.findIdByEmailOrUsernameIgnoreCase(key).orElse(null);
        if (orgId == null) {
            return ResponseEntity.ok(List.of());
        }

        // ✅ ดึง events ตาม organizer_id
        List<EventsNam> list = eventsNamRepository.findByOrganizerIdOrderByIdDesc(orgId);

        List<Map<String, Object>> result = list.stream().map(ev -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ev.getEvent_id());
            map.put("eventName", ev.getEvent_name());
            map.put("status", ev.getStatus());
            map.put("categoryId", ev.getCategory_id());
            map.put("startDatetime", ev.getStart_datetime());
            map.put("endDatetime", ev.getEnd_datetime());
            map.put("venue", ev.getVenue_name());
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }
}
