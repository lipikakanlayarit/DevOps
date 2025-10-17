package com.example.devops.web;

import com.example.devops.dto.EventCardResponse;
import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/public/events")
public class PublicEventsController {

    private final EventsNamRepository eventsRepo;

    public PublicEventsController(EventsNamRepository eventsRepo) {
        this.eventsRepo = eventsRepo;
    }

    /**
     * GET /api/public/events/landing?section=onSale|upcoming
     * ค่าเริ่มต้น: onSale
     *
     * ค่า section:
     *  - onSale   : อีเวนต์ที่กำลังเปิดขาย "ตอนนี้"
     *  - upcoming : อีเวนต์ที่จะเปิดขาย "อนาคต"
     */
    @GetMapping(value = "/landing", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<EventCardResponse> landing(@RequestParam(defaultValue = "onSale") String section) {
        List<EventsNam> list;
        switch (section.toLowerCase()) {
            case "upcoming" -> {
                // แนะนำ: ใช้ VIEW
                list = eventsRepo.findUpcomingViaView();
                // ถ้าจะใช้คอลัมน์โดยตรง:
                // list = eventsRepo.findUpcomingSales(Instant.now());
            }
            case "onsale" -> {
                list = eventsRepo.findOnSaleViaView();
                // หรือคอลัมน์โดยตรง:
                // list = eventsRepo.findCurrentlyOnSale(Instant.now());
            }
            default -> {
                list = eventsRepo.findOnSaleViaView();
            }
        }
        return list.stream().map(EventCardResponse::from).toList();
    }

    /**
     * GET /api/public/events/{eventId}/cover
     * เสิร์ฟรูป cover จาก BYTEA ในตาราง events_nam
     */
    @GetMapping("/{eventId}/cover")
    public ResponseEntity<byte[]> cover(@PathVariable Long eventId) {
        EventsNam e = eventsRepo.findById(eventId).orElse(null);
        if (e == null || e.getCover_image() == null || e.getCover_image().length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        MediaType type = MediaType.IMAGE_JPEG;
        if (e.getCover_image_type() != null) {
            try {
                type = MediaType.parseMediaType(e.getCover_image_type());
            } catch (Exception ignore) {}
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(type);
        if (e.getCover_updated_at() != null) {
            headers.setLastModified(e.getCover_updated_at().toEpochMilli());
        }
        // แคชได้ 5 นาที (ปรับตามเหมาะสม)
        headers.setCacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePublic());
        return new ResponseEntity<>(e.getCover_image(), headers, HttpStatus.OK);
    }
}
