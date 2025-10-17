import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SignUp from "./SignIn";

// mock window.alert และ window.location.href
const mockAlert = vi.fn();
const mockHref = vi.fn();
vi.stubGlobal("alert", mockAlert);
Object.defineProperty(window, "location", {
    value: { href: "", assign: mockHref },
    writable: true,
});

// mock fetch API
const mockFetch = vi.fn();

beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    mockAlert.mockReset();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// helper function หาช่อง input (label / placeholder / name)
const getInput = (label: string) => {
    const el =
        screen.queryByLabelText(new RegExp(label, "i")) ||
        screen.queryByPlaceholderText(new RegExp(label, "i")) ||
        screen.queryByDisplayValue(new RegExp(label, "i")) ||
        screen.container?.querySelector(`input[name="${label}"]`);
    if (!el) {
        screen.debug();
        throw new Error(`❌ Field not found: ${label}`);
    }
    return el as HTMLInputElement;
};

describe("SignUp Page", () => {
    it("renders all input fields correctly", () => {
        render(<SignUp />);
        const labels = [
            "Email",
            "Password",
            "First Name",
            "Last Name",
            "Username",
            "Phone",
            "ID Card",
        ];
        labels.forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());
    });

    it("shows validation errors when submitting empty form", async () => {
        render(<SignUp />);
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/กรอกอีเมล/i)).toBeInTheDocument();
            expect(screen.getByText(/กรอกรหัสผ่าน/i)).toBeInTheDocument();
            expect(screen.getByText(/กรอกชื่อจริง/i)).toBeInTheDocument();
            expect(screen.getByText(/กรอกนามสกุล/i)).toBeInTheDocument();
            expect(screen.getByText(/กรอกชื่อผู้ใช้/i)).toBeInTheDocument();
            expect(screen.getByText(/กรอกเบอร์โทร/i)).toBeInTheDocument();
            expect(screen.getByText(/กรอกเลขบัตรประชาชน/i)).toBeInTheDocument();
        });
    });

    it("shows format validation errors for invalid data", async () => {
        render(<SignUp />);
        fireEvent.change(getInput("email"), { target: { value: "wrongemail" } });
        fireEvent.change(getInput("password"), { target: { value: "123" } });
        fireEvent.change(getInput("username"), { target: { value: "!!" } });
        fireEvent.change(getInput("phoneNumber"), { target: { value: "abc" } });
        fireEvent.change(getInput("idCard"), { target: { value: "12345" } });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/รูปแบบอีเมลไม่ถูกต้อง/i)).toBeInTheDocument();
            expect(screen.getByText(/อย่างน้อย 8 ตัวอักษร/i)).toBeInTheDocument();
            expect(screen.getByText(/4–20 ตัวอักษร/i)).toBeInTheDocument();
            expect(screen.getByText(/กรอกเป็นตัวเลข 9–15 หลัก/i)).toBeInTheDocument();
            expect(screen.getByText(/เลขบัตรต้องมี 13 หลัก/i)).toBeInTheDocument();
        });
    });

    it("submits form successfully and shows alert", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("{}"),
            json: () => Promise.resolve({}),
        });

        render(<SignUp />);
        fireEvent.change(getInput("email"), { target: { value: "test@example.com" } });
        fireEvent.change(getInput("password"), { target: { value: "abc12345" } });
        fireEvent.change(getInput("firstName"), { target: { value: "John" } });
        fireEvent.change(getInput("lastName"), { target: { value: "Doe" } });
        fireEvent.change(getInput("username"), { target: { value: "johndoe" } });
        fireEvent.change(getInput("phoneNumber"), { target: { value: "0812345678" } });
        fireEvent.change(getInput("idCard"), { target: { value: "1234567890123" } });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/api/auth/signup"),
                expect.objectContaining({ method: "POST" })
            );
            expect(mockAlert).toHaveBeenCalledWith(
                expect.stringMatching(/สมัครสมาชิกสำเร็จ/i)
            );
        });
    });

    it("shows server error message when fetch fails", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            text: () => Promise.resolve("server error"),
        });

        render(<SignUp />);
        fireEvent.change(getInput("email"), { target: { value: "test@example.com" } });
        fireEvent.change(getInput("password"), { target: { value: "abc12345" } });
        fireEvent.change(getInput("firstName"), { target: { value: "John" } });
        fireEvent.change(getInput("lastName"), { target: { value: "Doe" } });
        fireEvent.change(getInput("username"), { target: { value: "johndoe" } });
        fireEvent.change(getInput("phoneNumber"), { target: { value: "0812345678" } });
        fireEvent.change(getInput("idCard"), { target: { value: "1234567890123" } });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/server error/i)).toBeInTheDocument();
        });
    });

    it("toggles password visibility when clicking icon", async () => {
        render(<SignUp />);
        const pwdInput = screen.getByLabelText("Password") as HTMLInputElement;
        const toggleBtn = pwdInput.nextElementSibling as HTMLElement;

        expect(pwdInput.type).toBe("password");
        fireEvent.click(toggleBtn);
        expect(pwdInput.type).toBe("text");
        fireEvent.click(toggleBtn);
        expect(pwdInput.type).toBe("password");
    });
});
