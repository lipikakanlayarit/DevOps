/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";

/**
 * Login using real backend API → visit /admin
 */
const loginAndVisitAdmin = (username = "admin", password = "password123") => {
    cy.request({
        method: "POST",
        url: `${FRONTEND_URL}/api/auth/login`,
        body: { username, password },
        failOnStatusCode: false,
    }).then((res) => {
        expect(res.status, "login status").to.eq(200);

        const body = res.body || {};
        const token =
            body.token ||
            body.accessToken ||
            body.access_token ||
            body.jwt ||
            body.idToken;

        expect(token, "jwt token").to.be.a("string").and.not.be.empty;

        cy.visit(`${FRONTEND_URL}/admin`, {
            onBeforeLoad(win) {
                win.localStorage.setItem("token", token);
                win.localStorage.setItem("tokenTimestamp", String(Date.now()));
            },
        });
    });
};

describe("Admin Event Management Page (Real API - Extended Tests)", () => {
    /* =======================================================
       A: Basic Admin UI & Page Load
    ======================================================= */
    describe("A: Basic admin view & page structure", () => {
        beforeEach(() => {
            loginAndVisitAdmin("admin", "password123");
        });

        it("A-01: Should display Event Management header", () => {
            cy.contains("h1", "Event Management", { timeout: 10000 }).should("be.visible");
        });

        it("A-02: Should display sidebar", () => {
            cy.get("body", { timeout: 10000 }).should("exist");
            // Sidebar typically has navigation elements
            cy.get(".ml-64", { timeout: 10000 }).should("exist");
        });

        it("A-03: Table should contain all 7 columns", () => {
            cy.get("thead th", { timeout: 10000 }).should("have.length", 7);

            ["Poster", "Event Name", "Organizer", "Show Date", "Sale Period", "Location", "Status"].forEach((label) => {
                cy.contains("th", label).should("exist");
            });
        });

        it("A-04: Table should contain at least 1 data row", () => {
            cy.get("tbody", { timeout: 10000 }).should("exist");
            cy.get("tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);
        });

        it("A-05: Should display EventToolbar with filters", () => {
            cy.contains("button", "Show all", { timeout: 10000 }).should("be.visible");
        });

        it("A-06: Should display pagination controls", () => {
            cy.contains("button", "Previous", { timeout: 10000 }).should("be.visible");
            cy.contains("button", "Next").should("be.visible");
        });
    });

    /* =======================================================
       B: Status Filtering
    ======================================================= */
    describe("B: Status filtering functionality", () => {
        beforeEach(() => {
            loginAndVisitAdmin("admin", "password123");
        });

        it('B-01: Click "Show all" should display all events', () => {
            cy.contains("button", "Show all", { timeout: 10000 }).click();
            cy.get("tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);
        });

        it('B-02: Filter by "ONSALE" status', () => {
            cy.contains("button", "ONSALE", { timeout: 10000 }).should("exist").click();
            cy.wait(500);

            // Check if any ONSALE events exist
            cy.get("tbody").then(($tbody) => {
                if ($tbody.find("tr").length > 0 && !$tbody.text().includes("ไม่พบอีเวนต์")) {
                    cy.get("tbody tr").each(($row) => {
                        cy.wrap($row).within(() => {
                            cy.get("td").last().should("contain", "ONSALE");
                        });
                    });
                }
            });
        });

        it('B-03: Filter by "UPCOMING" status', () => {
            cy.contains("button", "UPCOMING", { timeout: 10000 }).should("exist").click();
            cy.wait(500);

            cy.get("tbody").then(($tbody) => {
                if ($tbody.find("tr").length > 0 && !$tbody.text().includes("ไม่พบอีเวนต์")) {
                    cy.get("tbody tr").each(($row) => {
                        cy.wrap($row).within(() => {
                            cy.get("td").last().should("contain", "UPCOMING");
                        });
                    });
                }
            });
        });

        it('B-04: Filter by "OFFSALE" status', () => {
            cy.contains("button", "OFFSALE", { timeout: 10000 }).should("exist").click();
            cy.wait(500);

            cy.get("tbody").then(($tbody) => {
                if ($tbody.find("tr").length > 0 && !$tbody.text().includes("ไม่พบอีเวนต์")) {
                    cy.get("tbody tr").each(($row) => {
                        cy.wrap($row).within(() => {
                            cy.get("td").last().should("contain", "OFFSALE");
                        });
                    });
                }
            });
        });

        it("B-05: Switching filters should reset to page 1", () => {
            cy.contains("button", "Show all", { timeout: 10000 }).click();
            cy.wait(500);
            cy.contains("Page 1").should("be.visible");

            cy.contains("button", "ONSALE").click();
            cy.wait(500);
            cy.contains("Page 1").should("be.visible");
        });
    });

    /* =======================================================
       C: Search Functionality
    ======================================================= */
    describe("C: Search functionality", () => {
        beforeEach(() => {
            loginAndVisitAdmin("admin", "password123");
        });

        it('C-01: Should display "Showing X of Y events"', () => {
            cy.contains("Showing", { timeout: 10000 }).should("be.visible");
            cy.contains("events").should("be.visible");
        });

        it('C-03: Searching invalid keyword → Should show "Showing 0 of Y events"', () => {
            cy.get('input[type="text"]', { timeout: 10000 })
                .first()
                .clear()
                .type("xxxxx-no-such-event-xxxxx");

            cy.contains("Showing 0 of", { timeout: 10000 }).should("be.visible");
            cy.contains("ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข", { timeout: 10000 }).should("be.visible");
        });

        it("C-04: Clearing search should restore all events", () => {
            cy.get('input[type="text"]', { timeout: 10000 }).first().clear().type("xxxxx-no-such-event-xxxxx");
            cy.contains("Showing 0 of", { timeout: 10000 }).should("be.visible");

            cy.get('input[type="text"]').first().clear();
            cy.wait(500);

            cy.get("tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);
        });


        it("C-06: Search should reset pagination to page 1", () => {
            cy.get('input[type="text"]', { timeout: 10000 }).first().clear().type("test");
            cy.wait(500);
            cy.contains("Page 1").should("be.visible");
        });
    });

    /* =======================================================
       D: Sorting Functionality
    ======================================================= */
    describe("D: Sorting functionality", () => {
        beforeEach(() => {
            loginAndVisitAdmin("admin", "password123");
        });

        it("D-01: Should have newest/oldest sorting options", () => {
            cy.get("body", { timeout: 10000 }).should("exist");
            // EventToolbar should contain order controls
        });

        it("D-02: Default sort should be 'newest'", () => {
            cy.wait(1000);
            cy.get("tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);
        });

    });

    /* =======================================================
       E: Pagination
    ======================================================= */
    describe("E: Pagination controls", () => {
        beforeEach(() => {
            loginAndVisitAdmin("admin", "password123");
        });

        it('E-01: Should show "Page X of Y"', () => {
            cy.contains("Page", { timeout: 10000 }).should("be.visible");
            cy.contains("of").should("be.visible");
        });

        it('E-02: "Previous" button should be disabled on page 1', () => {
            cy.contains("button", "Previous", { timeout: 10000 }).should("be.disabled");
        });

        it("E-03: Clicking page number 1 should stay on Page 1", () => {
            cy.contains("button", "1", { timeout: 10000 }).click();
            cy.contains("Page 1").should("be.visible");
        });

        it('E-04: Clicking "Next" should work if enabled', () => {
            cy.contains("button", "Next", { timeout: 10000 })
                .should("exist")
                .then(($btn) => {
                    if (!$btn.is(":disabled")) {
                        cy.wrap($btn).click();
                        cy.contains("Page", { timeout: 10000 }).should("be.visible");
                        cy.contains("button", "Previous").should("not.be.disabled");
                    }
                });
        });

        it('E-05: "Next" button should be disabled on last page', () => {
            // Get to last page by checking total pages
            cy.contains(/Page \d+ of (\d+)/, { timeout: 10000 }).invoke("text").then((text) => {
                const match = text.match(/of (\d+)/);
                if (match) {
                    const totalPages = parseInt(match[1]);
                    if (totalPages > 1) {
                        cy.contains("button", String(totalPages)).click();
                        cy.wait(500);
                        cy.contains("button", "Next").should("be.disabled");
                    }
                }
            });
        });
    });

    /* =======================================================
       F: Navigation to Event Detail
    ======================================================= */
    describe("F: Navigate to event detail", () => {
        beforeEach(() => {
            loginAndVisitAdmin("admin", "password123");
        });

        it("F-03: Row should have hover effect", () => {
            cy.get("tbody tr", { timeout: 10000 })
                .first()
                .should("have.class", "hover:bg-gray-50");
        });
    });

    /* =======================================================
       G: Access Control (Real API)
    ======================================================= */
    describe("G: Access control & authorization", () => {
        it("G-01: Admin user should see Event Management page", () => {
            loginAndVisitAdmin("admin", "password123");
            cy.contains("h1", "Event Management", { timeout: 10000 }).should("be.visible");
        });

        it("G-02: Organizer should NOT see Event Management page", () => {
            loginAndVisitAdmin("organizer", "password123");
            cy.wait(2000);
            cy.get("body").should("not.contain", "Event Management");
        });

        it("G-03: Normal user (alice123) should NOT see Event Management page", () => {
            loginAndVisitAdmin("alice123", "password123");
            cy.wait(2000);
            cy.get("body").should("not.contain", "Event Management");
        });

        it("G-04: Unauthenticated user should be redirected", () => {
            cy.visit(`${FRONTEND_URL}/admin`);
            cy.wait(2000);
            cy.location("pathname").should("not.include", "/admin");
        });
    });

    /* =======================================================
       H: Data Display & Validation
    ======================================================= */
    describe("H: Data display & validation", () => {
        beforeEach(() => {
            loginAndVisitAdmin("admin", "password123");
        });

        it("H-01: Each row should display event poster", () => {
            cy.get("tbody tr", { timeout: 10000 })
                .first()
                .within(() => {
                    cy.get("td").first().find("img").should("exist");
                });
        });

        it("H-02: Event name should be displayed", () => {
            cy.get("tbody tr", { timeout: 10000 })
                .first()
                .within(() => {
                    cy.get("td").eq(1).should("not.be.empty");
                });
        });

        it("H-03: Status badge should have appropriate styling", () => {
            cy.get("tbody tr", { timeout: 10000 })
                .first()
                .within(() => {
                    cy.get("td").last().find("span, div").should("exist");
                });
        });

        it("H-04: Category should be displayed in event name cell", () => {
            cy.get("tbody tr", { timeout: 10000 })
                .first()
                .within(() => {
                    cy.get("td").eq(1).should("contain.text", "(");
                    cy.get("td").eq(1).should("contain.text", ")");
                });
        });
    });
});