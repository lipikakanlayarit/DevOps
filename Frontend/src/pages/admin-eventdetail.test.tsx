import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminEventdetail from "./admin-eventdetail";

// 🧠 Mock components ที่ไม่ต้อง render จริง
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("@/components/SearchBar", () => ({
    default: ({ value, onChange }: any) => (
        <input
            data-testid="searchbar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search reservations..."
        />
    ),
}));

vi.mock("@/components/CategoryRadio", () => ({
    default: ({ options, value, onChange }: any) => (
        <div data-testid="category-radio">
            {options.map((o: any) => (
                <label key={o.value}>
                    <input
                        type="radio"
                        checked={value === o.value}
                        onChange={() => onChange(o.value)}
                    />
                    {o.label}
                </label>
            ))}
        </div>
    ),
}));

vi.mock("@/components/OutlineButton", () => ({
    default: ({ children, onClick }: any) => (
        <button data-testid="outline-btn" onClick={onClick}>
            {children}
        </button>
    ),
}));

// 🧱 wrapper สำหรับ Router
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe("AdminEventdetail", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ---------- Seat Statistics ----------
    it("renders seat stats correctly", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        expect(await screen.findByText(/Available Seat: 40/i)).toBeInTheDocument();
        expect(screen.getByText(/Reserved Seat: 12/i)).toBeInTheDocument();
        expect(screen.getByText(/Sold Seat: 8/i)).toBeInTheDocument();
    });

    // ---------- Modal: Event detail ----------
    it("opens and closes Event Detail modal", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        const btn = await screen.findByText(/Event detail/i);
        fireEvent.click(btn);

        // modal should appear
        expect(await screen.findByText(/Event Description/i)).toBeInTheDocument();

        // close modal
        const closeBtn = screen.getAllByText(/Close/i)[0];
        fireEvent.click(closeBtn);

        await waitFor(() =>
            expect(screen.queryByText(/Event Description/i)).not.toBeInTheDocument()
        );
    });

    // ---------- Modal: Organizer detail ----------
    it("opens and closes Organizer Detail modal", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        const btn = await screen.findByText(/Organizer detail/i);
        fireEvent.click(btn);

        expect(await screen.findByText(/Organizer Details/i)).toBeInTheDocument();

        const closeBtn = screen.getAllByText(/Close/i)[0];
        fireEvent.click(closeBtn);

        await waitFor(() =>
            expect(screen.queryByText(/Organizer Details/i)).not.toBeInTheDocument()
        );
    });

    // ---------- Search Bar ----------
    it("filters reservations by search input", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        const input = await screen.findByTestId("searchbar");
        fireEvent.change(input, { target: { value: "810100125892500" } });

        await waitFor(() => {
            expect(screen.getByText(/810100125892500/i)).toBeInTheDocument();
        });
    });

    // ---------- Category Filter ----------
    it("changes reservation filter when clicking radio", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        const reservedRadio = (await screen.findAllByRole("radio"))[1]; // "Reserved"
        fireEvent.click(reservedRadio);

        expect(reservedRadio).toBeChecked();
    });
});
