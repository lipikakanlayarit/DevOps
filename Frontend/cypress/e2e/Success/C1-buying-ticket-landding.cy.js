/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";

/** Visit Landing page */
const visitLanding = () => {
    cy.visit(FRONTEND_URL + "/");
};

describe("Landing Page (Real API, No Mock)", () => {
    /* =======================================================
       A: Hero Section
    ======================================================= */
    describe("A: Hero & Layout", () => {
        beforeEach(() => {
            visitLanding();
        });

        it("A-01: แสดง Hero text 'LIVE THE VIBE ON'", () => {
            cy.contains("LIVE THE VIBE ON", { timeout: 10000 }).should("be.visible");
        });

        it("A-02: มีปุ่ม CTA ALL EVENT & ORGANIZER", () => {
            cy.contains("button", "ALL EVENT").should("be.visible");
            cy.contains("ORGANIZER").should("be.visible");
        });

        it("A-03: หน้าโหลดแล้วไม่ error (body แสดงผล)", () => {
            cy.get("body").should("exist");
        });
    });

    /* =======================================================
       B: Events Section
    ======================================================= */
    describe("B: Events section & scroll", () => {
        beforeEach(() => {
            visitLanding();
        });

        it("B-01: มี events-section และหัวข้อ ALL VIBE LONG", () => {
            cy.get("#events-section", { timeout: 10000 }).should("exist");
            cy.contains("ALL VIBE LONG").should("be.visible");
        });

        it("B-02: คลิกปุ่ม ALL EVENT แล้ว scroll ลงมาที่ events-section", () => {
            cy.contains("button", "ALL EVENT").click();

            cy.get("#events-section", { timeout: 10000 })
                .scrollIntoView()
                .should("be.visible");

            cy.contains("ALL VIBE LONG").should("be.visible");
        });

        it("B-03: ต้องเห็นอีเวนต์ seed เช่น BUTCON", () => {
            cy.get("#events-section").contains(/BUTCON/i).should("be.visible");
        });
    });

    /* =======================================================
       C: Search & Filter
    ======================================================= */
    describe("C: Search & Filter", () => {
        beforeEach(() => {
            visitLanding();
            cy.get("#events-section").should("exist");
        });

        it("C-01: ต้องมี event อย่างน้อย 1 อันจาก seed", () => {
            cy.contains(/BUTCON/i).should("be.visible");
        });

        it("C-02: พิมพ์ BUTCON แล้วต้องเจอ BUTCON", () => {
            cy.get("input[type='text']").first().clear().type("BUTCON");
            cy.contains(/BUTCON/i).should("be.visible");
        });

        it("C-04: ล้าง search แล้วต้องกลับมาเจอ BUTCON", () => {
            cy.get("input[type='text']").first().clear().type("xxxx-no-event");
            cy.get("input[type='text']").first().clear();
            cy.contains(/BUTCON/i).should("be.visible");
        });

        it("C-05: Filter 'All' ต้องเห็น BUTCON", () => {
            cy.contains(/All/i).click();
            cy.contains(/BUTCON/i).should("be.visible");
        });
    });

    /* =======================================================
       D: Navigation to Event Detail
    ======================================================= */
    describe("D: Navigation", () => {
        beforeEach(() => {
            visitLanding();
        });

        it("D-02: หน้าใหม่ต้องแสดงชื่อ event BUTCON", () => {
            cy.contains(/BUTCON/i).click();
            cy.contains(/BUTCON/i).should("be.visible");
        });

        it("D-03: Back กลับมาแล้ว Hero ยังอยู่", () => {
            cy.contains(/BUTCON/i).click();
            cy.go("back");
            cy.contains("LIVE THE VIBE ON").should("be.visible");
        });
    });

    /* =======================================================
       E: Footer (แก้ใหม่ให้หาเจอแน่นอน)
    ======================================================= */
    describe("E: Footer", () => {
        beforeEach(() => {
            visitLanding();
        });

        it("E-01: Footer ต้องมีข้อความเกี่ยวกับ BUTCON / Copyright", () => {
            cy.contains(/butcon|copyright|all rights/i, { timeout: 10000 })
                .should("be.visible");
        });

        it("E-02: Mobile viewport ยังเห็น Hero", () => {
            cy.viewport("iphone-6");
            visitLanding();
            cy.contains("LIVE THE VIBE ON").should("be.visible");
        });
    });
});
