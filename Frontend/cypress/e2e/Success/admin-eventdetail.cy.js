// cypress/e2e/admin-eventdetail.cy.js
/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";

// ใช้ event_id จากฐานจริง (BUTCON Music Fest 2025)
const EVENT_ID = "1";

/* ==============================
   Seed-like Data (อิงจาก R__butcon_seed_data.sql)
   ============================== */

// Event: BUTCON Music Fest 2025 (จาก seed)
const seedEvent = {
    id: Number(EVENT_ID),
    organizerId: 1, // จาก SELECT organizer_id WHERE event_name='BUTCON Music Fest 2025'
    organizerName: "EventPro Ltd.",
    eventName: "BUTCON Music Fest 2025",
    description: "Annual outdoor music festival",
    categoryId: 1, // 1 → Concert (ตาม categoryLabel ในหน้า React)
    startDateTime: "2025-11-20T11:00:00Z", // ≈ 18:00 +07
    endDateTime: "2025-11-20T16:59:59Z",   // ≈ 23:59:59 +07
    salesStartDateTime: "2025-11-19T00:00:00Z", // ตัวเลขสมมติให้เทสต์ ไม่ได้ assert เวลาเป๊ะ
    salesEndDateTime: "2025-12-19T00:00:00Z",
    venueName: "Central Park",
    venueAddress: "Bangkok, Thailand",
    maxCapacity: 5000,
    status: "APPROVED",
    updatedAt: "2025-11-01T00:00:00Z",
};

// Ticket Zones (อิงโครงจาก seat_zones: Zone A/B/C)
const seedTicketZones = [
    // zone, row count, column count, sale = sold/total, price (VIP/REGULAR/STANDING)
    { zone: "Zone A", row: 5, column: 10, sale: "2/50", price: 2500 }, // VIP
    { zone: "Zone B", row: 5, column: 10, sale: "0/50", price: 1500 }, // REGULAR
    { zone: "Zone C", row: 0, column: 0, sale: "0/0",  price: 800 },   // STANDING (ไม่มีที่นั่ง)
    // เพิ่ม rows เพิ่มเติมให้มี pagination page 1 = 5 แถว
    { zone: "Zone A-Extra-1", row: 5, column: 10, sale: "0/50", price: 2500 },
    { zone: "Zone B-Extra-1", row: 5, column: 10, sale: "0/50", price: 1500 },
    { zone: "Zone A-Extra-2", row: 5, column: 10, sale: "0/50", price: 2500 },
    { zone: "Zone B-Extra-2", row: 5, column: 10, sale: "0/50", price: 1500 },
    { zone: "Zone A-Extra-3", row: 5, column: 10, sale: "0/50", price: 2500 },
    { zone: "Zone B-Extra-3", row: 5, column: 10, sale: "0/50", price: 1500 },
    { zone: "Zone B-Extra-4", row: 5, column: 10, sale: "0/50", price: 1500 },
];

// Seat stats (ตาม geometry จาก seed: Zone A+B 5x10 = 100 ที่นั่ง)
const seedSeatStats = {
    total: 100,
    sold: 1,       // แถวที่เป็น PAID
    reserved: 2,   // แถวที่เป็น UNPAID/PENDING
    available: 97, // 100 - 3
};

// Reservations (ใช้โครงเดียวกับ backend ที่หน้า React map อยู่)
const seedReservations = [
    {
        id: 1,
        reserved_code: "RSV-2025-0001",
        seat_label: "A2",
        zone_label: "Zone A",
        row_label: "A",
        seat_number: 2,
        total: 2500,
        user: "alice123",
        status: "PAID", // → COMPLETE → SOLD
        date: "2025-11-18T00:00:00Z",
        payment_method: "Bank Transfer",
    },
    {
        id: 2,
        reserved_code: "RSV-2025-0002",
        seat_label: "A3",
        zone_label: "Zone A",
        row_label: "A",
        seat_number: 3,
        total: 2500,
        user: "user_unpaid",
        status: "UNPAID", // → UNPAID → RESERVED
        date: "2025-11-19T00:00:00Z",
        payment_method: "Credit Card",
    },
    {
        id: 3,
        reserved_code: "RSV-2025-0003",
        seat_label: "B1",
        zone_label: "Zone B",
        row_label: "B",
        seat_number: 1,
        total: 1500,
        user: "user_pending",
        status: "PENDING", // → UNPAID → RESERVED
        date: "2025-11-19T12:00:00Z",
        payment_method: "Cash",
    },
];

