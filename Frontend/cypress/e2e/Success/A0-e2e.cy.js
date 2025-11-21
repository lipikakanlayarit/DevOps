/// <reference types="cypress" />

// ใช้ eventId = 1 ตามสเปก
const EVENT_ID = 1;

const BASE_URL = Cypress.env("BASE_URL") || "http://localhost:5173";
const API_URL = Cypress.env("API_URL") || "http://localhost:8080";

// ======================
// Helpers
// ======================

/**
 * Login ผ่าน API (ไม่ intercept) แล้วเก็บ token ไว้ใน Cypress.env
 */
function loginByApiAndSave(envKey, username, password) {
    return cy
        .request({
            method: "POST",
            url: `${API_URL}/api/auth/login`,
            body: { username, password },
            failOnStatusCode: false,
        })
        .then((resp) => {
            expect(resp.status, "login status").to.eq(200);

            // รองรับทั้ง {token: "..."} หรือ body เป็น string
            const token =
                resp.body?.token ??
                resp.body?.accessToken ??
                (typeof resp.body === "string" ? resp.body : null);

            // มีค่าอะไรก็ได้ แค่ไม่ undefined/null
            expect(token, "JWT token should exist").to.exist;

            Cypress.env(envKey, String(token));
        });
}

const TEST_USER_PASSWORD = "Password123";

/**
 * สร้าง user ใหม่ผ่าน /api/auth/signup แล้ว login ผ่าน API
 * เพื่อให้แต่ละเทสต์ใช้ user ว่าง ๆ (ไม่มีตั๋วเก่าใน /profile)
 */
function createNewTestUserAndLogin(envKey) {
    const ts = Date.now();
    const rand = Cypress._.random(1000, 9999);

    const email = `qrtest_${ts}_${rand}@example.com`;
    const username = `qruser_${ts}_${rand}`;
    const password = TEST_USER_PASSWORD;

    return cy
        .request({
            method: "POST",
            url: `${API_URL}/api/auth/signup`,
            body: {
                email,
                password,
                firstName: "QR",
                lastName: "Tester",
                username,
                phoneNumber: "0800000000",
                idCard: "1234567890123",
            },
            failOnStatusCode: false,
        })
        .then((resp) => {
            expect(resp.status, "signup status").to.be.oneOf([200, 201]);
        })
        .then(() => {
            // login ด้วย user ที่เพิ่งสร้าง แล้วเก็บ token ไว้ใน Cypress.env
            return loginByApiAndSave(envKey, username, password);
        });
}

/**
 * visit path พร้อม set token เข้า localStorage ก่อน load หน้า
 */
function visitWithToken(path, envKey) {
    const token = Cypress.env(envKey);
    cy.visit(`${BASE_URL}${path}`, {
        onBeforeLoad(win) {
            if (token) {
                win.localStorage.setItem("accessToken", token);
                win.localStorage.setItem("token", token);
            }
        },
    });
}

/**
 * เลือกที่นั่งตัวใดก็ได้ใน SeatMap
 *
 * NOTE: ใช้:
 *   - หาปุ่ม (button) ใน #seat-map-section
 *   - ตัดปุ่มที่ disabled ทิ้ง
 *   - คลิกปุ่มแรก
 */
function pickAnyAvailableSeat() {
    // ให้แน่ใจว่า section ขึ้นก่อน
    cy.get("#seat-map-section", { timeout: 10000 }).should("be.visible");

    cy.log("🔎 Looking for any enabled <button> inside #seat-map-section ...");

    cy.get("#seat-map-section", { timeout: 10000 })
        .find("button")
        .not("[disabled]")
        .then(($buttons) => {
            const count = $buttons.length;
            cy.log(`🪑 Found ${count} enabled button(s) inside seat-map-section`);

            if (count === 0) {
                throw new Error(
                    "No clickable buttons found inside #seat-map-section – check if tickets are on sale and SeatMap renders seats as <button>."
                );
            }

            cy.wrap($buttons.first()).click({ force: true });
        });
}

/**
 * ดึง Check-in URL จาก popup ตั๋วในหน้า Profile
 */
function extractCheckinUrlFromTicketPopup() {
    return cy
        .contains("Check-in URL")
        .parent()
        .find(".font-mono")
        .invoke("text")
        .then((txt) => txt.trim());
}

