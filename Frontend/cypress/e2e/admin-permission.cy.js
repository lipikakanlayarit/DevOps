// cypress/e2e/admin-permission.cy.js
//
// This suite covers the admin event permission page.  The page
// displays a list of events awaiting permission review along with
// already approved or rejected events.  Administrators can filter
// events by status, search through the list, open a detailed
// preview of a submission, and either approve or reject a pending
// event via modal dialogs.  Each action triggers network calls to
// the backend which we stub for predictability.  Because the route
// is protected by RequireRole, we stub `/api/auth/me` to return an
// administrator on every test.

describe('Admin Event Permission Page', () => {
    // Common authentication stub.  Without this, the route would
    // redirect to the login or forbidden page.  Each test also
    // intercepts the GET and POST calls specific to its scenario.
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 2,
                username: 'adminuser',
                email: 'admin@example.com',
                role: 'ADMIN',
                firstName: 'Admin',
                lastName: 'User',
            },
        }).as('getMe');

        // Intercept cover image requests to prevent 401 errors
        cy.intercept('GET', '**/api/admin/events/*/cover*', {
            statusCode: 200,
            body: '',
        }).as('getCover');
    });

    it('lists all events and filters by status', () => {
        // Define a consistent set of events to return for each status.  We
        // include one event in each status category so the filters have
        // visible effect.
        const allEvents = [
            {
                id: 10,
                eventName: 'Pending Event',
                categoryId: 1,
                organizerName: 'Org A',
                startDateTime: '2025-06-01T12:00:00Z',
                endDateTime: '2025-06-01T15:00:00Z',
                updatedAt: '2025-05-20T00:00:00Z',
                status: 'PENDING',
                venueName: 'Hall A',
                description: 'Test pending event',
            },
            {
                id: 20,
                eventName: 'Approved Event',
                categoryId: 2,
                organizerName: 'Org B',
                startDateTime: '2025-07-01T12:00:00Z',
                endDateTime: '2025-07-01T15:00:00Z',
                updatedAt: '2025-06-20T00:00:00Z',
                status: 'APPROVED',
                venueName: 'Hall B',
                description: 'Test approved event',
            },
            {
                id: 30,
                eventName: 'Rejected Event',
                categoryId: 3,
                organizerName: 'Org C',
                startDateTime: '2025-08-01T12:00:00Z',
                endDateTime: '2025-08-01T15:00:00Z',
                updatedAt: '2025-07-20T00:00:00Z',
                status: 'REJECTED',
                venueName: 'Hall C',
                description: 'Test rejected event',
            },
        ];

        // Helper to filter based on backend status.  The component
        // requests uppercase statuses such as ALL, PENDING, APPROVED,
        // REJECTED.  Respond with the appropriate subset of our
        // predefined events.
        function filterByStatus(status) {
            if (status === 'ALL') return allEvents;
            if (status === 'PENDING') return allEvents.filter((e) => e.status === 'PENDING');
            if (status === 'APPROVED') return allEvents.filter((e) => e.status === 'APPROVED');
            if (status === 'REJECTED') return allEvents.filter((e) => e.status === 'REJECTED');
            return allEvents;
        }

        // Intercept any GET to /api/admin/events with a query string.
        cy.intercept('GET', '**/api/admin/events*', (req) => {
            const status = req.query.status;
            const body = filterByStatus(status);
            req.reply({ statusCode: 200, body });
        }).as('getEvents');

        // Visit the permissions page.
        cy.visit('http://localhost:5173/admin/permissions', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'admin-perm-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        // Wait for the first load (status=ALL).
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // The page should indicate the total number of events and list
        // titles from our stubbed data.  Each status badge should be
        // present.
        cy.contains('Events: 3').should('be.visible');
        cy.contains('Pending Event').should('be.visible');
        cy.contains('Approved Event').should('be.visible');
        cy.contains('Rejected Event').should('be.visible');

        // Check for status badges in the table
        cy.get('tbody').within(() => {
            cy.contains('span', 'Pending').should('be.visible');
            cy.contains('span', 'Approved').should('be.visible');
            cy.contains('span', 'Rejected').should('be.visible');
        });

        // Filter to pending events
        // Look for CategoryRadio button that says "Pending" but not "Pending Event"
        cy.get('button').contains(/^Pending$/).click();
        cy.wait('@getEvents');
        cy.wait(500);
        cy.contains('Events: 1').should('be.visible');
        cy.contains('Pending Event').should('be.visible');
        cy.contains('Approved Event').should('not.exist');
        cy.contains('Rejected Event').should('not.exist');

        // Filter to approved events
        cy.get('button').contains(/^Approved$/).click();
        cy.wait('@getEvents');
        cy.wait(500);
        cy.contains('Events: 1').should('be.visible');
        cy.contains('Approved Event').should('be.visible');
        cy.contains('Pending Event').should('not.exist');
        cy.contains('Rejected Event').should('not.exist');

        // Filter to rejected events
        cy.get('button').contains(/^Rejected$/).click();
        cy.wait('@getEvents');
        cy.wait(500);
        cy.contains('Events: 1').should('be.visible');
        cy.contains('Rejected Event').should('be.visible');
        cy.contains('Pending Event').should('not.exist');
        cy.contains('Approved Event').should('not.exist');

        // Switch back to all events
        cy.get('button').contains(/^All Status$/).click();
        cy.wait('@getEvents');
        cy.wait(500);
        cy.contains('Events: 3').should('be.visible');
    });

    it('searches for events using the search bar', () => {
        const events = [
            {
                id: 10,
                eventName: 'Pending Event',
                categoryId: 1,
                organizerName: 'Org A',
                startDateTime: '2025-06-01T12:00:00Z',
                endDateTime: '2025-06-01T15:00:00Z',
                updatedAt: '2025-05-20T00:00:00Z',
                status: 'PENDING',
                venueName: 'Hall A',
                description: 'Test pending event',
            },
            {
                id: 20,
                eventName: 'Approved Event',
                categoryId: 2,
                organizerName: 'Org B',
                startDateTime: '2025-07-01T12:00:00Z',
                endDateTime: '2025-07-01T15:00:00Z',
                updatedAt: '2025-06-20T00:00:00Z',
                status: 'APPROVED',
                venueName: 'Hall B',
                description: 'Test approved event',
            },
            {
                id: 30,
                eventName: 'Rejected Event',
                categoryId: 3,
                organizerName: 'Org C',
                startDateTime: '2025-08-01T12:00:00Z',
                endDateTime: '2025-08-01T15:00:00Z',
                updatedAt: '2025-07-20T00:00:00Z',
                status: 'REJECTED',
                venueName: 'Hall C',
                description: 'Test rejected event',
            },
        ];
        cy.intercept('GET', '**/api/admin/events*', (req) => {
            req.reply({ statusCode: 200, body: events });
        }).as('getEvents');

        cy.visit('http://localhost:5173/admin/permissions', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'admin-perm-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Initially, all events are shown.
        cy.contains('Events: 3').should('be.visible');
        cy.contains('Pending Event').should('be.visible');
        cy.contains('Approved Event').should('be.visible');
        cy.contains('Rejected Event').should('be.visible');

        // Search by title
        cy.get('input[placeholder="Search events..."]').type('Approved');
        cy.wait(300);
        cy.contains('Approved Event').should('be.visible');
        cy.contains('Pending Event').should('not.exist');
        cy.contains('Rejected Event').should('not.exist');

        // Search by location
        cy.get('input[placeholder="Search events..."]').clear().type('Hall C');
        cy.wait(300);
        cy.contains('Rejected Event').should('be.visible');
        cy.contains('Pending Event').should('not.exist');
        cy.contains('Approved Event').should('not.exist');

        // Clear search
        cy.get('input[placeholder="Search events..."]').clear();
        cy.wait(300);
        cy.contains('Events: 3').should('be.visible');
    });

    it('opens the event detail modal when clicking a row', () => {
        const event = {
            id: 42,
            eventName: 'Detail Test Event',
            categoryId: 1,
            organizerName: 'Org Detail',
            startDateTime: '2025-09-01T08:00:00Z',
            endDateTime: '2025-09-01T10:00:00Z',
            updatedAt: '2025-08-15T00:00:00Z',
            status: 'PENDING',
            venueName: 'Hall D',
            description: 'Description for modal test',
        };
        cy.intercept('GET', '**/api/admin/events*', (req) => {
            req.reply({ statusCode: 200, body: [event] });
        }).as('getEvents');

        cy.visit('http://localhost:5173/admin/permissions', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'admin-perm-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Click the row to open detail modal
        cy.contains('Detail Test Event').click();

        // Wait for modal to appear
        cy.get('[role="dialog"]').should('exist');

        // Check modal content
        cy.get('[role="dialog"]').within(() => {
            cy.contains('Detail Test Event').should('be.visible');
            cy.contains('Event Description').scrollIntoView().should('be.visible');
            cy.contains('Description for modal test').should('be.visible');
            cy.contains('Organizer Information').should('be.visible');
            cy.contains('Org Detail').should('be.visible');
        });

        // Close modal
        cy.get('[role="dialog"]').contains('button', 'Close').click();
        cy.get('[role="dialog"]').should('not.exist');
    });

    it('approves an event via the action modal', () => {
        const pendingEvent = {
            id: 55,
            eventName: 'Approval Test Event',
            categoryId: 2,
            organizerName: 'Org Approve',
            startDateTime: '2025-10-01T09:00:00Z',
            endDateTime: '2025-10-01T11:00:00Z',
            updatedAt: '2025-09-20T00:00:00Z',
            status: 'PENDING',
            venueName: 'Hall E',
            description: 'Event that will be approved',
        };

        cy.intercept('GET', '**/api/admin/events*', (req) => {
            req.reply({ statusCode: 200, body: [pendingEvent] });
        }).as('getEvents');

        cy.intercept('POST', `/api/admin/events/${pendingEvent.id}/approve`, {
            statusCode: 200,
            body: {},
        }).as('postApprove');

        cy.visit('http://localhost:5173/admin/permissions', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'admin-perm-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Click Approve button (not the row)
        cy.contains('td', 'Approval Test Event').parent().within(() => {
            cy.contains('button', 'Approve').click();
        });

        // Wait for action modal
        cy.get('[role="dialog"]').should('exist');
        cy.contains('Approve Event').should('be.visible');

        // Optional: Add approval notes
        cy.get('textarea').type('Looks good!');

        // Submit approval
        cy.get('[role="dialog"]').contains('button', 'Approve').click();
        cy.wait('@postApprove');

        // Event should be removed from list
        cy.wait(300);
        cy.contains('Approval Test Event').should('not.exist');
    });

    it('rejects an event via the action modal with required reason', () => {
        const pendingEvent = {
            id: 66,
            eventName: 'Rejection Test Event',
            categoryId: 2,
            organizerName: 'Org Reject',
            startDateTime: '2025-11-01T09:00:00Z',
            endDateTime: '2025-11-01T11:00:00Z',
            updatedAt: '2025-10-20T00:00:00Z',
            status: 'PENDING',
            venueName: 'Hall F',
            description: 'Event that will be rejected',
        };

        cy.intercept('GET', '**/api/admin/events*', (req) => {
            req.reply({ statusCode: 200, body: [pendingEvent] });
        }).as('getEvents');

        cy.intercept('POST', `/api/admin/events/${pendingEvent.id}/reject`, {
            statusCode: 200,
            body: {},
        }).as('postReject');

        cy.visit('http://localhost:5173/admin/permissions', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'admin-perm-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Click Reject button
        cy.contains('td', 'Rejection Test Event').parent().within(() => {
            cy.contains('button', 'Reject').click();
        });

        // Wait for action modal
        cy.get('[role="dialog"]').should('exist');
        cy.contains('Reject Event').should('be.visible');

        // Try to submit without reason (should be disabled)
        cy.get('[role="dialog"]').contains('button', 'Reject').should('be.disabled');

        // Enter rejection reason
        cy.get('textarea').type('Does not meet our requirements');

        // Now submit should be enabled
        cy.get('[role="dialog"]').contains('button', 'Reject').should('not.be.disabled').click();
        cy.wait('@postReject');

        // Event should be removed from list
        cy.wait(300);
        cy.contains('Rejection Test Event').should('not.exist');
    });


    it('displays event thumbnails correctly', () => {
        const event = {
            id: 77,
            eventName: 'Event With Image',
            categoryId: 1,
            organizerName: 'Test Org',
            startDateTime: '2025-06-01T12:00:00Z',
            updatedAt: '2025-05-20T00:00:00Z',
            status: 'PENDING',
            venueName: 'Test Hall',
        };

        cy.intercept('GET', '**/api/admin/events*', {
            statusCode: 200,
            body: [event],
        }).as('getEvents');

        cy.visit('http://localhost:5173/admin/permissions', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'admin-perm-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Check that thumbnail image is displayed
        cy.contains('td', 'Event With Image').parent().within(() => {
            cy.get('img').should('be.visible');
        });
    });

    it('shows empty state when no events match search', () => {
        cy.intercept('GET', '**/api/admin/events*', {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    eventName: 'Test Event',
                    categoryId: 1,
                    organizerName: 'Test Org',
                    startDateTime: '2025-06-01T12:00:00Z',
                    status: 'PENDING',
                    venueName: 'Test Hall',
                },
            ],
        }).as('getEvents');

        cy.visit('http://localhost:5173/admin/permissions', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'admin-perm-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Search for non-existent event
        cy.get('input[placeholder="Search events..."]').type('NONEXISTENT');
        cy.wait(300);

        // Should show empty state message
        cy.contains('No events found matching your criteria').should('be.visible');
    });


});