/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";
const EVENT_ID = 1;

/**
 * Login ด้วย API จริง แล้วเข้า /admin/eventdetail?id=EVENT_ID
 */
const loginAndVisitAdminEventDetail = (username = "admin", password = "password123") => {
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

        cy.visit(`${FRONTEND_URL}/admin/eventdetail?id=${EVENT_ID}`, {
            onBeforeLoad(win) {
                win.localStorage.setItem("token", token);
                win.localStorage.setItem("tokenTimestamp", String(Date.now()));
            },
        });
    });
};

describe("Admin Event Detail Page (Real API, Event ID 1)", () => {
    /* =======================================================
       A: Basic layout & event info
    ======================================================= */
    describe("A: Basic event info", () => {
        beforeEach(() => {
            loginAndVisitAdminEventDetail();
        });

        it("A-01: แสดงหัวข้อ Event Management", () => {
            cy.contains("Event Management", { timeout: 10000 }).should("be.visible");
        });

        it("A-02: แสดงชื่ออีเวนต์", () => {
            cy.contains("BUTCON Music Fest 2025", { timeout: 10000 }).should("be.visible");
        });

        it("A-03: มี Ticket Zones + Reservations", () => {
            cy.contains("Ticket Zones").should("be.visible");
            cy.contains("Reservations").should("be.visible");
        });

        it("A-04: แสดง Seat Stats (Available / Reserved / Sold)", () => {
            cy.contains("Available Seat:").should("be.visible");
            cy.contains("Reserved Seat:").should("be.visible");
            cy.contains("Sold Seat:").should("be.visible");
        });
    });

    /* =======================================================
       B: Ticket Zones (B03/B04 ใหม่)
    ======================================================= */
    describe("B: Ticket zones & seat stats", () => {
        beforeEach(() => {
            loginAndVisitAdminEventDetail();
        });

        it("B-01: ตาราง Ticket Zones มี header สำคัญ", () => {
            cy.get("table")
                .first()
                .within(() => {
                    cy.contains("th", "Ticket Zone").should("be.visible");
                    cy.contains("th", "Row").should("be.visible");
                    cy.contains("th", "Column").should("be.visible");
                });
        });

        it("B-02: มีแถวข้อมูลใน Ticket Zones อย่างน้อย 1 แถว", () => {
            cy.get("table")
                .first()
                .find("tbody tr")
                .should("have.length.at.least", 1);
        });

        /* -------------------------
           ⭐ B-03 (ใหม่): ตรวจสอบว่า Zone แรกต้องมีราคา (ไม่ใช่ค่าว่าง)
        --------------------------*/
        it("B-03: Zone แรกควรมีราคาแสดง (Price/ticket > 0)", () => {
            cy.get("table")
                .first()
                .find("tbody tr")
                .first()
                .find("td")
                .eq(4) // คอลัมน์ Price/ticket
                .invoke("text")
                .then((text) => {
                    const num = Number(text.replace(/[^0-9]/g, ""));
                    expect(num, "price numeric").to.be.greaterThan(0);
                });
        });
    });

    /* =======================================================
       C: Reservations table
    ======================================================= */
    describe("C: Reservations", () => {
        beforeEach(() => {
            loginAndVisitAdminEventDetail();
        });

        it("C-01: Header Reservations ครบ", () => {
            cy.get("table")
                .last()
                .within(() => {
                    cy.contains("th", "RESERVED").should("be.visible");
                    cy.contains("th", "DATE").should("be.visible");
                    cy.contains("th", "SEAT ID").should("be.visible");
                    cy.contains("th", "TOTAL").should("be.visible");
                });
        });

        it("C-02: หากมีแถว ต้องมี USER หรือ PAYMENT METHOD โชว์", () => {
            cy.get("table")
                .last()
                .find("tbody tr")
                .then(($rows) => {
                    if ($rows.length === 0) {
                        cy.contains("No reservations").should("be.visible");
                    } else {
                        cy.contains("USER").should("exist");
                    }
                });
        });

        it("C-03: Filter ALL ยังต้องมี table แสดง", () => {
            cy.contains("button", "All").click();
            cy.get("table").last().should("exist");
        });
    });

    /* =======================================================
       D: Organizer Modal
    ======================================================= */
    describe("D: Organizer detail modal", () => {
        beforeEach(() => {
            loginAndVisitAdminEventDetail();
        });

        it("D-01: เปิด Organizer Modal ได้", () => {
            cy.contains("button", "Organizer detail", { timeout: 10000 }).click();
            cy.contains("Organizer Details", { timeout: 10000 }).should("be.visible");
        });

        it("D-02: ปิด Organizer Modal ได้", () => {
            cy.contains("button", "Organizer detail").click();
            cy.contains("Organizer Details").should("be.visible");

            cy.contains("button", "Close").click();
            cy.contains("Organizer Details").should("not.exist");
        });
    });

    /* =======================================================
       E: Access Control
    ======================================================= */
    describe("E: Access control", () => {
        it("E-01: organizer ไม่ควรเห็น Event Management", () => {
            loginAndVisitAdminEventDetail("organizer", "password123");
            cy.get("body").should("not.contain", "Event Management");
        });

        it("E-02: user ปกติไม่ควรเห็น Event Management", () => {
            loginAndVisitAdminEventDetail("alice123", "password123");
            cy.get("body").should("not.contain", "Event Management");
        });
    });
});
