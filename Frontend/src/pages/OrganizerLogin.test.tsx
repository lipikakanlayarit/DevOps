import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import OrganizerLogin from "./OrganizerLogin";

// 🧱 mock fetch + alert + window.location
const mockFetch = vi.fn();
const mockAlert = vi.fn();
const mockAssign = vi.fn();

beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("alert", mockAlert);
    Object.defineProperty(window, "location", {
        value: { href: "", assign: mockAssign },
        writable: true,
    });
    mockFetch.mockReset();
    mockAlert.mockReset();
    mockAssign.mockReset();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("OrganizerLogin form", () => {
    // 🧩 Helper function ใช้ได้กับทุกช่อง (label หรือ placeholder)
    const fillByLabelOrPlaceholder = (labelOrPlaceholder: string, value: string) => {
        const input =
            screen.queryByPlaceholderText(labelOrPlaceholder) ||
            screen.queryByLabelText(labelOrPlaceholder) ||
            screen.queryByRole("textbox", { name: new RegExp(labelOrPlaceholder, "i") }); // 👈 เพิ่ม fallback

        if (!input) {
            throw new Error(` ไม่พบ input ที่ label หรือ placeholder = "${labelOrPlaceholder}"`);
        }

        fireEvent.change(input, { target: { value } });
    };
    it("renders all key fields", () => {
        render(
            <MemoryRouter>
                <OrganizerLogin />
            </MemoryRouter>
        );

        // 🔸 แก้จาก getByLabelText → ใช้ getByPlaceholderText แทน
        expect(screen.getByPlaceholderText("you@company.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("a–z, 0–9, _ (4–20 ตัว)")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("อย่างน้อย 8 ตัว มีตัวอักษร+ตัวเลข")).toBeInTheDocument();
    });

    it("shows validation errors for empty fields", async () => {
        render(<OrganizerLogin />);
        fireEvent.click(
            screen.getByRole("button", { name: /Create Organizer Account/i })
        );
        await waitFor(() => {
            expect(screen.getByText("กรอกอีเมล")).toBeInTheDocument();
            expect(screen.getByText("กรอกชื่อผู้ใช้")).toBeInTheDocument();
            expect(screen.getByText("กรอกรหัสผ่าน")).toBeInTheDocument();
            expect(screen.getByText("กรอกชื่อจริง")).toBeInTheDocument();
            expect(screen.getByText("กรอกนามสกุล")).toBeInTheDocument();
            expect(screen.getByText("กรอกเบอร์โทร")).toBeInTheDocument();
            expect(screen.getByText("กรอกชื่อบริษัท/องค์กร")).toBeInTheDocument();
            expect(screen.getByText("กรอกเลขผู้เสียภาษี")).toBeInTheDocument();
            expect(screen.getByText("กรอกที่อยู่ (สั้นเกินไป)")).toBeInTheDocument();
        });
    });

    it("toggles password visibility", () => {
        render(<OrganizerLogin />);

        const toggleBtn = screen.getByLabelText("Show password");
        const pwdInput = screen.getByPlaceholderText("อย่างน้อย 8 ตัว มีตัวอักษร+ตัวเลข");

        // เริ่มต้นต้องเป็น type=password
        expect(pwdInput).toHaveAttribute("type", "password");

        // คลิกเพื่อโชว์รหัสผ่าน
        fireEvent.click(toggleBtn);
        expect(pwdInput).toHaveAttribute("type", "text");

        // เปลี่ยนปุ่มเป็น hide แล้วคลิกอีกครั้ง
        fireEvent.click(screen.getByLabelText("Hide password"));
        expect(pwdInput).toHaveAttribute("type", "password");
    });
});
