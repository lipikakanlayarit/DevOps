import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminEventdetail from "./admin-eventdetail";

// 🧠 Mock components ที่ไม่ต้อง render จริง
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));

// ⭐ SearchBar mock (เหมือนของจริงที่สุด)
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

// ⭐ Mock API ให้มีรายการจองในระบบ
vi.mock("@/lib/api", () => ({
    reservationApi: {
        list: vi.fn().mockResolvedValue([
            {
                reserveId: "1",
                citizenId: "810100125892500",
                name: "Test User",
                status: "RESERVED",
            }
        ])
    }
}));


describe("AdminEventdetail", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ---------- Category Filter ----------
    it("changes reservation filter when clicking radio", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        const reservedRadio = (await screen.findAllByRole("radio"))[1];
        fireEvent.click(reservedRadio);

        expect(reservedRadio).toBeChecked();
    });
});
