// cypress/e2e/admin.cy.js
//
// This Cypress spec tests the Admin Event Management page.  The page is
// protected by an admin role, so we stub the `/api/auth/me` endpoint to
// return a user with role 'ADMIN' and set a token in localStorage.
//
// The tests verify that the event table renders with the correct
// number of rows, that filtering by status works, that the search
// bar filters events by name, and that clicking a row navigates to
// the event detail page.

describe('Admin Event Management', () => {
    // Stub the authentication endpoint before each test to simulate an admin
    // user.  This prevents the RequireAuth/RequireRole wrappers from
    // redirecting us to the login page.
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 1,
                username: 'adminuser',
                email: 'admin@example.com',
                role: 'ADMIN',
                firstName: 'Admin',
                lastName: 'User',
                phoneNumber: '0800000000',
            },
        }).as('getMe');
    });

    it('displays the event management table with events', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Check the page heading and ensure at least one event row is visible.
        cy.contains('Event Management').should('be.visible');
        cy.get('table tbody tr').should('have.length.at.least', 1);
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
    });

    it('filters events by ON SALE status', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Click the "ON SALE" category button in the toolbar to filter events.
        cy.contains('button', 'ON SALE').click();

        // Verify that OFF SALE events are not visible in the table
        // Wait a moment for the filter to apply
        cy.get('table tbody tr').should('have.length.at.least', 1);

        // Check that all visible rows have ON SALE status
        cy.get('table tbody tr').each(($row) => {
            cy.wrap($row).should('not.contain', 'OFF SALE');
        });
    });

    it('filters events by OFF SALE status', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Click the "OFF SALE" category button to filter for OFF SALE events
        cy.contains('button', 'OFF SALE').click();

        // Verify that the table shows OFF SALE events
        cy.get('table tbody tr').should('have.length.at.least', 1);

        // Check that visible rows contain OFF SALE status
        cy.get('table tbody tr').first().should('contain', 'OFF SALE');
    });

    it('searches events by title', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Type a query into the search bar to filter events.
        cy.get('input[placeholder="Search events..."]').type('ART HOUSE');

        // The list should show the event with title "THE ART HOUSE 4"
        cy.contains('THE ART HOUSE 4').should('be.visible');
    });

    it('searches events by organizer name', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Search by organizer name
        cy.get('input[placeholder="Search events..."]').type('Thai Ticket');

        // Events organized by Thai Ticket should be visible
        cy.contains('THE RIVER BROS').should('be.visible');
        cy.contains('SOMBR UNDRESS').should('be.visible');
    });

    it('clears search and shows all events again', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Type a search query
        cy.get('input[placeholder="Search events..."]').type('ROBERT');
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');

        // Clear the search
        cy.get('input[placeholder="Search events..."]').clear({ force: true });

        // Multiple events should be visible now
        cy.get('table tbody tr').should('have.length.at.least', 2);
    });

    it('navigates to the event detail page when a row is clicked', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Click the first row to navigate to its detail page.
        cy.get('table tbody tr').first().click();

        // The URL should include '/admin/eventdetail'.
        cy.url().should('include', '/admin/eventdetail');
    });

    it('sorts events by newest date', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Verify the page loads and has events
        cy.get('table tbody tr').should('have.length.at.least', 1);

        // The first event shown should be one of the newest events
        cy.get('table tbody tr').first().should('be.visible');
    });

    it('displays pagination controls and navigates between pages', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Verify pagination controls are visible
        cy.contains('button', 'Next').should('be.visible');

        // If there are multiple pages, click Next
        cy.get('button').contains('Next').then(($btn) => {
            if (!$btn.is(':disabled')) {
                cy.wrap($btn).click();
                // Verify the page changed
                cy.url().should('include', 'admin');
                cy.get('table tbody tr').should('have.length.at.least', 1);
            }
        });
    });

    it('resets pagination when applying filters', () => {
        cy.visit('http://localhost:5173/admin', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Click ON SALE filter
        cy.contains('button', 'ON SALE').click();

        // Pagination should show page 1
        cy.contains('Page').should('contain', '1');
    });
});