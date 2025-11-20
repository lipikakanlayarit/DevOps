/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";

/* ==============================
   Mock Data
   ============================== */

// backend shape ตามหน้า admin-permission.tsx (ดู mapStatusToUi / categoryLabel)
const makeEvent = (overrides = {}) => ({
    id: overrides.id ?? 1,
    eventName: overrides.eventName ?? "Untitled Event",
    categoryId: overrides.categoryId ?? 1,
    organizerName: overrides.organizerName ?? "Organizer Co.",
    startDateTime: overrides.startDateTime ?? "2025-01-10T18:00:00Z",
    endDateTime: overrides.endDateTime ?? "2025-01-10T21:00:00Z",
    updatedAt: overrides.updatedAt ?? "2025-01-01T12:00:00Z",
    status: overrides.status ?? "PENDING",
    venueName: overrides.venueName ?? "Main Hall",
    description: overrides.description ?? "Mock description",
});

// รวม 12 events → PAGE_SIZE=8 → 2 หน้า
const pendingEvents = [
    makeEvent({ id: 1, eventName: "Summer Rock Festival", organizerName: "Sunshine Events", status: "PENDING" }),
    makeEvent({ id: 2, eventName: "Tech Conference 2025", organizerName: "Tech Corp", status: "PENDING", categoryId: 2 }),
    makeEvent({ id: 3, eventName: "Art Expo", organizerName: "Creative Minds", status: "PENDING", categoryId: 3 }),
    makeEvent({ id: 4, eventName: "Food Carnival", organizerName: "Foodies United", status: "PENDING" }),
    makeEvent({ id: 5, eventName: "Charity Run", organizerName: "Run For Life", status: "PENDING" }),
];

const approvedEvents = [
    makeEvent({ id: 6, eventName: "Approved Concert", organizerName: "Green Light Org", status: "APPROVED" }),
    makeEvent({ id: 7, eventName: "Business Seminar", organizerName: "Biz Group", status: "APPROVED", categoryId: 2 }),
    makeEvent({ id: 8, eventName: "Design Exhibition", organizerName: "Design House", status: "APPROVED", categoryId: 3 }),
    makeEvent({ id: 9, eventName: "Music Live Night", organizerName: "Night Sound", status: "APPROVED" }),
];

const rejectedEvents = [
    makeEvent({ id: 10, eventName: "Rejected Event 1", organizerName: "Bad Org", status: "REJECTED" }),
    makeEvent({ id: 11, eventName: "Rejected Event 2", organizerName: "Bad Org", status: "REJECTED" }),
    makeEvent({ id: 12, eventName: "Rejected Event 3", organizerName: "Bad Org", status: "REJECTED" }),
];

const allEvents = [...pendingEvents, ...approvedEvents, ...rejectedEvents];

/* ==============================
   Helpers
   ============================== */

