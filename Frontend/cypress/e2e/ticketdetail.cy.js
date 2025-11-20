// cypress/e2e/ticketdetail.cy.js

describe('Ticket Detail Page', () => {
    const sampleSetup = {
        seatRows: 10,
        seatColumns: 12,
        zones: [
            { code: 'VIP', name: 'VIP', price: 5000, rows: 10, cols: 12 },
            { code: 'STANDARD', name: 'Standard', price: 1500, rows: 10, cols: 12 },
        ],
        minPerOrder: 1,
        maxPerOrder: 5,
        active: true,
        salesStartDatetime: '2025-12-01T10:00:00Z',
        salesEndDatetime: '2025-12-31T23:59:00Z',
    };

    const mockEventData = {
        id: 1,
        eventName: 'Test Event',
        startDateTime: '2025-01-01T12:00:00Z',
        endDateTime: '2025-01-01T14:00:00Z',
        venueName: 'Test Hall'
    };

    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 101,
                username: 'ticketuser',
                email: 'ticket@example.com',
                role: 'ORGANIZER',
            },
        }).as('getMe');

        cy.intercept('GET', '**/api/events/mine', {
            statusCode: 200,
            body: [],
        }).as('getEvents');
    });

    // ============================================================
    // P0 - CRITICAL TESTS (Must Pass)
    // ============================================================

    describe('P0: Page Load & Navigation', () => {
        it('TC-P0-001: loads page successfully with valid eventId', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
            cy.contains('h1', 'Ticket Detail').should('be.visible');
        });

        it('TC-P0-003: displays cached event data from localStorage', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                    win.localStorage.setItem('event:1', JSON.stringify(mockEventData));
                },
            });

            cy.wait('@getMe');
            cy.contains('Test Event').should('be.visible');
            cy.contains('Start: 2025-01-01T12:00:00Z').should('be.visible');
            cy.contains('Test Hall').should('be.visible');
        });

        it('TC-P0-004: "กลับไป Event Details" link navigates correctly', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.contains('a', 'กลับไป Event Details').should('have.attr', 'href', '/eventdetail/1');
        });
    });

    describe('P0: API Integration - Load Existing Data', () => {
        it('TC-P0-005 & TC-P0-006: successfully loads and displays existing zones data', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // Verify zones data
            cy.get('input[placeholder="เช่น 20"]').eq(0).should('have.value', '10');
            cy.get('input[placeholder="เช่น 20"]').eq(1).should('have.value', '12');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).should('have.value', 'VIP');
            cy.get('input[placeholder="0"]').eq(0).should('have.value', '5000');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(1).should('have.value', 'STANDARD');
            cy.get('input[placeholder="0"]').eq(1).should('have.value', '1500');
        });

        it('TC-P0-007: displays sales period correctly (UTC to local conversion)', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // Check that date inputs have values (exact values depend on timezone)
            cy.get('input[type="date"]').eq(0).should('not.have.value', '');
            cy.get('input[type="time"]').eq(0).should('not.have.value', '');
            cy.get('input[type="date"]').eq(1).should('not.have.value', '');
            cy.get('input[type="time"]').eq(1).should('not.have.value', '');
        });

        it('TC-P0-008 & TC-P0-009: displays min/max per order and ticket status', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.get('input[placeholder="1"]').eq(0).should('have.value', '1');
            cy.get('input[placeholder="1"]').eq(1).should('have.value', '5');
            cy.get('input[type="radio"][name="ticket-status"]').eq(0).should('be.checked');
        });

        it('TC-P0-010: handles no existing ticket setup (shows default form)', () => {
            cy.intercept('GET', '**/api/events/2/tickets/setup', {
                statusCode: 404,
                body: { error: 'Not found' },
            }).as('getTicketSetupNotFound');

            cy.visit('http://localhost:5173/ticketdetail/2', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');

            // Should show empty form with defaults
            cy.get('input[placeholder="เช่น 20"]').eq(0).should('have.value', '');
            cy.get('input[placeholder="1"]').eq(0).should('have.value', '1');
            cy.contains('button', 'Save').should('be.visible');
        });
    });

    describe('P0: Zone Management - Core Functions', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
        });

        it('TC-P0-011: can enter Seat Row value', () => {
            cy.get('input[placeholder="เช่น 20"]').eq(0).clear().type('25');
            cy.get('input[placeholder="เช่น 20"]').eq(0).should('have.value', '25');
        });

        it('TC-P0-012: can enter Seat Column value', () => {
            cy.get('input[placeholder="เช่น 20"]').eq(1).clear().type('30');
            cy.get('input[placeholder="เช่น 20"]').eq(1).should('have.value', '30');
        });

        it('TC-P0-013: can enter Zone name', () => {
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).clear().type('Premium');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).should('have.value', 'Premium');
        });

        it('TC-P0-014: can enter Price', () => {
            cy.get('input[placeholder="0"]').eq(0).clear().type('8000');
            cy.get('input[placeholder="0"]').eq(0).should('have.value', '8000');
        });

        it('TC-P0-015: "Add Zone" button adds new zone', () => {
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 2);
            cy.contains('button', 'Add Zone').click();
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 3);
        });

        it('TC-P0-016: X button removes zone (except last one)', () => {
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 2);
            cy.get('button[title="Remove"]').last().click();
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 1);
        });

        it('TC-P0-017: can have multiple zones simultaneously', () => {
            cy.contains('button', 'Add Zone').click();
            cy.contains('button', 'Add Zone').click();
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 4);

            // Fill all zones
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(2).type('Zone C');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(3).type('Zone D');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(2).should('have.value', 'Zone C');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(3).should('have.value', 'Zone D');
        });
    });

    describe('P0: Sales Period', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
        });

        it('TC-P0-018: can select Start Date', () => {
            cy.get('input[type="date"]').eq(0).clear().type('2025-12-15');
            cy.get('input[type="date"]').eq(0).should('have.value', '2025-12-15');
        });

        it('TC-P0-019: can select Start Time', () => {
            cy.get('input[type="time"]').eq(0).clear().type('09:00');
            cy.get('input[type="time"]').eq(0).should('have.value', '09:00');
        });

        it('TC-P0-020: can select End Date', () => {
            cy.get('input[type="date"]').eq(1).clear().type('2025-12-31');
            cy.get('input[type="date"]').eq(1).should('have.value', '2025-12-31');
        });

        it('TC-P0-021: can select End Time', () => {
            cy.get('input[type="time"]').eq(1).clear().type('23:59');
            cy.get('input[type="time"]').eq(1).should('have.value', '23:59');
        });

        it('TC-P0-022: X button clears date', () => {
            // Clear start date
            cy.get('input[type="date"]').eq(0).parent().find('button[aria-label="Clear start date"]').click();
            cy.get('input[type="date"]').eq(0).should('have.value', '');
        });
    });

    describe('P0: Advanced Settings', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
        });

        it('TC-P0-023: can enter Minimum ticket', () => {
            cy.get('input[placeholder="1"]').eq(0).clear().type('2');
            cy.get('input[placeholder="1"]').eq(0).should('have.value', '2');
        });

        it('TC-P0-024: can enter Maximum ticket', () => {
            cy.get('input[placeholder="1"]').eq(1).clear().type('10');
            cy.get('input[placeholder="1"]').eq(1).should('have.value', '10');
        });

        it('TC-P0-025: can toggle Ticket Status', () => {
            cy.get('input[type="radio"][name="ticket-status"]').eq(0).should('be.checked');
            cy.get('input[type="radio"][name="ticket-status"]').eq(1).click();
            cy.get('input[type="radio"][name="ticket-status"]').eq(1).should('be.checked');
        });
    });

    describe('P0: Form Validation - Critical Rules', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
        });

        it('TC-P0-027: shows alert when Seat Row is invalid', () => {
            cy.get('input[placeholder="เช่น 20"]').eq(0).clear();

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('Seat Row/Seat Column'));
            });
        });

        it('TC-P0-027: shows alert when Seat Row/Column is zero', () => {
            cy.get('input[placeholder="เช่น 20"]').eq(0).clear().type('0');

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('Seat Row/Seat Column'));
            });
        });

        it('TC-P0-028: shows alert when Zone name is empty', () => {
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).clear();

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('กรุณากรอกชื่อ Zone ให้ครบ'));
            });
        });

        it('TC-P0-029: shows alert when Minimum ticket < 1', () => {
            cy.get('input[placeholder="1"]').eq(0).clear().type('0');

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('Minimum ticket'));
            });
        });

        it('TC-P0-030: shows alert when Maximum ticket < 1', () => {
            cy.get('input[placeholder="1"]').eq(1).clear().type('0');

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('Maximum ticket'));
            });
        });

        it('TC-P0-031: shows alert when Minimum > Maximum', () => {
            cy.get('input[placeholder="1"]').eq(0).clear().type('10');
            cy.get('input[placeholder="1"]').eq(1).clear().type('5');

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('Minimum ต้องไม่มากกว่า Maximum'));
            });
        });

        it('TC-P0-032: shows alert when Sales Period is incomplete', () => {
            // Clear sales dates
            cy.get('input[type="date"]').eq(0).clear();
            cy.get('input[type="time"]').eq(0).clear();

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('กรุณากำหนดช่วงเวลา Sales Period ให้ครบ'));
            });
        });

        it('TC-P0-033: shows alert when Sales End < Sales Start', () => {
            cy.get('input[type="date"]').eq(0).clear().type('2025-12-31');
            cy.get('input[type="time"]').eq(0).clear().type('23:00');
            cy.get('input[type="date"]').eq(1).clear().type('2025-12-01');
            cy.get('input[type="time"]').eq(1).clear().type('10:00');

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click().then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('Sales End ต้องมากกว่า Sales Start'));
            });
        });
    });

    describe('P0: Save/Update Ticket Setup', () => {
        it('TC-P0-034: POST request for new ticket setup', () => {
            cy.intercept('GET', '**/api/events/2/tickets/setup', {
                statusCode: 404,
                body: { error: 'Not found' },
            }).as('getTicketSetupNotFound');

            cy.visit('http://localhost:5173/ticketdetail/2', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');

            // Fill required fields
            cy.get('input[placeholder="เช่น 20"]').eq(0).type('20');
            cy.get('input[placeholder="เช่น 20"]').eq(1).type('25');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).type('General');
            cy.get('input[placeholder="0"]').eq(0).type('1000');
            cy.get('input[type="date"]').eq(0).type('2025-12-01');
            cy.get('input[type="time"]').eq(0).type('10:00');
            cy.get('input[type="date"]').eq(1).type('2025-12-31');
            cy.get('input[type="time"]').eq(1).type('23:59');

            cy.intercept('POST', '**/api/events/2/tickets/setup', {
                statusCode: 201,
                body: { success: true },
            }).as('createTicket');

            cy.contains('button', 'Save').click();
            cy.wait('@createTicket');
        });

        it('TC-P0-035 & TC-P0-036: PUT request with correct payload for update', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.get('input[placeholder="เช่น 20"]').eq(0).clear().type('15');
            cy.get('input[placeholder="เช่น 20"]').eq(1).clear().type('30');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(1).clear().type('A');
            cy.get('input[placeholder="0"]').eq(1).clear().type('2000');

            cy.intercept('PUT', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: { success: true },
            }).as('saveTicket');

            cy.contains('button', 'Update').click();

            cy.wait('@saveTicket').then((interception) => {
                const body = interception.request.body;
                expect(body.seatRows).to.equal(15);
                expect(body.seatColumns).to.equal(30);
                expect(body.zones).to.have.length(2);
                expect(body.zones[1].code).to.equal('A');
                expect(body.zones[1].price).to.equal(2000);
            });
        });

        it('TC-P0-039: navigates to /organizationmnge with flash message on success', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.intercept('PUT', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: { success: true },
            }).as('saveTicket');

            cy.contains('button', 'Update').click();
            cy.wait('@saveTicket');

            cy.location('pathname').should('eq', '/organizationmnge');
            cy.contains('อัปเดต Ticket/Seat map').should('be.visible');
        });

        it('TC-P0-040: shows error message when save fails', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.intercept('PUT', '**/api/events/1/tickets/setup', {
                statusCode: 500,
                body: { message: 'Internal server error' },
            }).as('saveTicketError');

            const stub = cy.stub();
            cy.on('window:alert', stub);

            cy.contains('button', 'Update').click();
            cy.wait('@saveTicketError');

            cy.then(() => {
                expect(stub).to.be.calledWith(Cypress.sinon.match('Internal server error'));
            });

            cy.location('pathname').should('eq', '/ticketdetail/1');
        });

        it('TC-P0-041 & TC-P0-042: button shows "Saving..." and is disabled while saving', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.intercept('PUT', '**/api/events/1/tickets/setup', (req) => {
                req.reply({
                    delay: 1000,
                    statusCode: 200,
                    body: { success: true },
                });
            }).as('saveTicketSlow');

            cy.contains('button', 'Update').click();
            cy.contains('button', 'Saving...').should('be.disabled');
        });
    });

    describe('P0: Cancel Action', () => {
        it('TC-P0-043: Cancel button navigates to /organizationmnge', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.contains('a', 'Cancel').click();
            cy.location('pathname').should('eq', '/organizationmnge');
        });
    });

    // ============================================================
    // P1 - HIGH PRIORITY TESTS
    // ============================================================

    describe('P1: UI/UX - Zone Management', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
        });

        it('TC-P1-001: displays "(ใช้เป็นค่ากลาง)" label for first zone', () => {
            cy.contains('label', 'Seat Row').first().should('contain', '(ใช้เป็นค่ากลาง)');
            cy.contains('label', 'Seat Column').first().should('contain', '(ใช้เป็นค่ากลาง)');
        });

        it('TC-P1-003: input fields show correct placeholders', () => {
            cy.get('input[placeholder="เช่น 20"]').should('exist');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('exist');
            cy.get('input[placeholder="0"]').should('exist');
        });

        it('TC-P1-004: Price field accepts only numbers', () => {
            cy.get('input[placeholder="0"]').eq(0).should('have.attr', 'type', 'number');
        });
    });

    describe('P1: Data Consistency', () => {
        it('TC-P1-010 & TC-P1-011: zones without rows/cols use global values', () => {
            const setupWithMixedZones = {
                seatRows: 20,
                seatColumns: 25,
                zones: [
                    { code: 'VIP', name: 'VIP', price: 5000, rows: 20, cols: 25 },
                    { code: 'STANDARD', name: 'Standard', price: 1500 }, // No rows/cols
                ],
                minPerOrder: 1,
                maxPerOrder: 5,
                active: true,
                salesStartDatetime: '2025-12-01T10:00:00Z',
                salesEndDatetime: '2025-12-31T23:59:00Z',
            };

            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: setupWithMixedZones,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // Zone 2 should use global values
            cy.get('input[placeholder="เช่น 20"]').eq(2).should('have.value', '20');
            cy.get('input[placeholder="เช่น 20"]').eq(3).should('have.value', '25');
        });

        it('TC-P1-012: zone code and name are the same (trimmed)', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // Add spaces to zone name
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).clear().type('  Premium  ');

            cy.intercept('PUT', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: { success: true },
            }).as('saveTicket');

            cy.contains('button', 'Update').click();

            cy.wait('@saveTicket').then((interception) => {
                const body = interception.request.body;
                expect(body.zones[0].code).to.equal('Premium');
                expect(body.zones[0].name).to.equal('Premium');
            });
        });

        it('TC-P1-013: active status converts correctly', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: { ...sampleSetup, active: false },
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // Should show Unavailable radio checked
            cy.get('input[type="radio"][name="ticket-status"]').eq(1).should('be.checked');
        });
    });

    describe('P1: Multiple Zones Edge Cases', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
        });

        it('TC-P1-021: can create 10+ zones', () => {
            for (let i = 0; i < 10; i++) {
                cy.contains('button', 'Add Zone').click();
            }
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length.at.least', 10);
        });

        it('TC-P1-023: removing middle zone does not affect others', () => {
            cy.contains('button', 'Add Zone').click();
            cy.contains('button', 'Add Zone').click();

            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).clear().type('Zone A');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(1).clear().type('Zone B');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(2).clear().type('Zone C');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(3).clear().type('Zone D');

            // Remove Zone B (index 1)
            cy.get('button[title="Remove"]').eq(1).click();

            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).should('have.value', 'Zone A');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(1).should('have.value', 'Zone C');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(2).should('have.value', 'Zone D');
        });

        it('TC-P1-024: adding zone after deletion gets correct ID', () => {
            cy.contains('button', 'Add Zone').click();
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 3);

            cy.get('button[title="Remove"]').last().click();
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 2);

            cy.contains('button', 'Add Zone').click();
            cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 3);

            // Should be able to fill the new zone
            cy.get('input[placeholder="เช่น VIP / A / HB"]').last().type('New Zone');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').last().should('have.value', 'New Zone');
        });
    });

    describe('P1: Form State Management', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');
        });

        it('TC-P1-025: clearing start date does not affect start time', () => {
            const originalTime = '10:00';
            cy.get('input[type="time"]').eq(0).clear().type(originalTime);

            cy.get('input[type="date"]').eq(0).parent().find('button[aria-label="Clear start date"]').click();
            cy.get('input[type="date"]').eq(0).should('have.value', '');
            cy.get('input[type="time"]').eq(0).should('have.value', originalTime);
        });

        it('TC-P1-026: clearing end date does not affect end time', () => {
            const originalTime = '23:59';
            cy.get('input[type="time"]').eq(1).clear().type(originalTime);

            cy.get('input[type="date"]').eq(1).parent().find('button[aria-label="Clear end date"]').click();
            cy.get('input[type="date"]').eq(1).should('have.value', '');
            cy.get('input[type="time"]').eq(1).should('have.value', originalTime);
        });

        it('TC-P1-027: changing one zone field does not affect other zones', () => {
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).clear().type('Modified');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(1).should('have.value', 'STANDARD');
        });
    });

    describe('P1: Button States', () => {
        it('TC-P1-029: shows "Update" button when existing data exists', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.contains('button', 'Update').should('be.visible');
        });

        it('TC-P1-030: shows "Save" button when no existing data', () => {
            cy.intercept('GET', '**/api/events/2/tickets/setup', {
                statusCode: 404,
                body: { error: 'Not found' },
            }).as('getTicketSetupNotFound');

            cy.visit('http://localhost:5173/ticketdetail/2', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');

            cy.contains('button', 'Save').should('be.visible');
        });
    });

    describe('P1: Integration with Event Data', () => {
        it('TC-P1-033 to TC-P1-036: displays cached event information', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                    win.localStorage.setItem('event:1', JSON.stringify(mockEventData));
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // TC-P1-033: Event ID
            cy.contains('ID: 1').should('be.visible');

            // TC-P1-034: Event Name
            cy.contains('Test Event').should('be.visible');

            // TC-P1-035: Start/End DateTime
            cy.contains('Start:').should('be.visible');
            cy.contains('End:').should('be.visible');

            // TC-P1-036: Venue Name
            cy.contains('Venue: Test Hall').should('be.visible');
        });
    });

    // ============================================================
    // BONUS TESTS - Additional Coverage
    // ============================================================

    describe('Bonus: Complex Scenarios', () => {
        it('Bonus-001: can save multiple zones with different prices', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.contains('button', 'Add Zone').click();
            cy.contains('button', 'Add Zone').click();

            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(2).type('Zone C');
            cy.get('input[placeholder="0"]').eq(2).type('3000');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(3).type('Zone D');
            cy.get('input[placeholder="0"]').eq(3).type('4000');

            cy.intercept('PUT', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: { success: true },
            }).as('saveTicket');

            cy.contains('button', 'Update').click();

            cy.wait('@saveTicket').then((interception) => {
                const body = interception.request.body;
                expect(body.zones).to.have.length(4);
                expect(body.zones[2].code).to.equal('Zone C');
                expect(body.zones[2].price).to.equal(3000);
                expect(body.zones[3].code).to.equal('Zone D');
                expect(body.zones[3].price).to.equal(4000);
            });
        });

        it('Bonus-002: empty price field sends undefined (not 0)', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // Clear price of first zone
            cy.get('input[placeholder="0"]').eq(0).clear();

            cy.intercept('PUT', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: { success: true },
            }).as('saveTicket');

            cy.contains('button', 'Update').click();

            cy.wait('@saveTicket').then((interception) => {
                const body = interception.request.body;
                expect(body.zones[0].price).to.be.undefined;
            });
        });

        it('Bonus-003: handles malformed localStorage data gracefully', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                    win.localStorage.setItem('event:1', 'invalid-json-{{{');
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            // Should still load the page without crashing
            cy.contains('h1', 'Ticket Detail').should('be.visible');
        });

        it('Bonus-004: time input has step of 300 seconds (5 minutes)', () => {
            cy.intercept('GET', '**/api/events/1/tickets/setup', {
                statusCode: 200,
                body: sampleSetup,
            }).as('getTicketSetup');

            cy.visit('http://localhost:5173/ticketdetail/1', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');
            cy.wait('@getTicketSetup');

            cy.get('input[type="time"]').first().should('have.attr', 'step', '300');
        });

        it('Bonus-005: complete workflow - create, fill, validate, save', () => {
            cy.intercept('GET', '**/api/events/3/tickets/setup', {
                statusCode: 404,
                body: { error: 'Not found' },
            }).as('getTicketSetupNotFound');

            cy.visit('http://localhost:5173/ticketdetail/3', {
                onBeforeLoad(win) {
                    win.localStorage.setItem('token', 'fake-token');
                    win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                },
            });

            cy.wait('@getMe');

            // Fill complete form
            cy.get('input[placeholder="เช่น 20"]').eq(0).type('30');
            cy.get('input[placeholder="เช่น 20"]').eq(1).type('40');
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).type('Premium');
            cy.get('input[placeholder="0"]').eq(0).type('5000');

            // Add second zone
            cy.contains('button', 'Add Zone').click();
            cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(1).type('Standard');
            cy.get('input[placeholder="0"]').eq(1).type('2000');

            // Set sales period
            cy.get('input[type="date"]').eq(0).type('2025-12-01');
            cy.get('input[type="time"]').eq(0).type('09:00');
            cy.get('input[type="date"]').eq(1).type('2025-12-31');
            cy.get('input[type="time"]').eq(1).type('23:59');

            // Set limits
            cy.get('input[placeholder="1"]').eq(0).clear().type('1');
            cy.get('input[placeholder="1"]').eq(1).clear().type('10');

            // Set status
            cy.get('input[type="radio"][name="ticket-status"]').eq(0).check();

            cy.intercept('POST', '**/api/events/3/tickets/setup', {
                statusCode: 201,
                body: { success: true },
            }).as('createTicket');

            cy.contains('button', 'Save').click();

            cy.wait('@createTicket').then((interception) => {
                const body = interception.request.body;
                expect(body.seatRows).to.equal(30);
                expect(body.seatColumns).to.equal(40);
                expect(body.zones).to.have.length(2);
                expect(body.zones[0].code).to.equal('Premium');
                expect(body.zones[0].price).to.equal(5000);
                expect(body.zones[1].code).to.equal('Standard');
                expect(body.zones[1].price).to.equal(2000);
                expect(body.minPerOrder).to.equal(1);
                expect(body.maxPerOrder).to.equal(10);
                expect(body.active).to.be.true;
                expect(body.salesStartDatetime).to.exist;
                expect(body.salesEndDatetime).to.exist;
            });

            cy.location('pathname').should('eq', '/organizationmnge');
        });
    });
});