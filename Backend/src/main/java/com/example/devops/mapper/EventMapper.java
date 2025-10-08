package com.example.devops.mapper;

import com.example.devops.dto.EventDTO;
import com.example.devops.model.EventsNam;

public class EventMapper {
    public static EventDTO toDTO(EventsNam e) {
        EventDTO dto = new EventDTO();
        dto.setId(e.getEvent_id());
        dto.setTitle(e.getEvent_name());
        dto.setDescription(e.getDescription());
        dto.setImageUrl(e.getCover_image_url());
        dto.setLocation(e.getVenue_name());
        dto.setStartAt(e.getStart_datetime());
        dto.setEndAt(e.getEnd_datetime());
        dto.setFeatured(false);
        return dto;
    }
}