function setupAuthIntercept() {
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

function setupEventsIntercept() {
    cy.intercept("GET", "**/api/admin/events*", (req) => {
        const url = new URL(req.url);
        const status = url.searchParams.get("status") || "ALL"; // ALL / PENDING / APPROVED / REJECTED

        let body;
        if (status === "PENDING") body = pendingEvents;
        else if (status === "APPROVED") body = approvedEvents;
        else if (status === "REJECTED") body = rejectedEvents;
        else body = allEvents;

        req.reply({
            statusCode: 200,
            body,
        });
    }).as("getEvents");
}

function setupCoverIntercept() {
    cy.intercept("GET", "**/admin/events/*/cover*", {
        statusCode: 200,
        body: "",
    }).as("getCover");
}

function setupApproveRejectIntercepts() {
    cy.intercept("POST", "**/api/admin/events/*/approve", {
        statusCode: 200,
        body: { message: "approved" },
    }).as("approveEvent");

    cy.intercept("POST", "**/api/admin/events/*/reject", {
        statusCode: 200,
        body: { message: "rejected" },
    }).as("rejectEvent");
}

function visitAdminPermissionPage() {
    setupAuthIntercept();
    setupEventsIntercept();
    setupCoverIntercept();
    setupApproveRejectIntercepts();

    cy.visit(`${FRONTEND_URL}/admin/permissions`, {
        onBeforeLoad(win) {
            // mock login token
            win.localStorage.setItem("token", "fake-admin-token");
        },
    });

    cy.wait("@getMe");
    cy.wait("@getEvents");
}

/* ==============================
   Test Suite
   ============================== */

describe("Admin Event Permission - with mocks", () => {
    beforeEach(() => {
        visitAdminPermissionPage();
    });

    /* =======================================
       ① Page Initialization
    ======================================= */

    it("Page Initialization - loads initial UI", () => {
        cy.contains("h1", "Event Permission").should("be.visible");

        // Status filter buttons
        cy.contains("button", "All Status").should("be.visible");
        cy.contains("button", "Pending").should("be.visible");
        cy.contains("button", "Approved").should("be.visible");
        cy.contains("button", "Rejected").should("be.visible");

        // Search bar
        cy.get('input[placeholder="Search events..."]').should("be.visible");

        // Warning banner
        cy.contains(
            "Approve = เปลี่ยนสถานะเป็น Approved, Reject = ต้องกรอกเหตุผล"
        ).should("be.visible");

        // Table header
        ["ID", "TITLE", "CATEGORY", "ORGANIZER", "DATES", "SUBMITTED", "STATUS", "ACTIONS"].forEach(
            (h) => cy.contains("th", h).should("be.visible")
        );

        // Events count
        cy.contains("Events: 12").should("be.visible");

        // Pagination (2 pages)
        cy.contains("Page 1 of 2").should("be.visible");
    });

    /* =======================================
       ② Status Filtering
    ======================================= */

    it("Status Filtering - Pending", () => {
        cy.contains("button", "Pending").click();
        cy.wait("@getEvents");

        cy.get("tbody tr").should("have.length", pendingEvents.length);
        cy.get("tbody tr").each(($tr) => {
            cy.wrap($tr).find("td").eq(6).contains("Pending");
        });
    });

    it("Status Filtering - Approved", () => {
        cy.contains("button", "Approved").click();
        cy.wait("@getEvents");

        cy.get("tbody tr").should("have.length", approvedEvents.length);
        cy.get("tbody tr").each(($tr) => {
            cy.wrap($tr).find("td").eq(6).contains("Approved");
        });
    });

    it("Status Filtering - Rejected", () => {
        cy.contains("button", "Rejected").click();
        cy.wait("@getEvents");

        cy.get("tbody tr").should("have.length", rejectedEvents.length);
        cy.get("tbody tr").each(($tr) => {
            cy.wrap($tr).find("td").eq(6).contains("Rejected");
        });
    });

    /* =======================================
       ③ Search Feature
    ======================================= */

    it("Search Feature - search by title", () => {
        cy.get('input[placeholder="Search events..."]').type("Summer Rock");
        cy.contains("Events: 1").should("be.visible");

        cy.get("tbody tr").should("have.length", 1);
        cy.get("tbody tr").first().within(() => {
            cy.contains("Summer Rock Festival").should("be.visible");
        });
    });

    it("Search Feature - search by organizer", () => {
        cy.get('input[placeholder="Search events..."]').type("Tech Corp");
        cy.contains("Events: 1").should("be.visible");

        cy.get("tbody tr").first().within(() => {
            cy.contains("Tech Conference 2025").should("be.visible");
            cy.contains("Tech Corp").should("be.visible");
        });
    });

    it("Search Feature - empty result shows message and keeps header", () => {
        cy.get('input[placeholder="Search events..."]').type("NO-MATCH-XXXX");

        cy.contains("No events found matching your criteria.").should("be.visible");
        cy.contains("Events: 0").should("be.visible");
        cy.contains("Page 1 of 1").should("be.visible");
    });

    it("Search Feature - reset search bring back all events (All Status)", () => {
        cy.get('input[placeholder="Search events..."]').type("NO-MATCH-XXXX");
        cy.contains("Events: 0").should("be.visible");

        cy.get('input[placeholder="Search events..."]').clear();

        cy.contains("Events: 12").should("be.visible");
    });

    /* =======================================
       ④ Pagination
    ======================================= */

    it("Pagination - jump to page 2 via number button", () => {
        cy.get('nav[aria-label="Pagination"]').within(() => {
            cy.contains("button", "2").click();
        });
        cy.contains("Page 2 of 2").should("be.visible");
    });

    it("Pagination - disable next on last page", () => {
        cy.get('nav[aria-label="Pagination"]').within(() => {
            cy.contains("button", "2").click();
        });
        cy.contains("Page 2 of 2").should("be.visible");

        cy.contains("button", "Next").should("be.disabled");
    });

    /* =======================================
       ⑤ Event Detail Modal
    ======================================= */


    /* =======================================
       ⑥ Approve Flow
    ======================================= */

    it("Approve Flow - cancel keeps item", () => {
        cy.contains("button", "Pending").click();
        cy.wait("@getEvents");

        cy.get("tbody tr").first().as("row");
        cy.get("@row").find("td").eq(0).invoke("text").then((idText) => {
            const id = idText.trim();

            cy.get("@row").within(() => {
                cy.contains("button", "Approve").click();
            });

            cy.contains("button", "Cancel").click();
            cy.contains("Approve Event").should("not.exist");

            cy.get("tbody tr").first().find("td").eq(0).should("contain.text", id);
        });
    });

    /* =======================================
       ⑦ Reject Flow
    ======================================= */
    it("Reject Flow - cancel keeps item", () => {
        cy.contains("button", "Pending").click();
        cy.wait("@getEvents");

        cy.get("tbody tr").first().as("row");
        cy.get("@row").find("td").eq(0).invoke("text").then((idText) => {
            const id = idText.trim();

            cy.get("@row").within(() => {
                cy.contains("button", "Reject").click();
            });

            cy.contains("button", "Cancel").click();
            cy.contains("Reject Event").should("not.exist");

            cy.get("tbody tr").first().find("td").eq(0).should("contain.text", id);
        });
    });

    /* =======================================
       ⑨ Image Handling
    ======================================= */

    it("Image Handling - AuthImage in table exists", () => {
        cy.get("tbody tr").first().within(() => {
            cy.get("img").should("exist");
        });
    });

    it("Image Handling - detail modal image exists", () => {
        cy.get("tbody tr").first().click();
        cy.get("img").should("exist");
    });

    /* =======================================
       ⑩ Responsive & UI
    ======================================= */

    it("Responsive & UI - row hover + cursor pointer", () => {
        cy.get("tbody tr")
            .first()
            .should("have.class", "hover:bg-gray-50")
            .and("have.class", "cursor-pointer");
    });

    it("Responsive & UI - warning banner visible", () => {
        cy.contains(
            "Approve = เปลี่ยนสถานะเป็น Approved, Reject = ต้องกรอกเหตุผล"
        ).should("be.visible");
    });

    /* =======================================
       ⑪ Combined Filters
    ======================================= */

    it("Combined Filters - Pending + search by title", () => {
        cy.contains("button", "Pending").click();
        cy.wait("@getEvents");

        cy.get('input[placeholder="Search events..."]').type("Summer Rock");

        cy.get("tbody tr").should("have.length", 1);
        cy.get("tbody tr").first().within(() => {
            cy.contains("Summer Rock Festival").should("be.visible");
            cy.contains("Pending").should("be.visible");
        });
    });


});
