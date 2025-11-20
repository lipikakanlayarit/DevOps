// cypress/e2e/admin-usermnge.cy.js
/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";

/* ==============================
   Mock Data
   ============================== */

const mockAttendees = [
    {
        id: 1,
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "0812345678",
        lastLogin: "2025-01-10 10:00",
        role: "USER",
    },
    {
        id: 2,
        username: "jane_smith",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phoneNumber: "",
        lastLogin: "2025-01-11 11:11",
        role: "USER",
    },
    {
        id: 3,
        username: "test_user",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phoneNumber: "0899999999",
        lastLogin: null,
        role: "USER",
    },
];

const mockOrganizers = [
    {
        id: 10,
        username: "event_company",
        firstName: "Event",
        lastName: "Company",
        email: "contact@eventco.com",
        phoneNumber: "021234567",
        address: "123 Event Street, Bangkok",
        role: "ORGANIZER",
    },
    {
        id: 11,
        username: "music_org",
        firstName: "Music",
        lastName: "Org",
        email: "music@org.com",
        phoneNumber: "",
        address: "",
        role: "ORGANIZER",
    },
];

const mockTickets = [
    {
        reserveId: "RES-001",
        title: "Rock Concert 2025",
        venue: "Bangkok Arena",
        showDate: "2025-03-10 19:00",
        zone: "VIP",
        row: "A",
        column: 1,
        total: 2500,
        _eventId: 101,
        _coverUpdatedAt: "2025-01-01T00:00:00Z",
    },
    {
        reserveId: "RES-002",
        title: "Jazz Night",
        venue: "Chiang Mai Hall",
        showDate: "2025-04-01 20:00",
        zone: "B",
        row: "B",
        column: 5,
        total: 1500,
        _eventId: 102,
        _coverUpdatedAt: "2025-01-02T00:00:00Z",
    },
];

const mockOrganizerDetail = {
    id: 10,
    username: "event_company",
    firstName: "Event",
    lastName: "Company",
    email: "contact@eventco.com",
    phoneNumber: "021234567",
    address: "123 Event Street, Bangkok",
};

const mockOrganizerEvents = [
    {
        id: 201,
        title: "Festival A",
        venue: "Impact Arena",
        showDate: "2025-05-01 18:00",
        poster: "",
        updatedAt: "2025-02-01T00:00:00Z",
    },
    {
        id: 202,
        title: "Summer Live",
        venue: "Central World",
        showDate: "2025-06-10 19:00",
        poster: "",
        updatedAt: "2025-02-05T00:00:00Z",
    },
];

/* ==============================
   Helpers
   ============================== */

function mockAdminAuth() {
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
}

function mockUsersApi(attendees = mockAttendees, { delay = 0, error = false } = {}) {
    cy.intercept("GET", "**/api/admin/users*", (req) => {
        if (error) {
            req.reply({
                statusCode: 500,
                body: { message: "Server Error" },
                delay,
            });
            return;
        }
        req.reply({
            statusCode: 200,
            body: attendees,
            delay,
        });
    }).as("getUsers");
}

function mockOrganizersApi(organizers = mockOrganizers, { delay = 0, error = false } = {}) {
    cy.intercept("GET", "**/api/admin/organizers*", (req) => {
        if (error) {
            req.reply({
                statusCode: 500,
                body: { message: "Server Error" },
                delay,
            });
            return;
        }
        req.reply({
            statusCode: 200,
            body: organizers,
            delay,
        });
    }).as("getOrganizers");
}

function mockTicketsApi(tickets = mockTickets, { delay = 0, error = false } = {}) {
    cy.intercept("GET", "**/api/admin/users/*/tickets*", (req) => {
        if (error) {
            req.reply({
                statusCode: 404,
                body: { message: "Not Found" },
                delay,
            });
            return;
        }
        req.reply({
            statusCode: 200,
            body: tickets,
            delay,
        });
    }).as("getUserTickets");
}

function mockOrganizerDetailApi(detail = mockOrganizerDetail) {
    cy.intercept("GET", "**/api/admin/organizers/*", {
        statusCode: 200,
        body: detail,
    }).as("getOrganizerDetail");
}

