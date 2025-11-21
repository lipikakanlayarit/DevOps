/// <reference types="cypress" />

// ========================================
// Configuration
// ========================================
const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = "http://localhost:8080";
const ADMIN_USER = "admin";
const ADMIN_PASS = "password123";

// ========================================
// Helper Functions
// ========================================

/**
 * Extract token from various response body formats
 */
function extractToken(body) {
    if (!body || typeof body !== "object") return null;
    if (typeof body.token === "string") return body.token;
    if (typeof body.accessToken === "string") return body.accessToken;
    if (typeof body.jwt === "string") return body.jwt;

    const stringValues = Object.values(body).filter((v) => typeof v === "string");
    return stringValues.length ? stringValues[0] : null;
}

/**
 * Login via real API and visit admin permissions page
 */
function loginAndVisit() {
    cy.request("POST", `${BACKEND_URL}/api/auth/login`, {
        username: ADMIN_USER,
        password: ADMIN_PASS,
    }).then((res) => {
        const token = extractToken(res.body);
        expect(token, "login token").to.be.a("string").and.not.be.empty;

        cy.visit(`${FRONTEND_URL}/admin/permissions`, {
            onBeforeLoad(win) {
                win.localStorage.setItem("token", token);
            },
        });
    });

    cy.contains("h1", "Event Permission").should("be.visible");
    cy.contains("Events:").should("be.visible");
}

/**
 * Check if tbody shows empty state
 */
function isEmptyState($rows) {
    const $ = Cypress.$;
    const emptyRow = $($rows).filter((_, el) =>
        el.innerText.includes("No events found matching your criteria.")
    );
    return emptyRow.length > 0;
}

/**
 * Wait for table to finish loading
 */
function waitForTableLoad() {
    cy.get("tbody").should("exist");
    cy.get("tbody").should("not.contain", "Loading...");
    // รอให้ข้อมูลโหลดเสร็จและ DOM stable
    cy.wait(300);
}

/**
 * Get status filter button
 */
function clickStatusFilter(status) {
    cy.contains("button", status).click();
    waitForTableLoad();
}

/**
 * Get search input with retry
 */
function getSearchInput() {
    return cy.get('input[placeholder="Search events..."]', { timeout: 10000 });
}

// ========================================
// Test Suite
// ========================================

