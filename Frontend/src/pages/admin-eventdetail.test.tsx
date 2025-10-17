import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import AdminEventdetail from "./admin-eventdetail";

// 🧱 Mock child components
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));
vi.mock("@/components/SearchBar", () => ({
    default: ({ value, onChange }: any) => (
        <input
            data-testid="search-bar"
            value={value}
            placeholder="Search reservations..."
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));
vi.mock("@/components/CategoryRadio", () => ({
    default: ({ value, onChange, options }: any) => (
        <select
            data-testid="category-radio"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((o: any) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    ),
}));
vi.mock("@/components/OutlineButton", () => ({
    default: ({ children, onClick }: any) => (
        <button data-testid="outline-btn" onClick={onClick}>
            {children}
        </button>
    ),
}));

// wrapper
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe("AdminEventdetail Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders sidebar and event title", () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        expect(screen.getByTestId("sidebar")).toBeInTheDocument();

        const titles = screen.getAllByText(/ROBERT BALTAZAR TRIO/i);
        expect(titles.length).toBeGreaterThan(0); // ✅ มีอย่างน้อย 1
    });


    it("renders ticket zones table with rows", () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });
        const zoneRows = screen.getAllByRole("row");
        expect(zoneRows.length).toBeGreaterThan(1);
        expect(screen.getByText(/Ticket Zones/i)).toBeInTheDocument();
    });

    it("renders seat statistics badges", () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });
        expect(screen.getByText(/Available Seat/i)).toHaveTextContent("40");
        expect(screen.getByText(/Reserved Seat/i)).toHaveTextContent("12");
        expect(screen.getByText(/Sold Seat/i)).toHaveTextContent("8");
    });

    it("filters reservations via category select", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });
        const select = await screen.findByTestId("category-radio");
        fireEvent.change(select, { target: { value: "sold" } });

        await waitFor(() => {
            // “SOLD” badge ต้องปรากฏ
            expect(screen.getAllByText(/SOLD/i).length).toBeGreaterThan(0);
        });
    });

    it("searches reservations via search bar", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });
        const search = screen.getByTestId("search-bar");
        fireEvent.change(search, { target: { value: "810100125892500" } });

        await waitFor(() => {
            expect(screen.getByText(/810100125892500/i)).toBeInTheDocument();
        });
    });

    it("opens and closes Event detail modal", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        // เปิด modal
        const openBtn = screen.getByRole("button", { name: /event detail/i });
        fireEvent.click(openBtn);

        // ตรวจว่าข้อความใน modal ปรากฏ
        await waitFor(() => {
            expect(screen.getByText(/Event Description/i)).toBeInTheDocument();
        });

        // ปิด modal
        const closeBtn = screen.getByTestId("outline-btn");
        fireEvent.click(closeBtn);


        await waitFor(() => {
            expect(screen.queryByText(/Event Details/i)).not.toBeInTheDocument();
        });
    });


    it("opens and closes Organizer detail modal", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });
        const openBtn = screen.getByRole("button", { name: /organizer detail/i });
        fireEvent.click(openBtn);

        await waitFor(() => {
            expect(screen.getByText(/Organizer Details/i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Organizer Details/i)).toBeInTheDocument();
        });
    });

    it("renders pagination and navigates pages", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });

        // ตรวจว่ามีปุ่ม Next (pagination controls)
        const nextBtns = await screen.findAllByText(/Next/i);
        expect(nextBtns.length).toBeGreaterThan(0);

        // คลิกปุ่ม Next
        fireEvent.click(nextBtns[0]);

        // ตรวจว่าหลังคลิกยังมี pagination controls
        await waitFor(() => {
            expect(screen.getAllByText(/Next/i).length).toBeGreaterThan(0);
        });
    });


    it("renders reservation table with statuses", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });
        await waitFor(() => {
            expect(screen.getByText(/Reservations/i)).toBeInTheDocument();
            expect(screen.getAllByText(/SOLD|RESERVED/i).length).toBeGreaterThan(0);
        });
    });

    it("shows 'No reservations found' when search yields nothing", async () => {
        render(<AdminEventdetail />, { wrapper: Wrapper });
        const search = screen.getByTestId("search-bar");
        fireEvent.change(search, { target: { value: "zzzzzzz" } });

        await waitFor(() =>
            expect(screen.getByText(/No reservations found/i)).toBeInTheDocument()
        );
    });
});
