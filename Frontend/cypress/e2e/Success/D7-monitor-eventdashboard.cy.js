// cypress/e2e/eventdashboard.cy.js
/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";
const EVENT_ID = 1; // BUTCON Music Fest 2025 (seed event_id = 1)

/**
 * Login ด้วย API จริง แล้วเข้า /eventdashboard/:eventId
 * ใช้ได้กับทุก role (admin / organizer / alice123)
 */
const loginAndVisitEventDashboard = (
    username = "organizer",
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

        cy.visit(`${FRONTEND_URL}/eventdashboard/${EVENT_ID}`, {
            onBeforeLoad(win) {
                // EventDashboard อ่าน token จาก localStorage ผ่าน readToken()
                // โดยหาจาก key: authToken, accessToken, token, jwt, Authorization
                win.localStorage.setItem("token", token);
                win.localStorage.setItem("tokenTimestamp", String(Date.now()));
            },
        });
    });
};

describe("Event Dashboard Page (Real API)", () => {
    /* =======================================================
       A: Basic layout & header
    ======================================================= */
    describe("A: Basic layout & header", () => {
        beforeEach(() => {
            // ใช้ organizer เพราะ dashboard API เป็น /api/organizer/...
            loginAndVisitEventDashboard("organizer", "password123");
        });

        it("A-01: แสดงหัวข้อ Event Dashboard", () => {
            cy.contains("Event Dashboard", { timeout: 15000 }).should("be.visible");
        });

        it("A-02: แสดง Event ID ตรงกับที่เปิด (1)", () => {
            cy.contains("Event ID:", { timeout: 15000 })
                .should("be.visible")
                .and("contain.text", EVENT_ID.toString());
        });

        it("A-03: แสดงการ์ดสถิติหลัก 3 ใบ (Net Payout, Total Ticket Sold, Total Summary)", () => {
            cy.contains("Net Payout (THB)").should("be.visible");
            cy.contains("Total Ticket Sold").should("be.visible");
            cy.contains("Total Summary").should("be.visible");
        });

        it("A-04: การ์ด Net Payout แสดงจำนวนเงิน (มีตัวเลขอย่างน้อยหนึ่งตัว)", () => {
            cy.contains("Net Payout (THB)")
                .closest("section")
                .within(() => {
                    cy.get("div")
                        .contains(/\d/)
                        .should("exist");
                });
        });
    });

    /* =======================================================
       B: Seat summary badges & donut
    ======================================================= */
    describe("B: Seat summary & donut", () => {
        beforeEach(() => {
            loginAndVisitEventDashboard("organizer", "password123");
        });

        it("B-01: แสดง badge Available / Reserved / Sold Seat", () => {
            cy.contains("Available Seat :").should("be.visible");
            cy.contains("Reserved Seat :").should("be.visible");
            cy.contains("Sold Seat :").should("be.visible");
        });

        it("B-02: มีช่อง search 'Search reservations...'", () => {
            cy.get('input[placeholder="Search reservations..."]', {
                timeout: 10000,
            }).should("be.visible");
        });

        it("B-03: การ์ด Total Summary แสดงเปอร์เซ็นต์ใน donut (เช่น 40%)", () => {
            cy.contains("Total Summary")
                .closest("section")
                .within(() => {
                    cy.contains(/\d+%/).should("exist");
                });
        });

        it("B-04: การ์ด Total Ticket Sold แสดงรูปแบบ X / Y", () => {
            cy.contains("Total Ticket Sold")
                .closest("section")
                .within(() => {
                    cy.contains(/\d+\s*\/\s*\d+/).should("exist");
                });
        });
    });

    /* =======================================================
       C: Reservation table & search
    ======================================================= */
    describe("C: Reservation table & search", () => {
        beforeEach(() => {
            loginAndVisitEventDashboard("organizer", "password123");
        });

        const getRowsContainer = () =>
            cy
                .contains("Reserve ID", { timeout: 15000 })
                .closest("div") // header grid div
                .next(); // rows container div (min-w-[900px] divide-y...)

        it("C-01: Header ตารางต้องมี Reserve ID, Seat(s), Total, User, Status", () => {
            cy.contains("Reserve ID").should("be.visible");
            cy.contains("Seat(s)").should("be.visible");
            cy.contains("Total").should("be.visible");
            cy.contains("User").should("be.visible");
            cy.contains("Status").should("be.visible");
        });

        it("C-02: มี container สำหรับ rows ของ reservation", () => {
            getRowsContainer().should("exist");
        });

        it("C-03: พิมพ์คำมั่วให้ search แล้วจำนวน row ต้องเป็น 0", () => {
            cy.get('input[placeholder="Search reservations..."]', {
                timeout: 10000,
            })
                .clear()
                .type("no-such-reservation-xxxxx");

            getRowsContainer()
                .children()
                .should("have.length", 0);
        });
    });


    /* =======================================================
       E: Attendance section (Check-in)
    ======================================================= */
    describe("E: Attendance (Check-in) section", () => {
        beforeEach(() => {
            loginAndVisitEventDashboard("organizer", "password123");
        });

        it("E-01: แสดงหัวข้อ Attendance (Check-in)", () => {
            cy.contains("Attendance (Check-in)", { timeout: 15000 }).should(
                "be.visible"
            );
        });

        it("E-02: แสดงสถิติ Checked-in และ No-show", () => {
            cy.contains("Attendance (Check-in)")
                .parent()
                .within(() => {
                    cy.contains("Checked-in:").should("be.visible");
                    cy.contains("No-show:").should("be.visible");
                });
        });

        it("E-03: มีหัวข้อย่อย 'เข้าร่วมแล้ว' และ 'ยังไม่เช็คอิน'", () => {
            cy.contains("เข้าร่วมแล้ว").should("be.visible");
            cy.contains("ยังไม่เช็คอิน").should("be.visible");
        });
    });

    /* =======================================================
       F: Access control (non-organizer)
    ======================================================= */
    describe("F: Access control (real accounts)", () => {
        it("F-01: admin เข้าหน้า /eventdashboard/1 แล้วต้องไม่เห็น Attendance (Check-in) หรือมี error แสดง", () => {
            loginAndVisitEventDashboard("admin", "password123");

            cy.location("pathname", { timeout: 15000 }).then((path) => {
                if (path.includes("/login")) {
                    // ถูก redirect ไปหน้า login
                    cy.contains(/sign in|login|เข้าสู่ระบบ/i).should("be.visible");
                } else {
                    // อยู่หน้าเดิมแต่โหลดไม่ได้ → ต้องมี error หรือไม่มี title หลัก
                    cy.get("body").then(($body) => {
                        if ($body.text().includes("โหลดข้อมูลไม่สำเร็จ")) {
                            cy.contains("โหลดข้อมูลไม่สำเร็จ").should("be.visible");
                        } else {
                            cy.contains("Attendance (Check-in)").should("not.exist");
                        }
                    });
                }
            });
        });
    });
});
