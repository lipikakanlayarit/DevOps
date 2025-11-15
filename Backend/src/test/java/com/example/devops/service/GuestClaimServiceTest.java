package com.example.devops.service;

import com.example.devops.repo.ReservedRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class GuestClaimServiceTest {

    private ReservedRepository reservedRepository;
    private GuestClaimService service;

    @BeforeEach
    void setup() {
        reservedRepository = Mockito.mock(ReservedRepository.class);
        service = new GuestClaimService(reservedRepository);
    }

    @Test
    @DisplayName("userId = null → return 0 และไม่เรียก repo")
    void testNullUserId() {
        int result = service.linkGuestReservationsToUser(null, "test@example.com");

        assertThat(result).isEqualTo(0);
        verify(reservedRepository, never()).claimAllByEmail(anyString(), anyLong());
    }

    @Test
    @DisplayName("email = null → return 0 และไม่เรียก repo")
    void testNullEmail() {
        int result = service.linkGuestReservationsToUser(1L, null);

        assertThat(result).isEqualTo(0);
        verify(reservedRepository, never()).claimAllByEmail(anyString(), anyLong());
    }

    @Test
    @DisplayName("email ว่างหรือ blank → return 0 และไม่เรียก repo")
    void testBlankEmail() {
        int result = service.linkGuestReservationsToUser(1L, "   "); // blank

        assertThat(result).isEqualTo(0);
        verify(reservedRepository, never()).claimAllByEmail(anyString(), anyLong());
    }

    @Test
    @DisplayName("เคสปกติ → เรียก repo และ return จำนวนรายการที่ claim สำเร็จ")
    void testSuccessClaim() {
        when(reservedRepository.claimAllByEmail("test@example.com", 99L))
                .thenReturn(3); // สมมติ repo claim ได้ 3 รายการ

        int result = service.linkGuestReservationsToUser(99L, "   test@example.com   ");

        assertThat(result).isEqualTo(3);

        // ตรวจว่ามีการ trim email + ส่งค่า user ถูกต้อง
        verify(reservedRepository, times(1))
                .claimAllByEmail("test@example.com", 99L);
    }
}
