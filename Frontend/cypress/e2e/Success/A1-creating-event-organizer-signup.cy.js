// cypress/e2e/organizer-signup.cy.js
const PATH_SIGNUP = "http://localhost:5173/OrganizerLogin";

describe("Organizer Sign Up", () => {
    beforeEach(() => {
        // ⭐ ต้อง intercept ก่อน visit เสมอ
        cy.intercept("POST", "**/api/auth/organizer/signup").as("signupRequest");

        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(PATH_SIGNUP);
    });

    it("แสดงฟอร์มครบทุกช่องและ header ถูกต้อง", () => {
        cy.get("form").should("be.visible");

        [
            "email",
            "username",
            "password",
            "first_name",
            "last_name",
            "phone_number",
            "address",
            "company_name",
            "tax_id",
            "verification_status",
        ].forEach((name) => {
            cy.get(`[name="${name}"]`)
                .scrollIntoView()
                .should("exist")
                .and("be.visible");
        });

        cy.contains("button", /create organizer account/i)
            .scrollIntoView()
            .should("be.visible");

        cy.contains("a", /log in/i).should("have.attr", "href", "/login");
    });

    it("ตรวจ validation: เว้นว่างแล้ว submit ต้องขึ้น error", () => {
        cy.get("form").submit();
        cy.wait(500);

        cy.contains(/กรอกอีเมล/i).should("exist");
        cy.contains(/กรอกชื่อผู้ใช้/i).should("exist");
        cy.contains(/กรอกรหัสผ่าน/i).should("exist");
        cy.contains(/กรอกชื่อจริง/i).should("exist");
        cy.contains(/กรอกนามสกุล/i).should("exist");
        cy.contains(/กรอกเบอร์โทร/i).should("exist");
        cy.contains(/กรอกที่อยู่/i).should("exist");
        cy.contains(/กรอกชื่อบริษัท/i).should("exist");
        cy.contains(/กรอกเลขผู้เสียภาษี/i).should("exist");
    });

    it("ตรวจรูปแบบไม่ถูกต้อง: email/username/password/phone/address/tax_id", () => {
        cy.get('[name="email"]').type("not-an-email");
        cy.get('[name="username"]').type("a!");
        cy.get('[name="password"]').type("short");
        cy.get('[name="first_name"]').type("John");
        cy.get('[name="last_name"]').type("Doe");
        cy.get('[name="phone_number"]').type("abc");
        cy.get('[name="address"]').type("addr");
        cy.get('[name="company_name"]').type("ACME");
        cy.get('[name="tax_id"]').type("123");

        cy.get("form").submit();
        cy.wait(500);

        cy.contains(/รูปแบบอีเมลไม่ถูกต้อง/i).scrollIntoView().should("exist");
        cy.contains(/4.{1,3}20 ตัว/i).scrollIntoView().should("exist");
        cy.contains(/อย่างน้อย 8 ตัวอักษร/i).scrollIntoView().should("exist");
        cy.contains(/กรอกเป็นตัวเลข 9.{1,3}15 หลัก/i).scrollIntoView().should("exist");
        cy.contains(/ที่อยู่อย่างน้อย 8 ตัวอักษร/i).scrollIntoView().should("exist");
        cy.contains(/เลขผู้เสียภาษีต้องมี 13 หลัก/i).scrollIntoView().should("exist");
    });

    it("รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข", () => {
        cy.get('[name="email"]').type("test@example.com");
        cy.get('[name="username"]').type("testuser");
        cy.get('[name="password"]').type("onlyletters");
        cy.get('[name="first_name"]').type("John");
        cy.get('[name="last_name"]').type("Doe");
        cy.get('[name="phone_number"]').type("0812345678");
        cy.get('[name="address"]').type("123 Main Road");
        cy.get('[name="company_name"]').type("ACME");
        cy.get('[name="tax_id"]').type("1234567890123");

        cy.get("form").submit();
        cy.wait(500);

        cy.get('[name="password"]').scrollIntoView();
        cy.contains(/ต้องมีทั้งตัวอักษรและตัวเลข/i).should("exist");
    });

    it("verification_status ต้อง lock เป็น PENDING", () => {
        cy.get('[name="verification_status"]')
            .should("have.value", "PENDING")
            .and("have.attr", "readonly");

        cy.contains("สถานะเริ่มต้นคือ").should("be.visible");
        cy.contains("รอแอดมินอนุมัติ").should("be.visible");
    });

    it("แสดง/ซ่อนรหัสผ่านได้", () => {
        cy.get('[name="password"]').should("have.attr", "type", "password");

        cy.get('[name="password"]')
            .parent()
            .find('button[aria-label*="password"]')
            .click();
        cy.get('[name="password"]').should("have.attr", "type", "text");

        cy.get('[name="password"]')
            .parent()
            .find('button[aria-label*="password"]')
            .click();
        cy.get('[name="password"]').should("have.attr", "type", "password");
    });

    // ⭐⭐ ใช้ API จริง สมัครจริงลง DB ⭐⭐
    it("สมัครสำเร็จ: ยิง API จริง แล้ว redirect ไป /login (REAL API)", () => {
        const ts = Date.now();
        const uniqueEmail = `org_${ts}@example.com`;
        const uniqueUser = `organizer_${ts}`;

        // stub alert
        cy.window().then((win) => {
            cy.stub(win, "alert").as("alert");
        });

        // กรอกข้อมูล
        cy.get('[name="email"]').clear().type(uniqueEmail);
        cy.get('[name="username"]').clear().type(uniqueUser);
        cy.get('[name="password"]').clear().type("Password123");
        cy.get('[name="first_name"]').clear().type("Alice");
        cy.get('[name="last_name"]').clear().type("Smith");
        cy.get('[name="phone_number"]').clear().type("0812345678");
        cy.get('[name="address"]').clear().type("123 Main Road, Bangkok 10110");
        cy.get('[name="company_name"]').clear().type("Butcon Co., Ltd.");
        cy.get('[name="tax_id"]').clear().type("1234567890123");

        cy.contains("button", /create organizer account/i).click();

        // ⭐ รอให้ API ตอบกลับจริง (intercept ถูกตั้งใน beforeEach แล้ว)
        cy.wait("@signupRequest", { timeout: 15000 }).then((interception) => {
            cy.log("Response Status:", interception.response?.statusCode);
            cy.log("Response Body:", JSON.stringify(interception.response?.body));
            expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
        });

        // ตรวจสอบ alert
        cy.get("@alert", { timeout: 10000 })
            .should("have.been.calledOnce")
            .and("have.been.calledWithMatch", /สมัคร Organizer สำเร็จ/i);

        // ตรวจสอบ redirect
        cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
    });

    it("ลบ error เมื่อพิมพ์ใหม่ (email)", () => {
        cy.get("form").submit();
        cy.wait(500);

        cy.contains(/กรอกอีเมล/i).should("exist");

        cy.get('[name="email"]').type("test@example.com", { force: true });

        cy.contains(/กรอกอีเมล/i).should("not.exist");
    });

    it("payload ส่งไปยัง API ถูกต้อง (camelCase)", () => {
        // ⭐ Override intercept สำหรับ test นี้โดยเฉพาะ
        cy.intercept("POST", "**/api/auth/organizer/signup", (req) => {
            expect(req.body).to.have.property("email", "test@example.com");
            expect(req.body).to.have.property("username", "testuser");
            expect(req.body).to.have.property("password", "Password123");
            expect(req.body).to.have.property("firstName", "John");
            expect(req.body).to.have.property("lastName", "Doe");
            expect(req.body).to.have.property("phoneNumber", "0812345678");
            expect(req.body).to.have.property("address", "123 Main Road");
            expect(req.body).to.have.property("companyName", "ACME Corp");
            expect(req.body).to.have.property("taxId", "1234567890123");

            expect(req.body).to.not.have.property("verification_status");

            req.reply({ statusCode: 201, body: { id: 1 } });
        }).as("signupCheck");

        cy.get('[name="email"]').type("test@example.com");
        cy.get('[name="username"]').type("testuser");
        cy.get('[name="password"]').type("Password123");
        cy.get('[name="first_name"]').type("John");
        cy.get('[name="last_name"]').type("Doe");
        cy.get('[name="phone_number"]').type("0812345678");
        cy.get('[name="address"]').type("123 Main Road");
        cy.get('[name="company_name"]').type("ACME Corp");
        cy.get('[name="tax_id"]').type("1234567890123");

        cy.window().then((win) => cy.stub(win, "alert"));
        cy.contains("button", /create organizer account/i).click();
        cy.wait("@signupCheck");
    });

    it("ลบ error เมื่อพิมพ์ใหม่ (phone_number)", () => {
        cy.get("form").submit();
        cy.wait(500);

        cy.contains(/กรอกเบอร์โทร/i).should("exist");

        cy.get('[name="phone_number"]').type("0812345678", { force: true });

        cy.contains(/กรอกเบอร์โทร/i).should("not.exist");
    });

    it("ลิงก์ Log in ทำงานและนำไปหน้า /login", () => {
        cy.contains("a", /log in/i)
            .should("have.attr", "href", "/login")
            .click();

        cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
    });

    // ⭐ เพิ่ม: Test กรณี API error
    it("แสดง error message เมื่อ API ตอบ error", () => {
        cy.intercept("POST", "**/api/auth/organizer/signup", {
            statusCode: 400,
            body: { message: "Email already exists" }
        }).as("signupError");

        cy.get('[name="email"]').type("existing@example.com");
        cy.get('[name="username"]').type("existinguser");
        cy.get('[name="password"]').type("Password123");
        cy.get('[name="first_name"]').type("John");
        cy.get('[name="last_name"]').type("Doe");
        cy.get('[name="phone_number"]').type("0812345678");
        cy.get('[name="address"]').type("123 Main Road, Bangkok");
        cy.get('[name="company_name"]').type("ACME Corp");
        cy.get('[name="tax_id"]').type("1234567890123");

        cy.contains("button", /create organizer account/i).click();

        cy.wait("@signupError");

        // ตรวจสอบว่าแสดง error message จาก server
        cy.contains(/Email already exists/i).should("be.visible");
    });

    // ⭐ เพิ่ม: Test loading state
    it("แสดง loading state ระหว่างรอ API", () => {
        cy.intercept("POST", "**/api/auth/organizer/signup", (req) => {
            // delay response 2 วินาที
            req.on("response", (res) => {
                res.setDelay(2000);
            });
        }).as("signupSlow");

        cy.get('[name="email"]').type("test@example.com");
        cy.get('[name="username"]').type("testuser");
        cy.get('[name="password"]').type("Password123");
        cy.get('[name="first_name"]').type("John");
        cy.get('[name="last_name"]').type("Doe");
        cy.get('[name="phone_number"]').type("0812345678");
        cy.get('[name="address"]').type("123 Main Road, Bangkok");
        cy.get('[name="company_name"]').type("ACME Corp");
        cy.get('[name="tax_id"]').type("1234567890123");

        cy.window().then((win) => cy.stub(win, "alert"));
        cy.contains("button", /create organizer account/i).click();

        // ตรวจสอบว่าปุ่มแสดง loading state
        cy.contains("button", /creating organizer/i).should("be.visible");
        cy.contains("button", /create organizer account/i).should("be.disabled");
    });
});