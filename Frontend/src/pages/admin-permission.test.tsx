import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminEventPermission from "./admin-permission";

// mock child components ที่ไม่ต้องเทสจริง
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));
vi.mock("@/components/SearchBar", () => ({
    default: ({ value, onChange }: any) => (
        <input
            data-testid="searchbar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));
vi.mock("@/components/CategoryRadio", () => ({
    default: ({ value, onChange }: any) => (
        <select
            data-testid="categoryradio"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
        </select>
    ),
}));

// mock รูปภาพ
vi.mock("@/assets/poster.png", () => ({
    default: "mockPoster.png",
}));

describe("AdminEventPermission Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders sidebar and main title", () => {
        render(<AdminEventPermission />);
        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: /event permission/i })
        ).toBeInTheDocument();
    });

    it("shows all pending events in table", () => {
        render(<AdminEventPermission />);
        const rows = screen.getAllByRole("row");
        // header (1) + 3 events = 4 rows
        expect(rows.length).toBeGreaterThan(1);
        expect(screen.getByText(/SUMMER JAZZ FESTIVAL 2025/i)).toBeInTheDocument();
        expect(screen.getByText(/TECH CONFERENCE BANGKOK/i)).toBeInTheDocument();
        expect(screen.getByText(/FOOD & WINE EXPO/i)).toBeInTheDocument();
    });

    it("filters events by status", () => {
        render(<AdminEventPermission />);
        const select = screen.getByTestId("categoryradio");

        // filter under_review
        fireEvent.change(select, { target: { value: "under_review" } });
        expect(screen.queryByText(/SUMMER JAZZ FESTIVAL 2025/i)).not.toBeInTheDocument();
        expect(screen.getByText(/FOOD & WINE EXPO/i)).toBeInTheDocument();

        // filter pending
        fireEvent.change(select, { target: { value: "pending" } });
        expect(screen.getByText(/SUMMER JAZZ FESTIVAL 2025/i)).toBeInTheDocument();
        expect(screen.queryByText(/FOOD & WINE EXPO/i)).not.toBeInTheDocument();
    });

    it("filters events by search text", () => {
        render(<AdminEventPermission />);
        const input = screen.getByTestId("searchbar");
        fireEvent.change(input, { target: { value: "TECH" } });
        expect(screen.getByText(/TECH CONFERENCE BANGKOK/i)).toBeInTheDocument();
        expect(screen.queryByText(/SUMMER JAZZ FESTIVAL 2025/i)).not.toBeInTheDocument();
    });

    it("opens and closes Event Detail Modal", async () => {
        render(<AdminEventPermission />);
        // click on event row
        const eventRow = screen.getByText(/SUMMER JAZZ FESTIVAL 2025/i);
        fireEvent.click(eventRow);

        // modal should open
        expect(await screen.findByText(/Event Description/i)).toBeInTheDocument();

        // close modal by button
        const closeBtn = screen.getByRole("button", { name: /close/i });
        fireEvent.click(closeBtn);

        await waitFor(() => {
            expect(screen.queryByText(/Event Description/i)).not.toBeInTheDocument();
        });
    });




    it("paginates correctly with PaginationControls", async () => {
        render(<AdminEventPermission />);

        const nextBtn = screen.getAllByRole("button", { name: /next/i })[0];
        fireEvent.click(nextBtn);

        // ดึงข้อความใน <p> แล้วตรวจด้วย includes
        const pageInfo = document.querySelector("p.text-sm.text-gray-700")?.textContent;
        expect(pageInfo).toMatch(/Page\s*1\s*of\s*1/i);
    });

});