// ==============================
// 1) Guest Reservation → Signup
// ==============================

describe("Guest Reservation → Signup → Ticket appears in Profile (eventId=1)", () => {
    const ts = Date.now();
    const GUEST_EMAIL = `guest_${ts}@example.com`;
    const NEW_USERNAME = `G${ts}`;
    const NEW_PASSWORD = "Password123";

    let eventMeta = {
        name: "",
        startDatetime: "",
        venueName: "",
        venueAddress: "",
    };

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();

        cy.intercept("GET", `**/public/events/${EVENT_ID}`).as("getEvent");
        cy.intercept(
            "GET",
            `**/public/events/${EVENT_ID}/tickets/setup*`
        ).as("getSetup");
        cy.intercept("POST", "**/public/reservations").as("createReservation");
        cy.intercept("GET", "**/public/reservations/*").as("getReservationPublic");
        cy.intercept("POST", "**/public/reservations/*/pay").as("payReservation");
        cy.intercept("POST", "**/api/auth/signup").as("signupRequest");
        cy.intercept("POST", "**/api/auth/login").as("loginRequest");
        cy.intercept("GET", "**/api/auth/me").as("getProfile");
        cy.intercept("GET", "**/profile/my-tickets").as("getMyTickets");
    });

    it("Guest books ticket, pays, signs up with same email, and sees ticket in My Tickets", () => {
        // 1) Guest opens /eventselect/1
        cy.visit(`${BASE_URL}/eventselect/${EVENT_ID}`);

        cy.wait("@getEvent").then((interception) => {
            const body = interception.response?.body || {};
            eventMeta.name = body.eventName || "";
            eventMeta.startDatetime =
                body.startDatetime || body.startDateTime || "";
            eventMeta.venueName = body.venueName || "";
            eventMeta.venueAddress = body.venueAddress || "";
        });

        cy.wait("@getSetup");

        // ปุ่ม "Get Ticket"
        cy.contains("button", /get ticket/i, { timeout: 10000 }).click();

        // เลือกวันที่ใน #date-selection
        cy.get("#date-selection", { timeout: 10000 })
            .find("[class*='cursor-pointer'], button, [role='button']")
            .first()
            .click();

        // เลือกที่นั่ง
        pickAnyAvailableSeat();

        // Guest email field
        cy.get('input[type="email"]', { timeout: 5000 })
            .should("be.visible")
            .clear()
            .type(GUEST_EMAIL);

        // Go to payment
        cy.contains("button", /go to payment/i).click();

        let reservedId;

        cy.wait("@createReservation").then((interception) => {
            const statusCode = interception.response?.statusCode;
            expect(statusCode).to.be.oneOf([200, 201]);

            const body = interception.response?.body || {};
            reservedId =
                body.reservedId || body.id || body.reservationId || body.resvId;
            expect(reservedId, "reservedId from reservation API").to.exist;

            // ยืนยันว่ามี guestEmail ส่งไป
            expect(interception.request.body).to.have.property(
                "guestEmail",
                GUEST_EMAIL
            );

            Cypress.env("GUEST_RESERVED_ID", String(reservedId));
        });

        cy.location("pathname", { timeout: 10000 }).should(
            "match",
            /\/payment\/\d+$/
        );

        // 2) จ่ายเงิน
        cy.wait("@getReservationPublic");

        cy.contains("RESERVATION").should("be.visible");
        cy.contains(/UNPAID/i).should("be.visible");

        cy.contains("button", /^pay/i).click();

        cy.wait("@payReservation").then((interception) => {
            const statusCode = interception.response?.statusCode;
            expect(statusCode).to.be.oneOf([200, 201]);
        });

        cy.contains(/PAID/i, { timeout: 10000 }).should("be.visible");
        cy.contains(/Confirmation Code/i, { timeout: 10000 }).should(
            "be.visible"
        );

        // 3) ไปหน้า signup (/signin)
        cy.visit(`${BASE_URL}/signin`);
        cy.get("form").should("be.visible");

        cy.get('[name="email"]').clear().type(GUEST_EMAIL);
        cy.get('[name="password"]').clear().type(NEW_PASSWORD);
        cy.get('[name="firstName"]').clear().type("Guest");
        cy.get('[name="lastName"]').clear().type("Flow");
        cy.get('[name="username"]').clear().type(NEW_USERNAME);
        cy.get('[name="phoneNumber"]').clear().type("0812345678");
        cy.get('[name="idCard"]').clear().type("1234567890123");

        cy.window().then((win) => {
            cy.stub(win, "alert").as("signupAlert");
        });

        cy.contains("button", /create account/i).click();

        cy.wait("@signupRequest").then((interception) => {
            const statusCode = interception.response?.statusCode;
            expect(statusCode).to.be.oneOf([200, 201]);
        });

        cy.get("@signupAlert", { timeout: 10000 }).should("have.been.called");
        cy.location("pathname", { timeout: 10000 }).should("eq", "/login");

        // 4) Login ด้วย account ใหม่
        cy.get("form").should("be.visible");
        cy.get("input").first().clear().type(NEW_USERNAME);
        cy.get('input[type="password"]').clear().type(NEW_PASSWORD);

        cy.contains("button", /log in/i).click();

        cy.wait("@loginRequest").then((interception) => {
            const statusCode = interception.response?.statusCode;
            expect(statusCode).to.be.oneOf([200, 201]);
            const token =
                interception.response?.body?.token ??
                interception.response?.body?.accessToken;
            expect(token, "login token").to.exist;
            Cypress.env("NEW_USER_TOKEN", token);
        });

        cy.location("pathname", { timeout: 10000 }).should("eq", "/profile");

        // 5) Profile → My Tickets
        cy.wait("@getProfile");
        cy.wait("@getMyTickets").then((interception) => {
            const tickets = interception.response?.body || [];

            const t = tickets.find(
                (it) =>
                    String(it.eventId ?? it.event_id) === String(EVENT_ID) ||
                    String(it.event_id) === String(EVENT_ID)
            );

            expect(
                t,
                "ticket for eventId=1 in /profile/my-tickets"
            ).to.exist;

            if (eventMeta.name) {
                expect(t.eventName || t.title).to.eq(eventMeta.name);
            }
            if (eventMeta.venueName) {
                expect(t.venue || t.venueName).to.eq(eventMeta.venueName);
            }
            expect(
                t.showDate || t.showDatetime || t.show_datetime,
                "show date/datetime"
            ).to.exist;

            const rowLabel = t.rowLabel ?? t.row ?? "";
            const seatNo = t.seatNumber ?? t.seat_no ?? t.col ?? "";
            const seatLabel = `${rowLabel}${seatNo}`.trim();
            expect(seatLabel, "seat label").to.not.eq("");
        });

        if (eventMeta.name) {
            cy.contains(eventMeta.name).should("exist");
        }
    });
});

