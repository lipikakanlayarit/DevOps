package com.example.devops.controller;

import com.example.devops.dto.EventDTO;
import com.example.devops.mapper.EventMapper;
import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventRepository eventRepo;

    public EventController(EventRepository eventRepo) {
        this.eventRepo = eventRepo;
    }

    @GetMapping
    public Page<EventDTO> list(@RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "12") int size,
                               @RequestParam(required = false) String q) {
        Pageable pageable = PageRequest.of(page, size);
        Page<EventsNam> res = (q == null || q.isBlank())
                ? eventRepo.findAll(pageable)
                : eventRepo.searchByName(q, pageable);
        return res.map(EventMapper::toDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> get(@PathVariable Long id) {
        return eventRepo.findById(id)
                .map(e -> ResponseEntity.ok(EventMapper.toDTO(e)))
                .orElse(ResponseEntity.notFound().build());
    }
}
