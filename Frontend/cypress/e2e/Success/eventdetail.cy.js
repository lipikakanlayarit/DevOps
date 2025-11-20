// cypress/e2e/eventdetail.cy.js

describe('Event Details Page', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 101,
                username: 'organizeruser',
                email: 'organizer@example.com',
                role: 'ORGANIZER',
                firstName: 'Organizer',
                lastName: 'User',
            },
        }).as('getMe');
    });

    it('prefills default values and submits a new event', () => {
        cy.intercept('POST', '**/api/events', {
            statusCode: 201,
            body: { event_id: 123 },
        }).as('createEvent');

        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });

        cy.wait('@getMe');

        cy.contains('h1', 'Event Details').should('be.visible');

        cy.get('input[placeholder="Name of your project"]').clear().type('New Cypress Event');
        cy.get('select').select('Concert');

        cy.get('input[type="date"]').first().invoke('val').should('not.be.empty');
        cy.get('input[type="time"]').eq(0).should('have.value', '19:00');
        cy.get('input[type="date"]').eq(1).invoke('val').should('not.be.empty');
        cy.get('input[type="time"]').eq(1).should('have.value', '22:00');

        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');
        cy.get('textarea').type('This event was created by Cypress.');

        cy.contains('button', 'Save & Continue').click();
        cy.wait('@createEvent');

        cy.on('window:alert', (txt) => {
            expect(txt).to.contain('สร้างอีเวนต์สำเร็จ!');
        });

        cy.location('pathname').should('eq', '/ticketdetail/123');
    });

    it('loads existing event data for editing and updates successfully', () => {
        cy.intercept('GET', '**/api/events/1', {
            statusCode: 200,
            body: {
                id: 1,
                eventName: 'Existing Event',
                description: 'Original description',
                categoryId: 2,
                venueName: 'Original Hall',
                startDateTime: '2025-03-10T12:00:00.000Z',
                endDateTime: '2025-03-10T15:00:00.000Z',
            },
        }).as('getEvent');

        cy.intercept('PUT', '**/api/events/1', {
            statusCode: 200,
            body: {},
        }).as('updateEvent');

        cy.visit('http://localhost:5173/eventdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });

        cy.wait('@getMe');
        cy.wait('@getEvent');

        cy.contains('h1', 'Edit Event').should('be.visible');
        cy.contains('a', 'ไป Ticket Details ของอีเวนต์นี้').should('be.visible');

        cy.get('input[placeholder="Name of your project"]').should('have.value', 'Existing Event');
        cy.get('select').should('have.value', '2');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').should('have.value', 'Original Hall');
        cy.get('textarea').should('have.value', 'Original description');

        cy.get('input[type="date"]').first().should('have.value', '2025-03-10');
        cy.get('input[type="time"]').eq(0).should('have.value', '19:00');
        cy.get('input[type="date"]').eq(1).should('have.value', '2025-03-10');
        cy.get('input[type="time"]').eq(1).should('have.value', '22:00');

        cy.get('input[placeholder="Name of your project"]').clear().type('Existing Event Updated');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').clear().type('Updated Hall');

        cy.contains('button', 'Update & Continue').click();
        cy.wait('@updateEvent');

        cy.on('window:alert', (txt) => {
            expect(txt).to.contain('อัปเดตอีเวนต์สำเร็จ!');
        });

        cy.location('pathname').should('eq', '/ticketdetail/1');
    });

    it('allows adding and removing date/time blocks', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        cy.get('button[aria-label="Remove date-time block"]').should('have.length', 1);

        cy.contains('button', 'Add Date and Time').click();
        cy.get('button[aria-label="Remove date-time block"]').should('have.length', 2);

        cy.get('button[aria-label="Remove date-time block"]').last().click();
        cy.get('button[aria-label="Remove date-time block"]').should('have.length', 1);
    });

    // ========== NEW VALIDATION TESTS ==========

    it('shows error when event name is missing', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Clear event name (leave it empty)
        cy.get('input[placeholder="Name of your project"]').clear();

        // Select category and fill other required fields
        cy.get('select').select('Concert');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');

        // Try to save
        cy.contains('button', 'Save & Continue').click();

        // Should show alert
        cy.on('window:alert', (text) => {
            expect(text).to.contain('กรุณากรอก Event Name');
        });
    });

    it('shows error when category is not selected', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Fill event name but don't select category
        cy.get('input[placeholder="Name of your project"]').type('Test Event');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');

        cy.contains('button', 'Save & Continue').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contain('กรุณาเลือก Category');
        });
    });

    it('shows error when start date/time is missing', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Fill required fields except date/time
        cy.get('input[placeholder="Name of your project"]').type('Test Event');
        cy.get('select').select('Concert');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');

        // Clear the prefilled dates
        cy.get('input[type="date"]').first().clear();
        cy.get('input[type="time"]').eq(0).clear();

        cy.contains('button', 'Save & Continue').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contain('กรุณากรอกวันและเวลาให้ครบ');
        });
    });

    it('shows error when end date/time is missing', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        cy.get('input[placeholder="Name of your project"]').type('Test Event');
        cy.get('select').select('Concert');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');

        // Clear end date
        cy.get('input[type="date"]').eq(1).clear();

        cy.contains('button', 'Save & Continue').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contain('กรุณากรอกวันและเวลาให้ครบ');
        });
    });

    it('shows error when venue name is missing but venue type is selected', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        cy.get('input[placeholder="Name of your project"]').type('Test Event');
        cy.get('select').select('Concert');

        // Make sure Venue is selected but don't fill location name
        cy.contains('span', 'Venue').click();
        cy.get('input[placeholder="Main Hall / Auditorium A"]').clear();

        cy.contains('button', 'Save & Continue').click();

        cy.on('window:alert', (text) => {
            expect(text).to.contain('กรุณากรอกชื่อสถานที่ (Location name)');
        });
    });

    it('allows saving when "To be announced" is selected without venue name', () => {
        cy.intercept('POST', '**/api/events', {
            statusCode: 201,
            body: { event_id: 456 },
        }).as('createEvent');

        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        cy.get('input[placeholder="Name of your project"]').type('TBA Event');
        cy.get('select').select('Seminar');

        // Select "To be announced"
        cy.contains('span', 'To be announced').click();

        cy.contains('button', 'Save & Continue').click();

        cy.wait('@createEvent').then((interception) => {
            expect(interception.request.body.venueName).to.equal('To be announced');
        });

        cy.location('pathname').should('eq', '/ticketdetail/456');
    });

    it('can upload an image file', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Create a fake image file
        const fileName = 'test-image.png';
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from('fake-image-content'),
            fileName: fileName,
            mimeType: 'image/png',
        }, { force: true });

        // Preview should appear
        cy.get('img[alt="Preview"]').should('be.visible');
    });

    it('shows error when uploading non-image file', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Try to upload a text file
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from('not an image'),
            fileName: 'test.txt',
            mimeType: 'text/plain',
        }, { force: true });

        // Error message should appear
        cy.contains('กรุณาเลือกรูปภาพเท่านั้น (PNG/JPG/JPEG/GIF)').should('be.visible');
    });

    it('can remove uploaded image locally', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Upload image
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from('fake-image'),
            fileName: 'test.png',
            mimeType: 'image/png',
        }, { force: true });

        cy.get('img[alt="Preview"]').should('be.visible');

        // Remove it
        cy.get('button[aria-label="Remove image (local)"]').click();
        cy.get('img[alt="Preview"]').should('not.exist');
    });

    it('handles server error gracefully when creating event', () => {
        cy.intercept('POST', '**/api/events', {
            statusCode: 500,
            body: { error: 'Internal server error' },
        }).as('createEventError');

        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        cy.get('input[placeholder="Name of your project"]').type('Error Event');
        cy.get('select').select('Concert');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');

        cy.contains('button', 'Save & Continue').click();
        cy.wait('@createEventError');

        cy.on('window:alert', (text) => {
            expect(text).to.contain('Internal server error');
        });

        // Should stay on the same page
        cy.location('pathname').should('eq', '/eventdetail');
    });

    it('displays save button as disabled while saving', () => {
        cy.intercept('POST', '**/api/events', (req) => {
            req.reply({
                delay: 1000,
                statusCode: 201,
                body: { event_id: 789 },
            });
        }).as('createEventSlow');

        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        cy.get('input[placeholder="Name of your project"]').type('Slow Save Event');
        cy.get('select').select('Concert');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');

        cy.contains('button', 'Save & Continue').click();

        // Button should show "Saving..." and be disabled
        cy.contains('button', 'Saving...').should('be.disabled');
    });

    it('can add multiple date/time blocks and save them', () => {
        cy.intercept('POST', '**/api/events', {
            statusCode: 201,
            body: { event_id: 999 },
        }).as('createEvent');

        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Add two more date/time blocks
        cy.contains('button', 'Add Date and Time').click();
        cy.contains('button', 'Add Date and Time').click();

        cy.get('button[aria-label="Remove date-time block"]').should('have.length', 3);

        cy.get('input[placeholder="Name of your project"]').type('Multi Date Event');
        cy.get('select').select('Concert');
        cy.get('input[placeholder="Main Hall / Auditorium A"]').type('Hall A');

        cy.contains('button', 'Save & Continue').click();
        cy.wait('@createEvent');

        cy.location('pathname').should('eq', '/ticketdetail/999');
    });

    it('can navigate to ticket details page from edit mode', () => {
        cy.intercept('GET', '**/api/events/1', {
            statusCode: 200,
            body: {
                id: 1,
                eventName: 'Test Event',
                categoryId: 1,
                venueName: 'Test Hall',
                startDateTime: '2025-03-10T12:00:00.000Z',
                endDateTime: '2025-03-10T15:00:00.000Z',
            },
        }).as('getEvent');

        cy.visit('http://localhost:5173/eventdetail/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvent');

        cy.contains('a', 'ไป Ticket Details ของอีเวนต์นี้').click();
        cy.location('pathname').should('eq', '/ticketdetail/1');
    });

    it('can cancel and return to organization management', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        cy.contains('a', 'Cancel').click();
        cy.location('pathname').should('eq', '/organizationmnge');
    });

    it('validates all required fields together', () => {
        cy.visit('http://localhost:5173/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Clear all fields
        cy.get('input[placeholder="Name of your project"]').clear();
        cy.get('select').select(''); // Select empty option
        cy.get('input[type="date"]').first().clear();

        // Try to save - should hit first validation error (event name)
        cy.contains('button', 'Save & Continue').click();

        cy.on('window:alert', (text) => {
            expect(text).to.match(/กรุณา/);
        });
    });
});