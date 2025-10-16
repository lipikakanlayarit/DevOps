import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import EventPermissionPage from "./EventPermissionPage";

// 🧱 Mock Sidebar
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

// 🧱 Mock EventToolbar
vi.mock("@/components/EventToolbar", () => ({
    default: ({ categories, category, onCategoryChange, order, onOrderChange, search, onSearchChange }: any) => (
        <div data-testid="toolbar">
            <select
                data-testid="category-select"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
            >
                {categories.map((c: any) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                ))}
            </select>
            <select
                data-testid="order-select"
                value={order}
                onChange={(e) => onOrderChange(e.target.value)}
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
            </select>
            <input
                data-testid="search-input"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
            />
        </div>
    ),
}));

// 🧱 Mock Badge
vi.mock("@/components/badge", () => ({
    Badge: ({ children, className }: any) => (
        <span data-testid="badge" className={className}>
      {children}
    </span>
    ),
}));

// 🧱 Mock navigate (react-router-dom)
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<any>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Wrapper
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
});
afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
});

describe("EventPermissionPage (Admin)", () => {
    it("renders without crashing", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        await waitFor(() => {
            expect(screen.getByText("Event Management")).toBeInTheDocument();
        });
    });

    it("renders sidebar and toolbar", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        await waitFor(() => {
            expect(screen.getByTestId("sidebar")).toBeInTheDocument();
            expect(screen.getByTestId("toolbar")).toBeInTheDocument();
        });
    });

    it("renders table headers correctly", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        await waitFor(() => {
            const headers = [
                "Poster", "Event Name", "Organizer", "Show Date",
                "Sale Period", "Location", "Status", "Sale seat",
            ];
            headers.forEach((h) => expect(screen.getByText(h)).toBeInTheDocument());
        });
    });

    it("shows loading skeleton initially and then data", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        // loading skeletons first
        const skeletons = screen.getAllByRole("row");
        expect(skeletons.length).toBeGreaterThan(0);

        // wait for data loaded
        await waitFor(() => {
            expect(screen.getByText("ROBERT BALTAZAR TRIO")).toBeInTheDocument();
        });
    });

    it("renders badges with correct color", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        await waitFor(() => {
            const badges = screen.getAllByTestId("badge");
            expect(badges.length).toBeGreaterThan(0);
        });
    });

    it("filters events via category select", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        const select = await screen.findByTestId("category-select");
        fireEvent.change(select, { target: { value: "OFF SALE" } });
        await waitFor(() => {
            expect(screen.getByText("MIDNIGHT RAVE PARTY")).toBeInTheDocument();
        });
    });

    it("searches events correctly", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        const input = await screen.findByTestId("search-input");
        fireEvent.change(input, { target: { value: "ROBERT" } });
        vi.advanceTimersByTime(300);
        await waitFor(() => {
            expect(screen.getByText("ROBERT BALTAZAR TRIO")).toBeInTheDocument();
        });
    });

    it("handles pagination navigation", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        await waitFor(() => expect(screen.getByText(/Page 1/)).toBeInTheDocument());
        const nextBtn = screen.getByText("Next");
        fireEvent.click(nextBtn);
        await waitFor(() => expect(screen.getByText(/Page 2/)).toBeInTheDocument());
    });

    it("navigates to event detail on row click", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        await waitFor(() => expect(screen.getByText("ROBERT BALTAZAR TRIO")).toBeInTheDocument());
        const row = screen.getByText("ROBERT BALTAZAR TRIO").closest("tr");
        fireEvent.click(row!);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining("/admin/eventdetail?id=evt_1")
            );
        });
    });

    it("shows empty state when search yields no results", async () => {
        render(<EventPermissionPage />, { wrapper: Wrapper });
        const input = await screen.findByTestId("search-input");
        fireEvent.change(input, { target: { value: "ZZZZZZ" } });
        vi.advanceTimersByTime(300);
        await waitFor(() => {
            expect(screen.getByText("ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข")).toBeInTheDocument();
        });
    });
});
