// cypress/e2e/eventdetail.cy.js
/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";
const CREATE_URL = `${FRONTEND_URL}/eventdetail`;
const EDIT_EVENT_ID = "123";
const EDIT_URL = `${FRONTEND_URL}/eventdetail/${EDIT_EVENT_ID}`;

const FIXED_NOW = new Date("2025-01-10T12:00:00Z").getTime();

/* ==============================
   Mock Data
   ============================== */

const mockEditEvent = {
    id: Number(EDIT_EVENT_ID),
    eventName: "Existing Concert",
    description: "Existing description from backend.",
    categoryId: 2,
    venueName: "Existing Venue Hall",
    startDateTime: "2025-02-01T12:00:00Z",
    endDateTime: "2025-02-01T15:00:00Z",
};

function mockOrganizerAuth() {
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

function mockGetEvent({ statusCode = 200, body = mockEditEvent, delay = 0 } = {}) {
    cy.intercept("GET", `**/api/events/${EDIT_EVENT_ID}`, {
        statusCode,
        body,
        delay,
    }).as("getEvent");
}

function mockCreateEvent({ statusCode = 200, responseBody = { id: 555 } } = {}) {
    cy.intercept("POST", "**/api/events", (req) => {
        req.reply({
            statusCode,
            body: responseBody,
        });
    }).as("createEvent");
}

function mockUpdateEvent({ statusCode = 200, responseBody = { message: "OK" } } = {}) {
    cy.intercept("PUT", `**/api/events/${EDIT_EVENT_ID}`, (req) => {
        req.reply({
            statusCode,
            body: responseBody,
        });
    }).as("updateEvent");
}

function mockUploadCover(eventId = EDIT_EVENT_ID) {
    cy.intercept("POST", `**/api/events/${eventId}/cover`, {
        statusCode: 200,
        body: { message: "uploaded" },
    }).as("uploadCover");
}

function mockDeleteCover(eventId = EDIT_EVENT_ID, { statusCode = 200, body = {} } = {}) {
    cy.intercept("DELETE", `**/api/events/${eventId}/cover`, {
        statusCode,
        body,
    }).as("deleteCover");
}

/* ==============================
   Visit Helpers
   ============================== */

function visitCreateEventPage() {
    mockOrganizerAuth();

    cy.visit(CREATE_URL, {
        onBeforeLoad(win) {
            win.localStorage.setItem("token", "fake-organizer-token");
        },
    });

    cy.wait("@getMe");
}

function visitEditEventPage(options = {}) {
    mockOrganizerAuth();
    mockGetEvent(options);

    cy.visit(EDIT_URL, {
        onBeforeLoad(win) {
            win.localStorage.setItem("token", "fake-organizer-token");
        },
    });

    cy.wait("@getMe");
    cy.wait("@getEvent");
}

/* ==============================
   Test Suite
   ============================== */

describe("Event Details Page (Create & Edit)", () => {
    /* ==========================================
       1) Setup & Navigation (P1)
       ========================================== */
    describe("1. Setup & Navigation", () => {
        it("loads Create mode without eventId and shows correct title", () => {
            visitCreateEventPage();

            cy.contains("h1", "Event Details").should("be.visible");
            cy.contains("ไป Ticket Details ของอีเวนต์นี้").should("not.exist");
        });

        it("loads Edit mode with eventId and shows Edit title + ticket link", () => {
            visitEditEventPage();

            cy.contains("h1", "Edit Event").should("be.visible");
            cy.contains("a", "ไป Ticket Details ของอีเวนต์นี้")
                .should("be.visible")
                .should("have.attr", "href", `/ticketdetail/${EDIT_EVENT_ID}`);
        });

        it("handles event load API error without crashing", () => {
            mockOrganizerAuth();
            mockGetEvent({ statusCode: 500, body: { error: "Server error" } });

            cy.visit(EDIT_URL, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-organizer-token");
                },
            });

            cy.wait("@getMe");
            cy.wait("@getEvent");

            // loading หายไป และฟอร์มยัง render
            cy.contains("กำลังโหลดข้อมูลอีเวนต์...").should("not.exist");
            cy.contains("Event Details").should("be.visible");
        });
    });

    /* ==========================================
       3) Form Field Tests (P0)
       ========================================== */
    describe("3. Form Fields (Event Name / Category / Upload)", () => {
        beforeEach(() => {
            visitCreateEventPage();
        });

        // ----- Event Name -----
        it("allows typing, clearing Event Name and requires it on save", () => {
            const nameInput = 'input[placeholder="Name of your project"]';

            cy.get(nameInput).should("have.attr", "placeholder", "Name of your project");

            cy.get(nameInput).type("My New Event").should("have.value", "My New Event");
            cy.get(nameInput).clear().should("have.value", "");

            cy.window().then((win) => {
                cy.stub(win, "alert").as("alert");
            });

            cy.contains("button", "Save & Continue").click();
            cy.get("@alert").should("have.been.calledWith", "กรุณากรอก Event Name");
        });

        it("rejects non-image file type", () => {
            const contents = "This is not an image";
            cy.get('input[type="file"]').selectFile(
                {
                    contents: Cypress.Buffer.from(contents),
                    fileName: "not-image.txt",
                    mimeType: "text/plain",
                },
                { force: true }
            );

            cy.contains("กรุณาเลือกรูปภาพเท่านั้น (PNG/JPG/JPEG/GIF)").should("be.visible");
        });

        it("rejects file larger than 10MB", () => {
            const bigBuffer = Cypress.Buffer.alloc(11 * 1024 * 1024); // 11MB

            cy.get('input[type="file"]').selectFile(
                {
                    contents: bigBuffer,
                    fileName: "too-big.png",
                    mimeType: "image/png",
                },
                { force: true }
            );

            cy.contains("ไฟล์ใหญ่เกิน 10MB").should("be.visible");
        });
    });

    /* ==========================================
       4) Date & Time Tests (P1)
       ========================================== */
    describe("4. Date & Time", () => {

        it('can add and remove "Date and Time" blocks', () => {
            visitCreateEventPage();

            cy.contains("button", "Add Date and Time").click();

            cy.get('button[aria-label="Remove date-time block"]').should("have.length", 2);

            cy.get('button[aria-label="Remove date-time block"]').first().click();
            cy.get('button[aria-label="Remove date-time block"]').should("have.length", 1);
        });
    });

    /* ==========================================
       6) Description Field (P1)
       ========================================== */
    describe("6. Description Field", () => {
        it("allows typing description and is optional", () => {
            visitCreateEventPage();

            const desc = "This is a multi-line description\nwith some details.";
            cy.get('textarea[placeholder="Add more details about your event."]')
                .type(desc)
                .should("have.value", desc);

            // ลองเคลียร์ให้ว่างเพื่อยืนยันว่าไม่ required
            cy.get('textarea[placeholder="Add more details about your event."]')
                .clear()
                .should("have.value", "");
        });
    });

    /* ==========================================
       7) Save Functionality - Create & Edit (P0)
       ========================================== */
    describe("7. Save Functionality (Create & Edit)", () => {

        it("Edit: calls PUT /api/events/:id and alerts success, navigate to ticketdetail/:id", () => {
            mockOrganizerAuth();
            mockGetEvent();
            mockUpdateEvent();
            mockUploadCover(EDIT_EVENT_ID);

            cy.visit(EDIT_URL, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-organizer-token");
                },
            });

            cy.wait("@getMe");
            cy.wait("@getEvent");

            cy.get('input[placeholder="Name of your project"]')
                .clear()
                .type("Updated Event Name");

            cy.window().then((win) => {
                cy.stub(win, "alert").as("alert");
            });

            cy.contains("button", "Update & Continue").click();

            cy.wait("@updateEvent").its("request.body").should((body) => {
                expect(body.eventName).to.equal("Updated Event Name");
                expect(body.categoryId).to.equal(mockEditEvent.categoryId);
            });

            cy.get("@alert").should("have.been.calledWith", "อัปเดตอีเวนต์สำเร็จ!");
            cy.url().should("include", `/ticketdetail/${EDIT_EVENT_ID}`);
        });

        it("shows backend error on update failure and stays on edit page", () => {
            mockOrganizerAuth();
            mockGetEvent();
            mockUpdateEvent({
                statusCode: 500,
                responseBody: { error: "Update failed" },
            });

            cy.visit(EDIT_URL, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-organizer-token");
                },
            });

            cy.wait("@getMe");
            cy.wait("@getEvent");

            cy.window().then((win) => {
                cy.stub(win, "alert").as("alert");
            });

            cy.contains("button", "Update & Continue").click();

            cy.wait("@updateEvent");
            cy.get("@alert").should("have.been.calledWith", "Update failed");

            cy.url().should("include", `/eventdetail/${EDIT_EVENT_ID}`);
        });
    });

    /* ==========================================
       8) Cancel Button (P0)
       ========================================== */
    describe("8. Cancel Button", () => {
        it('navigates back to "/organizationmnge" and does not save', () => {
            visitCreateEventPage();

            cy.get('input[placeholder="Name of your project"]').type("Will Cancel");

            cy.contains("a", "Cancel")
                .should("have.attr", "href", "/organizationmnge")
                .click();

            cy.url().should("include", "/organizationmnge");
        });
    });

    /* ==========================================
       Extra: Delete image from server (Edit mode, still P1-ish)
       ========================================== */
    describe("Extra: Delete image from server (Edit mode)", () => {
        it("calls DELETE /events/:id/cover after confirm and removes preview", () => {
            mockOrganizerAuth();
            mockGetEvent();
            mockDeleteCover(EDIT_EVENT_ID, { statusCode: 200 });

            cy.visit(EDIT_URL, {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "fake-organizer-token");
                },
            });

            cy.wait("@getMe");
            cy.wait("@getEvent");

            cy.get('img[alt="Preview"]').should("exist");

            cy.window().then((win) => {
                cy.stub(win, "confirm").returns(true).as("confirm");
            });

            cy.contains("button", "ลบรูปจากเซิร์ฟเวอร์").click();

            cy.get("@confirm").should("have.been.called");
            cy.wait("@deleteCover");

            cy.get('img[alt="Preview"]').should("not.exist");
        });
    });
});
