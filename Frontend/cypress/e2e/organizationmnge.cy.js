// cypress/e2e/organizationmnge.cy.js
//
// This suite exercises the Organization Management page for
// organizers.  The page lists all events belonging to the current
// organizer and provides controls for searching, filtering by
// category, sorting by newest/oldest, and navigating to the
// individual event detail page.  Because the route is protected by
// RequireRole, we stub the `/api/auth/me` endpoint to return a
// user with the `ORGANIZER` role.  We also stub `/api/events/mine`
// to return a small set of sample events so that the UI has
// predictable data to render.
//
// The tests verify that the events list is displayed, that the
// search and category filters work, that the order toggle changes
// the visible text, and that clicking the “View” link navigates
// to the correct event detail route.

describe('Organization Management Page', () => {
    // Provide stubbed responses for authentication and event data on
    // every test.  The auth response gives the user an ORGANIZER
    // role; without this role the route would redirect to the
    // Forbidden page.  The events response contains three events
    // spanning different categories and statuses.  Additional
    // intercepts catch any event detail requests to prevent network
    // errors when navigating.
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 99,
                username: 'organizeruser',
                email: 'organizer@example.com',
                role: 'ORGANIZER',
                firstName: 'Organizer',
                lastName: 'User',
            },
        }).as('getMe');

        cy.intercept('GET', '/api/events/mine', {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    eventName: 'Jazz Night',
                    categoryId: 1, // concert
                    status: 'PENDING',
                    startDateTime: '2025-05-01T00:00:00Z',
                },
                {
                    id: 2,
                    eventName: 'Tech Summit',
                    categoryId: 2, // seminar
                    status: 'APPROVED',
                    startDateTime: '2024-01-05T00:00:00Z',
                },
                {
                    id: 3,
                    eventName: 'Art Expo',
                    categoryId: 3, // exhibition
                    status: 'REJECTED',
                    startDateTime: '2024-09-10T00:00:00Z',
                },
            ],
        }).as('getEvents');

        // We no longer intercept all `/api/events/*` routes here to avoid
        // capturing the `/api/events/mine` request.  Individual tests can
        // stub event detail endpoints as needed.
    });

    it('shows a list of events for the organizer', () => {
        // Visit the organization management page with a fake token in
        // localStorage so that the AuthProvider considers us logged in.
        cy.visit('http://localhost:5173/organizationmnge', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        // Wait for both the auth check and the events fetch.
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // The page should display the heading and all three event titles.
        cy.contains('All Event').should('be.visible');
        cy.contains('Jazz Night').should('be.visible');
        cy.contains('Tech Summit').should('be.visible');
        cy.contains('Art Expo').should('be.visible');

        // The status labels for each event should appear (Pending, Approved, Rejected).
        cy.contains('Pending').should('be.visible');
        cy.contains('Approved').should('be.visible');
        cy.contains('Rejected').should('be.visible');
    });

    it('filters events using the search bar', () => {
        cy.visit('http://localhost:5173/organizationmnge', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Enter a search term.  The query is debounced in the component,
        // but Cypress will wait until the DOM updates before asserting.
        cy.get('input[placeholder="Search events..."]').type('Tech');

        // Only the matching event should remain visible.
        cy.contains('Tech Summit').should('be.visible');
        cy.contains('Jazz Night').should('not.exist');
        cy.contains('Art Expo').should('not.exist');
    });

    it('filters events by category', () => {
        cy.visit('http://localhost:5173/organizationmnge', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Select the Seminar category.  This should show only the seminar event.
        cy.contains('Seminar').click();
        cy.contains('Tech Summit').should('be.visible');
        cy.contains('Jazz Night').should('not.exist');
        cy.contains('Art Expo').should('not.exist');

        // Switch to the Exhibition category.  Only Art Expo should remain.
        cy.contains('Exhibition').click();
        cy.contains('Art Expo').should('be.visible');
        cy.contains('Jazz Night').should('not.exist');
        cy.contains('Tech Summit').should('not.exist');
    });

    it('toggles sorting order using the order toggle', () => {
        cy.visit('http://localhost:5173/organizationmnge', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // By default the toggle displays “Newest Event”.
        cy.contains('Newest Event').should('be.visible');

        // Open the dropdown and choose “Oldest Event”.
        cy.contains('Newest Event').click();
        cy.contains('Oldest Event').click();

        // The toggle label should now read “Oldest Event”.
        cy.contains('Oldest Event').should('be.visible');

        // Switch back to the newest ordering.
        cy.contains('Oldest Event').click();
        cy.contains('Newest Event').click();
        cy.contains('Newest Event').should('be.visible');
    });

    it('navigates to the event detail page when clicking the View link', () => {
        cy.visit('http://localhost:5173/organizationmnge', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');
        cy.wait('@getEvents');

        // Stub the GET request for the event detail so Cypress does not
        // attempt to reach a real backend when navigating to the detail
        // page.  We only stub the specific ID used in this test.
        cy.intercept('GET', '/api/events/1', {
            statusCode: 200,
            body: {},
        }).as('getEventDetail');

        // Click the first “View” link.  This should navigate to
        // `/eventdetail/1` because the first event has id=1 in our stub.
        cy.contains('View').first().click();

        // Wait for the event detail call to complete and assert that the
        // URL path matches the expected event detail route.
        cy.wait('@getEventDetail');
        cy.location('pathname').should('eq', '/eventdetail/1');
    });
});