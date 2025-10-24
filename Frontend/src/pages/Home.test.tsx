import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./Home";
import { MemoryRouter } from "react-router-dom";

// ✅ mock PrimaryButton component เพื่อไม่ต้อง render ของจริง
vi.mock("@/components/PrimaryButton", () => ({
    default: ({ to, children }: { to: string; children: React.ReactNode }) => (
        <a href={to} data-testid="primary-button">
            {children}
        </a>
    ),
}));

describe("Home Page", () => {
    it("renders all PrimaryButtons correctly", () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        const buttons = screen.getAllByTestId("primary-button");
        expect(buttons).toHaveLength(9);

        // ✅ ตรวจสอบแต่ละปุ่มว่ามีข้อความและลิงก์ตรงตามที่คาดไว้
        expect(buttons[0]).toHaveTextContent("admin");
        expect(buttons[0]).toHaveAttribute("href", "/events");

        expect(buttons[1]).toHaveTextContent("Component");
        expect(buttons[1]).toHaveAttribute("href", "/component");

        expect(buttons[2]).toHaveTextContent("eventselect");
        expect(buttons[2]).toHaveAttribute("href", "/eventselect");

        expect(buttons[3]).toHaveTextContent("Landding");
        expect(buttons[3]).toHaveAttribute("href", "/Landding");

        expect(buttons[4]).toHaveTextContent("??");
        expect(buttons[4]).toHaveAttribute("href", "/");

        expect(buttons[5]).toHaveTextContent("??");
        expect(buttons[5]).toHaveAttribute("href", "/");

        expect(buttons[6]).toHaveTextContent("Profile");
        expect(buttons[6]).toHaveAttribute("href", "/Profile");

        expect(buttons[7]).toHaveTextContent("organization");
        expect(buttons[7]).toHaveAttribute("href", "/organization");

        expect(buttons[8]).toHaveTextContent("eventdetail");
        expect(buttons[8]).toHaveAttribute("href", "/Eventdetail");
    });
});
