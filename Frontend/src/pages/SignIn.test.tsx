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
});