// Organizer จากตาราง organizers (org1@butcon.com → EventPro Ltd.) :contentReference[oaicite:3]{index=3}
const seedOrganizer = {
    id: 1,
    companyName: "EventPro Ltd.",
    phoneNumber: "0834567890",
    address: "Bangkok, TH",
    email: "org1@butcon.com",
};

/* ==============================
   Helpers
   ============================== */

function setupAdminEventDetailIntercepts({
                                             event = seedEvent,
                                             zones = seedTicketZones,
                                             seatStats = seedSeatStats,
                                             reservations = seedReservations,
                                             organizer = seedOrganizer,
                                             delayEvent = 0,
                                             delayZones = 0,
                                             delaySeatStats = 0,
                                             delayReservations = 0,
                                         } = {}) {
    // mock auth เป็น admin
    cy.intercept("GET", "**/api/auth/me", {
        statusCode: 200,
        body: {
            id: 999,
            username: "admin",
            email: "admin@butcon.com",
            role: "ADMIN",
            firstName: "Admin",
            lastName: "User",
        },
    }).as("getMe");

    // Event detail (ตามหน้า admin-eventdetail.tsx) :contentReference[oaicite:4]{index=4}
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

    // กัน error รูป cover (AuthImage เรียก /admin/events/:id/cover?v=...)
    cy.intercept("GET", `**/admin/events/${EVENT_ID}/cover*`, {
        statusCode: 200,
        body: "",
    }).as("getCover");
}

/**
 * login แบบ mock (set token + /auth/me) แล้วเข้า /admin/eventdetail?id=1
 */
