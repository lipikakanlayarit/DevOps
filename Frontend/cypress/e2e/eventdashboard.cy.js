// cypress/e2e/eventdashboard.cy.js
//
// Tests for the Event Dashboard page.  This page is one of the simpler
// authenticated areas of the application – it displays a handful of
// statistics (available, reserved and sold seats) along with a small
// list of seat reservations and a search box for filtering them.
//
// All of the data on this screen is currently hard‑coded in the
// component (see src/pages/Eventdashboard.tsx), so there are no
// backend calls to stub apart from the authentication check.  The
// RequireAuth wrapper fetches the current user via `/api/auth/me` and
// redirects to `/login` if that call fails.  To keep our tests
// independent of any real backend we intercept that request and
// provide a stubbed user.  We also seed localStorage with a token so
// that the AuthProvider thinks the user is already logged in.

describe('Event Dashboard', () => {
    // Stub the `/api/auth/me` call in every test.  Without this the
    // AuthProvider will redirect to `/login` and the page under test
    // would never render.
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 1,
                username: 'organizer',
                email: 'organizer@example.com',
                role: 'ORGANIZER',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '0123456789',
                idCard: null,
                companyName: null,
                taxId: null,
                address: null,
                verificationStatus: null,
            },
        }).as('getMe');
    });

    it('redirects to the organization management page when no event id is provided', () => {
        // When visiting the dashboard without an eventId the component
        // navigates back to `/organizationmnge`.  Populate localStorage
        // before the page loads so the AuthProvider treats us as
        // authenticated.
        cy.visit('http://localhost:5173/eventdashboard', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        // Wait for the auth call so the navigation has a chance to fire.
        cy.wait('@getMe');
        // The router should redirect to the organization management page.
        cy.location('pathname', { timeout: 10000 }).should('eq', '/organizationmnge');
    });

    it('displays KPI cards and reservation list for a given event id', () => {
        cy.visit('http://localhost:5173/eventdashboard/evt_1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Check that the event identifier from the URL appears on screen.
        cy.contains('Event ID').should('contain.text', 'evt_1');

        // KPI cards show the seat counts.  These values are defined in the
        // component so we can assert against them directly.
        cy.contains('Available Seat : 40').should('be.visible');
        cy.contains('Reserved Seat : 12').should('be.visible');
        cy.contains('Sold Seat : 8').should('be.visible');

        // The reservation list uses mock data with three entries (B12, C20, A01).
        cy.contains('B12').should('be.visible');
        cy.contains('C20').should('be.visible');
        cy.contains('A01').should('be.visible');
    });

    it('filters reservations based on the search query', () => {
        cy.visit('http://localhost:5173/eventdashboard/evt_1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // The search field has a clear placeholder we can use to locate it.
        cy.get('input[placeholder="Search reservations..."]').as('search');

        // Typing a seat identifier should filter the list down to matching rows.
        cy.get('@search').type('C20');
        cy.contains('C20').should('be.visible');
        cy.contains('B12').should('not.exist');
        cy.contains('A01').should('not.exist');

        // Clearing the search field should restore all rows.
        cy.get('@search').clear();
        cy.contains('B12').should('be.visible');
        cy.contains('C20').should('be.visible');
        cy.contains('A01').should('be.visible');
    });
});