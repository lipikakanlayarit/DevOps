describe('Profile Page', () => {
    beforeEach(() => {
        // ใช้ custom login command
        cy.login('alice123', 'password123');
        cy.url().should('not.include', '/login');
        // รอให้ profile หน้า load เสร็จ
        cy.contains('My Ticket').should('be.visible');
    });

    it('should display user profile information', () => {
        // ตรวจสอบว่า profile card แสดงผล
        cy.get('[title="Edit Profile"]').should('be.visible');

        // ตรวจสอบ profile details
        cy.contains('Name').should('be.visible');
        cy.contains('Username').should('be.visible');
        cy.contains('Phone Number').should('be.visible');
        cy.contains('ID Card').should('be.visible');
    });

    it('should open edit profile popup when clicking edit button', () => {
        // คลิกปุ่ม edit
        cy.get('[title="Edit Profile"]').click();

        // ตรวจสอบว่า popup เปิด
        cy.contains('Edit Profile').should('be.visible');
        cy.contains('First Name').should('be.visible');
        cy.contains('Last Name').should('be.visible');
        cy.contains('Email').should('be.visible');
        cy.contains('Phone Number').should('be.visible');
    });

    it('should update profile information', () => {
        // คลิกปุ่ม edit
        cy.get('[title="Edit Profile"]').click();

        // Intercept API call
        cy.intercept('PUT', '**/api/profile/user', {
            statusCode: 200,
            body: { success: true }
        }).as('updateProfile');

        // แก้ไข First Name
        cy.get('input').filter((index, el) => {
            return Cypress.$(el).attr('value') && Cypress.$(el).attr('value').includes('Alice') || Cypress.$(el).attr('value').includes('alice');
        }).first().clear().type('Alicia');

        // คลิก Save
        cy.contains('button', /Save/i).click();

        // รอให้ API call จบ
        cy.wait('@updateProfile');
    });

    it('should close popup when clicking cancel', () => {
        // คลิกปุ่ม edit
        cy.get('[title="Edit Profile"]').click();

        // ตรวจสอบว่า popup เปิด
        cy.contains('Edit Profile').should('be.visible');

        // คลิก Cancel
        cy.contains('button', /Cancel/i).click();

        // ตรวจสอบว่า popup ปิด
        cy.contains('Edit Profile').should('not.be.visible');
    });

    it('should display organizer fields if user is organizer', () => {
        // Login ด้วย organizer account
        cy.login('organizer_user', 'password123');
        cy.visit('http://localhost:5173//profile');

        // คลิกปุ่ม edit
        cy.get('[title="Edit Profile"]').click();

        // ตรวจสอบว่า organizer fields แสดง
        cy.contains('Company Name').should('be.visible');
        cy.contains('Tax ID').should('be.visible');
        cy.contains('Address').should('be.visible');

        // ตรวจสอบว่า ID Card field ไม่แสดง
        cy.contains('ID Card').should('not.be.visible');
    });

    it('should filter tickets by category', () => {
        // เลือก category "Concert" - ถ้ามี dropdown
        cy.contains('Concert').click({ force: true });

        // ตรวจสอบว่ามี tickets แสดง
        cy.get('div').should('contain', 'ROBERT BALTAZAR TRIO');
    });

    it('should open ticket details when clicking ticket card', () => {
        // หา ticket card และคลิก
        cy.contains('ROBERT BALTAZAR TRIO').parent().click();

        // ตรวจสอบว่า popup เปิด
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');
    });

    it('should close ticket popup when clicking X button', () => {
        // หา ticket card และคลิก
        cy.contains('ROBERT BALTAZAR TRIO').parent().click();

        // ตรวจสอบว่า popup เปิด
        cy.contains('ROBERT BALTAZAR TRIO').should('be.visible');

        // คลิก X button
        cy.get('button').contains('×').click();

        // ตรวจสอบว่า popup ปิด (อาจยังเห็น ROBERT ในเมนูแต่ popup ต้องปิด)
        cy.get('div').filter('.fixed').should('not.exist');
    });

    it('should handle unauthorized access and redirect to login', () => {
        // Intercept profile API เพื่อ return 401
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 401,
            body: { error: 'Unauthorized' }
        }).as('profileError');

        // ไปที่หน้า profile โดยตรง
        cy.visit('http:localhost:5173/profile');

        // ตรวจสอบว่า redirect ไปหน้า login
        cy.url().should('include', '/login');
    });
});