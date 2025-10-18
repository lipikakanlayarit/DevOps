// cypress/e2e/eventselect.cy.js
//
// This suite exercises the Event Selection page.  The page allows an
// authenticated user to choose a show date and then pick one or more
// seats from a seating chart.  The component itself does not
// communicate with the backend except for the authentication check
// performed by the RequireAuth wrapper, so we only need to stub the
// `/api/auth/me` endpoint and set a token in localStorage before
// visiting the page.  The rest of the behaviour (date cards, seat
// selection, price calculation) is purely client side.

describe('Event Selection', () => {
    // Always stub the user lookup so the AuthProvider enters the
    // authenticated state instead of redirecting to `/login`.  We use a
    // minimal user object; only the `role` field matters for the
    // authorization guard (any role is accepted for this page).
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 42,
                username: 'testuser',
                email: 'user@example.com',
                role: 'USER',
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

    it('reveals the date selection section when clicking the Get Ticket button', () => {
        cy.visit('http://localhost:5173/eventselect', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Initially the date selection is off‑screen.  Clicking the
        // "Get Ticket" button should scroll to and display it.
        cy.contains('button', 'Get Ticket').scrollIntoView().click();
        cy.get('#date-selection').should('be.visible');
        // Verify that both available dates are rendered.
        cy.get('#date-selection').contains('Sat').should('be.visible');
        cy.get('#date-selection').contains('Sun').should('be.visible');
    });

    it('selects a date and one VIP seat, then shows a single ticket summary', () => {
        cy.visit('http://localhost:5173/eventselect', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Scroll to date selection and choose the first show (Sat 22 Mar).  We
        // limit our search to the date selection section to avoid clicking
        // the "Sat" text in the hero section.
        cy.contains('button', 'Get Ticket').scrollIntoView().click();
        cy.get('#date-selection').within(() => {
            cy.contains('Sat').click({ force: true });
        });

        // Once a date is selected the seat map should render.  The
        // "STAGE" label is a reliable indicator of this section.
        cy.contains('STAGE').should('be.visible');

        // Pick an available VIP seat (row B, seat 1).  The title
        // attribute includes both the seat ID and the zone.
        cy.get('button[title="B1 (VIP)"]').click();

        // The selected seats summary appears just below the seat map.
        // For a single seat it should show "Selected: 1 seat" and the
        // total price for that zone (฿5,000 for VIP seats).
        cy.contains('Selected: 1 seat').should('be.visible');
        cy.contains('Total: ฿5,000').should('be.visible');

        // Verify the ticket details: zone and price.  The row and seat
        // number are also shown but are less reliable to assert on
        // generically because "B" and "1" may appear elsewhere.  We
        // assert that the VIP label and the price are visible.
        cy.contains('VIP').should('be.visible');
        cy.contains('฿5,000').should('be.visible');

        // A "Go to Payment" button should be present for a single seat.
        // Use an exact text match to avoid matching buttons with additional text.
        cy.contains('button', /^Go to Payment$/).should('be.visible');
    });

    it('selects multiple VIP seats and shows the multiple tickets summary', () => {
        cy.visit('http://localhost:5173/eventselect', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Navigate to the first show (Saturday) and select two VIP seats.
        cy.contains('button', 'Get Ticket').scrollIntoView().click();
        cy.get('#date-selection').within(() => {
            cy.contains('Sat').click({ force: true });
        });
        cy.contains('STAGE').should('be.visible');

        // Choose two available VIP seats.  B2 and B3 are not occupied.
        cy.get('button[title="B2 (VIP)"]').click({ force: true });
        cy.get('button[title="B3 (VIP)"]').click({ force: true });

        // The summary should report two seats selected and the correct
        // total (฿10,000).  Note the plural "seats".
        cy.contains('Selected: 2 seats').should('be.visible');
        cy.contains('Total: ฿10,000').should('be.visible');

        // For multiple tickets the page shows a "Multiple Tickets Reserved"
        // header and enumerates each ticket (#1, #2).  The VIP zone
        // label should appear for each card.
        cy.contains('Multiple Tickets Reserved').should('be.visible');
        cy.contains('Ticket #1').should('be.visible');
        cy.contains('Ticket #2').should('be.visible');
        cy.contains('VIP').should('be.visible');

        // The single-ticket payment button should not be displayed.
        // Use exact text match to only match the single-ticket button, not multi-ticket variants.
        cy.contains('button', /^Go to Payment$/).should('not.exist');
    });

    it('selects a date and one Standard seat, then shows a single ticket summary', () => {
        // Visit the Eventselect page and authenticate via localStorage.  We reuse the
        // same stubbed `/api/auth/me` from the beforeEach hook to avoid a
        // redirect to `/login`.
        cy.visit('http://localhost:5173/eventselect', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Open the date selection and pick the first show (Saturday).
        cy.contains('button', 'Get Ticket').scrollIntoView().click();
        cy.get('#date-selection').within(() => {
            cy.contains('Sat').click({ force: true });
        });
        // Wait for the seat map to appear.
        cy.contains('STAGE').should('be.visible');

        // Choose an available Standard seat.  C2 is not listed in the occupied
        // seats array, so it should be selectable.  The title attribute
        // distinguishes the seat by its ID and zone.
        cy.get('button[title="C2 (STANDARD)"]').click();

        // Verify that the summary shows a single seat with the correct price and
        // zone information.  Standard seats cost ฿1,500.
        cy.contains('Selected: 1 seat').should('be.visible');
        cy.contains('Total: ฿1,500').should('be.visible');
        cy.contains('STANDARD').should('be.visible');
        cy.contains('฿1,500').should('be.visible');

        // A single-seat selection should display the "Go to Payment" button.
        cy.contains('button', /^Go to Payment$/).should('be.visible');
    });

    it('hides the seat map and clears selection when clicking the same date again', () => {
        // Navigate to the page with authentication.
        cy.visit('http://localhost:5173/eventselect', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Select the first date and pick a seat.
        cy.contains('button', 'Get Ticket').scrollIntoView().click();
        cy.get('#date-selection').within(() => {
            cy.contains('Sat').click({ force: true });
        });
        cy.contains('STAGE').should('be.visible');
        cy.get('button[title="B1 (VIP)"]').click();
        // Ensure the selection summary is visible for the single seat.
        cy.contains('Selected: 1 seat').should('be.visible');

        // Click the same date card again.  This should unset the selectedDate state
        // and hide the seat map and summary.
        cy.get('#date-selection').within(() => {
            cy.contains('Sat').click({ force: true });
        });

        // The seat map section should no longer exist in the DOM.
        cy.get('#seat-map-section').should('not.exist');
        // The selected seats summary should also disappear.
        cy.contains(/Selected:/).should('not.exist');
    });

    it('does not allow selecting an occupied seat', () => {
        // Visit the page and authenticate.
        cy.visit('http://localhost:5173/eventselect', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Open the date selection and choose Saturday.
        cy.contains('button', 'Get Ticket').scrollIntoView().click();
        cy.get('#date-selection').within(() => {
            cy.contains('Sat').click({ force: true });
        });
        cy.contains('STAGE').should('be.visible');

        // Attempt to click an occupied seat.  B4 is marked as occupied in the
        // component's occupiedSeats set.  The button should be disabled and
        // clicking it (even with force) should not produce a selection.
        cy.get('button[title="B4 (Occupied)"]').should('be.disabled');
        cy.get('button[title="B4 (Occupied)"]').click({ force: true });

        // Ensure no seat summary appears after attempting to select an occupied seat.
        cy.contains(/Selected:/).should('not.exist');
        cy.contains('Multiple Tickets Reserved').should('not.exist');
    });
});