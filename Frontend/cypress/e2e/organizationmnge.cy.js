// cypress/e2e/organizationmnge.cy.js
/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";

/* ==============================
   Mock Data
   ============================== */

const mockEvents = [
    {
        id: 1,
        eventName: "Rock Concert",
        categoryId: 1, // → concert
        status: "APPROVED",
        startDateTime: "2025-04-01T10:00:00Z",
        updatedAt: "2025-04-02T09:00:00Z",
    },
    {
        id: 2,
        eventName: "Data Seminar",
        categoryId: 2, // → seminar
        status: "PENDING",
        startDateTime: "2025-03-01T09:00:00Z",
        updatedAt: "2025-03-02T09:00:00Z",
    },
    {
        id: 3,
        eventName: "Art Exhibition",
        categoryId: 3, // → exhibition
        status: "REJECTED",
        startDateTime: "2025-02-01T08:00:00Z",
        updatedAt: "2025-02-02T09:00:00Z",
    },
];

/* dataset สำหรับทดสอบ sort (oldest/newest) */
const mockEventsForSorting = [
    {
        id: 101,
        eventName: "Oldest Event",
        categoryId: 1,
        status: "APPROVED",
        startDateTime: "2025-01-01T00:00:00Z",
    },
    {
        id: 102,
        eventName: "Middle Event",
        categoryId: 1,
        status: "APPROVED",
        startDateTime: "2025-02-01T00:00:00Z",
    },
    {
        id: 103,
        eventName: "Newest Event",
        categoryId: 1,
        status: "APPROVED",
        startDateTime: "2025-03-01T00:00:00Z",
    },
];

/* ==============================
   Helpers
   ============================== */

function mockAuthOrganizer() {
    cy.intercept("GET", "**/api/auth/me", {
        statusCode: 200,
        body: {
            id: 10,
            username: "organizer",
            email: "organizer@example.com",
            role: "ORGANIZER",
            firstName: "Org",
            lastName: "User",
        },
    }).as("getMe");
}

function mockEventsApi(body = mockEvents, opts = {}) {
    const { delay = 0, statusCode = 200 } = opts;
    cy.intercept("GET", "**/api/events/mine", {
        statusCode,
        delay,
        body,
    }).as("getEventsMine");
}

/** เข้า /organizationmnge แบบปกติ (มี token + mocks) */
function visitOrganizationPage(options = {}) {
    const { events = mockEvents, delay = 0 } = options;

    mockAuthOrganizer();
    mockEventsApi(events, { delay });

    cy.visit(`${FRONTEND_URL}/organizationmnge`, {
        onBeforeLoad(win) {
            // จำลองว่า login แล้ว (api instance น่าจะอ่าน token จาก storage)
            win.localStorage.setItem("token", "fake-organizer-token");
        },
    });

    cy.wait("@getMe");
    cy.wait("@getEventsMine");
}

/* ==============================
   Test Suite (P0 + P1)
   ============================== */

