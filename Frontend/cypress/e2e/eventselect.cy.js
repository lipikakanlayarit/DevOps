/// <reference types="cypress" />

const FRONTEND_URL = "http://localhost:5173";
const EVENT_ID = 123;

/* ==============================
   Mock Data Helpers
   ============================== */

const baseEvent = {
    id: EVENT_ID,
    eventName: "Rock The Night",
    categoryId: 1,
    startDatetime: "2025-01-10T19:00:00Z",
    endDatetime: "2025-01-10T22:00:00Z",
    description: "This is a test event description.",
    venueName: "Impact Arena",
    venueAddress: "Bangkok, Thailand",
    updatedAt: "2025-01-01T00:00:00Z",
    coverUpdatedAt: "2025-01-02T00:00:00Z",
    salesStartDatetime: null,
    salesEndDatetime: null,
};

function makeSetupOnSale() {
    // ใช้ now = 2025-01-05 12:00:00Z
    return {
        seatRows: 5,
        seatColumns: 5,
        zones: [
            {
                id: 1,
                name: "VIP",
                price: 2500,
                rows: 5,
                cols: 5,
                occupiedSeats: [],
                ticketTypeId: 10,
            },
            {
                id: 2,
                name: "Regular",
                price: 1500,
                rows: 5,
                cols: 5,
                occupiedSeats: [],
                ticketTypeId: 11,
            },
        ],
        minPerOrder: 1,
        maxPerOrder: 6,
        active: true,
        salesStartDatetime: "2025-01-01T00:00:00Z",
        salesEndDatetime: "2025-01-31T23:59:59Z",
        occupiedSeatMap: [], // ไม่มีใครจอง
    };
}

function makeSetupUpcoming() {
    return {
        ...makeSetupOnSale(),
        salesStartDatetime: "2025-02-01T00:00:00Z", // > now
        salesEndDatetime: "2025-02-28T23:59:59Z",
    };
}

function makeSetupOffsale() {
    return {
        ...makeSetupOnSale(),
        salesStartDatetime: "2024-12-01T00:00:00Z",
        salesEndDatetime: "2024-12-31T23:59:59Z", // < now
    };
}

/**
 * mock GET /public/events/:id และ /public/events/:id/tickets/setup
 */
function mockInitialApis({
                             event = baseEvent,
                             setup = makeSetupOnSale(),
                             delayEvent = 0,
                             delaySetup = 0,
                         } = {}) {
    cy.intercept("GET", `**/public/events/${EVENT_ID}`, {
        statusCode: 200,
        delay: delayEvent,
        body: event,
    }).as("getEvent");

    cy.intercept("GET", `**/public/events/${EVENT_ID}/tickets/setup`, {
        statusCode: 200,
        delay: delaySetup,
        body: setup,
    }).as("getSetup");

    // cover image
    cy.intercept("GET", `**/public/events/${EVENT_ID}/cover*`, {
        statusCode: 200,
        body: "",
    }).as("getCover");
}

/**
 * ใช้ใน GoToPayment → refetch setup ล่าสุด
 */
function mockSetupRefetch(setup) {
    cy.intercept(
        "GET",
        `**/public/events/${EVENT_ID}/tickets/setup?t=*`,
        (req) => {
            req.reply({
                statusCode: 200,
                body: setup,
            });
        }
    ).as("refetchSetup");
}

/**
 * ไปหน้า /eventselect/:id แบบกำหนด clock & mock
 */
function visitEventselect({
                              event = baseEvent,
                              setup = makeSetupOnSale(),
                              delayEvent = 0,
                              delaySetup = 0,
                              freezeNow = "2025-01-05T12:00:00Z",
                              withToken = false,
                          } = {}) {
    // fix เวลาให้ status logic คงที่
    cy.clock(new Date(freezeNow).getTime(), ["Date"]);

    mockInitialApis({ event, setup, delayEvent, delaySetup });

    cy.visit(`${FRONTEND_URL}/eventselect/${EVENT_ID}`, {
        onBeforeLoad(win) {
            if (withToken) {
                win.localStorage.setItem("token", "fake-user-token");
            } else {
                win.localStorage.removeItem("token");
                win.localStorage.removeItem("accessToken");
                win.sessionStorage.removeItem("token");
                win.sessionStorage.removeItem("accessToken");
            }
        },
    });

    cy.wait("@getEvent");
    cy.wait("@getSetup");
}

/* ==============================
   TEST SUITE (P0 + P1)
   ============================== */