// ==========================================
// 2) Paid vs Unpaid QR Check-in (fresh user)
// ==========================================

describe(
    "Paid vs Unpaid QR Check-in behaviour (fresh user per test)",
    () => {
        const USER_KEY = "QR_TEST_USER_TOKEN";

        beforeEach(() => {
            cy.clearCookies();
            cy.clearLocalStorage();

            // intercept ไว้ดู traffic / sync กับหน้าจอ
            cy.intercept("GET", `**/public/events/${EVENT_ID}`).as("getEvent");
            cy.intercept(
                "GET",
                `**/public/events/${EVENT_ID}/tickets/setup*`
            ).as("getSetup");
            cy.intercept("POST", "**/public/reservations").as(
                "createReservation"
            );
            cy.intercept("GET", "**/public/reservations/*").as(
                "getReservationPublic"
            );
            cy.intercept("POST", "**/public/reservations/*/pay").as(
                "payReservation"
            );
            cy.intercept("GET", "**/profile/my-tickets").as("getMyTickets");

            // ✨ แทนที่จะใช้ alice123 → สร้าง user ใหม่ทุกเทสต์
            createNewTestUserAndLogin(USER_KEY);
        });

        it("Case A – UNPAID: check-in page shows unpaid message and disabled button", () => {
            // -------- Reserve but DO NOT pay --------
            visitWithToken(`/eventselect/${EVENT_ID}`, USER_KEY);

            cy.wait("@getEvent");
            cy.wait("@getSetup");

            cy.contains("button", /get ticket/i, { timeout: 10000 }).click();

            cy.get("#date-selection", { timeout: 10000 })
                .find("[class*='cursor-pointer'], button, [role='button']")
                .first()
                .click();

            pickAnyAvailableSeat();

            cy.contains("button", /go to payment/i).click();

            let reservedId;

            cy.wait("@createReservation").then((interception) => {
                const status = interception.response?.statusCode;
                expect(status).to.be.oneOf([200, 201]);

                const body = interception.response?.body || {};
                reservedId =
                    body.reservedId ||
                    body.id ||
                    body.reservationId ||
                    body.resvId;
                expect(reservedId).to.exist;

                // เก็บไว้ใช้เช็คกับ check-in URL
                Cypress.env("QR_UNPAID_RESERVED_ID", String(reservedId));
            });

            cy.location("pathname", { timeout: 10000 }).should(
                "match",
                /\/payment\/\d+$/
            );

            // -------- Profile → Last (and only) ticket → Check-in URL --------
            // user นี้เพิ่งสร้างขึ้น → ไม่มีตั๋วเก่า → การ์ดใบแรกคือใบที่เราจอง
            visitWithToken("/profile", USER_KEY);

            cy.wait("@getMyTickets");

            cy.get(".myticket-scope .myticket-card", { timeout: 10000 })
                .first()
                .click();

            extractCheckinUrlFromTicketPopup().then((checkinUrl) => {
                const expectedResId = Cypress.env("QR_UNPAID_RESERVED_ID");
                if (expectedResId) {
                    // make sure URL เป็น /checkin/:reservedId?... ตามที่ต้องการ
                    expect(checkinUrl).to.contain(`/checkin/${expectedResId}`);
                }

                cy.visit(checkinUrl);

                cy.contains("ไม่ได้ชำระเงิน", { timeout: 10000 }).should(
                    "be.visible"
                );
                cy.contains("จึงไม่สามารถเช็คอินได้", {
                    timeout: 10000,
                }).should("be.visible");

                cy.contains("button", "ยืนยันการเข้างาน").should(
                    "be.disabled"
                );
            });
        });

        it("Case B – PAID: check-in page allows confirm and redirects to eventdashboard/:eventId", () => {
            // -------- Reserve and PAY --------
            visitWithToken(`/eventselect/${EVENT_ID}`, USER_KEY);

            cy.wait("@getEvent");
            cy.wait("@getSetup");

            cy.contains("button", /get ticket/i, { timeout: 10000 }).click();

            cy.get("#date-selection", { timeout: 10000 })
                .find("[class*='cursor-pointer'], button, [role='button']")
                .first()
                .click();

            pickAnyAvailableSeat();

            cy.contains("button", /go to payment/i).click();

            let reservedId;

            cy.wait("@createReservation").then((interception) => {
                const status = interception.response?.statusCode;
                expect(status).to.be.oneOf([200, 201]);

                const body = interception.response?.body || {};
                reservedId =
                    body.reservedId ||
                    body.id ||
                    body.reservationId ||
                    body.resvId;
                expect(reservedId).to.exist;

                Cypress.env("QR_PAID_RESERVED_ID", String(reservedId));
            });

            cy.location("pathname", { timeout: 10000 }).should(
                "match",
                /\/payment\/\d+$/
            );

            // ชำระเงินบน Payment Page
            cy.wait("@getReservationPublic");
            cy.contains(/UNPAID/i).should("be.visible");

            cy.contains("button", /^pay/i).click();

            cy.wait("@payReservation").then((interception) => {
                const status = interception.response?.statusCode;
                expect(status).to.be.oneOf([200, 201]);
            });

            cy.contains(/PAID/i, { timeout: 10000 }).should("be.visible");

            // -------- Profile → ticket → Check-in URL --------
            visitWithToken("/profile", USER_KEY);
            cy.wait("@getMyTickets");

            // เช่นเดียวกัน user นี้มีเฉพาะตั๋วที่เพิ่งจอง
            cy.get(".myticket-scope .myticket-card", { timeout: 10000 })
                .first()
                .click();

            extractCheckinUrlFromTicketPopup().then((checkinUrl) => {
                const expectedResId = Cypress.env("QR_PAID_RESERVED_ID");
                if (expectedResId) {
                    expect(checkinUrl).to.contain(`/checkin/${expectedResId}`);
                }

                cy.visit(checkinUrl);

                cy.contains("button", "ยืนยันการเข้างาน", { timeout: 10000 })
                    .should("be.visible")
                    .and("not.be.disabled")
                    .click();

                cy.location("pathname", { timeout: 10000 }).should(
                    "eq",
                    `/eventdashboard/${EVENT_ID}`
                );
            });
        });
    }
);