function mockOrganizerEventsApi(events = mockOrganizerEvents, { delay = 0, error = false } = {}) {
    cy.intercept("GET", "**/api/admin/organizers/*/events*", (req) => {
        if (error) {
            req.reply({
                statusCode: 500,
                body: { message: "Failed" },
                delay,
            });
            return;
        }
        req.reply({
            statusCode: 200,
            body: events,
            delay,
        });
    }).as("getOrganizerEvents");
}

function mockCovers({ ok = true } = {}) {
    cy.intercept("GET", "**/api/public/events/*/cover*", (req) => {
        if (ok) {
            req.reply({ statusCode: 200, body: "" });
        } else {
            req.reply({ statusCode: 404 });
        }
    }).as("getCover");
}

/** visit หน้า /admin/usermnge พร้อม mock login + users */
function visitAdminUserMng({ delayUsers = 0, errorUsers = false } = {}) {
    mockAdminAuth();
    mockUsersApi(undefined, { delay: delayUsers, error: errorUsers });
    mockCovers();

    cy.visit(`${FRONTEND_URL}/admin/usermnge`, {
        onBeforeLoad(win) {
            win.localStorage.setItem("token", "fake-admin-token");
        },
    });

    cy.wait("@getMe");
    cy.wait("@getUsers");
}

/* ==============================
   Test Suite
   ============================== */