describe("Eventselect / Booking Page (P0 + P1)", () => {
    /* ----------------------------------
     * P0 - 1.2 Initial Data Loading
     * ---------------------------------- */
    describe("P0 - Initial Data Loading", () => {
        it("loads event and setup via Promise.all and renders hero & zones", () => {
            visitEventselect();

            cy.contains(baseEvent.eventName).should("be.visible");
            cy.contains("Show Date").should("be.visible");
            cy.contains("Sale Opening Date").should("be.visible");
            cy.contains("Ticket Prices").should("be.visible");

            // Zones in Ticket Prices
            cy.contains("฿ 2,500").should("contain", "VIP");
            cy.contains("฿ 1,500").should("contain", "Regular");
        });

        it("handles API error gracefully (page not crashing)", () => {
            cy.clock(new Date("2025-01-05T12:00:00Z").getTime(), ["Date"]);

            cy.intercept("GET", `**/public/events/${EVENT_ID}`, {
                statusCode: 500,
                body: { error: "Internal error" },
            }).as("getEventErr");

            cy.intercept("GET", `**/public/events/${EVENT_ID}/tickets/setup`, {
                statusCode: 500,
                body: { error: "Internal error" },
            }).as("getSetupErr");

            cy.visit(`${FRONTEND_URL}/eventselect/${EVENT_ID}`);

            cy.wait("@getEventErr");
            cy.wait("@getSetupErr");

            // แค่เช็คว่าหน้ายัง render ได้ (ไม่ล่ม)
            cy.get("body").should("be.visible");
        });
    });

    /* ----------------------------------
     * P1 - 2. Hero Section
     * ---------------------------------- */
    describe("P1 - Hero Section (Poster, Badge, Info, Buttons)", () => {

        it('shows "COMING SOON" badge & disabled button when status = UPCOMING', () => {
            visitEventselect({ setup: makeSetupUpcoming() });

            cy.contains("COMING SOON").should("be.visible");
            cy.contains("button", "COMING SOON").should("be.disabled");
        });

        it('shows "OFFSALE" badge & disabled button when status = OFFSALE', () => {
            visitEventselect({ setup: makeSetupOffsale() });

            cy.contains("OFFSALE").should("be.visible");
            cy.contains("button", "OFFSALE").should("be.disabled");
        });

        it("toggles detail section via View Detail / Hide Detail button", () => {
            visitEventselect();

            cy.contains("View Detail").click();
            cy.contains(baseEvent.description).should("be.visible");

            cy.contains("Hide Detail").click();
            cy.contains(baseEvent.description).should("not.exist");
        });
    });

    /* ----------------------------------
     * P1 - 4. Date Selection Cards
     * ---------------------------------- */
    describe("P1 - Date Selection Cards", () => {
        it("renders date card with day, month, time and venue", () => {
            visitEventselect();

            cy.get("#date-selection").within(() => {
                cy.contains("Rock The Night").should("be.visible");
                cy.contains(baseEvent.venueName).should("be.visible");
            });
        });

        it("selects and unselects date card (toggle) and shows/hides seat-map-section", () => {
            visitEventselect();

            // click date card
            cy.get("#date-selection")
                .find(".cursor-pointer")
                .first()
                .click();

            cy.get("#seat-map-section").should("exist");

            // click again → unselect
            cy.get("#date-selection")
                .find(".cursor-pointer")
                .first()
                .click();

            cy.get("#seat-map-section").should("not.exist");
        });
    });

    /* ----------------------------------
     * P1 - 5. Sales Status Logic + UI
     * ---------------------------------- */
    describe("P1 - Sales Status Logic & Seat Map Visibility", () => {
        it("when ONSALE: selecting date shows seat map (SeatMap + summary container)", () => {
            visitEventselect({ setup: makeSetupOnSale() });

            cy.get("#date-selection").find(".cursor-pointer").first().click();

            cy.get("#seat-map-section").should("exist");
            cy.get("#seat-map-section").within(() => {
                cy.contains("COMING SOON").should("not.exist");
                cy.contains("OFFSALE").should("not.exist");
            });
        });

        it("when UPCOMING: selection shows COMING SOON panel instead of seat map", () => {
            visitEventselect({ setup: makeSetupUpcoming() });

            cy.get("#date-selection").find(".cursor-pointer").first().click();

            cy.get("#seat-map-section").within(() => {
                cy.contains("COMING SOON").should("be.visible");
                cy.contains("Sales start:").should("be.visible");
            });
        });

        it("when OFFSALE: selection shows OFFSALE panel and end date", () => {
            visitEventselect({ setup: makeSetupOffsale() });

            cy.get("#date-selection").find(".cursor-pointer").first().click();

            cy.get("#seat-map-section").within(() => {
                cy.contains("OFFSALE").should("be.visible");
                cy.contains("Sales ended:").should("be.visible");
            });
        });
    });

    /* ----------------------------------
     * P0 - 6. Seat Map & Selection
     * ---------------------------------- */
    describe("P0 - Seat Map & Seat Selection", () => {
        function selectFirstDateAndSeat() {
            // เลือก date → แสดง seat map
            cy.get("#date-selection").find(".cursor-pointer").first().click();
            cy.get("#seat-map-section").should("exist");

            // เลือก seat ตัวแรกในกล่อง SeatMap (สมมติว่า seat เป็น button ด้านใน)
            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();
        }

        it("allows selecting seat and shows small summary chip under seat map", () => {
            visitEventselect();

            selectFirstDateAndSeat();

            cy.contains("Selected: 1 seat").should("be.visible");
        });

        it("allows toggling seat selection (click same seat twice)", () => {
            visitEventselect();

            selectFirstDateAndSeat();

            cy.contains("Selected: 1 seat").should("be.visible");

            // click same seat again → unselect (ใช้ first() อีกที)
            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();

            cy.contains("Selected: 1 seat").should("not.exist");
        });
    });

    /* ----------------------------------
     * P1 - 7. Selected Seats Summary
     * ---------------------------------- */
    describe("P1 - Selected Seats Summary Panel", () => {
        it("shows ticket summary panel with correct total and ticket count", () => {
            visitEventselect();

            cy.get("#date-selection").find(".cursor-pointer").first().click();

            // เลือก 2 seats (ถ้า SeatMap ทำงานแบบ grid ปกติ)
            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .eq(0)
                .click();

            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .eq(1)
                .click();

            cy.contains("Total (2 tickets):").should("be.visible");
            cy.contains("Go to Payment - 2 Ticket").should("be.visible");
        });
    });

    /* ----------------------------------
     * P1 - 8. Guest Email (Unauthenticated)
     * ---------------------------------- */
    describe("P1 - Guest Email (Unauthenticated Users)", () => {
        it("shows guest email input only when not logged in and seats selected", () => {
            visitEventselect({ withToken: false });

            cy.get("#date-selection").find(".cursor-pointer").first().click();
            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();

            cy.contains("Email สำหรับรับลิงก์ชำระเงิน").should("be.visible");
        });

        it("validates email format and shows error on blur", () => {
            visitEventselect({ withToken: false });

            cy.get("#date-selection").find(".cursor-pointer").first().click();
            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();

            cy.get('input[placeholder="you@example.com"]')
                .type("invalid-email")
                .blur();

            cy.contains("กรุณากรอกอีเมลให้ถูกต้อง").should("be.visible");
        });

        it("clears error when email becomes valid", () => {
            visitEventselect({ withToken: false });

            cy.get("#date-selection").find(".cursor-pointer").first().click();
            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();

            cy.get('input[placeholder="you@example.com"]')
                .type("invalid")
                .blur();

            cy.contains("กรุณากรอกอีเมลให้ถูกต้อง").should("be.visible");

            cy.get('input[placeholder="you@example.com"]')
                .clear()
                .type("user@example.com")
                .blur();

            cy.contains("กรุณากรอกอีเมลให้ถูกต้อง").should("not.exist");
        });
    });

    /* ----------------------------------
     * P0 - 9. Go To Payment Flow
     * ---------------------------------- */
    describe("P0 - Go To Payment", () => {
        function prepareOnSaleWithOneSeatAndSelect({ withToken = true } = {}) {
            visitEventselect({ withToken });

            cy.get("#date-selection").find(".cursor-pointer").first().click();

            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();
        }

        it("submits reservation for guest user with guestEmail and navigates to /payment/:reservedId", () => {
            visitEventselect({ withToken: false });

            cy.get("#date-selection").find(".cursor-pointer").first().click();

            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();

            mockSetupRefetch(makeSetupOnSale());

            cy.get('input[placeholder="you@example.com"]').type("guest@example.com");

            cy.intercept("POST", "**/public/reservations", (req) => {
                expect(req.body.eventId).to.equal(EVENT_ID);
                expect(req.body.guestEmail).to.equal("guest@example.com");
                req.reply({
                    statusCode: 200,
                    body: { reservedId: 1001 },
                });
            }).as("createReservationGuest");

            cy.contains("button", "Go to Payment").click();

            cy.wait("@refetchSetup");
            cy.wait("@createReservationGuest");

            cy.url().should("include", "/payment/1001");
        });
    });

    /* ----------------------------------
     * P0 - 10. Auto-Refresh & Sync
     * ---------------------------------- */
    describe("P0 - Auto-Refresh & Sync (visibilitychange, focus, pageshow)", () => {


        it("on pageshow: clears selected seats and refetches setup", () => {
            visitEventselect();

            // เลือก date + seat ก่อน
            cy.get("#date-selection").find(".cursor-pointer").first().click();
            cy.get("#seat-map-section")
                .find(".p-8")
                .first()
                .find("button")
                .first()
                .click();

            cy.contains("Selected: 1 seat").should("be.visible");

            mockSetupRefetch(makeSetupOnSale());

            cy.window().then((win) => {
                win.dispatchEvent(new Event("pageshow"));
            });

            cy.wait("@refetchSetup");

            // seat selection ต้องถูกเคลียร์
            cy.contains("Selected: 1 seat").should("not.exist");
        });
    });
});
