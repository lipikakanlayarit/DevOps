// cypress/e2e/login.cy.js

describe('หน้า Login', () => {
    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        // ใช้ URL เต็มกันเคส baseUrl ไม่ถูกอ่าน หรือจะใช้ cy.visit('/login') ถ้าตั้ง baseUrl แล้วก็ได้
        cy.visit('http://localhost:5173/login');
    });

    it('แสดงฟอร์ม Login ครบ', () => {
        cy.get('h1, [role="heading"]').contains(/log in|sign in/i).should('be.visible');
        cy.get('input[autocomplete="username"], input[name="username"]').should('exist');
        cy.get('input[autocomplete="current-password"], input[name="password"]').should('exist');
        cy.contains('button, [type="submit"]', /log in|sign in/i).should('exist');
    });

    it('กรอกไม่ครบแล้วขึ้นข้อความแจ้งเตือน', () => {
        cy.get('input[autocomplete="username"], input[name="username"]').type('admin');
        cy.get('form').submit();
        cy.contains(/กรุณากรอกข้อมูลให้ครบ|please fill|required/i).should('be.visible');
    });

    it('ล็อกอินสำเร็จ: admin (ADMIN) → redirect /admin', () => {
        // 1) mock login
        cy.intercept('POST', '**/api/auth/login', {
            statusCode: 200,
            body: { token: 'fake-jwt-token', user: { username: 'admin', role: 'ADMIN' } },
        }).as('loginReq');

        // 2) mock auth/me (สำคัญมาก ป้องกัน 401)
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: { id: 1, username: 'admin', role: 'ADMIN', email: 'admin@example.com' },
        }).as('authMe');

        // 3) ดำเนินการ
        cy.get('input[autocomplete="username"], input[name="username"]').type('admin');
        cy.get('input[autocomplete="current-password"], input[name="password"]').type('password123');
        cy.contains('button, [type="submit"]', /log in|sign in/i).should('not.be.disabled').click();

        cy.wait('@loginReq');
        // แอปบางตัวจะเรียก /auth/me ในหน้าถัดไป ถ้ามีให้รอด้วย (ถ้าไม่มีก็จะข้ามอัตโนมัติ)
        // cy.wait('@authMe'); // เปิดใช้ถ้าต้องการ
        cy.location('pathname', { timeout: 10000 }).should('include', '/admin');
    });

    it('ล็อกอินไม่สำเร็จแล้วแสดงข้อความผิดพลาด', () => {
        // เคสนี้ "อย่า" mock auth/me ให้ 200 เราต้องการให้ล้มที่ login เลย
        cy.intercept('POST', '**/api/auth/login', {
            statusCode: 401,
            body: { message: 'Login failed' },
        }).as('loginFail');

        cy.get('input[autocomplete="username"], input[name="username"]').type('wronguser');
        cy.get('input[autocomplete="current-password"], input[name="password"]').type('wrongpass');
        cy.contains('button, [type="submit"]', /log in|sign in/i).should('not.be.disabled').click();

        cy.wait('@loginFail');
        cy.contains(/login failed|invalid|unauthorized/i).should('be.visible');
        cy.location('pathname').should('eq', '/login');
    });
});