// ===========================================
// 3) Organizer Dashboard - View Event with Paid Tickets
// ===========================================

describe("Organizer Dashboard - View event with at least 1 paid ticket", () => {
    const ORG_KEY = "ORG2_TOKEN";

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();

        // intercept สำหรับ dashboard (เรียกจาก Eventdashboard.tsx ผ่าน fetch)
        // buildApiUrl(`/api/organizer/events/${eventId}/dashboard`)
        cy.intercept("GET", "**/api/organizer/events/*/dashboard").as("getEventDashboard");

        // Login เป็น organizer2 ผ่าน API แล้วเก็บ token ไว้ใน Cypress.env
        loginByApiAndSave(ORG_KEY, "organizer2", "password123");
    });

    it("organizer2 logs in, selects event, and sees dashboard with at least 1 paid ticket", () => {
        // --- 1) ดึง event ที่เป็นของ organizer2 จาก API จริง /api/events/mine ---
        const token = Cypress.env(ORG_KEY);
        expect(token, "ORG2 token must exist").to.exist;

        let selectedEventId;

        cy.request({
            method: "GET",
            url: `${API_URL}/api/events/mine`,
            headers: {
                // Eventdashboard.tsx ใช้ Bearer token ใน header
                Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
                Accept: "application/json",
            },
            failOnStatusCode: false,
        }).then((resp) => {
            expect(resp.status, "status /api/events/mine").to.eq(200);
            const events = resp.body || [];
            expect(events, "events list").to.be.an("array").and.not.to.be.empty;

            const first = events[0];
            selectedEventId = first.id ?? first.eventId;
            expect(selectedEventId, "selectedEventId").to.exist;

            cy.log(`🎫 Using eventId = ${selectedEventId} for organizer2 dashboard test`);
        });

        // --- 2) เปิดหน้า Eventdetail/{id} (เหมือน user คลิก View จาก All Event) ---
        cy.then(() => {
            const eid = selectedEventId;
            visitWithToken(`/eventdetail/${eid}`, ORG_KEY);
        });

        // บนหน้า Eventdetail.tsx จะมี header "Edit Event" หรือ "Event Details"
        cy.contains(/Edit Event|Event Details/i, { timeout: 10000 }).should("be.visible");

        // --- 3) ไปหน้า eventdashboard/{id} (เหมือนกดจาก Sidebar) ---
        cy.then(() => {
            const eid = selectedEventId;
            visitWithToken(`/eventdashboard/${eid}`, ORG_KEY);
        });

        // --- 4) รอ dashboard API และเช็คว่ามีอย่างน้อย 1 แถวสถานะ PAID ---
        cy.wait("@getEventDashboard", { timeout: 15000 }).then((interception) => {
            const res = interception.response;
            expect(res, "dashboard response").to.exist;
            expect(res.statusCode, "status dashboard").to.eq(200);

            const body = res.body || {};
            const rows = Array.isArray(body.rows) ? body.rows : [];
            cy.log(`📊 Dashboard returned ${rows.length} rows`);

            // แปลง status เป็น COMPLETE/UNPAID ตาม logic normalizePaid ใน Eventdashboard.tsx
            const hasPaid = rows.some((r) => {
                const raw = String(r.status || "").trim().toUpperCase();
                return raw === "PAID";
            });

            expect(hasPaid, "should have at least 1 PAID reservation row").to.be.true;
        });

        // --- 5) เช็ค UI เบา ๆ ว่า dashboard แสดง summary จริง ---
        cy.contains(/Total Ticket Sold/i, { timeout: 10000 }).should("be.visible");
        cy.contains(/Net Payout/i, { timeout: 10000 }).should("be.visible");

        // มีคำว่า "Paid" ในสรุป (เช่น Legend / summary text)
        cy.get("body").invoke("text").then((txt) => {
            expect(txt, "UI should mention Paid").to.match(/Paid/i);
        });

        cy.log("✅ Organizer2 can open dashboard and backend reports at least 1 PAID ticket");
    });
});
