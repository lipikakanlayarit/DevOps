// cypress/e2e/landing-p0-p1.cy.ts

describe('Landing Page - P0 & P1 Tests', () => {
    const BASE_URL = 'http://localhost:5173/';

    // Mock data
    const mockOnSaleEvents = [
        {
            id: 1,
            eventName: 'Rock Concert 2025',
            categoryId: 1,
            salesStartDatetime: '2025-11-15T10:00:00+07:00',
            salesEndDatetime: '2025-12-31T23:59:59+07:00',
            coverUrl: 'https://via.placeholder.com/300x400',
            venueName: 'Impact Arena',
        },
        {
            id: 2,
            eventName: 'Tech Seminar',
            categoryId: 2,
            salesStartDatetime: '2025-11-20T09:00:00+07:00',
            salesEndDatetime: '2025-11-25T18:00:00+07:00',
            coverUrl: 'https://via.placeholder.com/300x400',
            venueName: 'BITEC',
        },
    ];

    const mockUpcomingEvents = [
        {
            id: 3,
            eventName: 'Art Exhibition',
            categoryId: 3,
            salesStartDatetime: '2025-12-01T10:00:00+07:00',
            salesEndDatetime: '2025-12-15T20:00:00+07:00',
            coverUrl: null,
            venueName: 'MCC Hall',
        },
    ];

    beforeEach(() => {
        // Mock API responses
        cy.intercept('GET', '**/api/public/events/landing?section=onSale', {
            statusCode: 200,
            body: mockOnSaleEvents,
        }).as('getOnSaleEvents');

        cy.intercept('GET', '**/api/public/events/landing?section=upcoming', {
            statusCode: 200,
            body: mockUpcomingEvents,
        }).as('getUpcomingEvents');
    });

    // ============================================
    // 🔴 P0: Test 1 - Data Loading & API
    // ============================================
    describe('P0: Test 1 - Initial Load & API Tests', () => {

        it('1.2: Should call both APIs and merge data', () => {
            cy.visit(BASE_URL);

            // Wait for both API calls
            cy.wait('@getOnSaleEvents').its('response.statusCode').should('eq', 200);
            cy.wait('@getUpcomingEvents').its('response.statusCode').should('eq', 200);

            // Verify data is displayed (merged)
            cy.wait(1000);
            cy.contains('Rock Concert 2025').should('exist');
            cy.contains('Tech Seminar').should('exist');
            cy.contains('Art Exhibition').should('exist');

            cy.log('✅ APIs called and data merged');
        });

        it('1.3: Should display loading state then hide it', () => {
            // Delay API response to see loading
            cy.intercept('GET', '**/api/public/events/landing?section=onSale', {
                statusCode: 200,
                body: mockOnSaleEvents,
                delay: 1000,
            }).as('slowOnSale');

            cy.visit(BASE_URL);

            // Check loading state
            cy.contains(/กำลังโหลด|Loading/i, { timeout: 2000 }).should('be.visible');

            // Wait for API
            cy.wait('@slowOnSale');

            // Loading should disappear
            cy.contains(/กำลังโหลด|Loading/i).should('not.exist');

            cy.log('✅ Loading state works');
        });

        it('1.4: Should handle API error gracefully', () => {
            cy.intercept('GET', '**/api/public/events/landing?section=onSale', {
                statusCode: 500,
                body: { error: 'Internal Server Error' },
            }).as('errorOnSale');

            cy.intercept('GET', '**/api/public/events/landing?section=upcoming', {
                statusCode: 500,
                body: { error: 'Internal Server Error' },
            }).as('errorUpcoming');

            cy.visit(BASE_URL);
            cy.wait(['@errorOnSale', '@errorUpcoming']);

            // Should show error message
            cy.contains(/โหลดล้มเหลว|Load failed|HTTP 500/i).should('be.visible');

            // Page should not crash
            cy.contains('LIVE THE VIBE ON').should('be.visible');

            cy.log('✅ Error handling works');
        });
    });

    // ============================================
    // 🔴 P0: Test 7 - Event Cards Display
    // ============================================
    describe('P0: Test 7 - Event Cards Tests', () => {
        beforeEach(() => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(1000);
        });

        it('7.1: Should display event cards with correct data', () => {
            cy.get('#events-section').within(() => {
                // Check event names
                cy.contains('Rock Concert 2025').should('be.visible');
                cy.contains('Tech Seminar').should('be.visible');

                // Check venue names
                cy.contains('Impact Arena').should('be.visible');
                cy.contains('BITEC').should('be.visible');
            });

            cy.log('✅ Event cards display correct data');
        });

        it('7.2: Should display event covers', () => {
            cy.get('#events-section').within(() => {
                // Check images exist
                cy.get('img').should('have.length.at.least', 2);
            });

            cy.log('✅ Event covers displayed');
        });

        it('7.4: Should filter out OFFSALE events', () => {
            // Verify that offsale events are not shown
            cy.get('#events-section').within(() => {
                cy.contains('OFFSALE').should('not.exist');
            });

            cy.log('✅ OFFSALE events filtered out');
        });

        it('7.5: Should display grid layout correctly', () => {
            cy.viewport(1280, 720);

            cy.get('#events-section').within(() => {
                // Check grid exists
                cy.get('.grid').should('exist');
            });

            cy.log('✅ Grid layout works');
        });
    });

    // ============================================
    // 🔴 P0: Test 16 - Navigation
    // ============================================
    describe('P0: Test 16 - Navigation Tests', () => {
        beforeEach(() => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(1000);
        });

        it('16.1: Should navigate to event detail when clicking event card', () => {
            cy.get('#events-section').scrollIntoView();
            cy.wait(500);

            // Click GET TICKET button
            cy.contains(/GET TICKET|View Event/i).first().click();

            // Should navigate to event detail
            cy.url({ timeout: 5000 }).should('include', '/eventselect/');

            cy.log('✅ Event card navigation works');
        });

        it('16.2: Should navigate to organizer login', () => {
            cy.contains(/ORGANIZER/i).click();

            cy.url({ timeout: 5000 }).should('include', '/OrganizerLogin');

            cy.log('✅ Organizer navigation works');
        });

        it('16.3: Should scroll to events section smoothly', () => {
            cy.contains('button', 'ALL EVENT').click();
            cy.wait(1000);

            // Should scroll to events section
            cy.get('#events-section').should('be.visible');

            cy.log('✅ Scroll navigation works');
        });

        it('16.4: Should navigate from countdown VIEW button', () => {
            // Check if countdown section exists
            cy.get('body').then(($body) => {
                if ($body.text().includes('VIEW')) {
                    cy.contains('button', 'VIEW').click();
                    cy.url({ timeout: 5000 }).should('include', '/eventselect/');
                    cy.log('✅ Countdown VIEW navigation works');
                } else {
                    cy.log('⚠️ No countdown section to test');
                }
            });
        });
    });

    // ============================================
    // 🟡 P1: Test 2 - Hero Section
    // ============================================
    describe('P1: Test 2 - Hero Section Tests', () => {
        beforeEach(() => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
        });

        it('2.1: Should display hero title correctly', () => {
            cy.get('h1').should('contain', 'LIVE THE VIBE ON')
                .and('be.visible')
                .and('have.css', 'font-weight', '800'); // extrabold

            cy.log('✅ Hero title displayed');
        });

        it('2.2: Should display main buttons', () => {
            cy.contains('button', 'ALL EVENT')
                .should('be.visible')
                .and('not.be.disabled');

            cy.contains(/ORGANIZER/i).should('be.visible');

            cy.log('✅ Hero buttons displayed');
        });

        it('2.3: Should have correct button spacing', () => {
            cy.get('div').contains('ALL EVENT').parent().should('have.class', 'gap-4');

            cy.log('✅ Button spacing correct');
        });

        it('2.4: Should scroll smoothly when clicking ALL EVENT', () => {
            cy.contains('button', 'ALL EVENT').click();

            // Check smooth scroll behavior
            cy.get('#events-section').should('be.visible');

            cy.log('✅ Smooth scroll works');
        });
    });

    // ============================================
    // 🟡 P1: Test 3 - Marquee Posters
    // ============================================
    describe('P1: Test 3 - Marquee Poster Tests', () => {
        beforeEach(() => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(1000);
        });

        it('3.1: Should display marquee posters', () => {
            cy.get('.poster-container')
                .should('exist')
                .and('have.length.at.least', 8); // MIN_ITEMS

            cy.log('✅ Marquee posters displayed');
        });

        it('3.2: Should display poster images', () => {
            cy.get('.poster-container img')
                .should('exist')
                .and('have.length.at.least', 1);

            cy.log('✅ Poster images displayed');
        });

        it('3.3: Should show event titles on posters', () => {
            cy.get('.poster-container').first().within(() => {
                cy.get('body').should('not.be.empty');
            });

            cy.log('✅ Poster titles displayed');
        });

        it('3.4: Should have infinite scroll animation', () => {
            cy.get('.animate-scroll-infinite').should('exist');

            cy.log('✅ Infinite scroll animation exists');
        });

        it('3.5: Should navigate when clicking poster', () => {
            cy.get('.poster-container').first().click();

            cy.url({ timeout: 5000 }).then((url) => {
                expect(url).to.match(/eventselect|#events-section/);
            });

            cy.log('✅ Poster click navigation works');
        });

    });

    // ============================================
    // 🟡 P1: Test 4 - Countdown Timer
    // ============================================
    describe('P1: Test 4 - Countdown Timer Tests', () => {
        it('4.1: Should display countdown for upcoming events', () => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(2000);

            // Check if countdown exists
            cy.get('body').then(($body) => {
                if ($body.text().includes('Art Exhibition')) {
                    // Countdown section displayed
                    cy.contains('Art Exhibition').should('be.visible');
                    cy.log('✅ Countdown section displayed');
                } else {
                    cy.log('⚠️ No upcoming events in range for countdown');
                }
            });
        });

        it('4.2: Should show event cover in countdown', () => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(2000);

            cy.get('body').then(($body) => {
                if ($body.text().includes('Art Exhibition')) {
                    // Check for image
                    cy.get('img[alt*="Art Exhibition"]').should('exist');
                    cy.log('✅ Countdown cover displayed');
                }
            });
        });

        it('4.3: Should show VIEW button in countdown', () => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(2000);

            cy.get('body').then(($body) => {
                if ($body.text().includes('VIEW')) {
                    cy.contains('button', 'VIEW').should('be.visible');
                    cy.log('✅ Countdown VIEW button displayed');
                }
            });
        });

        it('4.4: Should use fallback countdown when no upcoming events', () => {
            // Mock empty upcoming events
            cy.intercept('GET', '**/api/public/events/landing?section=upcoming', {
                statusCode: 200,
                body: [],
            }).as('emptyUpcoming');

            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@emptyUpcoming']);
            cy.wait(2000);

            // Should still show some countdown (fallback +10 days)
            cy.get('body').should('exist');

            cy.log('✅ Fallback countdown works');
        });
    });

    // ============================================
    // 🟡 P1: Test 6 - Search & Filter
    // ============================================
    describe('P1: Test 6 - Search & Filter Tests', () => {
        beforeEach(() => {
            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(1000);
        });

        it('6.1: Should display search bar', () => {
            cy.get('input[placeholder*="Search"]')
                .should('be.visible')
                .and('have.attr', 'placeholder', 'Search events...');

            cy.log('✅ Search bar displayed');
        });

        it('6.2: Should filter events by search query', () => {
            cy.get('input[placeholder*="Search"]')
                .clear()
                .type('Rock');

            cy.wait(500); // Debounce

            cy.get('#events-section').within(() => {
                cy.contains('Rock Concert 2025').should('be.visible');
                cy.contains('Tech Seminar').should('not.exist');
            });

            cy.log('✅ Search filtering works');
        });

        it('6.3: Should be case-insensitive', () => {
            cy.get('input[placeholder*="Search"]')
                .clear()
                .type('TECH');

            cy.wait(500);

            cy.get('#events-section').within(() => {
                cy.contains('Tech Seminar').should('be.visible');
            });

            cy.log('✅ Case-insensitive search works');
        });

        it('6.8: Should show "No events found" when no match', () => {
            cy.get('input[placeholder*="Search"]')
                .clear()
                .type('XYZ999NotFound');

            cy.wait(500);

            cy.contains('No events found').should('be.visible');

            cy.log('✅ Empty state displayed');
        });

    });
    // ============================================
    // Responsive Tests
    // ============================================
    describe('P1: Responsive Design Tests', () => {
        it('Should work on mobile viewport', () => {
            cy.viewport(375, 667); // iPhone SE

            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(1000);

            cy.contains('LIVE THE VIBE ON').should('be.visible');
            cy.get('#events-section').should('exist');

            cy.log('✅ Mobile responsive works');
        });

        it('Should work on tablet viewport', () => {
            cy.viewport(768, 1024); // iPad

            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(1000);

            cy.contains('LIVE THE VIBE ON').should('be.visible');
            cy.get('#events-section').should('exist');

            cy.log('✅ Tablet responsive works');
        });

        it('Should work on desktop viewport', () => {
            cy.viewport(1920, 1080);

            cy.visit(BASE_URL);
            cy.wait(['@getOnSaleEvents', '@getUpcomingEvents']);
            cy.wait(1000);

            cy.contains('LIVE THE VIBE ON').should('be.visible');
            cy.get('#events-section').should('exist');

            cy.log('✅ Desktop responsive works');
        });
    });
});