// cypress/e2e/signin.cy.js
// ใช้ทดสอบหน้า SignUp จริง + ยิง API จริง (ไม่ใช้ mockup data)

const PATH_SIGNUP = "http://localhost:5173/signIn";

describe("Sign Up (Real API)", () => {
    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(PATH_SIGNUP);
    });

    it("แสดงฟอร์มครบทุกช่องและ header ถูกต้อง", () => {
        cy.contains("h1", /sign up/i).should("be.visible");
        cy.contains(/สร้างบัญชีใหม่ของคุณ/i).should("be.visible");

        [
            "email",
            "password",
            "firstName",
            "lastName",
            "username",
            "phoneNumber",
            "idCard",
        ].forEach((name) => {
            cy.get(`[name="${name}"]`)
                .scrollIntoView()
                .should("exist")
                .and("be.visible");
        });

        cy.contains("button", /create account/i)
            .scrollIntoView()
            .should("be.visible");
    });

    it("มี placeholders / labels หลักตรงตามดีไซน์", () => {
        cy.get('[name="email"]').should(
            "have.attr",
            "placeholder",
            "you@example.com"
        );
        cy.get('[name="password"]').should(
            "have.attr",
            "placeholder",
            "อย่างน้อย 8 ตัวอักษร"
        );
        cy.contains("label", /first name/i).should("be.visible");
        cy.contains("label", /last name/i).should("be.visible");
        cy.contains("label", /username/i).should("be.visible");
        cy.contains("label", /phone/i).should("be.visible");
        cy.contains("label", /id card/i).should("be.visible");
    });

    it('ลิงก์ "Log in" ไปที่ /login', () => {
        cy.contains("a", /log in/i)
            .should("have.attr", "href", "/login")
            .and("be.visible");
    });

    it("submit ว่างทั้งหมด -> แสดง error required ทุกช่อง", () => {
        cy.get("form").submit();
        cy.wait(300);

        cy.contains(/กรอกอีเมล/i).should("exist");
        cy.contains(/กรอกรหัสผ่าน/i).should("exist");
        cy.contains(/กรอกชื่อจริง/i).should("exist");
        cy.contains(/กรอกนามสกุล/i).should("exist");
        cy.contains(/กรอกชื่อผู้ใช้/i).should("exist");
        cy.contains(/กรอกเบอร์โทร/i).should("exist");
        cy.contains(/กรอกเลขบัตรประชาชน/i).should("exist");
    });

    it("กรอกค่ารูปแบบไม่ถูกต้อง -> แสดงข้อความ validate ที่ถูกต้อง", () => {
        cy.get('[name="email"]').type("not-an-email");
        cy.get('[name="password"]').type("short"); // < 8 + ไม่มีตัวเลข
        cy.get('[name="firstName"]').type("John");
        cy.get('[name="lastName"]').type("Doe");
        cy.get('[name="username"]').type("a!"); // invalid pattern
        cy.get('[name="phoneNumber"]').type("abc"); // ไม่ใช่ตัวเลข
        cy.get('[name="idCard"]').type("123"); // ไม่ครบ 13 หลัก

        cy.get("form").submit();
        cy.wait(300);

        cy.contains(/รูปแบบอีเมลไม่ถูกต้อง/i).should("exist");
        cy.contains(/อย่างน้อย 8 ตัวอักษร/i).should("exist");
        cy.contains(/4.{1,3}20 ตัวอักษร/i).should("exist");
        cy.contains(/กรอกเป็นตัวเลข 9.{1,3}15 หลัก/i).should("exist");
        cy.contains(/เลขบัตรต้องมี 13 หลัก/i).should("exist");
    });

    it("รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข (ถ้ามีแต่ตัวอักษรจะไม่ผ่าน)", () => {
        cy.get('[name="email"]').type("test@example.com");
        cy.get('[name="password"]').type("onlyletters"); // ไม่มีตัวเลข
        cy.get('[name="firstName"]').type("John");
        cy.get('[name="lastName"]').type("Doe");
        cy.get('[name="username"]').type("testuser");
        cy.get('[name="phoneNumber"]').type("0812345678");
        cy.get('[name="idCard"]').type("1234567890123");

        cy.get("form").submit();
        cy.wait(300);

        cy.contains(/ต้องมีทั้งตัวอักษรและตัวเลข/i).should("exist");
    });

    it("สามารถแสดง/ซ่อนรหัสผ่านได้", () => {
        cy.get('[name="password"]').should("have.attr", "type", "password");

        cy.get('[name="password"]')
            .parent()
            .find('button[type="button"]')
            .click();
        cy.get('[name="password"]').should("have.attr", "type", "text");

        cy.get('[name="password"]')
            .parent()
            .find('button[type="button"]')
            .click();
        cy.get('[name="password"]').should("have.attr", "type", "password");
    });

    it("username validation: ต้องเป็น a-z, 0-9, _ และยาว 4–20 ตัว", () => {
        cy.get('[name="email"]').type("test@example.com");
        cy.get('[name="password"]').type("Password123");
        cy.get('[name="firstName"]').type("John");
        cy.get('[name="lastName"]').type("Doe");
        cy.get('[name="username"]').type("user@name!"); // invalid pattern
        cy.get('[name="phoneNumber"]').type("0812345678");
        cy.get('[name="idCard"]').type("1234567890123");

        cy.get("form").submit();
        cy.wait(300);

        cy.contains(/4.{1,3}20 ตัวอักษร/i).should("exist");
    });

    it("phone validation: ต้องเป็นตัวเลข 9–15 หลัก", () => {
        cy.get('[name="email"]').type("test@example.com");
        cy.get('[name="password"]').type("Password123");
        cy.get('[name="firstName"]').type("John");
        cy.get('[name="lastName"]').type("Doe");
        cy.get('[name="username"]').type("testuser");
        cy.get('[name="phoneNumber"]').type("12345"); // น้อยกว่า 9 หลัก
        cy.get('[name="idCard"]').type("1234567890123");

        cy.get("form").submit();
        cy.wait(300);

        cy.contains(/กรอกเป็นตัวเลข 9.{1,3}15 หลัก/i).should("exist");
    });

    it("idCard validation: ต้องมี 13 หลัก", () => {
        cy.get('[name="email"]').type("test@example.com");
        cy.get('[name="password"]').type("Password123");
        cy.get('[name="firstName"]').type("John");
        cy.get('[name="lastName"]').type("Doe");
        cy.get('[name="username"]').type("testuser");
        cy.get('[name="phoneNumber"]').type("0812345678");
        cy.get('[name="idCard"]').type("123"); // น้อยกว่า 13 หลัก

        cy.get("form").submit();
        cy.wait(300);

        cy.contains(/เลขบัตรต้องมี 13 หลัก/i).should("exist");
    });

    it("ลบ error ของ field เมื่อผู้ใช้พิมพ์ใหม่ (email)", () => {
        cy.get("form").submit();
        cy.wait(200);

        cy.contains(/กรอกอีเมล/i).should("exist");

        cy.get('[name="email"]').type("test@example.com", { force: true });

        cy.contains(/กรอกอีเมล/i).should("not.exist");
    });

    it("ปุ่ม Create Account เริ่มต้นต้องไม่ disabled และแสดงข้อความถูกต้อง", () => {
        cy.get('button[type="submit"]')
            .should("be.visible")
            .and("not.be.disabled");
        cy.contains("button", /create account/i).should("be.visible");
    });

    it("layout: มี background gradient และ card หลัก", () => {
        cy.get(".bg-gradient-to-br").should("exist");
        cy.get('.bg-\\[\\#DBDBDB\\]\\/95').should("be.visible");
    });

    it("layout: มี decorative animated blobs บนพื้นหลัง", () => {
        cy.get(".animate-pulse").should("exist");
        cy.get(".animate-bounce").should("exist");
        cy.get(".animate-ping").should("exist");
    });

    it("สมัครสมาชิกจริงผ่าน API: สร้าง user James Potter (password123) แล้ว redirect ไป /login", () => {
        // ทำให้ email / username ไม่ซ้ำกันทุกครั้งที่รัน test
        const uniqueSuffix = Date.now().toString().slice(-6);
        const email = `james.potter+${uniqueSuffix}@example.com`;
        const username = `james${uniqueSuffix}`;

        // กรอกฟอร์มด้วยข้อมูลของ James Potter
        cy.get('[name="email"]').clear().type(email);
        cy.get('[name="password"]').clear().type("Password123"); // ตามที่ผู้ใช้กำหนด
        cy.get('[name="firstName"]').clear().type("James");
        cy.get('[name="lastName"]').clear().type("Potter");
        cy.get('[name="username"]').clear().type(username);
        cy.get('[name="phoneNumber"]').clear().type("0812345678");
        cy.get('[name="idCard"]').clear().type("1234567890123");

        // stub alert เพื่อเช็คข้อความ (ไม่ได้ mock API)
        cy.window().then((win) => {
            cy.stub(win, "alert").as("alert");
        });

        cy.contains("button", /create account/i).click();

        // ตรวจว่า alert ถูกเรียกด้วยข้อความสมัครสำเร็จ
        cy.get("@alert")
            .should("have.been.calledOnce")
            .its("firstCall.args.0")
            .should("match", /สมัครสมาชิกสำเร็จ/i);

        // ตรวจ redirect ไปหน้า /login (ให้เวลา backend + frontend ทำงาน)
        cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
    });
});
