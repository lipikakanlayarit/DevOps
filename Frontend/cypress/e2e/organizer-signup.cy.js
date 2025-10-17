// cypress/e2e/organizer-signup.cy.js
const PATH_SIGNUP = 'http://localhost:5173/OrganizerLogin';

describe('Organizer Sign Up', () => {
    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(PATH_SIGNUP);
    });

    it('แสดงฟอร์มครบทุกช่องและ header ถูกต้อง', () => {
        // ตรวจสอบ fields ทั้งหมด - รอให้ฟอร์มโหลดเสร็จ
        cy.get('form').should('be.visible');

        [
            'email', 'username', 'password', 'first_name', 'last_name',
            'phone_number', 'address', 'company_name', 'tax_id', 'verification_status'
        ].forEach(name => {
            cy.get(`[name="${name}"]`).scrollIntoView().should('exist').and('be.visible');
        });

        // ตรวจสอบปุ่ม submit
        cy.contains('button', /create organizer account/i).scrollIntoView().should('be.visible');

        // ตรวจสอบลิงก์ไปหน้า login
        cy.contains('a', /log in/i).should('have.attr', 'href', '/login');
    });

    it('ตรวจ validation: เว้นว่างแล้ว submit ต้องขึ้น error', () => {
        cy.get('form').submit();

        // รอให้ error messages แสดง และ scroll ดู
        cy.wait(500);

        // ตรวจสอบ error messages ตามโค้ดจริง
        cy.contains(/กรอกอีเมล/i).should('exist');
        cy.contains(/กรอกชื่อผู้ใช้/i).should('exist');
        cy.contains(/กรอกรหัสผ่าน/i).should('exist');
        cy.contains(/กรอกชื่อจริง/i).should('exist');
        cy.contains(/กรอกนามสกุล/i).should('exist');
        cy.contains(/กรอกเบอร์โทร/i).should('exist');
        cy.contains(/กรอกที่อยู่/i).should('exist');
        cy.contains(/กรอกชื่อบริษัท/i).should('exist');
        cy.contains(/กรอกเลขผู้เสียภาษี/i).should('exist');
    });

    it('ตรวจรูปแบบไม่ถูกต้อง: email/username/password/phone/address/tax_id', () => {
        cy.get('[name="email"]').type('not-an-email');
        cy.get('[name="username"]').type('a!');                // สั้น/มีอักขระพิเศษ
        cy.get('[name="password"]').type('short');             // < 8 และไม่มีตัวเลข
        cy.get('[name="first_name"]').type('John');
        cy.get('[name="last_name"]').type('Doe');
        cy.get('[name="phone_number"]').type('abc');           // ไม่ใช่ตัวเลข
        cy.get('[name="address"]').type('addr');               // สั้นกว่า 8 ตัว
        cy.get('[name="company_name"]').type('ACME');
        cy.get('[name="tax_id"]').type('123');                 // ไม่ครบ 13 หลัก

        cy.get('form').submit();
        cy.wait(500);

        // ตรวจสอบ error messages ตามโค้ดจริง - scroll ดูทีละอัน
        cy.contains(/รูปแบบอีเมลไม่ถูกต้อง/i).scrollIntoView().should('exist');
        cy.contains(/4.{1,3}20 ตัว/i).scrollIntoView().should('exist');
        cy.contains(/อย่างน้อย 8 ตัวอักษร/i).scrollIntoView().should('exist');
        cy.contains(/กรอกเป็นตัวเลข 9.{1,3}15 หลัก/i).scrollIntoView().should('exist');
        cy.contains(/ที่อยู่อย่างน้อย 8 ตัวอักษร/i).scrollIntoView().should('exist');
        cy.contains(/เลขผู้เสียภาษีต้องมี 13 หลัก/i).scrollIntoView().should('exist');
    });

    it('รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข', () => {
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="password"]').type('onlyletters');       // ไม่มีตัวเลข
        cy.get('[name="first_name"]').type('John');
        cy.get('[name="last_name"]').type('Doe');
        cy.get('[name="phone_number"]').type('0812345678');
        cy.get('[name="address"]').type('123 Main Road');
        cy.get('[name="company_name"]').type('ACME');
        cy.get('[name="tax_id"]').type('1234567890123');

        cy.get('form').submit();
        cy.wait(500);

        // scroll ไปที่ password field แล้วตรวจสอบ error
        cy.get('[name="password"]').scrollIntoView();
        cy.contains(/ต้องมีทั้งตัวอักษรและตัวเลข/i).should('exist');
    });

    it('verification_status ต้อง lock เป็น PENDING', () => {
        cy.get('[name="verification_status"]')
            .should('have.value', 'PENDING')
            .and('have.attr', 'readonly');

        cy.contains('สถานะเริ่มต้นคือ').should('be.visible');
        cy.contains('รอแอดมินอนุมัติ').should('be.visible');
    });

    it('แสดง/ซ่อนรหัสผ่านได้', () => {
        cy.get('[name="password"]').should('have.attr', 'type', 'password');

        // คลิกปุ่มแสดงรหัสผ่าน
        cy.get('[name="password"]').parent().find('button[aria-label*="password"]').click();
        cy.get('[name="password"]').should('have.attr', 'type', 'text');

        // คลิกอีกครั้งเพื่อซ่อน
        cy.get('[name="password"]').parent().find('button[aria-label*="password"]').click();
        cy.get('[name="password"]').should('have.attr', 'type', 'password');
    });

    it('สมัครสำเร็จ: mock API 201 แล้ว redirect ไป /login', () => {
        cy.intercept('POST', '**/api/auth/organizer/signup', {
            statusCode: 201,
            body: { id: 999, username: 'organizer1' }
        }).as('signup');

        // กรอกข้อมูลถูกต้องครบถ้วน
        cy.get('[name="email"]').clear().type('org1@example.com');
        cy.get('[name="username"]').clear().type('organizer1');
        cy.get('[name="password"]').clear().type('Password123');
        cy.get('[name="first_name"]').clear().type('Alice');
        cy.get('[name="last_name"]').clear().type('Smith');
        cy.get('[name="phone_number"]').clear().type('0812345678');
        cy.get('[name="address"]').clear().type('123 Main Road, Bangkok 10110');
        cy.get('[name="company_name"]').clear().type('Butcon Co., Ltd.');
        cy.get('[name="tax_id"]').clear().type('1234567890123');

        // stub alert และเก็บข้อความ
        cy.window().then((win) => {
            cy.stub(win, 'alert').as('alert');
        });

        cy.contains('button', /create organizer account/i).click();
        cy.wait('@signup');

        // ตรวจสอบว่า alert ถูกเรียกพร้อมข้อความที่ถูกต้อง
        cy.get('@alert').should('have.been.calledOnce');
        cy.get('@alert').should('have.been.calledWithMatch', /สมัคร Organizer สำเร็จ/i);

        // ตรวจสอบ redirect
        cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
    });


    it('แสดง loading state ขณะ submit', () => {
        cy.intercept('POST', '**/api/auth/organizer/signup', (req) => {
            req.reply({ delay: 1000, statusCode: 201, body: { id: 1 } });
        }).as('signupSlow');

        // กรอกข้อมูล
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="password"]').type('Password123');
        cy.get('[name="first_name"]').type('Test');
        cy.get('[name="last_name"]').type('User');
        cy.get('[name="phone_number"]').type('0812345678');
        cy.get('[name="address"]').type('123 Test Road');
        cy.get('[name="company_name"]').type('Test Co.');
        cy.get('[name="tax_id"]').type('1234567890123');

        // stub alert
        cy.window().then((win) => cy.stub(win, 'alert'));

        cy.contains('button', /create organizer account/i).click();

        // ตรวจสอบ loading state
        cy.contains('button', /creating organizer/i).should('be.visible');
        cy.get('button[type="submit"]').should('be.disabled');
        cy.get('.animate-spin').should('be.visible');
    });

    it('ลบ error เมื่อพิมพ์ใหม่', () => {
        // submit เพื่อให้เกิด error
        cy.get('form').submit();
        cy.wait(500);

        // ตรวจสอบว่ามี error
        cy.contains(/กรอกอีเมล/i).should('exist');

        // พิมพ์ใน field email - ใช้ force เพื่อข้าม overlay check
        cy.get('[name="email"]').type('test@example.com', { force: true });

        // error ควรหายไป
        cy.contains(/กรอกอีเมล/i).should('not.exist');
    });

    it('payload ส่งไปยัง API ถูกต้อง (camelCase)', () => {
        cy.intercept('POST', '**/api/auth/organizer/signup', (req) => {
            // ตรวจสอบ payload format
            expect(req.body).to.have.property('email', 'test@example.com');
            expect(req.body).to.have.property('username', 'testuser');
            expect(req.body).to.have.property('password', 'Password123');
            expect(req.body).to.have.property('firstName', 'John');
            expect(req.body).to.have.property('lastName', 'Doe');
            expect(req.body).to.have.property('phoneNumber', '0812345678');
            expect(req.body).to.have.property('address', '123 Main Road');
            expect(req.body).to.have.property('companyName', 'ACME Corp');
            expect(req.body).to.have.property('taxId', '1234567890123');

            // ไม่ควรส่ง verification_status
            expect(req.body).to.not.have.property('verification_status');

            req.reply({ statusCode: 201, body: { id: 1 } });
        }).as('signupCheck');

        // กรอกฟอร์ม
        cy.get('[name="email"]').type('test@example.com');
        cy.get('[name="username"]').type('testuser');
        cy.get('[name="password"]').type('Password123');
        cy.get('[name="first_name"]').type('John');
        cy.get('[name="last_name"]').type('Doe');
        cy.get('[name="phone_number"]').type('0812345678');
        cy.get('[name="address"]').type('123 Main Road');
        cy.get('[name="company_name"]').type('ACME Corp');
        cy.get('[name="tax_id"]').type('1234567890123');

        cy.window().then((win) => cy.stub(win, 'alert'));
        cy.contains('button', /create organizer account/i).click();
        cy.wait('@signupCheck');
    });
});