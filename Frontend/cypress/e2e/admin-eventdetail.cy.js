// cypress/e2e/admin-eventdetail.cy.js
//
// This suite exercises the admin event detail page.  The page is
// rendered under the `/admin/eventdetail` route and shows a
// comprehensive overview of a single event, including its basic
// information, ticket zones, seat statistics, reservation list and
// two modal dialogs (event detail and organizer detail).  Data on
// this page is currently mocked in the component itself and no
// backend calls are made beyond the authentication check, so
// intercepting `/api/auth/me` is sufficient to satisfy RequireRole.

describe('Admin Event Detail Page', () => {
    // Stub authentication on every test to grant admin privileges.
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
            },
        }).as('getMe');
    });

    it('displays event information and paginates the ticket zones table', () => {
        // Visit the admin event detail page with a fake token.  Without
        // the token RequireAuth would redirect away from the page.
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Verify that the event headline and key fields appear.  The
        // component uses a hard-coded `eventData` object, so these
        // values should always match.
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
        cy.contains('Category:').next().should('contain.text', 'Concert');
        cy.contains('Organizer:').next().should('contain.text', 'THAI TICKET MAJOR');
        cy.contains('Show Date:').next().should('contain.text', '12 January 2025');
        cy.contains('Show Date:').next().should('contain.text', '13 January 2025');
        cy.contains('Sale Period:').next().should('contain.text', '1 December 2024');

        // Seat statistics should show the counts from the mock data.
        cy.contains('Available Seat: 40').should('be.visible');
        cy.contains('Reserved Seat: 12').should('be.visible');
        cy.contains('Sold Seat: 8').should('be.visible');

        // The ticket zones table paginates 5 rows per page.  Assert that
        // five rows are present on the first page and that known zone
        // names appear.  The first table in the DOM corresponds to the
        // ticket zones.
        cy.get('table').eq(0).within(() => {
            cy.get('tbody tr').should('have.length', 5);
            cy.contains('VIP zone').should('be.visible');
            cy.contains('zone A').should('be.visible');
            cy.contains('Standard zone').should('be.visible');
        });

        // Use the pagination controls associated with the ticket zones to
        // navigate to the second page.  We target the first nav with
        // aria-label="Pagination" because the first pagination widget
        // corresponds to the ticket zones (the second is for reservations).
        cy.get('nav[aria-label="Pagination"]').first().contains('2').click();
        // On the second page there should only be one remaining zone.
        cy.get('table').eq(0).within(() => {
            cy.get('tbody tr').should('have.length', 1);
        });
    });


    it('opens and closes the event detail modal', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Open the event detail modal
        cy.contains('button', 'Event detail').click();

        // Wait for modal to be visible and check the title
        cy.get('[role="dialog"]').should('exist');
        cy.get('#event-detail-title').should('contain.text', 'ROBERT BALTAZAR TRIO');

        // Scroll within modal to see description
        cy.get('[role="dialog"]').within(() => {
            cy.contains('Event Description').should('exist');
            // Scroll to the description area
            cy.contains('An intimate jazz night').scrollIntoView().should('be.visible');
        });

        // Close the modal
        cy.get('[role="dialog"]').contains('button', 'Close').click();

        // Verify the modal has closed
        cy.get('[role="dialog"]').should('not.exist');
    });

    it('opens and closes the organizer detail modal', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Open the organizer detail modal
        cy.contains('button', 'Organizer detail').click();

        // Wait for the organizer modal to appear
        cy.get('[role="dialog"]').should('exist');
        cy.get('#organizer-detail-title').should('contain.text', 'Organizer Details');

        // Verify organizer information is displayed
        cy.get('[role="dialog"]').within(() => {
            cy.contains('THAI TICKET MAJOR').should('be.visible');
            cy.contains('+66 (0) 2-262-3456').should('be.visible');
            cy.contains('contact@thaiticketmajor.com').should('be.visible');
            cy.contains('999/9 The Offices at CentralWorld').scrollIntoView().should('be.visible');
        });

        // Close the modal
        cy.get('[role="dialog"]').contains('button', 'Close').click();

        // Verify the modal has closed
        cy.get('[role="dialog"]').should('not.exist');
    });

    it('paginates the reservations table correctly', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // The reservations table shows 10 items per page
        cy.get('table').eq(1).find('tbody tr').should('have.length', 10);

        // Navigate to page 2 using the second pagination control
        cy.get('nav[aria-label="Pagination"]').eq(1).contains('2').click();

        // Should show remaining items (11 total reservations - 10 on page 1 = 1 on page 2)
        cy.get('table').eq(1).find('tbody tr').should('have.length', 1);

        // Navigate back to page 1
        cy.get('nav[aria-label="Pagination"]').eq(1).contains('1').click();
        cy.get('table').eq(1).find('tbody tr').should('have.length', 10);
    });

    it('displays correct reservation information in the table', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Check that the first reservation row contains expected data
        cy.get('table').eq(1).find('tbody tr').first().within(() => {
            cy.contains('810100125892500').should('be.visible'); // RESERVED ID
            cy.contains('B12').should('be.visible'); // SEAT ID
            cy.contains('5,000').should('be.visible'); // TOTAL
            cy.contains('ZOMBIE').should('be.visible'); // USER
            cy.contains('15 Dec 2024').should('be.visible'); // DATE
            cy.contains('Credit Card').should('be.visible'); // PAYMENT METHOD
            cy.contains('SOLD').should('be.visible'); // STATUS (COMPLETE -> SOLD)
        });
    });

    it('shows correct ticket zone information', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Check the ticket zones table structure
        cy.get('table').eq(0).within(() => {
            // Verify table headers
            cy.contains('th', 'Ticket Zone').should('be.visible');
            cy.contains('th', 'Row').should('be.visible');
            cy.contains('th', 'Column').should('be.visible');
            cy.contains('th', 'Sale').should('be.visible');
            cy.contains('th', 'Price/ticket').should('be.visible');

            // Verify first row data
            cy.get('tbody tr').first().within(() => {
                cy.contains('VIP zone').should('be.visible');
                cy.contains('12').should('be.visible'); // Row
                cy.contains('6').should('be.visible'); // Column
                cy.contains('50/30').should('be.visible'); // Sale
            });
        });
    });

    it('displays breadcrumb navigation correctly', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Check breadcrumb shows correct navigation path
        cy.contains('All Event').should('be.visible');
        cy.get('.lucide-chevron-right').should('be.visible');
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');

        // Test breadcrumb link functionality
        cy.contains('a', 'All Event').should('have.attr', 'href', '/admin');
    });

    it('modal closes when clicking outside or pressing Escape', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Open event detail modal
        cy.contains('button', 'Event detail').click();
        cy.get('[role="dialog"]').should('exist');

        // Close by clicking outside (on backdrop)
        cy.get('[role="dialog"]').parent().click('topLeft');
        cy.get('[role="dialog"]').should('not.exist');

        // Open organizer detail modal
        cy.contains('button', 'Organizer detail').click();
        cy.get('[role="dialog"]').should('exist');

        // Close by pressing Escape key
        cy.get('body').type('{esc}');
        cy.get('[role="dialog"]').should('not.exist');
    });

    it('displays event poster image correctly', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Check that event poster is displayed in the main info section
        cy.get('img[alt="ROBERT BALTAZAR TRIO"]').first().should('be.visible');
        cy.get('img[alt="ROBERT BALTAZAR TRIO"]').first().should('have.attr', 'src').and('include', 'poster');
    });


    it('displays seat statistics with correct colors', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Available seats should have green styling
        cy.contains('Available Seat: 40')
            .should('have.class', 'bg-green-100')
            .and('have.class', 'text-green-800');

        // Reserved seats should have yellow styling
        cy.contains('Reserved Seat: 12')
            .should('have.class', 'bg-yellow-100')
            .and('have.class', 'text-yellow-800');

        // Sold seats should have red styling
        cy.contains('Sold Seat: 8')
            .should('have.class', 'bg-red-100')
            .and('have.class', 'text-red-800');
    });

    it('handles empty search results gracefully', () => {
        cy.visit('http://localhost:5173/admin/eventdetail', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-admin-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Search for something that doesn't exist
        cy.get('input[placeholder="Search reservations..."]').type('NONEXISTENT123');
        cy.wait(300);

        // Should show "No reservations found" message
        cy.get('table').eq(1).contains('No reservations found').should('be.visible');
    });
});