function visitAdminEventDetailPage(options = {}) {
    setupAdminEventDetailIntercepts(options);

    cy.visit(`${FRONTEND_URL}/admin/eventdetail?id=${EVENT_ID}`, {
        onBeforeLoad(win) {
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

describe("Admin Event Detail Page - BUTCON Music Fest (seed-based)", () => {
    // 1) โครงหน้าจอหลัก: breadcrumb + section ต่าง ๆ
    it("shows breadcrumb, sections and seat stats labels", () => {
        visitAdminEventDetailPage();

        // breadcrumb
        cy.contains("Event Management").should("be.visible");
        cy.contains("(ID: 1)").should("be.visible");

        // main headings
        cy.contains("Ticket Zones").should("be.visible");
        cy.contains("Reservations").should("be.visible");

        // seat stats labels
        cy.contains("Available Seat:").should("be.visible");
        cy.contains("Reserved Seat:").should("be.visible");
        cy.contains("Sold Seat:").should("be.visible");
    });

    // 2) Loading skeleton ตอนโหลด event
    it("shows loading skeleton while fetching event detail", () => {
        setupAdminEventDetailIntercepts({ delayEvent: 500 });

        cy.visit(`${FRONTEND_URL}/admin/eventdetail?id=${EVENT_ID}`, {
            onBeforeLoad(win) {
                win.localStorage.setItem("token", "fake-admin-token");
            },
        });

        cy.wait("@getMe");

        // หน้า React ใช้ .animate-pulse เป็น skeleton :contentReference[oaicite:5]{index=5}
        cy.get(".animate-pulse").should("be.visible");

        cy.wait("@getEvent");

        cy.get(".animate-pulse").should("not.exist");
        cy.contains(seedEvent.eventName).should("be.visible");
    });

    // 3) แสดงข้อมูล Event จาก /admin/events/:id
    it("displays event detail from /admin/events/:id", () => {
        visitAdminEventDetailPage();

        // title
        cy.contains(seedEvent.eventName).should("be.visible");

        // category = Concert
        cy.contains("Category:")
            .next()
            .should("contain.text", "Concert");

        // organizer
        cy.contains("Organizer:")
            .next()
            .should("contain.text", seedEvent.organizerName);

        // location
        cy.contains("Location:")
            .next()
            .should("contain.text", seedEvent.venueName);

        // capacity (5000)
        cy.contains("Capacity:")
            .next()
            .should("contain.text", "5,000");

        // poster (AuthImage alt = event.title)
        cy.get(`img[alt="${seedEvent.eventName}"]`).should("exist");
    });

    // 4) ตาราง Ticket Zones + header + rows หน้าแรก 5 แถว (page size = 5)
    it("renders ticket zones table with correct headers and first-page rows", () => {
        visitAdminEventDetailPage();

        cy.contains("Ticket Zones").should("be.visible");

        // headers
        cy.contains("th", "Ticket Zone").should("be.visible");
        cy.contains("th", "Row").should("be.visible");
        cy.contains("th", "Column").should("be.visible");
        cy.contains("th", "Sale").should("be.visible");
        cy.contains("th", "Price/ticket").should("be.visible");

        // rows page 1
        cy.get("table").first().find("tbody tr").should("have.length", 5);
    });

    // 5) Seat stats จาก /seat-stats
    it("shows seat stats badges using /seat-stats data", () => {
        visitAdminEventDetailPage();

        cy.contains(`Available Seat: ${seedSeatStats.available}`).should("be.visible");
        cy.contains(`Reserved Seat: ${seedSeatStats.reserved}`).should("be.visible");
        cy.contains(`Sold Seat: ${seedSeatStats.sold}`).should("be.visible");
    });

    // 6) Reservations table แสดงครบ column และแถวตาม seedReservations
    it("shows reservations table from /reservations", () => {
        visitAdminEventDetailPage();

        cy.contains("th", "RESERVED").should("be.visible");
        cy.contains("th", "DATE").should("be.visible");
        cy.contains("th", "SEAT ID").should("be.visible");
        cy.contains("th", "TOTAL").should("be.visible");
        cy.contains("th", "USER").should("be.visible");
        cy.contains("th", "PAYMENT METHOD").should("be.visible");
        cy.contains("th", "STATUS").should("be.visible");

        cy.get("table").last().find("tbody tr").should("have.length", seedReservations.length);
    });

    // 7) Filter = All (ค่า default) → แสดงทุก reservation
    it("filters reservations - All shows all items", () => {
        visitAdminEventDetailPage();

        cy.contains("button", "All").click();

        cy.get("table").last().find("tbody tr").should("have.length", seedReservations.length);
    });

    // 8) Filter = Reserved → เฉพาะ status ที่ไม่ใช่ PAID (UNPAID/PENDING)
    it("filters reservations - Reserved shows only non-PAID items", () => {
        visitAdminEventDetailPage();

        cy.contains("button", "Reserved").click();

        // จาก seedReservations มี 3 แถว: 1 PAID, 2 non-PAID
        cy.get("table").last().find("tbody tr").should("have.length", 2);

        cy.get("table").last().contains("SOLD").should("not.exist");
        cy.get("table").last().contains("RESERVED").should("exist");
    });

    // 10) Search reservations ด้วย keyword (alice123)
    it("searches reservations by keyword (alice123)", () => {
        visitAdminEventDetailPage();

        cy.get('input[placeholder="Search reservations..."]').type("alice123");

        cy.get("table")
            .last()
            .find("tbody tr")
            .should("have.length", 1)
            .first()
            .within(() => {
                cy.contains("alice123").should("be.visible");
            });
    });

    // 11) Organizer Detail Modal - เปิด/ปิด ด้วยปุ่ม Close + ESC
    it("opens and closes Organizer Detail modal", () => {
        visitAdminEventDetailPage();

        // เปิด
        cy.contains("button", "Organizer detail").click();
        cy.contains("Organizer Details").should("be.visible");
        cy.contains(seedOrganizer.companyName).should("be.visible");

        // ปิดด้วยปุ่ม Close
        cy.contains("button", "Close").click();
        cy.contains("Organizer Details").should("not.exist");

        // เปิดใหม่ แล้วปิดด้วย ESC
        cy.contains("button", "Organizer detail").click();
        cy.get("body").type("{esc}");
        cy.contains("Organizer Details").should("not.exist");
    });
});
