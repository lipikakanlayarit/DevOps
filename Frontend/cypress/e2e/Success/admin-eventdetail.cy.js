/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";
const EVENT_ID = "123";

/* ==============================
   Mock Data
   ============================== */

const mockEvent = {
    id: Number(EVENT_ID),
    organizerId: 10,
    organizerName: "Cool Organizer Co., Ltd.",
    eventName: "Rock the Night",
    description: "Best concert ever.",
    categoryId: 1, // → Concert
    startDateTime: "2025-01-10T18:00:00Z",
    endDateTime: "2025-01-10T21:00:00Z",
    salesStartDateTime: "2024-12-01T10:00:00Z",
    salesEndDateTime: "2025-01-09T23:59:59Z",
    venueName: "Impact Arena",
    venueAddress: "Bangkok, Thailand",
    maxCapacity: 100,
    status: "APPROVED",
    updatedAt: "2025-01-01T00:00:00Z",
};

const mockTicketZones10 = Array.from({ length: 10 }, (_, i) => ({
    zone: `ZONE-${i + 1}`,
    row: i + 1,
    column: 10 + i,
    sale: `${i}/${100 + i}`,
    price: 1500 + i * 100,
}));

const mockSeatStats = {
    total: 100,
    sold: 20,
    reserved: 10,
    available: 70,
};

const mockReservations = [
    {
        id: 1,
        reserved_code: "RES-001",
        seat_label: "A 1",
        zone_label: "A",
        row_label: "1",
        seat_number: 1,
        total: 1500,
        user: "user123",
        status: "PAID", // → COMPLETE → SOLD
        date: "2025-01-01T00:00:00Z",
        payment_method: "CREDIT_CARD",
    },
    {
        id: 2,
        reserved_code: "RES-002",
        seat_label: "A 2",
        zone_label: "A",
        row_label: "1",
        seat_number: 2,
        total: 1500,
        user: "user456",
        status: "UNPAID", // → UNPAID → RESERVED
        date: "2025-01-02T00:00:00Z",
        payment_method: "QR",
    },
    {
        id: 3,
        reserved_code: "RES-003",
        seat_label: "B 1",
        zone_label: "B",
        row_label: "1",
        seat_number: 1,
        total: 2000,
        user: "another-user",
        status: "PENDING", // อะไรก็ได้ที่ไม่ใช่ PAID → UNPAID → RESERVED
        date: "2025-01-03T00:00:00Z",
        payment_method: "CASH",
    },
];

const mockOrganizer = {
    id: 10,
    companyName: "Cool Organizer Co., Ltd.",
    phoneNumber: "081-234-5678",
    address: "123 Main Road, Bangkok",
    email: "organizer@example.com",
};

/* ==============================
   Helpers
   ============================== */

/**
 * ตั้ง intercept สำหรับหน้า Event Detail (แต่ยังไม่ visit)
 */
function setupAdminEventDetailIntercepts({
                                             event = mockEvent,
                                             zones = mockTicketZones10,
                                             seatStats = mockSeatStats,
                                             reservations = mockReservations,
                                             organizer = mockOrganizer,
                                             delayEvent = 0,
                                             delayZones = 0,
                                             delaySeatStats = 0,
                                             delayReservations = 0,
                                         } = {}) {
    // mock auth เป็น admin (แทนการ login จริง)
    cy.intercept("GET", "**/api/auth/me", {
        statusCode: 200,
        body: {
            id: 1,
            username: "admin",
            email: "admin@example.com",
            role: "ADMIN",
            firstName: "Admin",
            lastName: "User",
        },
    }).as("getMe");

    // Event detail
    cy.intercept("GET", `**/api/admin/events/${EVENT_ID}`, {
        delay: delayEvent,
        statusCode: 200,
        body: event,
    }).as("getEvent");

    // Ticket zones
    cy.intercept("GET", `**/api/admin/events/${EVENT_ID}/zones`, {
        delay: delayZones,
        statusCode: 200,
        body: zones,
    }).as("getZones");

    // Seat stats
    cy.intercept("GET", `**/api/admin/events/${EVENT_ID}/seat-stats`, {
        delay: delaySeatStats,
        statusCode: 200,
        body: seatStats,
    }).as("getSeatStats");

    // Reservations
    cy.intercept("GET", `**/api/admin/events/${EVENT_ID}/reservations`, {
        delay: delayReservations,
        statusCode: 200,
        body: reservations,
    }).as("getReservations");

    // Organizer detail
    cy.intercept("GET", `**/api/admin/organizers/${organizer.id}`, {
        statusCode: 200,
        body: organizer,
    }).as("getOrganizer");

    // กัน error รูป cover
    cy.intercept("GET", `**/admin/events/${EVENT_ID}/cover*`, {
        statusCode: 200,
        body: "",
    }).as("getCover");
}

