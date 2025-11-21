// cypress/e2e/admin-usermnge.cy.js
/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";

/**
 * Login ด้วย API จริง แล้วเข้า /admin/usermnge
 * ใช้ได้กับทุก role: admin / organizer / alice123
 */
const loginAndVisitAdminUserMng = (
    username = "admin",
    password = "password123"
) => {
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

        cy.visit(`${FRONTEND_URL}/admin/usermnge`, {
            onBeforeLoad(win) {
                win.localStorage.setItem("token", token);
                win.localStorage.setItem("tokenTimestamp", String(Date.now()));
            },
        });
    });
};

describe("Admin User Management Page (/admin/usermnge, Real API)", () => {
    /* =======================================================
       A: Basic layout & Attendee tab
    ======================================================= */
    describe("A: Basic layout & Attendee tab", () => {
        beforeEach(() => {
            loginAndVisitAdminUserMng("admin", "password123");
        });

        it("A-01: แสดงหัวข้อ User Management และ default เป็นแท็บ Attendee", () => {
            cy.contains("h1", "User Management", { timeout: 10000 }).should(
                "be.visible"
            );
            cy.contains("button", "Attendee")
                .should("have.class", "bg-black")
                .and("have.class", "text-white");
            cy.contains("Attendees:").should("be.visible");
        });

        it("A-03: Attendees ต้องมีอย่างน้อย 1 แถวข้อมูล", () => {
            cy.get("tbody tr", { timeout: 10000 }).should(
                "have.length.at.least",
                1
            );
        });
    });

    /* =======================================================
       B: Tab switching Attendee <-> Organizer
    ======================================================= */
    describe("B: Tab switching between Attendee and Organizer", () => {
        beforeEach(() => {
            loginAndVisitAdminUserMng("admin", "password123");
        });

        it("B-02: แท็บ Organizer ต้องมีอย่างน้อย 1 แถวข้อมูล (ถ้ามีนักจัดงานในระบบ)", () => {
            cy.contains("button", "Organizer", { timeout: 10000 }).click();
            cy.get("tbody tr", { timeout: 10000 }).should(
                "have.length.at.least",
                1
            );
        });
    });

    /* =======================================================
       C: Search attendees (ใช้ข้อมูลจริง)
    ======================================================= */
    describe("C: Search Attendee list", () => {
        beforeEach(() => {
            loginAndVisitAdminUserMng("admin", "password123");
        });

        const attendeeSearchInput = () =>
            cy.get('input[placeholder="Search attendees..."]', {
                timeout: 10000,
            });

        it("C-01: ค้นหา alice123 แล้วควรเจอ alice123 ในตาราง (seed USER)", () => {
            attendeeSearchInput().clear().type("alice123");
            cy.get("tbody tr", { timeout: 10000 })
                .should("have.length.at.least", 1)
                .first()
                .should("contain.text", "alice123");
        });

        it("C-02: ค้นหาด้วย email บางส่วน เช่น alice@", () => {
            attendeeSearchInput().clear().type("alice@");
            cy.get("tbody tr", { timeout: 10000 }).should(
                "have.length.at.least",
                1
            );
        });

        it("C-03: ค้นหาคำมั่ว ๆ แล้วต้องไม่เหลือแถวในตาราง", () => {
            attendeeSearchInput().clear().type("no-such-attendee-xxxx");
            cy.get("tbody tr", { timeout: 10000 }).should("have.length", 0);
        });

        it("C-04: ล้าง search แล้วกลับมามีแถวข้อมูลอย่างน้อย 1 แถว", () => {
            attendeeSearchInput().clear().type("no-such-attendee-xxxx");
            cy.get("tbody tr", { timeout: 10000 }).should("have.length", 0);

            attendeeSearchInput().clear();
            cy.get("tbody tr", { timeout: 10000 }).should(
                "have.length.at.least",
                1
            );
        });
    });

    /* =======================================================
       D: Search organizers
    ======================================================= */
    describe("D: Search Organizer list", () => {
        beforeEach(() => {
            loginAndVisitAdminUserMng("admin", "password123");
            cy.contains("button", "Organizer", { timeout: 10000 }).click();
        });

        const organizerSearchInput = () =>
            cy.get('input[placeholder="Search organizers..."]', {
                timeout: 10000,
            });

        it("D-01: ค้นหาด้วยคำว่า organizer แล้วต้องมีอย่างน้อย 1 แถว (username organizer)", () => {
            organizerSearchInput().clear().type("organizer");
            cy.get("tbody tr", { timeout: 10000 }).should(
                "have.length.at.least",
                1
            );
        });

        it("D-02: ค้นหาคำมั่ว ๆ แล้วตารางต้องว่าง", () => {
            organizerSearchInput().clear().type("no-such-organizer-xxxx");
            cy.get("tbody tr", { timeout: 10000 }).should("have.length", 0);
        });
    });

    /* =======================================================
       E: Attendee detail modal & ticket history
    ======================================================= */
    describe("E: Attendee detail modal & ticket history", () => {
        beforeEach(() => {
            loginAndVisitAdminUserMng("admin", "password123");
        });

        const openFirstAttendeeDetail = () => {
            cy.get("tbody tr", { timeout: 10000 })
                .first()
                .within(() => {
                    cy.contains("View detail", { timeout: 10000 }).click();
                });
        };

        it("E-01: คลิก View detail แถวแรก แล้วเปิด modal Ticket History ได้", () => {
            openFirstAttendeeDetail();

            cy.get(".fixed.inset-0", { timeout: 10000 }).should("be.visible");
            cy.contains("Ticket History", { timeout: 10000 }).should(
                "be.visible"
            );
        });

        it("E-02: ใน modal ต้องมีช่อง search Ticket History", () => {
            openFirstAttendeeDetail();

            cy.contains("Ticket History", { timeout: 10000 }).should(
                "be.visible"
            );
            cy.get('.fixed.inset-0 input[placeholder="Search..."]', {
                timeout: 10000,
            }).should("exist");
        });

        it("E-03: คลิก overlay (พื้นหลังดำ) แล้ว modal ต้องปิด", () => {
            openFirstAttendeeDetail();

            cy.get(".fixed.inset-0", { timeout: 10000 }).click("topLeft");
            cy.get(".fixed.inset-0").should("not.exist");
        });
    });

    /* =======================================================
       F: Organizer detail modal & event history
    ======================================================= */
    describe("F: Organizer detail modal & event history", () => {
        beforeEach(() => {
            loginAndVisitAdminUserMng("admin", "password123");
            cy.contains("button", "Organizer", { timeout: 10000 }).click();
        });

        const openFirstOrganizerDetail = () => {
            cy.get("tbody tr", { timeout: 10000 })
                .first()
                .within(() => {
                    cy.contains("View detail", { timeout: 10000 }).click();
                });
        };

        it("F-01: เปิด Organizer detail modal แล้วต้องเห็น Event History", () => {
            openFirstOrganizerDetail();

            cy.get(".fixed.inset-0", { timeout: 10000 }).should("be.visible");
            cy.contains("Event History", { timeout: 10000 }).should(
                "be.visible"
            );
        });

        it("F-02: ใน modal ฝั่ง organizer ต้องมีข้อมูล Name / Phone Number / Address / Email", () => {
            openFirstOrganizerDetail();

            cy.contains("Name").should("be.visible");
            cy.contains("Phone Number").should("be.visible");
            cy.contains("Address").should("be.visible");
            cy.contains("Email").should("be.visible");
        });

        it("F-03: ปิด Organizer modal ด้วยการคลิก overlay", () => {
            openFirstOrganizerDetail();

            cy.get(".fixed.inset-0", { timeout: 10000 }).click("topLeft");
            cy.get(".fixed.inset-0").should("not.exist");
        });
    });

    /* =======================================================
       G: Access control (real accounts)
    ======================================================= */
    describe("G: Access control with non-admin accounts", () => {
        it("G-01: organizer (organizer/password123) ไม่ควรเห็นหน้า User Management", () => {
            loginAndVisitAdminUserMng("organizer", "password123");

            cy.get("body", { timeout: 10000 }).should(
                "not.contain",
                "User Management"
            );
        });

        it("G-02: user ปกติ (alice123/password123) ไม่ควรเห็นหน้า User Management", () => {
            loginAndVisitAdminUserMng("alice123", "password123");

            cy.get("body", { timeout: 10000 }).should(
                "not.contain",
                "User Management"
            );
        });
    });
});
