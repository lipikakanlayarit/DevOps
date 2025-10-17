Cypress.Commands.add('loginAs', (role = 'ADMIN') => {
    cy.intercept('POST', 'http://localhost:8080/api/auth/login', (req) => {
        req.reply({
            statusCode: 200,
            body: { token: 'fake', user: { username: role.toLowerCase(), role } },
        });
    }).as('loginReq');

    cy.visit('/login');
    cy.get('input[autocomplete="username"]').type(role.toLowerCase());
    cy.get('input[autocomplete="current-password"]').type('password123');
    cy.contains('button', /log in/i).click();
    cy.wait('@loginReq');
});
