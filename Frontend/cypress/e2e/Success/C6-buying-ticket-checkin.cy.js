// cypress/e2e/checkin.cy.js
/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";
const BASE_PATH = "/checkin";

describe("Check-in Confirmation Page", () => {
    const visitCheckin = (path = "123", query = "") => {
        const url = `${FRONTEND_URL}${BASE_PATH}/${path}${query ? `?${query}` : ""}`;
        cy.visit(url);
    };

    /**
     * TEST 1: Page Loading & Initial State
     */
    describe("1. Page Initialization", () => {

        it("should handle missing reservedId gracefully", () => {
            cy.visit(`${FRONTEND_URL}${BASE_PATH}`); // No ID in URL
            cy.contains("Loading…").should("not.exist");
        });
    });

    /**
     * TEST 2: Query Parameters Handling
     */
    describe("2. Query Parameters", () => {

        it("should combine eventId and seatId from query", () => {
            cy.intercept("GET", "**/api/public/reservations/123?seatId=789", {
                body: {
                    reservedId: 123,
                    seatId: 789,
                    paymentStatus: "PAID",
                },
            }).as("getReservation");

            visitCheckin("123", "eventId=100&seatId=789");
            cy.wait("@getReservation");
            cy.contains("Event ID").parent().should("contain", "100");
        });

    });

    /**
     * TEST 5: Confirm Button Behavior
     */
    describe("5. Confirm Check-in Button", () => {
        it("should enable button for paid reservations", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    eventId: 100,
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123");
            cy.contains("ยืนยันการเข้างาน").should("not.be.disabled");
        });

        it("should show processing state when confirming", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    eventId: 100,
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123");

            cy.window().then((win) => {
                const originalPush = win.history.pushState;
                cy.stub(win.history, "pushState")
                    .callsFake(function (...args) {
                        cy.contains("Processing…").should("be.visible");
                        return originalPush.apply(this, args);
                    })
                    .as("pushState");
            });

            cy.contains("ยืนยันการเข้างาน").click();
        });

    });

    /**
     * TEST 6: Navigation After Confirmation
     */
    describe("6. Navigation Flow", () => {

        it("should alert when eventId is missing from both API and query", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123");

            cy.on("window:alert", (text) => {
                expect(text).to.contains("ไม่พบ Event ID");
            });

            cy.contains("ยืนยันการเข้างาน").click();
        });

        it("should use replace navigation (no back history)", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    eventId: 100,
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123");
            cy.contains("ยืนยันการเข้างาน").click();

            cy.go("back");
            cy.url().should("not.include", "/checkin");
        });
    });

    /**
     * TEST 8: Error Handling
     */
    describe("8. Error Handling", () => {
        it("should display error message when API fails", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                statusCode: 404,
                body: {
                    error: "Reservation not found",
                },
            });

            visitCheckin("123");
            cy.contains("Reservation not found").should("be.visible");
            cy.get(".text-rose-600").should("exist");
        });

        it("should handle 500 server error", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                statusCode: 500,
                body: {
                    error: "Internal server error",
                },
            });

            visitCheckin("999");
            cy.contains("Internal server error").should("be.visible");
        });

        it("should display default error message when no error provided", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                statusCode: 400,
            });

            visitCheckin("123");
            cy.contains("Failed to load reservation").should("be.visible");
        });

        it('should show "Reservation not found" for null data', () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: null,
            });

            visitCheckin("123");
            cy.contains("Reservation not found").should("be.visible");
        });

        it("should handle network timeout", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                forceNetworkError: true,
            });

            visitCheckin("123");
            cy.contains("Failed to load reservation").should("be.visible");
        });

        it("should not display confirm button when error occurs", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                statusCode: 404,
            });

            visitCheckin("123");
            cy.contains("ยืนยันการเข้างาน").should("not.exist");
        });

        it("should not display close button when error occurs", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                statusCode: 500,
            });

            visitCheckin("123");
            cy.contains("ปิดหน้าต่าง").should("not.exist");
        });
    });

    /**
     * TEST 9: Payment Status Variations
     */
    describe("9. Payment Status Cases", () => {
        it('should handle "PAID" status (uppercase)', () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    eventId: 100,
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123");
            cy.contains("ยืนยันการเข้างาน").should("not.be.disabled");
            cy.get(".border-amber-200").should("not.exist");
        });

        it('should handle "paid" status (lowercase)', () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    eventId: 100,
                    paymentStatus: "paid",
                },
            });

            visitCheckin("123");
            cy.contains("ยืนยันการเข้างาน").should("not.be.disabled");
        });

        it("should display status badge for any payment status", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    paymentStatus: "PENDING",
                },
            });

            visitCheckin("123");
            cy.contains("Status")
                .parent()
                .within(() => {
                    cy.get("span").last().should("contain", "PENDING");
                });
        });
    });

    /**
     * TEST 12: Data Fallbacks & Edge Cases
     */
    describe("12. Edge Cases & Data Fallbacks", () => {
        it("should handle all null optional fields", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    userId: null,
                    eventId: null,
                    ticketTypeId: null,
                    quantity: null,
                    totalAmount: null,
                    paymentStatus: "PAID",
                    registrationDatetime: null,
                    paymentDatetime: null,
                    confirmationCode: null,
                    notes: null,
                    paymentMethod: null,
                    userFullName: null,
                    seatId: null,
                    seatLabel: null,
                    zoneName: null,
                    unitPrice: null,
                },
            });

            visitCheckin("123", "eventId=100");
            cy.contains("Reserved ID").parent().should("contain", "123");
            cy.contains("-").should("have.length.greaterThan", 0);
        });

        it("should handle very long user names", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    userFullName:
                        "This Is A Very Long User Name That Should Be Displayed Properly",
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123", "eventId=100");
            cy.contains("This Is A Very Long User Name").should("be.visible");
        });

        it("should handle very large seat numbers", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    seatLabel: "Section A Row 999 Seat 9999",
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123", "eventId=100");
            cy.contains("Section A Row 999 Seat 9999").should("be.visible");
        });

        it("should format very large prices correctly", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    unitPrice: 1234567.89,
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123", "eventId=100");
            cy.contains("1,234,567.89").should("be.visible");
        });

        it("should handle zero price", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    unitPrice: 0,
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123", "eventId=100");
            cy.contains("Price").parent().should("contain", "0");
        });

        it("should handle special characters in confirmation code", () => {
            cy.intercept("GET", "**/api/public/reservations/*", {
                body: {
                    reservedId: 123,
                    confirmationCode: "ABC-123_XYZ@2025",
                    paymentStatus: "PAID",
                },
            });

            visitCheckin("123", "eventId=100");
            cy.get(".font-mono").should("contain", "ABC-123_XYZ@2025");
        });
    });
});
