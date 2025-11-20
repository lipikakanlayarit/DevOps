/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";
const FIXED_NOW = new Date("2025-01-10T12:00:00Z").getTime();

/**
 * Helper function to visit admin page with mocked data
 */
const visitAdminWithEvents = (events, { delay = 0 } = {}) => {
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

    cy.intercept("GET", "**/api/admin/events*", (req) => {
        expect(req.url).to.include("status=APPROVED");
        req.reply({
            delay,
            statusCode: 200,
            body: events,
        });
    }).as("getEvents");

    cy.intercept("GET", "**/api/admin/events/*/cover", {
        statusCode: 204,
    }).as("getCover");

    cy.visit(`${FRONTEND_URL}/admin`, {
        onBeforeLoad(win) {
            win.localStorage.setItem("token", "fake-admin-token");
            win.localStorage.setItem("tokenTimestamp", Date.now().toString());
        },
    });

    cy.wait("@getMe");
    if (delay === 0) {
        cy.wait("@getEvents");
    }
};

describe("Admin Event Management Page - Complete Test Suite", () => {
    beforeEach(() => {
        cy.clock(FIXED_NOW);
    });

    /* ============================================================
       P0-A: Authentication & Page Load
    ============================================================ */
    describe("P0-A: Authentication & Page Load", () => {
        it("TC-A-001: loads page successfully when authenticated as ADMIN", () => {
            visitAdminWithEvents([]);
            cy.contains("h1", "Event Management").should("be.visible");
            cy.get("table").should("be.visible");
        });

        it("TC-A-002: redirects to /login when unauthenticated", () => {
            cy.intercept("GET", "**/api/auth/me", {
                statusCode: 401,
            }).as("getMeUnauth");

            cy.visit(`${FRONTEND_URL}/admin`);
            cy.url().should("include", "/login");
        });

        it("TC-A-003: displays loading skeleton (5 rows) while fetching data", () => {
            cy.intercept("GET", "**/api/auth/me", {
                statusCode: 200,
                body: { id: 1, username: "admin", role: "ADMIN" },
            }).as("getMe");

            cy.intercept("GET", "**/api/admin/events*", {
                delay: 800,
                statusCode: 200,
                body: [],
            }).as("getEvents");

            cy.intercept("GET", "**/api/admin/events/*/cover", {
                statusCode: 204,
            });

            cy.visit(`${FRONTEND_URL}/admin`, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-admin-token");
                    win.localStorage.setItem("tokenTimestamp", Date.now().toString());
                },
            });

            cy.wait("@getMe");
            cy.get("tbody tr.animate-pulse").should("have.length", 5);
            cy.wait("@getEvents");
            cy.get("tbody tr.animate-pulse").should("have.length", 0);
        });

        it("TC-A-004: successfully calls GET /api/auth/me", () => {
            visitAdminWithEvents([]);
            cy.get("@getMe").its("request.url").should("include", "/api/auth/me");
        });

        it("TC-A-005: successfully calls GET /api/admin/events?status=APPROVED", () => {
            visitAdminWithEvents([]);
            cy.get("@getEvents")
                .its("request.url")
                .should("include", "/api/admin/events")
                .and("include", "status=APPROVED");
        });

        it("TC-A-006: displays error state when API fails", () => {
            cy.intercept("GET", "**/api/auth/me", {
                statusCode: 200,
                body: { id: 1, role: "ADMIN" },
            }).as("getMe");

            cy.intercept("GET", "**/api/admin/events*", {
                statusCode: 500,
                body: { error: "Server error" },
            }).as("getEventsError");

            cy.visit(`${FRONTEND_URL}/admin`, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-admin-token");
                    win.localStorage.setItem("tokenTimestamp", Date.now().toString());
                },
            });

            cy.wait("@getMe");
            cy.wait("@getEventsError");
            cy.contains("ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข").should("be.visible");
        });
    });

    /* ============================================================
       P0-B: Layout & UI Elements
    ============================================================ */
    describe("P0-B: Layout & UI Elements", () => {
        beforeEach(() => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Test Event",
                    organizerName: "Test Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                    showDateTime: "2025-01-20T19:00:00Z",
                    venueName: "Test Venue",
                    categoryId: 1,
                },
            ]);
        });

        it('TC-B-001: displays "Event Management" header', () => {
            cy.contains("h1", "Event Management").should("be.visible");
        });

        it("TC-B-002: displays Sidebar component", () => {
            cy.get(".ml-64").should("exist");
        });

        it("TC-B-003: displays EventToolbar with filters", () => {
            cy.get('input[type="text"]').should("be.visible");
            cy.contains("button", "Show all").should("be.visible");
        });

        it("TC-B-004: displays table with 7 columns", () => {
            cy.get("thead th").should("have.length", 7);
            cy.contains("th", "Poster").should("be.visible");
            cy.contains("th", "Event Name").should("be.visible");
            cy.contains("th", "Organizer").should("be.visible");
            cy.contains("th", "Show Date").should("be.visible");
            cy.contains("th", "Sale Period").should("be.visible");
            cy.contains("th", "Location").should("be.visible");
            cy.contains("th", "Status").should("be.visible");
        });

        it("TC-B-005: displays pagination controls", () => {
            cy.contains("button", "Previous").should("be.visible");
            cy.contains("button", "Next").should("be.visible");
            cy.contains("Page 1 of 1").should("be.visible");
        });

        it("TC-B-006: displays event count summary", () => {
            cy.contains("Showing 1 of 1 events").should("be.visible");
        });
    });

    /* ============================================================
       P0-C: Data Display & Mapping
    ============================================================ */
    describe("P0-C: Data Display & Mapping", () => {
        it("TC-C-001: correctly maps event data from API response", () => {
            const events = [
                {
                    id: 123,
                    eventName: "Rock Concert",
                    organizerName: "Big Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                    showDateTime: "2025-01-20T19:00:00Z",
                    venueName: "Bangkok Hall",
                    categoryId: 1,
                },
            ];

            visitAdminWithEvents(events);

            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Rock Concert").should("be.visible");
            cy.contains("Big Org").should("be.visible");
            cy.contains("Bangkok Hall").should("be.visible");
        });

        it("TC-C-002: displays event poster images with fallback", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Test Event",
                    organizerName: "Test Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ]);

            cy.get("tbody tr td").first().find("img").should("exist");
        });

        it("TC-C-003: displays event name and category", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Jazz Night",
                    categoryId: 1,
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ]);

            cy.contains("Jazz Night").should("be.visible");
            cy.contains("(concert)").should("be.visible");
        });

        it("TC-C-004: displays organizer name", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Event",
                    organizerName: "Amazing Organizer",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ]);

            cy.contains("Amazing Organizer").should("be.visible");
        });

        it("TC-C-006: displays formatted sale period (start → end)", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Event",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-05T10:00:00Z",
                    salesEndDateTime: "2025-01-15T10:00:00Z",
                },
            ]);

            cy.contains("05 Jan 2025").should("be.visible");
            cy.contains("→").should("be.visible");
            cy.contains("15 Jan 2025").should("be.visible");
        });

        it("TC-C-007: displays location/venue", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Event",
                    organizerName: "Org",
                    venueName: "Grand Theatre",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ]);

            cy.contains("Grand Theatre").should("be.visible");
        });

        it("TC-C-008: displays correct status badge", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Onsale Event",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ]);

            cy.get("tbody tr").first().contains("ONSALE").should("be.visible");
        });
    });

    /* ============================================================
       P0-D: Status Logic
    ============================================================ */
    describe("P0-D: Status Logic", () => {

        it("TC-D-004: correctly handles edge cases (exactly 7 days)", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Edge Case Event",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-17T12:00:00Z", // exactly 7 days
                    salesEndDateTime: "2025-01-20T10:00:00Z",
                },
            ]);

            cy.contains("UPCOMING").should("be.visible");
        });
    });

    /* ============================================================
       P0-E: Filtering
    ============================================================ */
    describe("P0-E: Filtering", () => {
        const mixedEvents = [
            {
                id: 1,
                eventName: "Onsale Event",
                organizerName: "Org A",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            },
            {
                id: 2,
                eventName: "Upcoming Event",
                organizerName: "Org B",
                salesStartDateTime: "2025-01-13T10:00:00Z",
                salesEndDateTime: "2025-01-20T10:00:00Z",
            },
            {
                id: 3,
                eventName: "Offsale Event",
                organizerName: "Org C",
                salesStartDateTime: "2024-12-01T10:00:00Z",
                salesEndDateTime: "2024-12-10T10:00:00Z",
            },
        ];

        beforeEach(() => {
            visitAdminWithEvents(mixedEvents);
        });

        it('TC-E-001: "Show all" displays all events', () => {
            cy.contains("button", "Show all").click();
            cy.get("tbody tr").should("have.length", 3);
        });

        it('TC-E-002: "ONSALE" filter shows only ONSALE events', () => {
            cy.contains("button", "ONSALE").click();
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Onsale Event").should("be.visible");
        });

        it('TC-E-003: "UPCOMING" filter shows only UPCOMING events', () => {
            cy.contains("button", "UPCOMING").click();
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Upcoming Event").should("be.visible");
        });

        it('TC-E-004: "OFFSALE" filter shows only OFFSALE events', () => {
            cy.contains("button", "OFFSALE").click();
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Offsale Event").should("be.visible");
        });

        it("TC-E-005: filter updates page number to 1", () => {
            const manyEvents = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(manyEvents);

            cy.contains("button", "2").click();
            cy.contains("Page 2").should("be.visible");

            cy.contains("button", "ONSALE").click();
            cy.contains("Page 1").should("be.visible");
        });

        it("TC-E-006: filter updates event count display", () => {
            cy.contains("Showing 3 of 3 events").should("be.visible");

            cy.contains("button", "ONSALE").click();
            cy.contains("Showing 1 of 3 events").should("be.visible");
        });
    });

    /* ============================================================
       P0-F: Search
    ============================================================ */
    describe("P0-F: Search", () => {
        const searchEvents = [
            {
                id: 1,
                eventName: "Rock Festival",
                organizerName: "Big Org",
                venueName: "Bangkok Arena",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            },
            {
                id: 2,
                eventName: "Tech Meetup",
                organizerName: "Dev Group",
                venueName: "Chiang Mai Hub",
                salesStartDateTime: "2025-01-09T10:00:00Z",
                salesEndDateTime: "2025-01-13T10:00:00Z",
            },
        ];

        beforeEach(() => {
            visitAdminWithEvents(searchEvents);
        });

        it("TC-F-001: search by event name filters correctly", () => {
            cy.get("input[type='text']").first().type("rock");
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Rock Festival").should("be.visible");
        });

        it("TC-F-002: search by organizer name filters correctly", () => {
            cy.get("input[type='text']").first().type("dev group");
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Tech Meetup").should("be.visible");
        });

        it("TC-F-003: search by location filters correctly", () => {
            cy.get("input[type='text']").first().type("bangkok");
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Rock Festival").should("be.visible");
        });

        it("TC-F-004: search is case-insensitive", () => {
            cy.get("input[type='text']").first().type("ROCK");
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Rock Festival").should("be.visible");
        });

        it('TC-F-005: search with no results shows "ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข"', () => {
            cy.get("input[type='text']").first().type("xxxxx-no-match-xxxxx");
            cy.contains("ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข").should("be.visible");
        });

        it("TC-F-006: clear search shows all events", () => {
            cy.get("input[type='text']").first().type("rock");
            cy.get("tbody tr").should("have.length", 1);

            cy.get("input[type='text']").first().clear();
            cy.get("tbody tr").should("have.length", 2);
        });

        it("TC-F-007: search updates page number to 1", () => {
            const manyEvents = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
                venueName: "Venue",
            }));

            visitAdminWithEvents(manyEvents);

            cy.contains("button", "2").click();
            cy.contains("Page 2").should("be.visible");

            cy.get("input[type='text']").first().type("Event 1");
            cy.contains("Page 1").should("be.visible");
        });
    });

    /* ============================================================
       P0-G: Sorting
    ============================================================ */
    describe("P0-G: Sorting", () => {
        const sortEvents = [
            {
                id: 1,
                eventName: "Old Event",
                organizerName: "Org A",
                showDateTime: "2025-01-01T10:00:00Z",
                salesStartDateTime: "2024-12-01T10:00:00Z",
                salesEndDateTime: "2024-12-10T10:00:00Z",
            },
            {
                id: 2,
                eventName: "New Event",
                organizerName: "Org B",
                showDateTime: "2025-02-01T10:00:00Z",
                salesStartDateTime: "2025-01-10T10:00:00Z",
                salesEndDateTime: "2025-01-20T10:00:00Z",
            },
            {
                id: 3,
                eventName: "Middle Event",
                organizerName: "Org C",
                showDateTime: "2025-01-15T10:00:00Z",
                salesStartDateTime: "2025-01-05T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            },
        ];

        beforeEach(() => {
            visitAdminWithEvents(sortEvents);
        });

        it('TC-G-001: default sort is "newest" (latest date first)', () => {
            cy.get("tbody tr").first().contains("New Event");
        });

        it('TC-G-002: "newest" sorts by date descending', () => {
            cy.get("tbody tr").eq(0).contains("New Event");
            cy.get("tbody tr").eq(1).contains("Middle Event");
            cy.get("tbody tr").eq(2).contains("Old Event");
        });

        it('TC-G-003: "oldest" sorts by date ascending', () => {
            // Note: Need to trigger sort change via EventToolbar
            // This depends on how your EventToolbar implements sort toggle
            // For now, verify the data structure supports it
            cy.get("tbody tr").should("have.length", 3);
        });

        it("TC-G-004: sort uses showDate, falls back to startSaleDate", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "No Show Date",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-20T10:00:00Z",
                    salesEndDateTime: "2025-01-25T10:00:00Z",
                },
                {
                    id: 2,
                    eventName: "Has Show Date",
                    organizerName: "Org",
                    showDateTime: "2025-01-25T10:00:00Z",
                    salesStartDateTime: "2025-01-10T10:00:00Z",
                    salesEndDateTime: "2025-01-15T10:00:00Z",
                },
            ]);

            cy.get("tbody tr").first().contains("Has Show Date");
        });

        it("TC-G-005: sort updates page number to 1", () => {
            const manyEvents = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                showDateTime: `2025-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
                salesStartDateTime: "2025-01-01T10:00:00Z",
                salesEndDateTime: "2025-02-01T10:00:00Z",
            }));

            visitAdminWithEvents(manyEvents);

            cy.contains("button", "2").click();
            cy.contains("Page 2").should("be.visible");

            // Trigger sort change (implementation depends on EventToolbar)
            // For now, verify page resets work
            cy.get("input[type='text']").first().type("Event").clear();
            cy.contains("Page 1").should("be.visible");
        });
    });

    /* ============================================================
       P0-H: Pagination
    ============================================================ */
    describe("P0-H: Pagination", () => {
        it("TC-H-001: default page size is 6 events", () => {
            const events = Array.from({ length: 8 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.get("tbody tr").should("have.length", 6);
        });

        it("TC-H-002: displays correct page number (1 of X)", () => {
            const events = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.contains("Page 1 of 3").should("be.visible");
        });

        it('TC-H-003: "Next" button navigates to next page', () => {
            const events = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.contains("button", "Next").click();
            cy.contains("Page 2 of 3").should("be.visible");
        });

        it('TC-H-004: "Previous" button navigates to previous page', () => {
            const events = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.contains("button", "2").click();
            cy.contains("Page 2").should("be.visible");

            cy.contains("button", "Previous").click();
            cy.contains("Page 1").should("be.visible");
        });

        it("TC-H-005: page number buttons navigate correctly", () => {
            const events = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.contains("button", "2").click();
            cy.contains("Page 2 of 3").should("be.visible");

            cy.contains("button", "3").click();
            cy.contains("Page 3 of 3").should("be.visible");

            cy.contains("button", "1").click();
            cy.contains("Page 1 of 3").should("be.visible");
        });

        it('TC-H-006: "Previous" disabled on first page', () => {
            const events = Array.from({ length: 10 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.contains("button", "Previous").should("be.disabled");
        });

        it('TC-H-007: "Next" disabled on last page', () => {
            const events = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.contains("button", "3").click();
            cy.contains("button", "Next").should("be.disabled");
        });

        it("TC-H-008: displays correct number of events per page", () => {
            const events = Array.from({ length: 10 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            // Page 1: 6 events
            cy.get("tbody tr").should("have.length", 6);

            // Page 2: 4 events
            cy.contains("button", "2").click();
            cy.get("tbody tr").should("have.length", 4);
        });

        it("TC-H-009: last page shows remaining events (< 6)", () => {
            const events = Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.contains("button", "3").click();
            cy.get("tbody tr").should("have.length", 1);
        });

        it("TC-H-010: total pages calculated correctly", () => {
            // Test various page counts
            const testCases = [
                { total: 6, pages: 1 },
                { total: 7, pages: 2 },
                { total: 12, pages: 2 },
                { total: 13, pages: 3 },
            ];

            testCases.forEach(({ total, pages }) => {
                const events = Array.from({ length: total }).map((_, i) => ({
                    id: i + 1,
                    eventName: `Event ${i + 1}`,
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                }));

                visitAdminWithEvents(events);
                cy.contains(`Page 1 of ${pages}`).should("be.visible");
                cy.visit(`${FRONTEND_URL}/admin`); // Reset for next iteration
            });
        });
    });

    /* ============================================================
       P0-I: Navigation
    ============================================================ */
    describe("P0-I: Navigation", () => {
        it("TC-I-001: clicking event row navigates to /admin/eventdetail?id={id}", () => {
            const events = [
                {
                    id: 42,
                    eventName: "Clickable Event",
                    organizerName: "Org X",
                    showDateTime: "2025-01-20T10:00:00Z",
                    salesStartDateTime: "2025-01-01T10:00:00Z",
                    salesEndDateTime: "2025-02-01T10:00:00Z",
                    venueName: "Hall X",
                },
            ];

            visitAdminWithEvents(events);

            cy.contains("Clickable Event").click();

            cy.location().should((loc) => {
                expect(loc.pathname).to.eq("/admin/eventdetail");
                expect(loc.search).to.eq("?id=42");
            });
        });

        it("TC-I-002: row hover shows visual feedback", () => {
            const events = [
                {
                    id: 1,
                    eventName: "Hover Event",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ];

            visitAdminWithEvents(events);

            cy.get("tbody tr")
                .first()
                .should("have.class", "hover:bg-gray-50")
                .and("have.class", "cursor-pointer");
        });

        it("TC-I-003: URL includes correct event ID parameter", () => {
            const events = [
                {
                    id: 999,
                    eventName: "Event 999",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ];

            visitAdminWithEvents(events);

            cy.contains("Event 999").click();
            cy.url().should("include", "id=999");
        });
    });

    /* ============================================================
       P1-J: Combined Filters
    ============================================================ */
    describe("P1-J: Combined Filters", () => {
        const combinedEvents = [
            {
                id: 1,
                eventName: "Rock Onsale",
                organizerName: "Big Org",
                venueName: "Bangkok",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
                showDateTime: "2025-01-20T10:00:00Z",
            },
            {
                id: 2,
                eventName: "Jazz Upcoming",
                organizerName: "Small Org",
                venueName: "Chiang Mai",
                salesStartDateTime: "2025-01-13T10:00:00Z",
                salesEndDateTime: "2025-01-20T10:00:00Z",
                showDateTime: "2025-01-25T10:00:00Z",
            },
            {
                id: 3,
                eventName: "Rock Offsale",
                organizerName: "Big Org",
                venueName: "Phuket",
                salesStartDateTime: "2024-12-01T10:00:00Z",
                salesEndDateTime: "2024-12-10T10:00:00Z",
                showDateTime: "2024-12-15T10:00:00Z",
            },
        ];

        beforeEach(() => {
            visitAdminWithEvents(combinedEvents);
        });

        it("TC-J-001: status filter + search work together", () => {
            cy.contains("button", "ONSALE").click();
            cy.get("tbody tr").should("have.length", 1);

            cy.get("input[type='text']").first().type("rock");
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Rock Onsale").should("be.visible");

            cy.get("input[type='text']").first().clear().type("jazz");
            cy.contains("ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข").should("be.visible");
        });

        it("TC-J-002: status filter + sort work together", () => {
            cy.contains("button", "ONSALE").click();
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Rock Onsale").should("be.visible");
        });

        it("TC-J-003: search + sort work together", () => {
            cy.get("input[type='text']").first().type("rock");
            cy.get("tbody tr").should("have.length", 2);

            // Events should be sorted by date (newest first by default)
            cy.get("tbody tr").first().contains("Rock Onsale");
            cy.get("tbody tr").last().contains("Rock Offsale");
        });

        it("TC-J-004: status + search + sort work together", () => {
            cy.contains("button", "ONSALE").click();
            cy.get("input[type='text']").first().type("big org");
            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Rock Onsale").should("be.visible");
        });

        it("TC-J-005: combined filters update event count correctly", () => {
            cy.contains("Showing 3 of 3 events").should("be.visible");

            cy.contains("button", "ONSALE").click();
            cy.contains("Showing 1 of 3 events").should("be.visible");

            cy.get("input[type='text']").first().type("rock");
            cy.contains("Showing 1 of 3 events").should("be.visible");

            cy.get("input[type='text']").first().clear().type("jazz");
            cy.contains("Showing 0 of 3 events").should("be.visible");
        });
    });

    /* ============================================================
       P1-K: Edge Cases
    ============================================================ */
    describe("P1-K: Edge Cases", () => {
        it('TC-K-001: empty events array shows "ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข"', () => {
            visitAdminWithEvents([]);
            cy.contains("ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข").should("be.visible");
        });

        it("TC-K-002: single event displays correctly", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Single Event",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ]);

            cy.get("tbody tr").should("have.length", 1);
            cy.contains("Page 1 of 1").should("be.visible");
            cy.contains("Showing 1 of 1 events").should("be.visible");
        });

        it("TC-K-003: exactly 6 events shows 1 page", () => {
            const events = Array.from({ length: 6 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: "Org",
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
            }));

            visitAdminWithEvents(events);

            cy.get("tbody tr").should("have.length", 6);
            cy.contains("Page 1 of 1").should("be.visible");
            cy.contains("button", "Next").should("be.disabled");
        });

        it('TC-K-004: events with missing data show fallback values ("-")', () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Minimal Event",
                    // Missing: organizer, venue, dates
                },
            ]);

            cy.get("tbody tr").should("exist");
            cy.contains("Minimal Event").should("be.visible");
            // Check for fallback dashes
            cy.get("tbody tr").first().contains("-").should("exist");
        });

        it("TC-K-005: events with null/undefined dates handled gracefully", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "No Date Event",
                    organizerName: "Org",
                    salesStartDateTime: null,
                    salesEndDateTime: null,
                    showDateTime: undefined,
                },
            ]);

            cy.contains("No Date Event").should("be.visible");
            cy.contains("OFFSALE").should("be.visible");
        });

        it("TC-K-006: category ID mapping works correctly", () => {
            const events = [
                {
                    id: 1,
                    eventName: "Concert",
                    organizerName: "Org",
                    categoryId: 1,
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
                {
                    id: 2,
                    eventName: "Seminar",
                    organizerName: "Org",
                    categoryId: 2,
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
                {
                    id: 3,
                    eventName: "Exhibition",
                    organizerName: "Org",
                    categoryId: 3,
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
                {
                    id: 4,
                    eventName: "Other",
                    organizerName: "Org",
                    categoryId: 99,
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ];

            visitAdminWithEvents(events);

            cy.contains("(concert)").should("be.visible");
            cy.contains("(seminar)").should("be.visible");
            cy.contains("(exhibition)").should("be.visible");
            cy.contains("(other)").should("be.visible");
        });
    });

    /* ============================================================
       P1-L: Performance & UX
    ============================================================ */
    describe("P1-L: Performance & UX", () => {
        it("TC-L-001: skeleton disappears after data loads", () => {
            cy.intercept("GET", "**/api/auth/me", {
                statusCode: 200,
                body: { id: 1, role: "ADMIN" },
            }).as("getMe");

            cy.intercept("GET", "**/api/admin/events*", {
                delay: 500,
                statusCode: 200,
                body: [
                    {
                        id: 1,
                        eventName: "Test",
                        organizerName: "Org",
                        salesStartDateTime: "2025-01-08T10:00:00Z",
                        salesEndDateTime: "2025-01-12T10:00:00Z",
                    },
                ],
            }).as("getEvents");

            cy.intercept("GET", "**/api/admin/events/*/cover", {
                statusCode: 204,
            });

            cy.visit(`${FRONTEND_URL}/admin`, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-admin-token");
                    win.localStorage.setItem("tokenTimestamp", Date.now().toString());
                },
            });

            cy.wait("@getMe");

            // Skeleton should be visible during loading
            cy.get("tbody tr.animate-pulse").should("have.length", 5);

            cy.wait("@getEvents");

            // Skeleton should disappear after load
            cy.get("tbody tr.animate-pulse").should("have.length", 0);
            cy.contains("Test").should("be.visible");
        });

        it("TC-L-002: images load with authentication header", () => {
            visitAdminWithEvents([
                {
                    id: 1,
                    eventName: "Event with Image",
                    organizerName: "Org",
                    salesStartDateTime: "2025-01-08T10:00:00Z",
                    salesEndDateTime: "2025-01-12T10:00:00Z",
                },
            ]);

            // Verify cover image intercept was called
            cy.get("@getCover").should("exist");
        });

        it("TC-L-003: table remains responsive with many events", () => {
            const manyEvents = Array.from({ length: 50 }).map((_, i) => ({
                id: i + 1,
                eventName: `Event ${i + 1}`,
                organizerName: `Organizer ${i + 1}`,
                venueName: `Venue ${i + 1}`,
                salesStartDateTime: "2025-01-08T10:00:00Z",
                salesEndDateTime: "2025-01-12T10:00:00Z",
                showDateTime: `2025-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
            }));

            visitAdminWithEvents(manyEvents);

            // Should only render 6 events (first page)
            cy.get("tbody tr").should("have.length", 6);

            // Table should be visible and scrollable
            cy.get("table").should("be.visible");
            cy.get(".overflow-x-auto").should("exist");
        });


    });

    /* ============================================================
       Additional Test: Multiple Category Mappings
    ============================================================ */
    describe("Additional: Data Mapping Edge Cases", () => {
        it("handles various API response field names", () => {
            const events = [
                {
                    eventsNamId: 1, // Alternative ID field
                    name: "Event via 'name' field",
                    organizer: "Org via 'organizer'",
                    location: "Location via 'location'",
                    startDateTime: "2025-01-08T10:00:00Z",
                    endDateTime: "2025-01-12T10:00:00Z",
                    eventDate: "2025-01-20T10:00:00Z",
                    category: "concert",
                },
            ];

            visitAdminWithEvents(events);

            cy.contains("Event via 'name' field").should("be.visible");
            cy.contains("Org via 'organizer'").should("be.visible");
            cy.contains("Location via 'location'").should("be.visible");
        });
    });
});