/**
 * login แบบ mock (set token + /auth/me) แล้วเข้า /admin/eventdetail?id=123
 */
function visitAdminEventDetailPage(options = {}) {
    setupAdminEventDetailIntercepts(options);

    cy.visit(`${FRONTEND_URL}/admin/eventdetail?id=${EVENT_ID}`, {
        onBeforeLoad(win) {
            // จำลองว่า login แล้ว ได้ token มาแล้ว
            win.localStorage.setItem("token", "fake-admin-token");
        },
    });

    cy.wait("@getMe");
    cy.wait("@getEvent");
    cy.wait("@getZones");
    cy.wait("@getSeatStats");
    cy.wait("@getReservations");
}

/* ==============================
   Test Suite
   ============================== */

describe("Admin Event Detail Page", () => {
    // 1) หน้าจอแสดงครบ - Sidebar, Breadcrumb, Event Info, Ticket Zones, Seat Stats, Reservations
    it("shows sidebar, breadcrumb and main sections", () => {
        visitAdminEventDetailPage();

        // breadcrumb
        cy.contains("Event Management").should("be.visible");
        cy.contains(`(ID: ${EVENT_ID})`).should("be.visible");

        // main heading
        cy.contains("Ticket Zones").should("be.visible");
        cy.contains("Reservations").should("be.visible");

        // seat stats labels
        cy.contains("Available Seat:").should("be.visible");
        cy.contains("Reserved Seat:").should("be.visible");
        cy.contains("Sold Seat:").should("be.visible");
    });

    // 2) Loading state - แสดง skeleton ขณะโหลดข้อมูล
    it("shows loading skeleton while fetching event detail", () => {
        setupAdminEventDetailIntercepts({ delayEvent: 500 });

        cy.visit(`${FRONTEND_URL}/admin/eventdetail?id=${EVENT_ID}`, {
            onBeforeLoad(win) {
                win.localStorage.setItem("token", "fake-admin-token");
            },
        });

        cy.wait("@getMe");

        // ระหว่าง event ยังโหลดอยู่ ควรเห็น skeleton
        cy.get(".animate-pulse").should("be.visible");

        cy.wait("@getEvent");

        // หลังโหลดเสร็จ skeleton หาย และแสดงชื่อ event
        cy.get(".animate-pulse").should("not.exist");
        cy.contains(mockEvent.eventName).should("be.visible");
    });

    // 3) Fetch event detail - แสดงข้อมูล event (poster, name, category, etc.)
    it("displays event detail from /admin/events/:id", () => {
        visitAdminEventDetailPage();

        // event title
        cy.contains(mockEvent.eventName).should("be.visible");

        // category label (categoryId=1 → Concert)
        cy.contains("Category:")
            .next()
            .should("contain.text", "Concert");

        // organizer name
        cy.contains("Organizer:")
            .next()
            .should("contain.text", mockEvent.organizerName);

        // location
        cy.contains("Location:")
            .next()
            .should("contain.text", mockEvent.venueName);

        // capacity
        cy.contains("Capacity:")
            .next()
            .should("contain.text", "100");

        // poster img (AuthImage → alt = event.title)
        cy.get(`img[alt="${mockEvent.eventName}"]`).should("exist");
    });

    // 4) Fetch ticket zones - แสดงตารางโซนตั๋ว 5 คอลัมน์
    it("renders ticket zones table with correct columns and rows", () => {
        visitAdminEventDetailPage();

        cy.contains("Ticket Zones").should("be.visible");

        // header
        cy.contains("th", "Ticket Zone").should("be.visible");
        cy.contains("th", "Row").should("be.visible");
        cy.contains("th", "Column").should("be.visible");
        cy.contains("th", "Sale").should("be.visible");
        cy.contains("th", "Price/ticket").should("be.visible");

        // rows page 1 (page size = 5)
        cy.get("table").first().find("tbody tr").should("have.length", 5);
    });

    // 5) Fetch seat stats - แสดง badge Available/Reserved/Sold
    it("shows seat stats badges with numbers from /seat-stats", () => {
        visitAdminEventDetailPage();

        cy.contains(`Available Seat: ${mockSeatStats.available}`).should("be.visible");
        cy.contains(`Reserved Seat: ${mockSeatStats.reserved}`).should("be.visible");
        cy.contains(`Sold Seat: ${mockSeatStats.sold}`).should("be.visible");
    });

    // 6) Fetch reservations - แสดงตารางการจอง
    it("shows reservations table from /reservations", () => {
        visitAdminEventDetailPage();

        cy.contains("th", "RESERVED").should("be.visible");
        cy.contains("th", "DATE").should("be.visible");
        cy.contains("th", "SEAT ID").should("be.visible");
        cy.contains("th", "TOTAL").should("be.visible");
        cy.contains("th", "USER").should("be.visible");
        cy.contains("th", "PAYMENT METHOD").should("be.visible");
        cy.contains("th", "STATUS").should("be.visible");

        cy.get("table").last().find("tbody tr").should("have.length", mockReservations.length);
    });



    // 10) Reservations filter - All - แสดงทุก reservations
    it("filters reservations - All shows all items", () => {
        visitAdminEventDetailPage();

        cy.contains("button", "All").click();

        cy.get("table").last().find("tbody tr").should("have.length", mockReservations.length);
    });

    // 11) Reservations filter - Reserved - เฉพาะ RESERVED
    it("filters reservations - Reserved shows only non-sold", () => {
        visitAdminEventDetailPage();

        cy.contains("button", "Reserved").click();

        cy.get("table").last().find("tbody tr").should("have.length", 2);

        cy.get("table").last().contains("SOLD").should("not.exist");
        cy.get("table").last().contains("RESERVED").should("exist");
    });

    // 13) Reservations search - พิมพ์ "user123"
    it("searches reservations by keyword", () => {
        visitAdminEventDetailPage();

        cy.get('input[placeholder="Search reservations..."]').type("user123");

        cy.get("table")
            .last()
            .find("tbody tr")
            .should("have.length", 1)
            .first()
            .within(() => {
                cy.contains("user123").should("be.visible");
            });
    });



    // 15) Organizer Detail Modal - เปิด/ปิดด้วย Close / ESC
    it("opens and closes Organizer Detail modal", () => {
        visitAdminEventDetailPage();

        // open
        cy.contains("button", "Organizer detail").click();
        cy.contains("Organizer Details").should("be.visible");
        cy.contains(mockOrganizer.companyName).should("be.visible");

        // close ด้วยปุ่ม Close
        cy.contains("button", "Close").click();
        cy.contains("Organizer Details").should("not.exist");

        // เปิดใหม่ แล้วปิดด้วย ESC
        cy.contains("button", "Organizer detail").click();
        cy.get("body").type("{esc}");
        cy.contains("Organizer Details").should("not.exist");
    });
});
