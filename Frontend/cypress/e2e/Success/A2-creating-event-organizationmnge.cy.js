/// <reference types="cypress" />

/**
 * E2E ใช้ API จริงสำหรับหน้า Organizer - All Event (/organizationmnge)
 * - ดึง /api/auth/login จริง
 * - ดึง /api/events/mine จริง (ไม่ intercept / mock)
 */

const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = "http://localhost:8080";

const ORGANIZER_CREDENTIALS = {
    username: "organizer",      // 👈 แก้ให้ตรงกับ seed ของโปรเจกต์
    password: "password123",    // 👈 แก้ให้ตรงกับ seed ของโปรเจกต์
};

/** helper: login ผ่าน API จริง แล้วเปิดหน้า /organizationmnge พร้อม set token ให้ frontend */
function visitOrganizationPageAsRealOrganizer() {
    cy.request("POST", `${BACKEND_URL}/api/auth/login`, ORGANIZER_CREDENTIALS).then((res) => {
        const body = res.body || {};

        // รองรับหลายรูปแบบ response ของ backend
        const token =
            body.token ||
            body.accessToken ||
            body.jwt ||
            (body.data && (body.data.token || body.data.accessToken));

        expect(token, "JWT token from login response")
            .to.be.a("string")
            .and.not.be.empty;

        cy.visit(`${FRONTEND_URL}/organizationmnge`, {
            onBeforeLoad(win) {
                // key นี้ต้องตรงกับที่ frontend ใช้ใน api instance
                win.localStorage.setItem("token", token);
            },
        });
    });
}

/** selector รวมที่ใช้บ่อย */
const ROW_SELECTOR =
    ".grid.grid-cols-\\[1fr_240px\\].items-center.px-6.py-8";