describe("Admin User Management Page (/admin/usermnge)", () => {
    /* 1) Page Initialization */
    describe("1. Page Initialization", () => {

        it("defaults to Attendee tab", () => {
            visitAdminUserMng();

            cy.contains("button", "Attendee").should("have.class", "bg-black");
            cy.contains("th", "LAST LOGIN").should("be.visible");
            cy.contains("th", "ADDRESS").should("not.exist");
        });
    });

    /* 2) Tab Navigation */
    describe("2. Tab Navigation", () => {
        beforeEach(() => {
            visitAdminUserMng();
            mockOrganizersApi();
        });

        it("switches to Organizer tab and loads organizers", () => {
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");

            cy.contains("button", "Organizer").should("have.class", "bg-black");
            cy.get('input[placeholder="Search organizers..."]').should("exist");

            cy.contains("th", "ADDRESS").should("be.visible");
            cy.contains("th", "LAST LOGIN").should("not.exist");

            cy.get("tbody tr").should("have.length", mockOrganizers.length);
            cy.contains("Organizers:").should("be.visible");
        });

        it("switches back to Attendee tab and reloads attendees", () => {
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");

            mockUsersApi(); // re-mock for going back
            cy.contains("button", "Attendee").click();
            cy.wait("@getUsers");

            cy.contains("button", "Attendee").should("have.class", "bg-black");
            cy.contains("th", "LAST LOGIN").should("be.visible");
            cy.get("tbody tr").should("have.length", mockAttendees.length);
        });

        it("updates search placeholder when switching tabs", () => {
            cy.get('input[placeholder="Search attendees..."]').should("exist");

            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");

            cy.get('input[placeholder="Search organizers..."]').should("exist");
        });
    });

    /* 3) Search - Attendee Tab */
    describe("3. Search - Attendee Tab", () => {
        beforeEach(() => {
            visitAdminUserMng();
        });

        it("searches by username", () => {
            cy.get('input[placeholder="Search attendees..."]').type("john_doe");
            cy.get("tbody tr").should("have.length", 1).and("contain", "john_doe");
        });

        it("searches by email", () => {
            cy.get('input[placeholder="Search attendees..."]').type("jane@example.com");
            cy.get("tbody tr").should("have.length", 1).and("contain", "jane@example.com");
        });

        it("searches by first name (case-insensitive)", () => {
            cy.get('input[placeholder="Search attendees..."]').type("john");
            cy.get("tbody tr").should("have.length.at.least", 1).and("contain", "John");
        });

        it("shows no rows for non-matching search", () => {
            cy.get('input[placeholder="Search attendees..."]').type("NonExistentUser123");
            cy.get("tbody tr").should("have.length", 0);
        });
    });

    /* 4) Search - Organizer Tab */
    describe("4. Search - Organizer Tab", () => {
        beforeEach(() => {
            visitAdminUserMng();
            mockOrganizersApi();
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");
        });

        it("searches organizers by username", () => {
            cy.get('input[placeholder="Search organizers..."]').type("event_company");
            cy.get("tbody tr").should("have.length", 1).and("contain", "event_company");
        });

        it("searches organizers by email", () => {
            cy.get('input[placeholder="Search organizers..."]').type("contact@eventco.com");
            cy.get("tbody tr").should("have.length", 1).and("contain", "contact@eventco.com");
        });


    });

    /* 5) Attendee Table Display */
    describe("5. Attendee Table Display", () => {
        beforeEach(() => {
            visitAdminUserMng();
        });

        it("renders attendee data correctly", () => {
            cy.get("tbody tr")
                .first()
                .within(() => {
                    cy.get("td").eq(0).should("contain", "john_doe");
                    cy.get("td").eq(3).should("contain", "@");
                });
        });

        it('shows "-" when phoneNumber is empty', () => {
            cy.contains("jane_smith")
                .parent()
                .within(() => {
                    cy.get("td").eq(4).should("contain", "-");
                });
        });

        it('shows "-" when lastLogin is null/empty', () => {
            cy.contains("test_user")
                .parent()
                .within(() => {
                    cy.get("td").eq(5).should("contain", "-");
                });
        });
    });

    /* 6) Organizer Table Display */
    describe("6. Organizer Table Display", () => {
        beforeEach(() => {
            visitAdminUserMng();
            mockOrganizersApi();
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");
        });

        it("shows ADDRESS instead of LAST LOGIN", () => {
            cy.contains("th", "ADDRESS").should("be.visible");
            cy.contains("th", "LAST LOGIN").should("not.exist");
        });

        it("shows '-' when address is missing", () => {
            cy.contains("music_org")
                .parent()
                .within(() => {
                    cy.get("td").eq(5).should("contain", "-");
                });
        });
    });

    /* 7) Attendee Detail Modal */
    describe("7. Attendee Detail Modal", () => {
        beforeEach(() => {
            visitAdminUserMng();
            mockTicketsApi();
        });

        it("opens detail modal when clicking View detail", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.wait("@getUserTickets");

            cy.get(".fixed.inset-0").should("be.visible");
            cy.contains("Ticket History").should("be.visible");
        });

        it("shows user info in modal header", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();

            cy.get(".fixed.inset-0").within(() => {
                cy.get(".text-2xl").should("contain", "john_doe");
                cy.get(".text-gray-500").should("contain", "@");
            });
        });

        it("closes modal with X button", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();

            cy.get(".fixed.inset-0")
                .find("button")
                .filter((_, el) => el.querySelector("svg") !== null)
                .first()
                .click();

            cy.get(".fixed.inset-0").should("not.exist");
        });

        it("closes modal when clicking backdrop", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();

            cy.get(".fixed.inset-0").click("topLeft");
            cy.get(".fixed.inset-0").should("not.exist");
        });

        it("does not close when clicking modal content", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();

            cy.get('.bg-white.w-full.max-w-\\[1040px\\]').click();
            cy.get(".fixed.inset-0").should("exist");
        });
    });

    /* 8) Attendee Ticket History */
    describe("8. Attendee Ticket History", () => {
        beforeEach(() => {
            visitAdminUserMng();
            mockTicketsApi();
            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.wait("@getUserTickets");
        });

        it("shows ticket count in header", () => {
            cy.contains(`Ticket History (${mockTickets.length})`).should("be.visible");
        });

        it("shows loading state while fetching tickets", () => {
            mockTicketsApi(undefined, { delay: 800 });
            cy.reload();
            visitAdminUserMng();
            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.contains("Loading…").should("be.visible");
        });

        it("filters tickets with search box", () => {
            cy.get('input[placeholder="Search..."]').type("Rock Concert");
            cy.contains("Rock Concert 2025").should("be.visible");
            cy.contains("Jazz Night").should("not.exist");
        });

        it("shows 'No tickets found.' when no matches", () => {
            cy.get('input[placeholder="Search..."]').type("NonExistentTicket");
            cy.contains("No tickets found.").should("be.visible");
        });
    });

    /* 9) Organizer Detail Modal */
    describe("9. Organizer Detail Modal", () => {
        beforeEach(() => {
            visitAdminUserMng();
            mockOrganizersApi();
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");
            mockOrganizerDetailApi();
            mockOrganizerEventsApi();
        });

        it("opens organizer detail modal", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.wait("@getOrganizerDetail");
            cy.wait("@getOrganizerEvents");

            cy.get(".fixed.inset-0").should("be.visible");
        });

        it("shows profile left panel and event history right panel", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.wait("@getOrganizerEvents");

            cy.get(".flex-1.p-6.border-r.overflow-y-auto").should("exist");
            cy.get('.w-\\[460px\\].bg-\\[\\#121212\\].text-white').should("exist");
        });

        it("shows organizer profile information", () => {
            cy.get("tbody tr").first().find("button").contains("View detail").click();

            cy.contains("Name").should("be.visible");
            cy.contains("Phone Number").should("be.visible");
            cy.contains("Address").should("be.visible");
            cy.contains("Email").should("be.visible");
        });
    });

    /* 10) Organizer Event History */
    describe("10. Organizer Event History", () => {
        beforeEach(() => {
            visitAdminUserMng();
            mockOrganizersApi();
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");
            mockOrganizerDetailApi();
            mockOrganizerEventsApi();
            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.wait("@getOrganizerEvents");
        });

        it("shows dark right-side panel with events", () => {
            cy.get('.w-\\[460px\\].bg-\\[\\#121212\\].text-white').should("be.visible");
        });

        it("shows event titles and venues", () => {
            cy.contains("Festival A").should("be.visible");
            cy.contains("Impact Arena").should("be.visible");
        });

        it("shows 'No events.' when organizer has no events", () => {
            mockOrganizerEventsApi([], { error: false });
            cy.reload();
            visitAdminUserMng();
            mockOrganizersApi();
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");
            mockOrganizerDetailApi();
            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.contains("No events.").should("be.visible");
        });
    });

    /* 11) Error Handling */
    describe("11. Error Handling", () => {
        it("handles attendee list fetch error", () => {
            mockAdminAuth();
            mockUsersApi([], { error: true });
            mockCovers();

            cy.visit(`${FRONTEND_URL}/admin/usermnge`, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-admin-token");
                },
            });

            cy.wait("@getMe");
            cy.wait("@getUsers");

            cy.get("tbody tr").should("have.length", 0);
            cy.contains("Attendees: 0").should("be.visible");
        });

        it("handles ticket fetch error", () => {
            visitAdminUserMng();
            mockTicketsApi(undefined, { error: true });

            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.contains("No tickets found.").should("be.visible");
        });

        it("handles organizer events fetch error", () => {
            visitAdminUserMng();
            mockOrganizersApi();
            cy.contains("button", "Organizer").click();
            cy.wait("@getOrganizers");
            mockOrganizerDetailApi();
            mockOrganizerEventsApi([], { error: true });

            cy.get("tbody tr").first().find("button").contains("View detail").click();
            cy.contains("No events.").should("be.visible");
        });
    });

    /* 12) Responsive & UI */
    describe("12. Responsive & UI", () => {
        it("is responsive on mobile", () => {
            visitAdminUserMng();
            cy.viewport("iphone-x");

            cy.contains("User Management").should("be.visible");
            cy.get("table").should("exist");
        });

        it("enables horizontal scroll on small screens", () => {
            visitAdminUserMng();
            cy.viewport(800, 600);

            cy.get(".overflow-x-auto").should("exist");
        });

        it("rows have hover highlight", () => {
            visitAdminUserMng();

            cy.get("tbody tr")
                .first()
                .should("have.class", "hover:bg-gray-50")
                .and("have.class", "transition-colors");
        });

        it("view detail button has red hover style", () => {
            visitAdminUserMng();

            cy.get("tbody tr")
                .first()
                .find("button")
                .contains("View detail")
                .should("have.class", "hover:bg-red-50");
        });
    });
});
