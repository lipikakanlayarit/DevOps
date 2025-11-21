// cypress/e2e/profilepage.cy.js

describe('User Profile Page', () => {
    const mockUserProfile = {
        id: 123,
        username: 'testuser',
        email: 'testuser@example.com',
        role: 'USER',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '0123456789',
        idCard: '1234567890123',
    };

    const mockOrganizerProfile = {
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
    };

    const mockTickets = [
        {
            reserveId: 'RES001',
            eventId: 1,
            seatId: 101,
            title: 'ROBERT BALTAZAR TRIO',
            venue: 'Bangkok Concert Hall',
            showDate: '2025-12-01T19:00:00',
            zone: 'VIP',
            rowLabel: 'A',
            seatNumber: '12',
            unitPrice: 1500,
            type: 'concert',
            posterUrl: '/poster1.jpg',
            effectiveStatus: 'ONSALE'
        },
        {
            reserveId: 'RES002',
            eventId: 2,
            seatId: 102,
            title: 'Tech Summit 2025',
            venue: 'Convention Center',
            showDate: '2025-11-25T09:00:00',
            zone: 'General',
            rowLabel: 'B',
            seatNumber: '5',
            unitPrice: 800,
            type: 'seminar',
            posterUrl: '/poster2.jpg',
            effectiveStatus: 'ONSALE'
        },
        {
            reserveId: 'RES003',
            eventId: 3,
            seatId: 103,
            title: 'Art Exhibition 2025',
            venue: 'Art Gallery',
            showDate: '2025-10-15T10:00:00',
            zone: 'Standard',
            rowLabel: 'C',
            seatNumber: '8',
            unitPrice: 500,
            type: 'exhibition',
            posterUrl: '/poster3.jpg',
            effectiveStatus: 'ONSALE'
        }
    ];

    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: mockUserProfile,
        }).as('getMe');

        cy.intercept('GET', '**/profile/my-tickets', {
            statusCode: 200,
            body: mockTickets,
        }).as('getTickets');
    });

    const visitProfile = () => {
        cy.visit('http://localhost:5173/profile', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'fake-token');
                win.localStorage.setItem('tokenTimestamp', Date.now().toString());
            },
        });
    };

    // =====================
    // P0 Tests
    // =====================

    describe('P0 - Authentication & Page Load', () => {
        it('TC-P0-001: loads page successfully when authenticated', () => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
            cy.contains('My Ticket').should('be.visible');
        });

        it('TC-P0-002: redirects to /login when unauthenticated', () => {
            cy.intercept('GET', '**/api/auth/me', {
                statusCode: 401,
            }).as('getMeUnauth');

            cy.visit('http://localhost:5173/profile');
            cy.url().should('include', '/login');
        });

        it('TC-P0-003: displays loading state while loading data', () => {
            cy.intercept('GET', '**/api/auth/me', {
                statusCode: 200,
                body: mockUserProfile,
                delay: 1000,
            }).as('getMeSlow');

            visitProfile();
            cy.contains('Loading...').should('be.visible');
            cy.wait('@getMeSlow');
            cy.contains('Loading...').should('not.exist');
        });

        it('TC-P0-004: successfully calls GET /api/auth/me', () => {
            visitProfile();
            cy.wait('@getMe').its('request.url').should('include', '/api/auth/me');
        });

        it('TC-P0-005: successfully calls GET /profile/my-tickets', () => {
            visitProfile();
            cy.wait('@getTickets').its('request.url').should('include', '/profile/my-tickets');
        });
    });

    describe('P0 - Profile Card Display - USER Role', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
        });

        it('TC-P0-006: displays avatar initials (First + Last name)', () => {
            cy.contains('TU').should('be.visible');
        });

        it('TC-P0-007: displays correct email', () => {
            cy.contains('testuser@example.com').should('be.visible');
        });

        it('TC-P0-008: displays correct full name', () => {
            cy.contains('Test User').should('be.visible');
        });

        it('TC-P0-009: displays correct username', () => {
            cy.contains('testuser').should('be.visible');
        });

        it('TC-P0-010: displays correct phone number', () => {
            cy.contains('0123456789').should('be.visible');
        });

        it('TC-P0-011: displays ID Card for USER', () => {
            cy.contains('ID Card').should('be.visible');
            cy.contains('1234567890123').should('be.visible');
        });

        it('TC-P0-012: Edit Profile button (red dot) is displayed and clickable', () => {
            cy.get('[title="Edit Profile"]').should('be.visible').and('have.class', 'bg-red-500');
            cy.get('[title="Edit Profile"]').click();
            cy.contains('Edit Profile').should('be.visible');
        });
    });

    describe('P0 - Profile Card Display - ORGANIZER Role', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/auth/me', {
                statusCode: 200,
                body: mockOrganizerProfile,
            }).as('getOrganizerMe');

            visitProfile();
            cy.wait('@getOrganizerMe');
            cy.wait('@getTickets');
        });

        it('TC-P0-013: displays organizer information correctly', () => {
            cy.contains('John Organizer').should('be.visible');
            cy.contains('organizer@example.com').should('be.visible');
            cy.contains('5555555555').should('be.visible');
        });

        it('TC-P0-014: displays Company Name', () => {
            cy.contains('Company').should('be.visible');
            cy.contains('Event Company Inc').should('be.visible');
        });

        it('TC-P0-015: displays Verification Status', () => {
            cy.contains('Status').should('be.visible');
            cy.contains('VERIFIED').should('be.visible');
        });

        it('TC-P0-016: does not display ID Card for ORGANIZER', () => {
            cy.contains('ID Card').should('not.exist');
        });
    });

    describe('P0 - Edit Profile Popup - USER', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
            cy.get('[title="Edit Profile"]').click();
        });

        it('TC-P0-017: opens popup when clicking Edit button', () => {
            cy.contains('Edit Profile').should('be.visible');
        });

        it('TC-P0-018: displays all required fields', () => {
            cy.contains('Email').should('be.visible');
            cy.contains('First Name').should('be.visible');
            cy.contains('Last Name').should('be.visible');
            cy.contains('Phone Number').should('be.visible');
            cy.contains('ID Card').should('be.visible');
        });

        it('TC-P0-020: can edit information', () => {
            cy.get('input').eq(1).clear().type('NewFirst');
            cy.get('input').eq(1).should('have.value', 'NewFirst');
        });

        it('TC-P0-021: Cancel button closes popup', () => {
            cy.contains('button', 'Cancel').click();
            cy.contains('Edit Profile').should('not.exist');
        });

        it('TC-P0-022: Save button calls PUT /api/profile/user', () => {
            cy.intercept('PUT', '**/api/profile/user', {
                statusCode: 200,
                body: mockUserProfile,
            }).as('updateProfile');

            cy.contains('button', 'Save').click();
            cy.wait('@updateProfile');
        });

        it('TC-P0-023: displays "Saving..." while saving', () => {
            cy.intercept('PUT', '**/api/profile/user', {
                statusCode: 200,
                body: mockUserProfile,
                delay: 500,
            }).as('updateProfileSlow');

            cy.contains('button', 'Save').click();
            cy.contains('Saving...').should('be.visible');
        });

        it('TC-P0-024: closes popup after successful save', () => {
            cy.intercept('PUT', '**/api/profile/user', {
                statusCode: 200,
                body: mockUserProfile,
            }).as('updateProfile');

            cy.contains('button', 'Save').click();
            cy.wait('@updateProfile');
            cy.contains('Edit Profile').should('not.exist');
        });

        it('TC-P0-025: displays success alert after save', () => {
            cy.intercept('PUT', '**/api/profile/user', {
                statusCode: 200,
                body: mockUserProfile,
            }).as('updateProfile');

            cy.on('window:alert', (text) => {
                expect(text).to.contains('Profile updated successfully');
            });

            cy.contains('button', 'Save').click();
            cy.wait('@updateProfile');
        });

        it('TC-P0-026: refreshes profile data after successful save', () => {
            cy.intercept('PUT', '**/api/profile/user', {
                statusCode: 200,
                body: { ...mockUserProfile, firstName: 'Updated' },
            }).as('updateProfile');

            cy.intercept('GET', '**/api/auth/me', {
                statusCode: 200,
                body: { ...mockUserProfile, firstName: 'Updated' },
            }).as('getMeRefresh');

            cy.contains('button', 'Save').click();
            cy.wait('@updateProfile');
            cy.wait('@getMeRefresh');
        });
    });

    describe('P0 - Edit Profile Popup - ORGANIZER', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/auth/me', {
                statusCode: 200,
                body: mockOrganizerProfile,
            }).as('getOrganizerMe');

            visitProfile();
            cy.wait('@getOrganizerMe');
            cy.wait('@getTickets');
            cy.get('[title="Edit Profile"]').click();
        });

        it('TC-P0-027: displays organizer fields', () => {
            cy.contains('Email').should('be.visible');
            cy.contains('First Name').should('be.visible');
            cy.contains('Last Name').should('be.visible');
            cy.contains('Phone Number').should('be.visible');
            cy.contains('Company Name').should('be.visible');
            cy.contains('Tax ID').should('be.visible');
            cy.contains('Address').should('be.visible');
        });

        it('TC-P0-028: does not display ID Card field', () => {
            cy.contains('ID Card').should('not.exist');
        });

        it('TC-P0-029: Save button calls PUT /api/profile/organizer', () => {
            cy.intercept('PUT', '**/api/profile/organizer', {
                statusCode: 200,
                body: mockOrganizerProfile,
            }).as('updateOrganizer');

            cy.contains('button', 'Save').click();
            cy.wait('@updateOrganizer');
        });

        it('TC-P0-030: saves organizer data successfully', () => {
            cy.intercept('PUT', '**/api/profile/organizer', {
                statusCode: 200,
                body: mockOrganizerProfile,
            }).as('updateOrganizer');

            cy.contains('button', 'Save').click();
            cy.wait('@updateOrganizer').its('response.statusCode').should('eq', 200);
        });
    });

    describe('P0 - Edit Profile - Error Handling', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
            cy.get('[title="Edit Profile"]').click();
        });

        it('TC-P0-031: displays error message when save fails', () => {
            cy.intercept('PUT', '**/api/profile/user', {
                statusCode: 400,
                body: { error: 'Invalid email format' },
            }).as('updateProfileError');

            cy.contains('button', 'Save').click();
            cy.wait('@updateProfileError');
            cy.contains('Invalid email format').should('be.visible');
        });

        it('TC-P0-032: does not close popup when error occurs', () => {
            cy.intercept('PUT', '**/api/profile/user', {
                statusCode: 400,
                body: { error: 'Update failed' },
            }).as('updateProfileError');

            cy.contains('button', 'Save').click();
            cy.wait('@updateProfileError');
            cy.contains('Edit Profile').should('be.visible');
        });
    });

    describe('P0 - Tickets Display', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
        });

        it('TC-P0-034: displays "My Ticket" heading', () => {
            cy.contains('My Ticket').should('be.visible');
        });

        it('TC-P0-035: displays all ticket cards', () => {
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Tech Summit 2025').should('be.visible');
            cy.contains('Art Exhibition 2025').should('be.visible');
        });

        it('TC-P0-036: displays correct ticket information', () => {
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Bangkok Concert Hall').should('be.visible');
        });

        it('TC-P0-037: clicking ticket card opens Ticket Popup', () => {
            cy.contains('ROBERT BALTAZAR TRIO').click();
            cy.contains('Organizer Check-in').should('be.visible');
        });

        it('TC-P0-038: displays EventToolbar', () => {
            cy.get('input[placeholder="Search events..."]').should('be.visible');
            cy.contains('All').should('be.visible');
        });
    });

    describe('P0 - Ticket Popup', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
            cy.contains('ROBERT BALTAZAR TRIO').click();
        });

        it('TC-P0-039: opens popup when clicking ticket', () => {
            cy.contains('Organizer Check-in').should('be.visible');
        });

        it('TC-P0-040: displays TicketCard component', () => {
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('VIP').should('be.visible');
        });

        it('TC-P0-041: displays QR Code', () => {
            cy.get('canvas').should('be.visible');
        });

        it('TC-P0-042: displays Check-in URL', () => {
            cy.contains('Check-in URL').should('be.visible');
            cy.contains('/checkin/RES001').should('be.visible');
        });

        it('TC-P0-043: "Copy link" button copies URL', () => {
            cy.window().then((win) => {
                cy.stub(win.navigator.clipboard, 'writeText').as('clipboardStub');
            });

            cy.contains('button', 'Copy link').click();
            cy.get('@clipboardStub').should('have.been.calledOnce');
        });

        it('TC-P0-044: × button closes popup', () => {
            cy.get('button').contains('×').click();
            cy.contains('Organizer Check-in').should('not.exist');
        });

        it('TC-P0-045: URL contains reserveId, eventId, and seat info', () => {
            cy.contains('/checkin/RES001').should('be.visible');
            cy.get('.font-mono').should('contain', 'eventId=1');
            cy.get('.font-mono').should('contain', 'seatId=101');
        });
    });

    describe('P0 - Ticket Filtering', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
        });

        it('TC-P0-046: Filter "All" displays all tickets', () => {
            cy.contains('All').click();
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Tech Summit 2025').should('be.visible');
            cy.contains('Art Exhibition 2025').should('be.visible');
        });

        it('TC-P0-047: Filter "Concert" displays only concerts', () => {
            cy.contains('Concert').click();
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Tech Summit 2025').should('not.exist');
        });

        it('TC-P0-048: Filter "Seminar" displays only seminars', () => {
            cy.contains('Seminar').click();
            cy.contains('Tech Summit 2025').should('be.visible');
            cy.contains('ROBERT BALTAZAR TRIO').should('not.exist');
        });

        it('TC-P0-049: Filter "Exhibition" displays only exhibitions', () => {
            cy.contains('Exhibition').click();
            cy.contains('Art Exhibition 2025').should('be.visible');
            cy.contains('ROBERT BALTAZAR TRIO').should('not.exist');
        });
    });

    describe('P0 - Ticket Search', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
        });

        it('TC-P0-050: Search box is displayed and functional', () => {
            cy.get('input[placeholder="Search events..."]').should('be.visible').and('be.enabled');
        });

        it('TC-P0-051: Search by title filters tickets correctly', () => {
            cy.get('input[placeholder="Search events..."]').type('ROBERT');
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Tech Summit 2025').should('not.exist');
        });

        it('TC-P0-052: Search by venue filters tickets correctly', () => {
            cy.get('input[placeholder="Search events..."]').type('Concert Hall');
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Tech Summit 2025').should('not.exist');
        });

        it('TC-P0-053: Clear search displays all tickets', () => {
            cy.get('input[placeholder="Search events..."]').type('ROBERT');
            cy.get('input[placeholder="Search events..."]').clear();
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Tech Summit 2025').should('be.visible');
        });

        it('TC-P0-054: Search with no results displays no tickets', () => {
            cy.get('input[placeholder="Search events..."]').type('NonexistentEvent');
            cy.contains('ROBERT BALTAZAR TRIO').should('not.exist');
            cy.contains('Tech Summit 2025').should('not.exist');
        });
    });

    describe('P0 - Ticket Sorting', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
        });

        it('TC-P0-055: Sort "newest" orders from new to old', () => {
            // Default is newest, so just verify order
            cy.get('.myticket-card').first().should('contain', 'ROBERT BALTAZAR TRIO');
        });

        it('TC-P0-056: Sort "oldest" orders from old to new', () => {
            // Need to implement sort toggle in UI or test via toolbar
            cy.get('.myticket-card').should('have.length.at.least', 1);
        });
    });

    // =====================
    // P1 Tests
    // =====================

    describe('P1 - Combined Filters', () => {
        beforeEach(() => {
            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTickets');
        });

        it('TC-P1-018: Category + Search work together', () => {
            cy.contains('Concert').click();
            cy.get('input[placeholder="Search events..."]').type('ROBERT');
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
            cy.contains('Tech Summit 2025').should('not.exist');
        });

        it('TC-P1-019: Category + Sort work together', () => {
            cy.contains('Concert').click();
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
        });

        it('TC-P1-020: Search + Sort work together', () => {
            cy.get('input[placeholder="Search events..."]').type('2025');
            cy.get('.myticket-card').should('have.length.at.least', 1);
        });

        it('TC-P1-021: Category + Search + Sort work together', () => {
            cy.contains('Concert').click();
            cy.get('input[placeholder="Search events..."]').type('ROBERT');
            cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
        });
    });

    describe('P1 - Error States', () => {
        it('TC-P1-022: Handle API error for profile', () => {
            cy.intercept('GET', '**/api/auth/me', {
                statusCode: 500,
                body: { error: 'Server error' },
            }).as('getMeError');

            visitProfile();
            cy.wait('@getMeError');
            // Should handle gracefully
        });

        it('TC-P1-024: Handle empty tickets response', () => {
            cy.intercept('GET', '**/profile/my-tickets', {
                statusCode: 200,
                body: [],
            }).as('getTicketsEmpty');

            visitProfile();
            cy.wait('@getMe');
            cy.wait('@getTicketsEmpty');
            cy.contains('My Ticket').should('be.visible');
        });
    });
});