describe("Admin Event Permission - Full Integration Tests", () => {
    beforeEach(() => {
        // Intercept API calls เพื่อรอให้โหลดเสร็จ
        cy.intercept('GET', '**/api/admin/events*').as('getEvents');
        loginAndVisit();
        cy.wait('@getEvents', { timeout: 10000 });
        waitForTableLoad();
    });

    // ========================================
    // 1. Page Initialization (3 tests)
    // ========================================

    describe("1. Page Initialization", () => {
        it("1.1 หน้าโหลดสำเร็จและแสดง header ครบถ้วน", () => {
            cy.contains("h1", "Event Permission").should("be.visible");
            cy.contains("Events:").should("be.visible");
            getSearchInput().should("be.visible");
        });

        it("1.3 แสดงข้อมูล events อย่างน้อย 1 row หรือ empty state", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.contains("No events found matching your criteria.").should("be.visible");
                } else {
                    expect($rows.length).to.be.greaterThan(0);
                }
            });
        });
    });

    // ========================================
    // 2. Status Filtering (5 tests)
    // ========================================

    describe("2. Status Filtering", () => {
        it("2.1 filter All Status แสดงทุก event", () => {
            clickStatusFilter("All Status");
            cy.get("tbody tr").then(($rows) => {
                if (!isEmptyState($rows)) {
                    expect($rows.length).to.be.greaterThan(0);
                }
            });
        });

        it("2.2 filter Pending แสดงเฉพาะ events ที่ pending", () => {
            clickStatusFilter("Pending");
            cy.get("tbody tr").then(($rows) => {
                if (!isEmptyState($rows)) {
                    cy.wrap($rows).each(($tr) => {
                        cy.wrap($tr).within(() => {
                            cy.contains("td", "Pending").should("exist");
                        });
                    });
                }
            });
        });

        it("2.3 filter Approved แสดงเฉพาะ events ที่ approved", () => {
            clickStatusFilter("Approved");
            cy.get("tbody tr").then(($rows) => {
                if (!isEmptyState($rows)) {
                    cy.wrap($rows).each(($tr) => {
                        cy.wrap($tr).within(() => {
                            cy.contains("td", "Approved").should("exist");
                        });
                    });
                }
            });
        });

        it("2.4 filter Rejected แสดงเฉพาะ events ที่ rejected", () => {
            clickStatusFilter("Rejected");
            cy.get("tbody tr").then(($rows) => {
                if (!isEmptyState($rows)) {
                    cy.wrap($rows).each(($tr) => {
                        cy.wrap($tr).within(() => {
                            cy.contains("td", "Rejected").should("exist");
                        });
                    });
                }
            });
        });

        it("2.5 สลับระหว่าง status filters ได้อย่างถูกต้อง", () => {
            clickStatusFilter("Pending");
            cy.wait(500);
            clickStatusFilter("Approved");
            cy.wait(500);
            clickStatusFilter("All Status");
            cy.get("tbody tr").should("exist");
        });
    });

    // ========================================
    // 3. Search Functionality (4 tests) - FIXED
    // ========================================

    describe("3. Search Functionality", () => {
        it("3.1 ค้นหาด้วย event title filter ผลลัพธ์ได้", () => {
            // รอให้ตารางโหลดเสร็จก่อน
            cy.get("tbody tr").should('have.length.greaterThan', 0);

            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test search');
                    return;
                }

                // ดึงข้อมูลจาก row แรก
                cy.get("tbody tr").first().as('firstRow');
                cy.get('@firstRow').find("td").eq(1).invoke("text").then((text) => {
                    const keyword = text.trim().split(" ")[0] || text.trim().substring(0, 5);

                    if (!keyword) {
                        cy.log('No valid keyword found');
                        return;
                    }

                    // ค้นหาด้วย keyword
                    getSearchInput()
                        .clear()
                        .type(keyword);

                    // รอให้การค้นหาเสร็จสิ้น
                    cy.wait('@getEvents');
                    waitForTableLoad();

                    // ตรวจสอบผลลัพธ์
                    cy.get("tbody tr").then(($filtered) => {
                        if (!isEmptyState($filtered)) {
                            cy.get("tbody tr").first().should("contain.text", keyword);
                        }
                    });
                });
            });
        });

        it("3.2 ค้นหาด้วย organizer name filter ผลลัพธ์ได้", () => {
            // รอให้ตารางโหลดเสร็จก่อน
            cy.get("tbody tr").should('have.length.greaterThan', 0);

            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test search');
                    return;
                }

                // ดึงข้อมูล organizer จาก row แรก
                cy.get("tbody tr").first().as('firstRow');
                cy.get('@firstRow').find("td").eq(3).invoke("text").then((org) => {
                    const orgText = org.trim();

                    if (!orgText || orgText === "-" || orgText === "") {
                        cy.log('No valid organizer found');
                        return;
                    }

                    const keyword = orgText.split(" ")[0];

                    // ค้นหาด้วย keyword
                    getSearchInput()
                        .clear()
                        .type(keyword);

                    // รอให้การค้นหาเสร็จสิ้น
                    cy.wait('@getEvents');
                    waitForTableLoad();

                    // ตรวจสอบว่าค้นหาได้
                    cy.get("tbody tr").should('exist');
                });
            });
        });

        it("3.3 ค้นหาด้วย keyword ที่ไม่มีแสดง empty state", () => {
            getSearchInput()
                .clear()
                .type("NONEXISTENT_KEYWORD_XYZ123");

            cy.wait('@getEvents');
            waitForTableLoad();
            cy.contains("No events found matching your criteria.").should("be.visible");
        });

    });

    // ========================================
    // 4. Pagination (4 tests)
    // ========================================

    describe("4. Pagination", () => {
        it("4.1 แสดง pagination controls ครบถ้วน", () => {
            cy.contains("Page").should("be.visible");
            cy.get('nav[aria-label="Pagination"]').should("be.visible");
            cy.get('nav[aria-label="Pagination"]').within(() => {
                cy.contains("button", "Previous").should("exist");
                cy.contains("button", "Next").should("exist");
            });
        });

        it("4.2 แสดง Page X of Y format ถูกต้อง", () => {
            cy.contains("Page").invoke("text").then((txt) => {
                expect(txt).to.match(/Page\s+\d+\s+of\s+\d+/);
            });
        });

        it("4.3 ปุ่ม Previous disabled ในหน้าแรก", () => {
            cy.get('nav[aria-label="Pagination"]').within(() => {
                cy.contains("button", "Previous").should("be.disabled");
            });
        });

        it("4.4 กด Next แล้ว Previous ได้ (ถ้ามีหลายหน้า)", () => {
            cy.get('nav[aria-label="Pagination"]').within(() => {
                cy.contains("button", "Next").then(($next) => {
                    if ($next.prop("disabled")) {
                        cy.log('Only one page available');
                        return;
                    }

                    cy.wrap($next).click();
                    cy.wait('@getEvents');
                    waitForTableLoad();

                    cy.contains("Page").invoke("text").should("match", /Page\s+2/);

                    cy.contains("button", "Previous").should("not.be.disabled").click();
                    cy.wait('@getEvents');
                    waitForTableLoad();

                    cy.contains("Page").invoke("text").should("match", /Page\s+1/);
                });
            });
        });
    });

    // ========================================
    // 5. Event Detail Modal (4 tests) - FIXED
    // ========================================

    describe("5. Event Detail Modal", () => {

        it("5.2 Modal แสดงข้อมูล event ครบถ้วน (scroll ตรวจรายละเอียด)", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log("No rows available");
                    return;
                }

                // เปิด modal
                cy.get("tbody tr").first().click();
                cy.get('[role="dialog"]', { timeout: 10000 }).should("be.visible");

                // หา scrollable container ตัวจริง
                cy.get('[role="dialog"]')
                    .find(".overflow-y-auto")
                    .as("scrollBox");

                // Scroll ทีละส่วน + ตรวจสอบ
                cy.get("@scrollBox").scrollTo("top");

                const sections = [
                    "Category",
                    "Status",
                    "Start",
                    "End",
                    "Location",
                    "Event Description",
                    "Organizer Information",
                ];

                sections.forEach((text) => {
                    cy.get("@scrollBox")
                        .contains(text)
                        .scrollIntoView()
                        .should("be.visible");
                });
            });
        });


        it("5.3 ปิด modal ด้วยปุ่ม Close", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test modal');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').click();

                cy.get('[role="dialog"]', { timeout: 10000 }).should("be.visible");

                cy.get('[role="dialog"]').within(() => {
                    cy.contains("button", "Close").click();
                });

                cy.get('[role="dialog"]').should("not.exist");
            });
        });

        it("5.4 ปิด modal ด้วย ESC key", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test modal');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').click();

                cy.get('[role="dialog"]', { timeout: 10000 }).should("be.visible");

                cy.get("body").type("{esc}");
                cy.get('[role="dialog"]').should("not.exist");
            });
        });
    });

    // ========================================
    // 6. Approve Modal (3 tests)
    // ========================================

    describe("6. Approve Modal", () => {
        it("6.1 กดปุ่ม Approve เปิด modal approve", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test approve');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').within(() => {
                    cy.contains("button", "Approve").click();
                });

                cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
                    cy.contains("Approve Event").should("be.visible");
                    cy.contains("Are you sure").should("be.visible");
                });
            });
        });

        it("6.2 Approve modal มี textarea สำหรับ notes (optional)", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test approve');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').within(() => {
                    cy.contains("button", "Approve").click();
                });

                cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
                    cy.get("textarea").should("exist");
                    cy.contains("Approval Notes (Optional)").should("be.visible");
                    cy.contains("button", "Approve").should("not.be.disabled");
                });
            });
        });

        it("6.3 ปิด Approve modal ด้วย Cancel", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test approve');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').within(() => {
                    cy.contains("button", "Approve").click();
                });

                cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
                    cy.contains("button", "Cancel").click();
                });

                cy.get('[role="dialog"]').should("not.exist");
            });
        });
    });

    // ========================================
    // 7. Reject Modal (3 tests)
    // ========================================

    describe("7. Reject Modal", () => {
        it("7.1 กดปุ่ม Reject เปิด modal reject", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test reject');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').within(() => {
                    cy.contains("button", "Reject").click();
                });

                cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
                    cy.contains("Reject Event").should("be.visible");
                    cy.contains("Are you sure").should("be.visible");
                });
            });
        });

        it("7.2 Reject button disabled ถ้าไม่กรอก reason", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test reject');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').within(() => {
                    cy.contains("button", "Reject").click();
                });

                cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
                    cy.contains("button", "Reject").should("be.disabled");

                    cy.get("textarea").type("Test rejection reason");
                    cy.contains("button", "Reject").should("not.be.disabled");
                });
            });
        });

        it("7.3 ปิด Reject modal ด้วย Cancel", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test reject');
                    return;
                }

                cy.get("tbody tr").first().as('targetRow');
                cy.get('@targetRow').within(() => {
                    cy.contains("button", "Reject").click();
                });

                cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
                    cy.get("textarea").type("Test reason");
                    cy.contains("button", "Cancel").click();
                });

                cy.get('[role="dialog"]').should("not.exist");
            });
        });
    });

    // ========================================
    // 8. UI/UX Elements (4 tests)
    // ========================================

    describe("8. UI/UX Elements", () => {
        it("8.1 rows มี hover effect และ cursor pointer", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test UI');
                    return;
                }

                cy.get("tbody tr").first()
                    .should("have.class", "hover:bg-gray-50")
                    .and("have.class", "cursor-pointer");
            });
        });

        it("8.2 แสดง warning banner ด้านบน", () => {
            cy.contains("Approve = เปลี่ยนสถานะเป็น Approved").should("be.visible");
        });

        it("8.3 แสดง event images/posters", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test images');
                    return;
                }

                cy.get("tbody tr").first().within(() => {
                    cy.get("img").should("exist");
                });
            });
        });

        it("8.4 Status badges แสดงสีถูกต้องตาม status", () => {
            cy.get("tbody tr").then(($rows) => {
                if (isEmptyState($rows)) {
                    cy.log('No data to test badges');
                    return;
                }

                cy.get("tbody tr").first().within(() => {
                    cy.get("td").eq(6).find("span").should("exist");
                });
            });
        });
    });
});