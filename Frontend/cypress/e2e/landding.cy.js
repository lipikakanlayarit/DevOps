// cypress/e2e/landding.cy.js

describe('Landing Page', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 401,
            body: { error: 'Unauthorized' },
        }).as('getMe');
    });

    it('displays the hero section with call-to-action buttons', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('LIVE THE VIBE ON').should('be.visible');
        cy.contains('button', 'ALL EVENT').should('be.visible');
        cy.contains('ORGANIZER').should('be.visible');
    });

    it('scrolls to the events section when clicking ALL EVENT', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').should('be.visible');
        cy.contains('ALL VIBE LONG').should('be.visible');
    });

    it('filters events by search query', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').should('be.visible');
        cy.get('input[placeholder="Search events..."]').type('JAZZ');
        cy.contains(/Found 1 event/i).should('be.visible');
        cy.contains(/JAZZ/i).should('be.visible');
        cy.contains('JAZZ FESTIVAL').should('be.visible');
    });

    it('filters events by category', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').should('be.visible');
        cy.contains('Exhibition').click();
        cy.contains(/Found.*event/i).should('be.visible');
        cy.contains('in Exhibition category').should('be.visible');
        cy.contains('THE ART HOUSE 4').should('be.visible');
        cy.contains('ART GALLERY SHOWCASE').should('be.visible');
    });

    it('expands and collapses the event list using the Show more and Show less buttons', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').should('be.visible');
        cy.get('#events-section').find('article[role="button"]').should('have.length', 5);
        cy.contains(/Show more/i).click();
        cy.get('#events-section').find('article[role="button"]').should('have.length.greaterThan', 5);
        cy.contains('Show less').click();
        cy.get('#events-section').find('article[role="button"]').should('have.length', 5);
    });

    it('redirects to the login page when selecting an event while unauthenticated', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').find('article[role="button"]').first().click();
        cy.location('pathname').should('eq', '/login');
        cy.location('search').should('contain', 'returnTo=%2Feventselect');
    });

    it('clears search and displays all events again', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').should('be.visible');
        cy.get('input[placeholder="Search events..."]').type('JAZZ');
        cy.contains('JAZZ FESTIVAL').should('be.visible');
        cy.get('input[placeholder="Search events..."]').clear({ force: true });
        cy.get('#events-section').find('article[role="button"]').should('have.length.greaterThan', 1);
    });

    it('displays featured event section', () => {
        cy.visit('http://localhost:5173/');
        cy.get('[data-testid="featured-event"]').within(() => {
            cy.contains('ROBERT').should('be.visible');
            cy.contains('BALTAZAR TRIO').should('be.visible');
            cy.contains('VIEW').should('be.visible');
        });
        cy.get('img[alt="Robert Baltazar Trio"]').should('be.visible');
    });

    it('navigates to eventselect when clicking VIEW on featured event', () => {
        cy.visit('http://localhost:5173/');
        cy.get('[data-testid="featured-event"]').within(() => {
            cy.contains('BALTAZAR TRIO').should('be.visible');
            // แก้ไขตรงนี้: เอา 'button' ออก
            cy.contains('VIEW').click();
        });
        cy.location('pathname').should('eq', '/login');
        cy.location('search').should('contain', 'returnTo=%2Feventselect');
    });

    it('filters multiple categories and resets correctly', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').should('be.visible');
        cy.contains('Concert').click();
        cy.contains(/Found.*event/i).should('be.visible');
        cy.get('#events-section').find('article[role="button"]').should('have.length.at.least', 1);
        cy.contains('Seminar').click();
        cy.contains(/Found.*event/i).should('be.visible');
        cy.contains('All').click();
        cy.get('#events-section').find('article[role="button"]').should('have.length', 5);
    });

    it('displays no events message when search has no results', () => {
        cy.visit('http://localhost:5173/');
        cy.contains('button', 'ALL EVENT').click();
        cy.get('#events-section').should('be.visible');
        cy.get('input[placeholder="Search events..."]').type('NONEXISTENT_EVENT_12345');
        cy.contains('No events found').should('be.visible');
        cy.contains('Try adjusting your search terms').should('be.visible');
        cy.contains('Clear all filters').should('be.visible');
    });
});