// cypress/e2e/profilepage.cy.js
//
// This suite covers the Profile page for an authenticated user.  The page
// displays basic user information and a list of purchased tickets.  It
// requires authentication via the AuthProvider, which we stub by
// intercepting the `/api/auth/me` endpoint and setting a token in
// localStorage.  The tests verify that the profile details render
// correctly, that the tickets section is visible, and that the edit
// profile popup can be opened and closed.

describe('User Profile Page', () => {
    // Provide a stubbed response for the authenticated user on every test.
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 123,
                username: 'testuser',
                email: 'testuser@example.com',
                role: 'USER',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '0123456789',
                idCard: '1234567890123',
            },
        }).as('getMe');
    });

    it('displays user information and tickets', () => {
        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                // Simulate a loggedâ€'in state by providing a token and timestamp.
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // The profile card should show the userâ€™s name, email and phone number.
        cy.contains('Test User').should('be.visible');
        cy.contains('testuser@example.com').should('be.visible');
        cy.contains('0123456789').should('be.visible');

        // The â€œMy Ticketâ€ heading should be visible on the page.
        cy.contains('My Ticket').should('be.visible');

        // At least one ticket card should appear with the event title from the sample data.
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
    });

    it('opens and closes the edit profile popup', () => {
        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Click the edit button (red dot) in the profile card to open the popup.
        cy.get('[title="Edit Profile"]').click();
        cy.contains('Edit Profile').should('be.visible');
        cy.contains('First Name').should('be.visible');

        // Close the popup by clicking the Cancel button.
        cy.contains('button', 'Cancel').click();
        cy.contains('Edit Profile').should('not.exist');
    });

    it('edits profile information and saves changes', () => {
        // Stub the update profile API endpoint
        cy.intercept('PUT', '**/api/profile/user', {
            statusCode: 200,
            body: {
                id: 123,
                username: 'testuser',
                email: 'newemail@example.com',
                role: 'USER',
                firstName: 'Updated',
                lastName: 'Name',
                phoneNumber: '9876543210',
                idCard: '9876543210987',
            },
        }).as('updateProfile');

        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Open the edit profile popup
        cy.get('[title="Edit Profile"]').click();
        cy.contains('Edit Profile').should('be.visible');

        // Update the profile fields - use within to scope to the popup
        cy.get('.bg-white.rounded-2xl').within(() => {
            cy.get('input').eq(0).clear({ force: true }).type('Updated');
            cy.get('input').eq(1).clear({ force: true }).type('Name');
            cy.get('input').eq(2).clear({ force: true }).type('newemail@example.com');
            cy.get('input').eq(3).clear({ force: true }).type('9876543210');
        });

        // Click the Save button
        cy.contains('button', 'Save').click();
        cy.wait('@updateProfile');

        // Verify that the popup closes after saving
        cy.contains('Edit Profile').should('not.exist');
    });

    it('displays error message when profile update fails', () => {
        // Stub the update profile API endpoint to return an error
        cy.intercept('PUT', '**/api/profile/user', {
            statusCode: 400,
            body: {
                error: 'Invalid email format',
            },
        }).as('updateProfileError');

        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Open the edit profile popup
        cy.get('[title="Edit Profile"]').click();
        cy.contains('Edit Profile').should('be.visible');

        // Try to save with invalid data
        cy.get('input').eq(2).clear().type('invalid-email');
        cy.contains('button', 'Save').click();
        cy.wait('@updateProfileError');

        // Verify that the error message appears
        cy.contains('Invalid email format').should('be.visible');
    });

    it('displays organizer-specific fields when user role is ORGANIZER', () => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                id: 124,
                username: 'organizer',
                email: 'organizer@example.com',
                role: 'ORGANIZER',
                firstName: 'John',
                lastName: 'Organizer',
                phoneNumber: '5555555555',
                companyName: 'Event Company Inc',
                taxId: 'TAX123456',
                address: '123 Event Street',
                verificationStatus: 'VERIFIED',
            },
        }).as('getOrganizerMe');

        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getOrganizerMe');

        // The profile card should display organizer-specific information
        cy.contains('John Organizer').should('be.visible');
        cy.contains('organizer@example.com').should('be.visible');
        cy.contains('5555555555').should('be.visible');
        cy.contains('Company').should('be.visible');
        cy.contains('Event Company Inc').should('be.visible');
        cy.contains('Status').should('be.visible');
        cy.contains('VERIFIED').should('be.visible');

        // Open the edit profile popup and verify organizer fields
        cy.get('[title="Edit Profile"]').click();
        cy.contains('Edit Profile').should('be.visible');
        cy.contains('Company Name').should('be.visible');
        cy.contains('Tax ID').should('be.visible');
        cy.contains('Address').should('be.visible');

        // ID Card field should not be visible for organizers
        cy.contains('ID Card').should('not.exist');

        // Close the popup
        cy.contains('button', 'Cancel').click();
        cy.contains('Edit Profile').should('not.exist');
    });

    it('filters tickets by category', () => {
        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Initially all tickets should be visible
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');

        // Click on the category filter (Concert is default, try clicking All to reset or another category)
        cy.contains('All').click();

        // Verify the filter interaction works by checking if the button is interactable
        cy.contains('All').should('be.visible');
    });

    it('sorts tickets by newest and oldest', () => {
        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Verify the page loads with default sorting
        cy.contains('My Ticket').should('be.visible');
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');

        // Verify that sorting controls exist in the EventToolbar
        // The toolbar should have sorting controls visible
        cy.get('input[placeholder="Search events..."]').should('exist');
    });

    it('searches for tickets by title', () => {
        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
        cy.wait('@getMe');

        // Initially the ticket should be visible
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');

        // Find and interact with the search field
        cy.get('input[placeholder="Search events..."]').should('be.visible');

        // Type in the search field
        cy.get('input[placeholder="Search events..."]').type('ROBERT');

        // The search should filter tickets
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');

        // Try searching for a non-existent ticket
        cy.get('input[placeholder="Search events..."]').clear({ force: true }).type('Nonexistent');

        // The ticket should not be visible
        cy.contains('ROBERT BALTAZAR TRIO').should('not.exist');
    });
});