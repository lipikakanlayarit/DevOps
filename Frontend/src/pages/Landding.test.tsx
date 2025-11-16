import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./Landding";

// 🧱 Mock Components ทั้งหมดเพื่อไม่ให้ซ้อน logic ของจริง
vi.mock("@/components/PosterCard", () => ({
    default: ({ title, onClick }: any) => (
        <div data-testid="poster-card" onClick={onClick}>
            Poster:{title}
        </div>
    ),
}));
vi.mock("@/components/CategoryRadio", () => ({
    default: ({ options, value, onChange }: any) => (
        <select
            data-testid="category-radio"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
}));
vi.mock("@/components/PrimaryButton", () => ({
    default: ({ children, onClick }: any) => (
        <button data-testid="primary-btn" onClick={onClick}>
            {children}
        </button>
    ),
}));
vi.mock("@/components/OutlineButton", () => ({
    default: ({ children, onClick }: any) => (
        <button data-testid="outline-btn" onClick={onClick}>
            {children}
        </button>
    ),
}));
vi.mock("@/components/EventCard", () => ({
    default: ({ title, onClick }: any) => (
        <div data-testid="event-card" onClick={onClick}>
            {title}
        </div>
    ),
}));
vi.mock("@/components/SearchBar", () => ({
    default: ({ value, onChange }: any) => (
        <input
            data-testid="search-bar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search events..."
        />
    ),
}));
vi.mock("@/components/Footer", () => ({
    default: () => <footer data-testid="footer">Footer</footer>,
}));
vi.mock("@/components/CountdownTimer", () => ({
    default: () => <div data-testid="countdown">Countdown</div>,
}));

// 🧭 mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<any>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("Landing Page (HomePage)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers(); // สำหรับ debounce
    });

    it("renders hero, posters, and footer correctly", () => {
        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );
        expect(screen.getByText(/LIVE THE VIBE ON/i)).toBeInTheDocument();
        expect(screen.getAllByTestId("poster-card").length).toBeGreaterThan(0);
        expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("handles drag events without crashing", () => {
        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        const container = document.querySelector(".draggable-container")!;
        fireEvent.mouseDown(container, { pageX: 100 });
        fireEvent.mouseMove(container, { pageX: 115 });
        fireEvent.mouseUp(container);
        expect(container).toBeInTheDocument();
    });

    it("scrolls to events section when ALL EVENT clicked", () => {
        const scrollSpy = vi.fn();
        Object.defineProperty(global.document, "getElementById", {
            value: vi.fn(() => ({ scrollIntoView: scrollSpy })),
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("ALL EVENT"));
        expect(scrollSpy).toHaveBeenCalled();
    });

});