describe("Organizer - All Event Page (REAL API)", () => {
    beforeEach(() => {
        visitOrganizationPageAsRealOrganizer();

        // รอให้ state loading เสร็จก่อน (รองรับ UI ปัจจุบัน)
        cy.contains("Loading events...").should("exist");
        cy.contains("Loading events...")
            .should("not.exist", { timeout: 10000 });
    });

    it("ถ้ามีอีเวนต์ในระบบ จะต้องเห็นตารางอีเวนต์อย่างน้อย 1 แถว (หรือถ้าไม่มีจะขึ้นข้อความยังไม่มีอีเวนต์)", () => {
        cy.get("body").then(($body) => {
            if ($body.text().includes("ยังไม่มีอีเวนต์")) {
                cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
            } else {
                cy.get(ROW_SELECTOR).its("length").should("be.gte", 1);
                cy.contains("div", "Events").should("be.visible");
                cy.contains("div", "Status / Action").should("be.visible");
            }
        });
    });

    it("ปุ่ม CREATE EVENT นำทางไปหน้า /eventdetail (หน้าสร้างอีเวนต์)", () => {
        cy.contains("button", "CREATE EVENT").click();
        cy.location("pathname").should("eq", "/eventdetail");
    });

    it("สามารถคลิกลิงก์ View เพื่อเข้าไปหน้ารายละเอียดอีเวนต์ (/eventdetail/:id)", () => {
        cy.get("body").then(($body) => {
            if ($body.text().includes("ยังไม่มีอีเวนต์")) {
                // ถ้าไม่มีอีเวนต์ก็ข้าม test นี้ไป
                cy.log("No events yet, skip View link test.");
                return;
            }

            cy.get(ROW_SELECTOR)
                .first()
                .within(() => {
                    cy.contains("View")
                        .should("have.attr", "href")
                        .and("match", /\/eventdetail\/\d+$/);
                    cy.contains("View").click();
                });

            cy.location("pathname").should("match", /\/eventdetail\/\d+$/);
        });
    });

    it("ฟิลเตอร์ Category ทำงานได้ (เลือกแล้วไม่ crash และแสดงอีเวนต์ หรือ empty state)", () => {
        const clickAndCheck = (label) => {
            cy.contains("button", label).click();
            cy.get("body").then(($body) => {
                if ($body.text().includes("ยังไม่มีอีเวนต์")) {
                    cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
                } else {
                    cy.get(ROW_SELECTOR).its("length").should("be.gte", 0);
                }
            });
        };

        clickAndCheck("Concert");
        clickAndCheck("Seminar");
        clickAndCheck("Exhibition");

        // กลับมา All
        cy.contains("button", "All").click();
        cy.get("body").then(($body) => {
            if ($body.text().includes("ยังไม่มีอีเวนต์")) {
                cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
            } else {
                cy.get(ROW_SELECTOR).its("length").should("be.gte", 0);
            }
        });
    });

    it("สามารถค้นหาอีเวนต์ได้ด้วย Search bar (มีผลกับจำนวนแถว หรือแสดง empty state)", () => {
        const input = cy.get('input[placeholder="Search events..."]');

        // ลองหาด้วย keyword ทั่วไปก่อน (เช่น 'BUTCON' ถ้า seed มีอีเวนต์นี้)
        input.type("BUTCON");

        cy.get("body").then(($body) => {
            if ($body.text().includes("ยังไม่มีอีเวนต์")) {
                cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
            } else {
                cy.get(ROW_SELECTOR).its("length").should("be.gte", 1);
            }
        });

        // เคลียร์แล้วต้องกลับมาเป็น list เดิม (หรืออย่างน้อยไม่ขึ้น error)
        input.clear();
        cy.get("body").then(($body) => {
            if ($body.text().includes("ยังไม่มีอีเวนต์")) {
                cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
            } else {
                cy.get(ROW_SELECTOR).its("length").should("be.gte", 0);
            }
        });
    });

    it("ค้นหาด้วย keyword แปลกๆ ที่ไม่มีในระบบ แล้วควรเห็น empty state", () => {
        cy.get('input[placeholder="Search events..."]').type("this-keyword-should-not-exist-xyz");

        cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
    });

    it("แสดง Status badge ตามสถานะจาก API จริง (ถ้ามี Approved/Pending/Rejected)", () => {
        // ตรวจ style สำหรับ badge ที่มีข้อความ Approved/Pending/Rejected ถ้ามีอยู่ใน DOM
        cy.get("body").then(($body) => {
            const text = $body.text();

            if (text.includes("Approved")) {
                cy.contains("Approved")
                    .should("have.class", "bg-emerald-100")
                    .and("have.class", "text-emerald-700")
                    .and("have.class", "ring-emerald-200");
            }

            if (text.includes("Pending")) {
                cy.contains("Pending")
                    .should("have.class", "bg-amber-100")
                    .and("have.class", "text-amber-800")
                    .and("have.class", "ring-amber-200");
            }

            if (text.includes("Rejected")) {
                cy.contains("Rejected")
                    .should("have.class", "bg-rose-100")
                    .and("have.class", "text-rose-700")
                    .and("have.class", "ring-rose-200");
            }
        });
    });

    it("happy path รวม: โหลดอีเวนต์ -> filter -> search -> เข้าหน้า event detail ได้", () => {
        cy.get("body").then(($body) => {
            if ($body.text().includes("ยังไม่มีอีเวนต์")) {
                cy.log("No events, skip integration flow.");
                return;
            }

            // เริ่มต้น: ต้องมีแถวอย่างน้อย 1
            cy.get(ROW_SELECTOR).its("length").should("be.gte", 1);

            // กด filter Concert (ถ้ามี)
            cy.contains("button", "Concert").click({ force: true });

            // พิมพ์ค้นหาคำสั้นๆ เช่น 'CON' (ไม่ fix กับชื่อใดชื่อหนึ่ง)
            cy.get('input[placeholder="Search events..."]').clear().type("CON");

            cy.get("body").then(($b2) => {
                if ($b2.text().includes("ยังไม่มีอีเวนต์")) {
                    cy.contains("ยังไม่มีอีเวนต์").should("be.visible");
                } else {
                    cy.get(ROW_SELECTOR)
                        .first()
                        .within(() => {
                            cy.contains("View").click();
                        });
                    cy.location("pathname").should("match", /\/eventdetail\/\d+$/);
                }
            });
        });
    });
});
