// src/pages/Home.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";

// Mock PrimaryButton
vi.mock("@/components/PrimaryButton", () => ({
    default: ({ to, children }: any) => (
        <a data-testid={`btn-${to}`} href={to}>
            {children}
        </a>
    ),
}));

describe("Home Page", () => {
    it("renders all navigation buttons correctly", () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        // Checkทุกปุ่มที่ควรมี
        expect(screen.getByTestId("btn-/events")).toHaveTextContent("Admin");
        expect(screen.getByTestId("btn-/component")).toHaveTextContent("Component");
        expect(screen.getByTestId("btn-/landing")).toHaveTextContent("Landing");
        expect(screen.getByTestId("btn-/profile")).toHaveTextContent("Profile");
        expect(screen.getByTestId("btn-/organization")).toHaveTextContent("Organization");
        expect(screen.getByTestId("btn-/eventdetail")).toHaveTextContent("Event Detail");
    });
});
