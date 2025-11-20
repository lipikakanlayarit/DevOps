package com.example.devops.repo;

import com.example.devops.model.TicketTypes;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TicketTypesRepositoryIT {

    @Autowired
    private TicketTypesRepository ticketTypesRepository;

    private Long testEventId1;
    private Long testEventId2;
    private TicketTypes vipTicket;
    private TicketTypes regularTicket;
    private TicketTypes studentTicket;
    private TicketTypes eventTwoTicket;

    @BeforeEach
    void setUp() {
        ticketTypesRepository.deleteAll();

        testEventId1 = 100L;
        testEventId2 = 200L;

        Instant now = Instant.now();
        Instant saleStart = now.minus(7, ChronoUnit.DAYS);
        Instant saleEnd = now.plus(30, ChronoUnit.DAYS);

        // VIP Ticket
        vipTicket = new TicketTypes();
        vipTicket.setEventId(testEventId1);
        vipTicket.setTypeName("VIP");
        vipTicket.setDescription("VIP ticket with premium benefits");
        vipTicket.setPrice(new BigDecimal("5000.00"));
        vipTicket.setQuantityAvailable(100);
        vipTicket.setQuantitySold(25);
        vipTicket.setSaleStartDatetime(saleStart);
        vipTicket.setSaleEndDatetime(saleEnd);
        vipTicket.setIsActive(true);
        vipTicket.setMinPerOrder(1);
        vipTicket.setMaxPerOrder(4);
        vipTicket.setCreatedAt(now);
        vipTicket.setUpdatedAt(now);

        // Regular Ticket
        regularTicket = new TicketTypes();
        regularTicket.setEventId(testEventId1);
        regularTicket.setTypeName("Regular");
        regularTicket.setDescription("Standard admission ticket");
        regularTicket.setPrice(new BigDecimal("3000.00"));
        regularTicket.setQuantityAvailable(500);
        regularTicket.setQuantitySold(150);
        regularTicket.setSaleStartDatetime(saleStart);
        regularTicket.setSaleEndDatetime(saleEnd);
        regularTicket.setIsActive(true);
        regularTicket.setMinPerOrder(1);
        regularTicket.setMaxPerOrder(10);
        regularTicket.setCreatedAt(now);
        regularTicket.setUpdatedAt(now);

        // Student Ticket
        studentTicket = new TicketTypes();
        studentTicket.setEventId(testEventId1);
        studentTicket.setTypeName("Student");
        studentTicket.setDescription("Discounted ticket for students");
        studentTicket.setPrice(new BigDecimal("1500.00"));
        studentTicket.setQuantityAvailable(200);
        studentTicket.setQuantitySold(80);
        studentTicket.setSaleStartDatetime(saleStart);
        studentTicket.setSaleEndDatetime(saleEnd);
        studentTicket.setIsActive(true);
        studentTicket.setMinPerOrder(1);
        studentTicket.setMaxPerOrder(2);
        studentTicket.setCreatedAt(now);
        studentTicket.setUpdatedAt(now);

        // Ticket for Event 2
        eventTwoTicket = new TicketTypes();
        eventTwoTicket.setEventId(testEventId2);
        eventTwoTicket.setTypeName("General Admission");
        eventTwoTicket.setDescription("General admission for event 2");
        eventTwoTicket.setPrice(new BigDecimal("2000.00"));
        eventTwoTicket.setQuantityAvailable(300);
        eventTwoTicket.setQuantitySold(50);
        eventTwoTicket.setSaleStartDatetime(saleStart);
        eventTwoTicket.setSaleEndDatetime(saleEnd);
        eventTwoTicket.setIsActive(true);
        eventTwoTicket.setMinPerOrder(1);
        eventTwoTicket.setMaxPerOrder(5);
        eventTwoTicket.setCreatedAt(now);
        eventTwoTicket.setUpdatedAt(now);
    }

    @Test
    @Order(1)
    @DisplayName("✅ ดึง ticket types ทั้งหมดของอีเวนต์ เรียงตาม ticket_type_id")
    void testFindByEventId_Success() {
        // Given
        ticketTypesRepository.save(vipTicket);
        ticketTypesRepository.save(regularTicket);
        ticketTypesRepository.save(studentTicket);
        ticketTypesRepository.save(eventTwoTicket); // Different event

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId1);

        // Then
        assertThat(tickets).hasSize(3);
        assertThat(tickets)
                .extracting(TicketTypes::getTypeName)
                .containsExactly("VIP", "Regular", "Student");

        // Verify sorted by ticket_type_id ascending
        for (int i = 0; i < tickets.size() - 1; i++) {
            assertThat(tickets.get(i).getTicketTypeId())
                    .isLessThan(tickets.get(i + 1).getTicketTypeId());
        }
    }

    @Test
    @Order(2)
    @DisplayName("✅ ดึง ticket types จากอีเวนต์ที่ไม่มี tickets")
    void testFindByEventId_EmptyResult() {
        // Given
        Long nonExistentEventId = 999L;

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(nonExistentEventId);

        // Then
        assertThat(tickets).isEmpty();
    }

    @Test
    @Order(3)
    @DisplayName("✅ ดึง ticket types ที่มีเพียง 1 รายการ")
    void testFindByEventId_SingleTicket() {
        // Given
        ticketTypesRepository.save(eventTwoTicket);

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId2);

        // Then
        assertThat(tickets).hasSize(1);
        assertThat(tickets.get(0).getTypeName()).isEqualTo("General Admission");
        assertThat(tickets.get(0).getEventId()).isEqualTo(testEventId2);
    }

    @Test
    @Order(4)
    @DisplayName("✅ ตรวจสอบ ticket types มี field ครบถ้วน")
    void testFindByEventId_VerifyAllFields() {
        // Given
        TicketTypes savedTicket = ticketTypesRepository.save(vipTicket);

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId1);

        // Then
        assertThat(tickets).hasSize(1);
        TicketTypes retrievedTicket = tickets.get(0);

        assertThat(retrievedTicket.getTicketTypeId()).isEqualTo(savedTicket.getTicketTypeId());
        assertThat(retrievedTicket.getEventId()).isEqualTo(testEventId1);
        assertThat(retrievedTicket.getTypeName()).isEqualTo("VIP");
        assertThat(retrievedTicket.getDescription()).isEqualTo("VIP ticket with premium benefits");
        assertThat(retrievedTicket.getPrice()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(retrievedTicket.getQuantityAvailable()).isEqualTo(100);
        assertThat(retrievedTicket.getQuantitySold()).isEqualTo(25);
        assertThat(retrievedTicket.getSaleStartDatetime()).isNotNull();
        assertThat(retrievedTicket.getSaleEndDatetime()).isNotNull();
        assertThat(retrievedTicket.getIsActive()).isTrue();
        assertThat(retrievedTicket.getMinPerOrder()).isEqualTo(1);
        assertThat(retrievedTicket.getMaxPerOrder()).isEqualTo(4);
        assertThat(retrievedTicket.getCreatedAt()).isNotNull();
        assertThat(retrievedTicket.getUpdatedAt()).isNotNull();
    }

    @Test
    @Order(5)
    @DisplayName("✅ ลบ ticket types ทั้งหมดของอีเวนต์")
    void testDeleteByEventId_Success() {
        // Given
        ticketTypesRepository.save(vipTicket);
        ticketTypesRepository.save(regularTicket);
        ticketTypesRepository.save(studentTicket);
        ticketTypesRepository.save(eventTwoTicket); // Different event

        assertThat(ticketTypesRepository.findAll()).hasSize(4);

        // When
        ticketTypesRepository.deleteByEventId(testEventId1);
        ticketTypesRepository.flush();

        // Then
        List<TicketTypes> remainingTickets = ticketTypesRepository.findAll();
        assertThat(remainingTickets).hasSize(1);
        assertThat(remainingTickets.get(0).getEventId()).isEqualTo(testEventId2);

        // Verify event1 tickets are deleted
        List<TicketTypes> event1Tickets = ticketTypesRepository.findByEventId(testEventId1);
        assertThat(event1Tickets).isEmpty();
    }

    @Test
    @Order(6)
    @DisplayName("✅ ลบ ticket types จากอีเวนต์ที่ไม่มี tickets")
    void testDeleteByEventId_NoTickets() {
        // Given
        Long nonExistentEventId = 999L;

        // When & Then (should not throw exception)
        assertThatCode(() -> {
            ticketTypesRepository.deleteByEventId(nonExistentEventId);
            ticketTypesRepository.flush();
        }).doesNotThrowAnyException();
    }

    @Test
    @Order(7)
    @DisplayName("✅ ลบและสร้าง ticket types ใหม่ (regenerate scenario)")
    void testDeleteAndRecreate_RegenerateScenario() {
        // Given - สร้าง tickets เดิม
        ticketTypesRepository.save(vipTicket);
        ticketTypesRepository.save(regularTicket);

        assertThat(ticketTypesRepository.findByEventId(testEventId1)).hasSize(2);

        // When - ลบ tickets เดิมทั้งหมด
        ticketTypesRepository.deleteByEventId(testEventId1);
        ticketTypesRepository.flush();

        // Then - ตรวจสอบว่าลบหมดแล้ว
        assertThat(ticketTypesRepository.findByEventId(testEventId1)).isEmpty();

        // When - สร้าง tickets ใหม่
        TicketTypes newVipTicket = new TicketTypes();
        newVipTicket.setEventId(testEventId1);
        newVipTicket.setTypeName("VIP Premium");
        newVipTicket.setDescription("Updated VIP ticket");
        newVipTicket.setPrice(new BigDecimal("6000.00"));
        newVipTicket.setQuantityAvailable(50);
        newVipTicket.setQuantitySold(0);
        newVipTicket.setIsActive(true);
        newVipTicket.setMinPerOrder(1);
        newVipTicket.setMaxPerOrder(2);
        newVipTicket.setCreatedAt(Instant.now());
        newVipTicket.setUpdatedAt(Instant.now());

        ticketTypesRepository.save(newVipTicket);

        // Then - ตรวจสอบ tickets ใหม่
        List<TicketTypes> newTickets = ticketTypesRepository.findByEventId(testEventId1);
        assertThat(newTickets).hasSize(1);
        assertThat(newTickets.get(0).getTypeName()).isEqualTo("VIP Premium");
        assertThat(newTickets.get(0).getPrice()).isEqualByComparingTo(new BigDecimal("6000.00"));
    }

    @Test
    @Order(8)
    @DisplayName("✅ ทดสอบ ticket types ที่มี isActive = false")
    void testFindByEventId_InactiveTickets() {
        // Given
        vipTicket.setIsActive(false);
        ticketTypesRepository.save(vipTicket);
        ticketTypesRepository.save(regularTicket);

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId1);

        // Then
        assertThat(tickets).hasSize(2);
        assertThat(tickets)
                .filteredOn(t -> !t.getIsActive())
                .hasSize(1)
                .first()
                .extracting(TicketTypes::getTypeName)
                .isEqualTo("VIP");
    }

    @Test
    @Order(9)
    @DisplayName("✅ ทดสอบ ticket types ที่ sold out")
    void testFindByEventId_SoldOutTickets() {
        // Given
        vipTicket.setQuantityAvailable(100);
        vipTicket.setQuantitySold(100); // Sold out
        ticketTypesRepository.save(vipTicket);
        ticketTypesRepository.save(regularTicket);

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId1);

        // Then
        assertThat(tickets).hasSize(2);
        TicketTypes soldOutTicket = tickets.stream()
                .filter(t -> t.getTypeName().equals("VIP"))
                .findFirst()
                .orElseThrow();

        assertThat(soldOutTicket.getQuantitySold())
                .isEqualTo(soldOutTicket.getQuantityAvailable());
    }

    @Test
    @Order(10)
    @DisplayName("✅ ทดสอบ ticket types ที่มี null values ในบาง fields")
    void testFindByEventId_WithNullValues() {
        // Given
        TicketTypes ticketWithNulls = new TicketTypes();
        ticketWithNulls.setEventId(testEventId1);
        ticketWithNulls.setTypeName("Basic");
        ticketWithNulls.setDescription(null); // NULL
        ticketWithNulls.setPrice(new BigDecimal("1000.00"));
        ticketWithNulls.setQuantityAvailable(null); // NULL
        ticketWithNulls.setQuantitySold(null); // NULL
        ticketWithNulls.setSaleStartDatetime(null); // NULL
        ticketWithNulls.setSaleEndDatetime(null); // NULL
        ticketWithNulls.setIsActive(true);
        ticketWithNulls.setMinPerOrder(null); // NULL
        ticketWithNulls.setMaxPerOrder(null); // NULL
        ticketWithNulls.setCreatedAt(Instant.now());
        ticketWithNulls.setUpdatedAt(Instant.now());

        ticketTypesRepository.save(ticketWithNulls);

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId1);

        // Then
        assertThat(tickets).hasSize(1);
        TicketTypes retrieved = tickets.get(0);
        assertThat(retrieved.getTypeName()).isEqualTo("Basic");
        assertThat(retrieved.getDescription()).isNull();
        assertThat(retrieved.getQuantityAvailable()).isNull();
        assertThat(retrieved.getQuantitySold()).isNull();
        assertThat(retrieved.getSaleStartDatetime()).isNull();
        assertThat(retrieved.getSaleEndDatetime()).isNull();
        assertThat(retrieved.getMinPerOrder()).isNull();
        assertThat(retrieved.getMaxPerOrder()).isNull();
    }

    @Test
    @Order(11)
    @DisplayName("✅ ทดสอบ sorting หลายรายการ ticket types")
    void testFindByEventId_MultipleSorting() {
        // Given - สร้างหลาย tickets
        for (int i = 1; i <= 5; i++) {
            TicketTypes ticket = new TicketTypes();
            ticket.setEventId(testEventId1);
            ticket.setTypeName("Ticket " + i);
            ticket.setPrice(new BigDecimal(i * 1000));
            ticket.setQuantityAvailable(100);
            ticket.setQuantitySold(0);
            ticket.setIsActive(true);
            ticket.setMinPerOrder(1);
            ticket.setMaxPerOrder(10);
            ticket.setCreatedAt(Instant.now());
            ticket.setUpdatedAt(Instant.now());
            ticketTypesRepository.save(ticket);
        }

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId1);

        // Then
        assertThat(tickets).hasSize(5);

        // Verify sorted by ticket_type_id
        for (int i = 0; i < tickets.size() - 1; i++) {
            assertThat(tickets.get(i).getTicketTypeId())
                    .isLessThan(tickets.get(i + 1).getTicketTypeId());
        }

        assertThat(tickets)
                .extracting(TicketTypes::getTypeName)
                .containsExactly("Ticket 1", "Ticket 2", "Ticket 3", "Ticket 4", "Ticket 5");
    }

    @Test
    @Order(12)
    @DisplayName("✅ ทดสอบ decimal precision สำหรับ price")
    void testFindByEventId_DecimalPrecision() {
        // Given
        vipTicket.setPrice(new BigDecimal("1234.56"));
        ticketTypesRepository.save(vipTicket);

        // When
        List<TicketTypes> tickets = ticketTypesRepository.findByEventId(testEventId1);

        // Then
        assertThat(tickets).hasSize(1);
        assertThat(tickets.get(0).getPrice())
                .isEqualByComparingTo(new BigDecimal("1234.56"));
    }
}