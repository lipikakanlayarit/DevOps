package com.example.devops.controller;

import com.example.devops.model.Organizer;
import com.example.devops.repo.OrganizerRepo;
import com.example.devops.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// ✅ โหลดเฉพาะ AdminController
@WebMvcTest(controllers = AdminController.class)
@AutoConfigureMockMvc(addFilters = false) // ❗️ปิด security filters (@PreAuthorize)
@TestPropertySource(properties = {
        // ✅ ใช้ path matcher เก่าเพื่อแก้ปัญหา PathVariable reflection
        "spring.mvc.pathmatch.matching-strategy=ant_path_matcher"
})
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private OrganizerRepo organizerRepo;

    private Organizer sampleOrganizer;

    @BeforeEach
    void setup() {
        sampleOrganizer = new Organizer();
        sampleOrganizer.setId(1L);
        sampleOrganizer.setUsername("orgA");
        sampleOrganizer.setVerificationStatus("PENDING");
    }

    @Test
    void verifyOrganizer_success() throws Exception {
        // 🎯 Mock: มี organizer อยู่จริง
        when(organizerRepo.findById(1L)).thenReturn(Optional.of(sampleOrganizer));
        when(organizerRepo.save(any(Organizer.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(patch("/api/admin/organizers/{id}/verify", 1L) // ✅ ใช้ path variable แบบปลอดภัย
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("id", "1")) // ✅ เพิ่ม param ป้องกัน PathVariable mapping error
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Organizer verified successfully"));

        // ✅ ตรวจว่า save ถูกเรียกจริง
        verify(organizerRepo, times(1)).save(any(Organizer.class));
    }

    @Test
    void verifyOrganizer_notFound() throws Exception {
        // 🎯 Mock: ไม่เจอ organizer
        when(organizerRepo.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/admin/organizers/{id}/verify", 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("id", "99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Organizer not found"));

        // ✅ ตรวจว่า save ไม่ถูกเรียก
        verify(organizerRepo, never()).save(any(Organizer.class));
    }
}
