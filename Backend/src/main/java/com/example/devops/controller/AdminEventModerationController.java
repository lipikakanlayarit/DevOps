package com.example.devops.controller;

import com.example.devops.repo.EventsNamRepository;
import com.example.devops.repo.projection.AdminEventRow;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class AdminEventModerationController {

    private final EventsNamRepository events;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Map<String, Object> list(@RequestParam(value = "status", required = false) String status,
                                    @RequestParam(value = "q", required = false) String q,
                                    @RequestParam(value = "page", defaultValue = "0") int page,
                                    @RequestParam(value = "size", defaultValue = "8") int size) {
        try {
            String s = null;
            if (status != null && !status.isBlank()) {
                if ("pending".equalsIgnoreCase(status)) s = "PENDING";
                else if ("under_review".equalsIgnoreCase(status)) s = "UNDER_REVIEW";
                else s = status.toUpperCase();
            }

            Page<AdminEventRow> pg = events.searchAdminList(
                    s,
                    (q == null || q.isBlank()) ? null : q.trim(),
                    PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100))
            );

            var items = pg.getContent().stream().map(r -> {
                Map<String, Object> m = new HashMap<>();
                m.put("event_id", r.getEvent_id());
                m.put("event_name", r.getEvent_name());
                m.put("category_id", r.getCategory_id());
                m.put("organizer_id", r.getOrganizer_id());
                m.put("start_datetime", r.getStart_datetime());
                m.put("end_datetime", r.getEnd_datetime());
                m.put("venue_name", r.getVenue_name());
                m.put("venue_address", r.getVenue_address());
                m.put("status", r.getStatus());
                return m;
            }).toList();

            Map<String, Object> resp = new HashMap<>();
            resp.put("content", items);
            resp.put("totalPages", pg.getTotalPages());
            resp.put("totalElements", pg.getTotalElements());
            resp.put("number", pg.getNumber());
            resp.put("size", pg.getSize());
            return resp;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "ADMIN_EVENTS_QUERY_FAILED: " + e.getClass().getSimpleName() + ": " + e.getMessage(), e);
        }
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> approve(@PathVariable Long id) {
        int updated = events.updateStatus(id, "APPROVED");
        return Map.of("status", updated > 0 ? "OK" : "NOT_MODIFIED", "event_id", id, "new_status", "APPROVED");
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> reject(@PathVariable Long id) {
        int updated = events.updateStatus(id, "REJECTED");
        return Map.of("status", updated > 0 ? "OK" : "NOT_MODIFIED", "event_id", id, "new_status", "REJECTED");
    }
}
