// cypress/e2e/ticketdetail.cy.js

describe('Ticket Detail Page', () => {
    const sampleSetup = {
        seatRows: 10,
        seatColumns: 12,
        zones: [
            { code: 'VIP', name: 'VIP', price: 5000 },
            { code: 'STANDARD', name: 'Standard', price: 1500 },
        ],
        minPerOrder: 1,
        maxPerOrder: 5,
        active: true,
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

        cy.intercept('GET', '**/api/events/1/tickets/setup', {
            statusCode: 200,
            body: sampleSetup,
        }).as('getTicketSetup');

        cy.intercept('GET', '**/api/events/mine', {
            statusCode: 200,
            body: [],
        }).as('getEvents');
    });

    it('prefills existing ticket configuration for an event', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
                win.localStorage.setItem(
                    'event:1',
                    JSON.stringify({
                        id: 1,
                        eventName: 'Test Event',
                        startDateTime: '2025-01-01T12:00:00Z',
                        endDateTime: '2025-01-01T14:00:00Z',
                        venueName: 'Test Hall'
                    }),
                );
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        cy.get('input[placeholder="เช่น 20"]').eq(0).should('have.value', '10');
        cy.get('input[placeholder="เช่น 20"]').eq(1).should('have.value', '12');
        cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).should('have.value', 'VIP');
        cy.get('input[placeholder="0"]').eq(0).should('have.value', '5000');
        cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(1).should('have.value', 'STANDARD');
        cy.get('input[placeholder="0"]').eq(1).should('have.value', '1500');
        cy.get('input[placeholder="1"]').eq(0).should('have.value', '1');
        cy.get('input[placeholder="1"]').eq(1).should('have.value', '5');
        cy.get('input[type="radio"][name="ticket-status"]').eq(0).should('be.checked');
        cy.get('input[type="radio"][name="ticket-status"]').eq(1).should('not.be.checked');
    });

    it('allows adding and removing zones', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 2);
        cy.contains('button', 'Add Zone').click();
        cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 3);
        cy.get('button[title="Remove"]').last().click();
        cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 2);
    });

    it('updates ticket details and saves the configuration', () => {
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
        cy.get('input[placeholder="1"]').eq(0).clear().type('2');
        cy.get('input[placeholder="1"]').eq(1).clear().type('5');
        cy.get('input[type="radio"][name="ticket-status"]').eq(1).click();

        cy.intercept('PUT', '**/api/events/1/tickets/setup', {
            statusCode: 200,
            body: { success: true },
        }).as('saveTicket');

        cy.contains('button', 'Update').click();

        cy.wait('@saveTicket').then((interception) => {
            const body = interception.request.body;
            expect(body.seatRows).to.equal(15);
            expect(body.seatColumns).to.equal(30);
            expect(body.zones).to.deep.equal([
                { code: 'VIP', name: 'VIP', price: 5000 },
                { code: 'A', name: 'A', price: 2000 },
            ]);
            expect(body.minPerOrder).to.equal(2);
            expect(body.maxPerOrder).to.equal(5);
            expect(body.active).to.be.false;
        });

        cy.location('pathname').should('eq', '/organizationmnge');
        cy.contains('อัปเดต Ticket/Seat map เรียบร้อย').should('be.visible');
    });

    it('navigates back to organization management on cancel', () => {
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

    // ========== NEW VALIDATION TESTS ==========

    it('shows error when seat row is invalid or missing', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Clear seat row (make it empty)
        cy.get('input[placeholder="เช่น 20"]').eq(0).clear();

        // Try to save
        cy.contains('button', 'Update').click();

        // Should show alert
        cy.on('window:alert', (text) => {
            expect(text).to.contains('Seat Row/Seat Column');
        });
    });

    it('shows error when seat column is invalid or missing', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Clear seat column
        cy.get('input[placeholder="เช่น 20"]').eq(1).clear();

        cy.contains('button', 'Update').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contains('Seat Row/Seat Column');
        });
    });

    it('shows error when seat row or column is zero or negative', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Set seat row to 0
        cy.get('input[placeholder="เช่น 20"]').eq(0).clear().type('0');

        cy.contains('button', 'Update').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contains('Seat Row/Seat Column');
        });
    });

    it('shows error when zone name is empty', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Clear first zone name
        cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).clear();

        cy.contains('button', 'Update').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contains('กรุณากรอกชื่อ Zone ให้ครบ');
        });
    });

    it('shows error when minimum ticket is less than 1', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Set minimum to 0
        cy.get('input[placeholder="1"]').eq(0).clear().type('0');

        cy.contains('button', 'Update').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contains('Minimum ticket');
        });
    });

    it('shows error when maximum ticket is less than 1', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Set maximum to 0
        cy.get('input[placeholder="1"]').eq(1).clear().type('0');

        cy.contains('button', 'Update').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contains('Maximum ticket');
        });
    });

    it('shows error when minimum ticket is greater than maximum ticket', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Set min > max
        cy.get('input[placeholder="1"]').eq(0).clear().type('10');
        cy.get('input[placeholder="1"]').eq(1).clear().type('5');

        cy.contains('button', 'Update').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contains('Minimum ต้องไม่มากกว่า Maximum');
        });
    });

    it('allows saving with valid data when creating new ticket setup', () => {
        // Stub GET to return 404 (no existing setup)
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

        // Fill in all required fields
        cy.get('input[placeholder="เช่น 20"]').eq(0).type('20');
        cy.get('input[placeholder="เช่น 20"]').eq(1).type('25');
        cy.get('input[placeholder="เช่น VIP / A / HB"]').eq(0).type('General');
        cy.get('input[placeholder="0"]').eq(0).type('1000');
        cy.get('input[placeholder="1"]').eq(0).clear().type('1');
        cy.get('input[placeholder="1"]').eq(1).clear().type('10');

        // Stub POST request for creating new setup
        cy.intercept('POST', '**/api/events/2/tickets/setup', {
            statusCode: 201,
            body: { success: true },
        }).as('createTicket');

        // Click Save button (should show "Save" not "Update" for new setup)
        cy.contains('button', 'Save').click();

        cy.wait('@createTicket').then((interception) => {
            const body = interception.request.body;
            expect(body.seatRows).to.equal(20);
            expect(body.seatColumns).to.equal(25);
            expect(body.zones).to.have.length(1);
            expect(body.zones[0].code).to.equal('General');
            expect(body.minPerOrder).to.equal(1);
            expect(body.maxPerOrder).to.equal(10);
            expect(body.active).to.be.true;
        });

        cy.location('pathname').should('eq', '/organizationmnge');
    });

    it('can add multiple zones and save them all', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Add two more zones
        cy.contains('button', 'Add Zone').click();
        cy.contains('button', 'Add Zone').click();

        // Should have 4 zones total
        cy.get('input[placeholder="เช่น VIP / A / HB"]').should('have.length', 4);

        // Fill in the new zones
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

    it('handles server error gracefully when saving', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Stub PUT to return error
        cy.intercept('PUT', '**/api/events/1/tickets/setup', {
            statusCode: 500,
            body: { message: 'Internal server error' },
        }).as('saveTicketError');

        cy.contains('button', 'Update').click();

        cy.wait('@saveTicketError');

        // Should show error alert
        cy.on('window:alert', (text) => {
            expect(text).to.contains('Internal server error');
        });

        // Should stay on the same page
        cy.location('pathname').should('eq', '/ticketdetail/1');
    });

    it('displays save button as disabled while saving', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Stub with delay to see saving state
        cy.intercept('PUT', '**/api/events/1/tickets/setup', (req) => {
            req.reply({
                delay: 1000,
                statusCode: 200,
                body: { success: true },
            });
        }).as('saveTicketSlow');

        cy.contains('button', 'Update').click();

        // Button should show "Saving..." and be disabled
        cy.contains('button', 'Saving...').should('be.disabled');
    });

    it('toggles ticket status correctly', () => {
        cy.visit('http://localhost:5173/ticketdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getTicketSetup');

        // Initially should be "available" (active: true from sample)
        cy.get('input[type="radio"][name="ticket-status"]').eq(0).should('be.checked');

        // Click unavailable
        cy.get('input[type="radio"][name="ticket-status"]').eq(1).click();
        cy.get('input[type="radio"][name="ticket-status"]').eq(1).should('be.checked');

        cy.intercept('PUT', '**/api/events/1/tickets/setup', {
            statusCode: 200,
            body: { success: true },
        }).as('saveTicket');

        cy.contains('button', 'Update').click();

        cy.wait('@saveTicket').then((interception) => {
            expect(interception.request.body.active).to.be.false;
        });
    });
});