import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./Landding";

// -------------------------
//  Mock component children
// -------------------------

vi.mock("@/components/PosterCard", () => ({
    default: ({ title, onClick }: any) => (
        <div data-testid="poster-card" onClick={onClick}>
            Poster:{title}
        </div>
    ),
}));

vi.mock("@/components/SearchBar", () => ({
    default: () => <input data-testid="search-bar" />,
}));

vi.mock("@/components/CategoryRadio", () => ({
    default: () => <div data-testid="category-radio" />,
}));

vi.mock("@/components/EventCard", () => ({
    default: () => <div data-testid="event-card">Event</div>,
}));

vi.mock("@/components/Footer", () => ({
    default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("@/components/CountdownTimer", () => ({
    default: () => <div data-testid="countdown">Countdown</div>,
}));

vi.mock("@/components/PrimaryButton", () => ({
    default: ({ children, onClick }: any) => (
        <button data-testid="primary-btn" onClick={onClick}>{children}</button>
    ),
}));

// -------------------------
//    Mock navigate()
// -------------------------

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<any>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// -------------------------

describe("Landing Page (HomePage)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders hero text + posters + footer", () => {
        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        // Hero text (static)
        expect(screen.getByText(/LIVE THE VIBE ON/i)).toBeInTheDocument();

        // Poster list
        expect(screen.getAllByTestId("poster-card").length).toBeGreaterThan(0);

        // Footer
        expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("scrolls to events when ALL EVENT button clicked", () => {
        const scrollSpy = vi.fn();

        // mock getElementById
        document.getElementById = vi.fn(() => ({
            scrollIntoView: scrollSpy,
        })) as any;

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("ALL EVENT"));

        expect(scrollSpy).toHaveBeenCalled();
    });
});
