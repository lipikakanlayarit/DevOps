describe('หน้า Login', () => {
    beforeEach(() => {
        // กัน state ค้างจากเทสต์ก่อนหน้า
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit('http://localhost:5173/login'); // หรือใช้ baseUrl ถ้าตั้งไว้ใน cypress.config
    });

    it('แสดงฟอร์ม Login ครบ', () => {
        cy.get('h1').contains(/log in/i).should('be.visible');
        cy.get('input[autocomplete="username"]').should('exist');
        cy.get('input[autocomplete="current-password"]').should('exist');
        cy.contains('button', /log in/i).should('exist');
    });

    it('กรอกไม่ครบแล้วขึ้นข้อความแจ้งเตือน', () => {
        // กรอกแค่ username แล้ว "ส่งฟอร์ม" โดยตรง (ไม่กดปุ่มซึ่ง disabled)
        cy.get('input[autocomplete="username"]').type('admin');

        // submit ฟอร์มตรงๆ (เพราะปุ่มถูก disabled)
        cy.get('form').submit();

        // ตรวจสอบว่ามีข้อความเตือน
        cy.contains('กรุณากรอกข้อมูลให้ครบ').should('be.visible');
    });

    it('ล็อกอินสำเร็จแล้ว redirect ไป /admin', () => {
        // intercept ที่ "URL เต็ม" ของ backend (ตามจริงคือ localhost:8080)
        cy.intercept('POST', 'http://localhost:8080/api/auth/login', (req) => {
            req.reply({
                statusCode: 200,
                body: {
                    token: 'fake-jwt',
                    user: { username: 'admin', role: 'ADMIN' }, // ต้องมี user.username / user.role
                },
            });
        }).as('loginReq');

        // กรอกข้อมูลล็อกอิน
        cy.get('input[autocomplete="username"]').type('admin');
        cy.get('input[autocomplete="current-password"]').type('password123');

        // ปุ่มจะ enabled แล้ว
        cy.contains('button', /log in/i).should('not.be.disabled').click();

        // รอ intercept ตอบกลับ
        cy.wait('@loginReq');

        // ตรวจว่า redirect ไป /admin
        cy.location('pathname', { timeout: 10000 }).should('include', '/admin');
    });

    it('ล็อกอินไม่สำเร็จแล้วแสดงข้อความผิดพลาด', () => {
        cy.intercept('POST', 'http://localhost:8080/api/auth/login', {
            statusCode: 401,
            body: { message: 'Login failed' },
        }).as('loginFail');

        cy.get('input[autocomplete="username"]').type('wronguser');
        cy.get('input[autocomplete="current-password"]').type('wrongpass');

        // ปุ่มจะ enabled เพราะกรอกครบ
        cy.contains('button', /log in/i).should('not.be.disabled').click();

        // รอ intercept
        cy.wait('@loginFail');

        // ตรวจว่ามีข้อความผิดพลาด
        cy.contains(/login failed/i).should('be.visible');
        cy.location('pathname').should('eq', '/login');
    });
});