describe("Organizer - All Event Page (Organizationmnge)", () => {
    /* ---------------------------------
       1. Initial Load & API (P0)
    --------------------------------- */

    describe("Initial Load & API Data", () => {

        it("shows error box when API /events/mine fails", () => {
            mockAuthOrganizer();
            cy.intercept("GET", "**/api/events/mine", {
                statusCode: 500,
                body: { message: "Server error" },
            }).as("getEventsMine");
            cy.visit(`${FRONTEND_URL}/organizationmnge`, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-organizer-token");
                },
            });

            cy.wait("@getMe");
            cy.wait("@getEventsMine");

            cy.contains("Server error").should("be.visible");
            cy.get(".bg-red-100.border-red-300").should("exist");
        });
    });

    /* ---------------------------------
       4. Category Filter (P1)
    --------------------------------- */

    describe("Category Filter", () => {
        beforeEach(() => {
            visitOrganizationPage();
        });

        it('defaults to "All" and shows all events', () => {
            cy.contains("All Event").should("be.visible");
            cy.contains("button", "All").should("exist");

            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                mockEvents.length
            );
        });

        it("filters Concert events only", () => {
            cy.contains("button", "Concert").click();

            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .should("have.length", 1)
                .first()
                .contains("Rock Concert");
        });

        it("filters Seminar events only", () => {
            cy.contains("button", "Seminar").click();

            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .should("have.length", 1)
                .first()
                .contains("Data Seminar");
        });

        it("filters Exhibition events only", () => {
            cy.contains("button", "Exhibition").click();

            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .should("have.length", 1)
                .first()
                .contains("Art Exhibition");
        });

        it("can switch back to All and show all events again", () => {
            cy.contains("button", "Concert").click();
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                1
            );

            cy.contains("button", "All").click();
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                mockEvents.length
            );
        });
    });

    /* ---------------------------------
       6. Search Bar (P1)
    --------------------------------- */

    describe("Search Bar", () => {
        beforeEach(() => {
            visitOrganizationPage();
        });

        it("filters events by title (case-insensitive)", () => {
            cy.get('input[placeholder="Search events..."]').type("rock");
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .should("have.length", 1)
                .first()
                .contains("Rock Concert");
        });

        it("shows all events again when search is cleared", () => {
            const input = cy.get('input[placeholder="Search events..."]');
            input.type("seminar");
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                1
            );

            input.clear();
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                mockEvents.length
            );
        });

        it("shows empty state when no results match search", () => {
            cy.get('input[placeholder="Search events..."]').type(
                "this-does-not-exist"
            );
            cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
        });
    });


    /* ---------------------------------
       8. Events List Display (P0)
    --------------------------------- */

    describe("Events List Display", () => {
        it("shows empty state when there is no event", () => {
            visitOrganizationPage({ events: [] });

            cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                0
            );
        });

        it('renders table headers "Events" and "Status / Action" and event rows', () => {
            visitOrganizationPage();

            cy.contains("div", "Events").should("be.visible");
            cy.contains("div", "Status / Action").should("be.visible");

            cy.get(".mt-6.rounded-xl.bg-white.shadow-sm.overflow-hidden").should(
                "exist"
            );
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                mockEvents.length
            );
        });
    });

    /* ---------------------------------
       9. Status Badge (P1)
    --------------------------------- */

    describe("Status Badge Rendering", () => {
        beforeEach(() => {
            visitOrganizationPage();
        });

        it("shows Approved badge with green styling", () => {
            cy.contains("Rock Concert")
                .parent()
                .parent()
                .within(() => {
                    cy.contains("Approved")
                        .should("have.class", "bg-emerald-100")
                        .and("have.class", "text-emerald-700")
                        .and("have.class", "ring-emerald-200");
                });
        });

        it("shows Pending badge with amber styling", () => {
            cy.contains("Data Seminar")
                .parent()
                .parent()
                .within(() => {
                    cy.contains("Pending")
                        .should("have.class", "bg-amber-100")
                        .and("have.class", "text-amber-800")
                        .and("have.class", "ring-amber-200");
                });
        });

        it("shows Rejected badge with rose styling", () => {
            cy.contains("Art Exhibition")
                .parent()
                .parent()
                .within(() => {
                    cy.contains("Rejected")
                        .should("have.class", "bg-rose-100")
                        .and("have.class", "text-rose-700")
                        .and("have.class", "ring-rose-200");
                });
        });
    });

    /* ---------------------------------
       10. View Link (P0)
    --------------------------------- */

    describe("View link navigation", () => {
        beforeEach(() => {
            visitOrganizationPage();
        });

        it('shows "View" link for each event and navigates to /eventdetail/:id', () => {
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .first()
                .within(() => {
                    cy.contains("View")
                        .should("have.attr", "href")
                        .and("contain", "/eventdetail/1");
                });

            // click and navigate
            cy.contains("View").first().click();
            cy.location("pathname").should("eq", "/eventdetail/1");
        });
    });

    /* ---------------------------------
       12. Combined Filters (P1)
    --------------------------------- */

    describe("Combined Filters (Category + Search + Order)", () => {
        beforeEach(() => {
            visitOrganizationPage({ events: mockEventsForSorting });
        });

        it("applies category + search together", () => {
            // ทั้ง 3 events เป็น categoryId=1 → concert
            cy.contains("button", "Concert").click();

            // search เฉพาะคำว่า "Newest"
            cy.get('input[placeholder="Search events..."]').type("Newest");

            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .should("have.length", 1)
                .first()
                .contains("Newest Event");
        });
    });

    /* ---------------------------------
       19. Integration Flow (P0)
    --------------------------------- */

    describe("Integration Flow (Happy Paths)", () => {
        it("loads events, filters, searches and navigates to event detail", () => {
            visitOrganizationPage();

            // เริ่มต้นเห็นทุก event
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8").should(
                "have.length",
                mockEvents.length
            );

            // เลือก category Concert
            cy.contains("button", "Concert").click();
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .should("have.length", 1)
                .first()
                .contains("Rock Concert");

            // พิมพ์ search ให้ตรง title
            cy.get('input[placeholder="Search events..."]').type("Rock");

            // ควรยังเหลือ 1 ผลลัพธ์
            cy.get(".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8")
                .should("have.length", 1)
                .first()
                .within(() => {
                    cy.contains("Rock Concert").should("be.visible");
                    cy.contains("View").click();
                });

            // ไปหน้า eventdetail/:id
            cy.location("pathname").should("eq", "/eventdetail/1");
        });
    });
});
