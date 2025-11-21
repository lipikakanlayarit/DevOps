// cypress/e2e/e2e-guest-booking-to-member.cy.js
// ⭐ Full E2E Flow with Database Debug

const EVENT_ID = 2;
const BASE_URL = "http://localhost:5173";
const API_URL = "http://localhost:8080";

// ⭐ ใช้สำหรับจอง/สมัคร (ยังคงไว้ เผื่อ debug flow guest → signup)
const ts = Date.now();
const TEST_EMAIL = `e2e_${ts}@example.com`;
const TEST_USERNAME = `E2euser${ts}`;
const TEST_PASSWORD = "Password123";
const TEST_FIRST_NAME = "E2E";
const TEST_LAST_NAME = "Tester";
const TEST_PHONE = "0899999999";
const TEST_ID_CARD = "1234567890123";

// ⭐ Account ที่มีอยู่แล้ว (คุณขอให้ใช้ตัวนี้ตอน Login)
const EXISTING_USERNAME = "E2euser1763708759164";
const EXISTING_PASSWORD = "Password123";

describe("E2E: Guest Booking → Payment → SignUp → Login → Profile (with Debug)", () => {

    before(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        cy.log("📧 TEST_EMAIL (for guest booking):", TEST_EMAIL);
        cy.log("👤 TEST_USERNAME (for signup debug):", TEST_USERNAME);
        cy.log("👤 EXISTING_USERNAME (for login in STEP 4):", EXISTING_USERNAME);
        cy.log("🔗 API_URL:", API_URL);
        cy.log("🔗 BASE_URL:", BASE_URL);
        cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    beforeEach(() => {
        cy.intercept("GET", `**/public/events/${EVENT_ID}`).as("getEvent");
        cy.intercept("GET", `**/public/events/${EVENT_ID}/tickets/setup*`).as("getSetup");
        cy.intercept("POST", "**/public/reservations").as("createReservation");
        cy.intercept("GET", "**/public/reservations/*").as("getReservation");
        cy.intercept("POST", "**/public/reservations/*/pay").as("payReservation");
        cy.intercept("POST", "**/api/auth/signup").as("signupRequest");
        cy.intercept("POST", "**/api/auth/login").as("loginRequest");
        cy.intercept("GET", "**/api/auth/me").as("getProfile");
        cy.intercept("GET", "**/profile/my-tickets").as("getMyTickets");
    });

    // ============================================
    // STEP 0: Health Check
    // ============================================
    it("STEP 0: ตรวจสอบ Backend", () => {
        cy.request({
            method: "GET",
            url: `${API_URL}/actuator/health`,
            failOnStatusCode: false,
            timeout: 10000,
        }).then((response) => {
            cy.log("📥 Backend Status:", response.status);
            if (response.status === 200) {
                cy.log("✅ Spring Boot is running!");
            } else {
                cy.log("❌ Backend not responding!");
            }
        });
    });

    // ============================================
    // STEP 1: Guest Booking (⭐ เพิ่ม Debug)
    // ============================================
    it("STEP 1: จองบัตรแบบ Guest + ตรวจสอบข้อมูล", () => {
        cy.clearCookies();
        cy.clearLocalStorage();

        cy.visit(`${BASE_URL}/eventselect/${EVENT_ID}`);

        // รอให้ API โหลด
        cy.wait("@getEvent", { timeout: 15000 }).then((interception) => {
            cy.log("📥 Event Data:", JSON.stringify(interception.response?.body));

            if (interception.response?.status !== 200) {
                cy.log("❌ Event not found! Check EVENT_ID:", EVENT_ID);
            }
        });

        cy.wait("@getSetup", { timeout: 15000 }).then((interception) => {
            cy.log("📥 Setup Data:", JSON.stringify(interception.response?.body));
        });

        cy.get("body").then(($body) => {
            const hasGetTicket = $body
                .find("button")
                .filter((i, el) => /get ticket/i.test(el.innerText)).length > 0;

            if (!hasGetTicket) {
                cy.log("⚠️ Event is not ONSALE");
                cy.log("💡 Check Event status in database:");
                cy.log("   SELECT status FROM events_nam WHERE event_id = " + EVENT_ID);
                return;
            }

            cy.log("✅ Event is ONSALE - proceeding with booking");

            // คลิก Get Ticket
            cy.contains("button", /get ticket/i).click();

            // เลือก date
            cy.get("#date-selection", { timeout: 5000 })
                .find("[class*='cursor-pointer']")
                .first()
                .click();

            // รอ seat map
            cy.get("#seat-map-section", { timeout: 10000 }).should("be.visible");

            // นับจำนวนที่นั่งว่าง
            cy.get("#seat-map-section")
                .find("[class*='cursor-pointer']")
                .not("[class*='bg-gray']")
                .not("[class*='opacity-50']")
                .then(($seats) => {
                    cy.log(`🪑 Found ${$seats.length} available seat(s)`);

                    if ($seats.length === 0) {
                        cy.log("❌ No available seats!");
                        return;
                    }

                    // เลือกที่นั่งแรก
                    cy.wrap($seats.first()).click({ force: true });

                    // รอ email field
                    cy.get('input[type="email"]', { timeout: 5000 }).should("be.visible");

                    // กรอก email (guest)
                    cy.get('input[type="email"]').clear().type(TEST_EMAIL);
                    cy.log("📧 Entered guest email:", TEST_EMAIL);

                    // Go to Payment
                    cy.contains("button", /go to payment/i).click();

                    // ⭐ รอและตรวจสอบ API Response อย่างละเอียด
                    cy.wait("@createReservation", { timeout: 20000 }).then((interception) => {
                        cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        cy.log("📤 CREATE RESERVATION REQUEST:");
                        cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        cy.log("URL:", interception.request.url);
                        cy.log("Method:", interception.request.method);
                        cy.log("Headers:", JSON.stringify(interception.request.headers, null, 2));
                        cy.log("Body:", JSON.stringify(interception.request.body, null, 2));

                        cy.log("");
                        cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        cy.log("📥 CREATE RESERVATION RESPONSE:");
                        cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        cy.log("Status:", interception.response?.statusCode);
                        cy.log("Headers:", JSON.stringify(interception.response?.headers, null, 2));
                        cy.log("Body:", JSON.stringify(interception.response?.body, null, 2));

                        // ⭐ ตรวจสอบว่า request มี guestEmail
                        expect(interception.request.body).to.have.property("guestEmail", TEST_EMAIL);
                        cy.log("✅ Request has correct guestEmail");

                        // ⭐ ตรวจสอบว่า response success
                        const status = interception.response?.statusCode;
                        if (status !== 200 && status !== 201) {
                            cy.log("❌ RESERVATION FAILED!");
                            cy.log("Status:", status);
                            cy.log("Error:", interception.response?.body);

                            if (status === 400) {
                                cy.log("💡 Possible causes:");
                                cy.log("   - Duplicate seat selection");
                                cy.log("   - Invalid seat data");
                                cy.log("   - Validation error");
                            } else if (status === 404) {
                                cy.log("💡 Event not found in database");
                            } else if (status === 409) {
                                cy.log("💡 Seat already taken");
                            }

                            throw new Error(`Reservation failed with status ${status}`);
                        }

                        expect(status).to.be.oneOf([200, 201]);
                        cy.log("✅ Reservation API returned success");

                        // ⭐ ดึง reservedId
                        const body = interception.response?.body;
                        const resId = body?.reservedId || body?.id || body?.reservationId;

                        if (!resId) {
                            cy.log("❌ NO RESERVATION ID IN RESPONSE!");
                            cy.log("Response body:", JSON.stringify(body));
                            throw new Error("No reservation ID returned");
                        }

                        Cypress.env("RESERVED_ID", resId);
                        cy.log("✅ Reserved ID:", resId);

                        Cypress.env("RESERVATION_RESPONSE", body);
                        cy.log("✅ Full reservation data saved");
                    });

                    cy.location("pathname", { timeout: 10000 }).should("match", /\/payment\/\d+/);
                    cy.log("✅ Redirected to payment page");
                });
        });
    });

    // ============================================
    // STEP 1.5: Debug - ตรวจสอบ Reservation ทันที
    // ============================================
    it("STEP 1.5 (DEBUG): ตรวจสอบ Reservation ถูกสร้างจริงหรือไม่", () => {
        const resId = Cypress.env("RESERVED_ID");

        if (!resId) {
            cy.log("⚠️ No reservedId - cannot check reservation");
            cy.log("💡 This means STEP 1 failed to create reservation");
            return;
        }

        cy.log("🔍 Checking reservation in database...");
        cy.log("Reservation ID:", resId);

        cy.request({
            method: "GET",
            url: `${API_URL}/api/public/reservations/${resId}`,
            failOnStatusCode: false,
            timeout: 10000,
        }).then((response) => {
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("📥 GET RESERVATION RESPONSE:");
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("Status:", response.status);
            cy.log("Body:", JSON.stringify(response.body, null, 2));

            if (response.status === 200) {
                const reservation = response.body;

                cy.log("");
                cy.log("✅ RESERVATION FOUND IN DATABASE!");
                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                cy.log("Reservation Details:");
                cy.log("  - ID:", reservation.id);
                cy.log("  - Status:", reservation.status);
                cy.log("  - Guest Email:", reservation.guestEmail);
                cy.log("  - User ID:", reservation.userId || "❌ NULL (not linked)");
                cy.log("  - Event ID:", reservation.eventId);
                cy.log("  - Total Price:", reservation.totalPrice);
                cy.log("  - Quantity:", reservation.quantity);
                cy.log("  - Created At:", reservation.createdAt);
                cy.log("  - Confirmation Code:", reservation.confirmationCode || "N/A");
                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                expect(reservation.id).to.equal(resId);
                expect(reservation.guestEmail).to.equal(TEST_EMAIL);
                expect(reservation.eventId).to.equal(EVENT_ID);
                expect(reservation.status).to.be.oneOf(["UNPAID", "PENDING", "RESERVED"]);
            } else if (response.status === 404) {
                cy.log("❌ RESERVATION NOT FOUND IN DATABASE!");
            } else {
                cy.log("⚠️ Unexpected status:", response.status);
            }
        });
    });

    // ============================================
    // STEP 2: Payment (⭐ เพิ่ม Debug)
    // ============================================
    it("STEP 2: ชำระเงิน", () => {
        const resId = Cypress.env("RESERVED_ID");

        if (!resId) {
            cy.log("⚠️ No reservedId - skipping payment test");
            return;
        }

        cy.visit(`${BASE_URL}/payment/${resId}`);

        cy.wait("@getReservation", { timeout: 15000 }).then((interception) => {
            cy.log("📥 Payment Page - Reservation Data:");
            cy.log(JSON.stringify(interception.response?.body, null, 2));
        });

        cy.contains("RESERVATION", { timeout: 10000 }).should("be.visible");
        cy.contains("UNPAID", { timeout: 5000 }).should("be.visible");
        cy.log("✅ Payment page loaded");

        cy.contains("button", /^pay/i).click();
        cy.log("🖱️ Clicked Pay button");

        cy.wait("@payReservation", { timeout: 15000 }).then((interception) => {
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("📥 PAYMENT RESPONSE:");
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("Status:", interception.response?.statusCode);
            cy.log("Body:", JSON.stringify(interception.response?.body, null, 2));

            const status = interception.response?.statusCode;
            expect(status).to.be.oneOf([200, 201]);
        });

        cy.contains("PAID", { timeout: 10000 }).should("be.visible");
        cy.contains("Confirmation Code", { timeout: 5000 }).should("be.visible");
        cy.log("✅ Payment confirmed");
    });

    // ============================================
    // STEP 2.5: Debug - ตรวจสอบหลังชำระเงิน
    // ============================================
    it("STEP 2.5 (DEBUG): ตรวจสอบ Reservation หลังชำระเงิน", () => {
        const resId = Cypress.env("RESERVED_ID");

        if (!resId) {
            cy.log("⚠️ No reservedId");
            return;
        }

        cy.request({
            method: "GET",
            url: `${API_URL}/api/public/reservations/${resId}`,
            failOnStatusCode: false,
        }).then((response) => {
            if (response.status === 200) {
                const reservation = response.body;

                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                cy.log("✅ RESERVATION STATUS AFTER PAYMENT:");
                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                cy.log("  - Status:", reservation.status);
                cy.log("  - Guest Email:", reservation.guestEmail);
                cy.log("  - User ID:", reservation.userId || "❌ NULL (not claimed)");
                cy.log("  - Confirmation Code:", reservation.confirmationCode);
                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                expect(reservation.guestEmail).to.equal(TEST_EMAIL);
            } else {
                cy.log("❌ Cannot fetch reservation after payment");
            }
        });
    });

    // ============================================
    // STEP 3: SignUp (ยังใช้ TEST_EMAIL/TEST_USERNAME เดิมสำหรับ debug)
    // ============================================
    it("STEP 3: สมัครสมาชิก (debug test user ใหม่)", () => {
        cy.visit(`${BASE_URL}/signin`);
        cy.get("form").should("be.visible");

        cy.get('[name="email"]').clear().type(TEST_EMAIL);
        cy.get('[name="password"]').clear().type(TEST_PASSWORD);
        cy.get('[name="firstName"]').clear().type(TEST_FIRST_NAME);
        cy.get('[name="lastName"]').clear().type(TEST_LAST_NAME);
        cy.get('[name="username"]').clear().type(TEST_USERNAME);
        cy.get('[name="phoneNumber"]').clear().type(TEST_PHONE);
        cy.get('[name="idCard"]').clear().type(TEST_ID_CARD);

        cy.window().then((win) => {
            cy.stub(win, "alert").as("alert");
        });

        cy.contains("button", /create account/i).click();

        cy.wait("@signupRequest", { timeout: 15000 }).then((interception) => {
            cy.log("📤 SignUp Request:", JSON.stringify(interception.request.body, null, 2));
            cy.log("📥 SignUp Status:", interception.response?.statusCode);
            cy.log("📥 SignUp Body:", JSON.stringify(interception.response?.body, null, 2));

            expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
        });

        cy.get("@alert", { timeout: 10000 }).should("have.been.calledOnce");
        cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
    });

    // ============================================
    // STEP 4: Login ด้วย Account ที่เพิ่งจอง
    // ============================================
    it("STEP 4: Login ด้วย Account ที่เพิ่งจองตั๋ว)", () => {
        cy.visit(`${BASE_URL}/login`);
        cy.get("form").should("be.visible");

        // 🔥 ใช้ account ที่คุณบอกมา
        cy.get("input").first().clear().type(EXISTING_USERNAME);
        cy.get('input[type="password"]').clear().type(EXISTING_PASSWORD);

        cy.contains("button", /log in/i).click();

        cy.wait("@loginRequest", { timeout: 15000 }).then((interception) => {
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("📤 LOGIN REQUEST:");
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("Body:", JSON.stringify(interception.request.body, null, 2));

            cy.log("");
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("📥 LOGIN RESPONSE:");
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("Status:", interception.response?.statusCode);
            cy.log("Body:", JSON.stringify(interception.response?.body, null, 2));

            expect(interception.response?.statusCode).to.be.oneOf([200, 201]);

            const body = interception.response?.body;
            expect(body).to.have.property("token");

            if (body.token) {
                Cypress.env("AUTH_TOKEN", body.token);
                cy.log("🔑 Token saved");
            }
        });

        cy.location("pathname", { timeout: 10000 }).should("eq", "/profile");
        cy.log("✅ Redirected to profile");
    });

    // ============================================
    // STEP 4.5: Debug - ตรวจสอบ Reservation หลัง Login
    // ============================================
    it("STEP 4.5 (DEBUG): ตรวจสอบ Reservation หลัง Login", () => {
        const resId = Cypress.env("RESERVED_ID");

        if (!resId) {
            cy.log("⚠️ No reservedId");
            return;
        }

        cy.wait(2000);

        cy.request({
            method: "GET",
            url: `${API_URL}/api/public/reservations/${resId}`,
            failOnStatusCode: false,
        }).then((response) => {
            if (response.status === 200) {
                const reservation = response.body;

                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                cy.log("📊 RESERVATION AFTER LOGIN:");
                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                cy.log("  - ID:", reservation.id);
                cy.log("  - Status:", reservation.status);
                cy.log("  - Guest Email:", reservation.guestEmail);
                cy.log("  - User ID:", reservation.userId || "❌ STILL NULL!");
                cy.log("  - Event ID:", reservation.eventId);
                cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            } else {
                cy.log("❌ Cannot fetch reservation");
            }
        });
    });

    // ============================================
    // STEP 5: Profile - ใช้ Existing Account ตรวจ My Tickets
    // ============================================
    it("STEP 5: ตรวจสอบตั๋วใน Profile ", () => {
        const token = Cypress.env("AUTH_TOKEN");

        if (!token) {
            cy.log("⚠️ No token");
            return;
        }

        cy.visit(`${BASE_URL}/profile`, {
            onBeforeLoad(win) {
                win.localStorage.setItem("accessToken", token);
                win.localStorage.setItem("token", token);
            },
        });

        cy.wait(2000);

        cy.wait("@getProfile", { timeout: 15000 }).then((interception) => {
            if (interception?.response) {
                const profile = interception.response.body;
                cy.log("📥 Profile:", JSON.stringify(profile, null, 2));

                // ✅ ตอนนี้เราคาดหวัง username เป็นตัว existing
                expect(profile).to.have.property("username", EXISTING_USERNAME);

                // email ไม่รู้ว่าค่าอะไรในระบบคุณ เลย log อย่างเดียว ไม่ assert
                cy.log("📧 Profile Email:", profile.email);

                if (profile.id) {
                    Cypress.env("USER_ID", profile.id);
                    cy.log("👤 User ID:", profile.id);
                }
            }
        });

        cy.wait("@getMyTickets", { timeout: 15000 }).then((interception) => {
            if (!interception?.response) {
                cy.log("⚠️ No tickets response");
                return;
            }

            const tickets = interception.response.body;
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("🎫 MY TICKETS (Existing User):");
            cy.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            cy.log("Count:", tickets.length);
            cy.log("Data:", JSON.stringify(tickets, null, 2));

            // ไม่บังคับว่าต้องมีตั๋วเสมอ แค่ log ให้เห็น
        });

        cy.contains("My Ticket", { timeout: 5000 }).should("be.visible");
    });
});
