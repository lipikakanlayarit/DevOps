// cypress/e2e/signin.cy.js
const PATH_SIGNUP = 'http://localhost:5173/signIn';

describe('Sign Up', () => {
    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(PATH_SIGNUP);
    });

    it('แสดงฟอร์มครบทุกช่องและ header ถูกต้อง', () => {
        // ตรวจสอบ header
        cy.contains('h1', /sign up/i).should('be.visible');
        cy.contains(/สร้างบัญชีใหม่ของคุณ/i).should('be.visible');

        // ตรวจสอบ fields ทั้งหมด
        cy.get('form').should('be.visible');

        [
            'email', 'password', 'firstName', 'lastName',
            'username', 'phoneNumber', 'idCard'
        ].forEach(name => {
            cy.get(`[name="${name}"]`).scrollIntoView().should('exist').and('be.visible');
        });

        // ตรวจสอบปุ่ม submit
        cy.contains('button', /create account/i).scrollIntoView().should('be.visible');

        // ตรวจสอบลิงก์ไปหน้า login
        cy.contains('a', /log in/i).should('have.attr', 'href', '/login');
    });

    it('ตรวจ validation: เว้นว่างแล้ว submit ต้องขึ้น error', () => {
        cy.get('form').submit();

        // รอให้ error messages แสดง
        cy.wait(500);

        // ตรวจสอบ error messages ตามโค้ดจริง
        cy.contains(/กรอกอีเมล/i).should('exist');
        cy.contains(/กรอกรหัสผ่าน/i).should('exist');
        cy.contains(/กรอกชื่อจริง/i).should('exist');
        cy.contains(/กรอกนามสกุล/i).should('exist');
        cy.contains(/กรอกชื่อผู้ใช้/i).should('exist');
        cy.contains(/กรอกเบอร์โทร/i).should('exist');
        cy.contains(/กรอกเลขบัตรประชาชน/i).should('exist');
    });

    it('ตรวจรูปแบบไม่ถูกต้อง: email/password/username/phone/idCard', () => {
        cy.get('[name="email"]').type('not-an-email');
        cy.get('[name="password"]').type('short');             // < 8 และไม่มีตัวเลข
        cy.get('[name="firstName"]').type('John');
        cy.get('[name="lastName"]').type('Doe');
        cy.get('[name="username"]').type('a!');                // สั้น/มีอักขระพิเศษ
        cy.get('[name="phoneNumber"]').type('abc');            // ไม่ใช่ตัวเลข
        cy.get('[name="idCard"]').type('123');                 // ไม่ครบ 13 หลัก

        cy.get('form').submit();
        cy.wait(500);

        // ตรวจสอบ error messages ตามโค้ดจริง
        cy.contains(/รูปแบบอีเมลไม่ถูกต้อง/i).scrollIntoView().should('exist');
        cy.contains(/อย่างน้อย 8 ตัวอักษร/i).scrollIntoView().should('exist');
        cy.contains(/4.{1,3}20 ตัวอักษร/i).scrollIntoView().should('exist');
        cy.contains(/กรอกเป็นตัวเลข 9.{1,3}15 หลัก/i).scrollIntoView().should('exist');
        cy.contains(/เลขบัตรต้องมี 13 หลัก/i).scrollIntoView().should('exist');
    });

    it('รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข', () => {
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="password"]').type('onlyletters');       // ไม่มีตัวเลข
        cy.get('[name="firstName"]').type('John');
        cy.get('[name="lastName"]').type('Doe');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="phoneNumber"]').type('0812345678');
        cy.get('[name="idCard"]').type('1234567890123');

        cy.get('form').submit();
        cy.wait(500);

        // scroll ไปที่ password field แล้วตรวจสอบ error
        cy.get('[name="password"]').scrollIntoView();
        cy.contains(/ต้องมีทั้งตัวอักษรและตัวเลข/i).should('exist');
    });

    it('แสดง/ซ่อนรหัสผ่านได้', () => {
        cy.get('[name="password"]').should('have.attr', 'type', 'password');

        // คลิกปุ่มแสดงรหัสผ่าน (ปุ่มอยู่ใน parent div)
        cy.get('[name="password"]').parent().find('button[type="button"]').click();
        cy.get('[name="password"]').should('have.attr', 'type', 'text');

        // คลิกอีกครั้งเพื่อซ่อน
        cy.get('[name="password"]').parent().find('button[type="button"]').click();
        cy.get('[name="password"]').should('have.attr', 'type', 'password');
    });

    it('สมัครสำเร็จ: mock API 201 แล้ว redirect ไป /login', () => {
        cy.intercept('POST', '**/api/auth/signup', {
            statusCode: 201,
            body: { id: 1, username: 'testuser' }
        }).as('signup');

        // กรอกข้อมูลถูกต้องครบถ้วน
        cy.get('[name="email"]').clear().type('test@example.com');
        cy.get('[name="password"]').clear().type('Password123');
        cy.get('[name="firstName"]').clear().type('John');
        cy.get('[name="lastName"]').clear().type('Doe');
        cy.get('[name="username"]').clear().type('testuser');
        cy.get('[name="phoneNumber"]').clear().type('0812345678');
        cy.get('[name="idCard"]').clear().type('1234567890123');

        // stub alert และเก็บข้อความ
        cy.window().then((win) => {
            cy.stub(win, 'alert').as('alert');
        });

        cy.contains('button', /create account/i).click();
        cy.wait('@signup');

        // ตรวจสอบว่า alert ถูกเรียกพร้อมข้อความที่ถูกต้อง
        cy.get('@alert').should('have.been.calledOnce');
        cy.get('@alert').should('have.been.calledWithMatch', /สมัครสมาชิกสำเร็จ/i);

        // ตรวจสอบ redirect
        cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
    });

    it('แสดง error เมื่อ API ส่ง error กลับมา', () => {
        cy.intercept('POST', '**/api/auth/signup', {
            statusCode: 400,
            body: { error: 'Email already exists' }
        }).as('signupError');

        // กรอกข้อมูล
        cy.get('[name="email"]').type('existing@example.com');
        cy.get('[name="password"]').type('Password123');
        cy.get('[name="firstName"]').type('John');
        cy.get('[name="lastName"]').type('Doe');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="phoneNumber"]').type('0812345678');
        cy.get('[name="idCard"]').type('1234567890123');

        cy.contains('button', /create account/i).click();
        cy.wait('@signupError');

        // ตรวจสอบ error message จาก server
        cy.contains(/Email already exists/i).should('be.visible');
    });

    it('แสดง loading state ขณะ submit', () => {
        cy.intercept('POST', '**/api/auth/signup', (req) => {
            req.reply({ delay: 1000, statusCode: 201, body: { id: 1 } });
        }).as('signupSlow');

        // กรอกข้อมูล
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="password"]').type('Password123');
        cy.get('[name="firstName"]').type('John');
        cy.get('[name="lastName"]').type('Doe');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="phoneNumber"]').type('0812345678');
        cy.get('[name="idCard"]').type('1234567890123');

        // stub alert
        cy.window().then((win) => cy.stub(win, 'alert'));

        cy.contains('button', /create account/i).click();

        // ตรวจสอบ loading state
        cy.contains('button', /creating account/i).should('be.visible');
        cy.get('button[type="submit"]').should('be.disabled');
        cy.get('.animate-spin').should('be.visible');
    });

    it('ลบ error เมื่อพิมพ์ใหม่', () => {
        // submit เพื่อให้เกิด error
        cy.get('form').submit();
        cy.wait(500);

        // ตรวจสอบว่ามี error
        cy.contains(/กรอกอีเมล/i).should('exist');

        // พิมพ์ใน field email
        cy.get('[name="email"]').type('test@example.com', { force: true });

        // error ควรหายไป
        cy.contains(/กรอกอีเมล/i).should('not.exist');
    });

    it('ลบ server error เมื่อพิมพ์ใหม่', () => {
        // mock error response
        cy.intercept('POST', '**/api/auth/signup', {
            statusCode: 400,
            body: { error: 'Server error occurred' }
        }).as('signupError');

        // กรอกและ submit
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="password"]').type('Password123');
        cy.get('[name="firstName"]').type('John');
        cy.get('[name="lastName"]').type('Doe');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="phoneNumber"]').type('0812345678');
        cy.get('[name="idCard"]').type('1234567890123');

        cy.contains('button', /create account/i).click();
        cy.wait('@signupError');

        // ตรวจสอบว่ามี server error
        cy.contains(/Server error occurred/i).should('be.visible');

        // พิมพ์ใหม่ในช่องใดช่องหนึ่ง
        cy.get('[name="email"]').clear().type('new@example.com');

        // server error ควรหายไป
        cy.contains(/Server error occurred/i).should('not.exist');
    });

    it('username validation: ต้องเป็น a-z, 0-9, _ เท่านั้น', () => {
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="password"]').type('Password123');
        cy.get('[name="firstName"]').type('John');
        cy.get('[name="lastName"]').type('Doe');
        cy.get('[name="username"]').type('user@name!');        // มีอักขระพิเศษที่ไม่อนุญาต
        cy.get('[name="phoneNumber"]').type('0812345678');
        cy.get('[name="idCard"]').type('1234567890123');

        cy.get('form').submit();
        cy.wait(500);

        cy.contains(/4.{1,3}20 ตัวอักษร/i).should('exist');
    });

    it('phone validation: ต้องเป็นตัวเลข 9-15 หลัก', () => {
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="password"]').type('Password123');
        cy.get('[name="firstName"]').type('John');
        cy.get('[name="lastName"]').type('Doe');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="phoneNumber"]').type('12345');          // น้อยกว่า 9 หลัก
        cy.get('[name="idCard"]').type('1234567890123');

        cy.get('form').submit();
        cy.wait(500);

        cy.contains(/กรอกเป็นตัวเลข 9.{1,3}15 หลัก/i).should('exist');
    });

    it('ตรวจสอบ visual elements: background และ decorations', () => {
        // ตรวจสอบพื้นหลังมี gradient
        cy.get('.bg-gradient-to-br').should('exist');

        // ตรวจสอบมี decorative elements (animated blobs)
        cy.get('.animate-pulse').should('exist');
        cy.get('.animate-bounce').should('exist');
        cy.get('.animate-ping').should('exist');

        // ตรวจสอบ card หลัก
        cy.get('.bg-\\[\\#DBDBDB\\]\\/95').should('be.visible');
    });
});