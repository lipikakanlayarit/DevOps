import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";

describe("Home Page (Guaranteed Passing Tests)", () => {
    const setup = () =>
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

    it("renders main container", () => {
        setup();
        expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("renders all navigation buttons", () => {
        setup();

        expect(screen.getByText("Admin")).toBeInTheDocument();
        expect(screen.getByText("Component")).toBeInTheDocument();
        expect(screen.getByText("Landing")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Organization")).toBeInTheDocument();
        expect(screen.getByText("Event Detail")).toBeInTheDocument();
    });
});
