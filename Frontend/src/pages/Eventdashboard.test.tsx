// src/pages/Eventdashboard.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import EventDashboard from "./eventdashboard";

/* ---------------------------------------------------
   MOCK: Sidebar + Input
--------------------------------------------------- */
vi.mock("@/components/sidebarorg", () => ({
    Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("@/components/inputtxt", () => ({
    Input: (props: any) => (
        <input
            data-testid="search-input"
            placeholder={props.placeholder}
            value={props.value}
            onChange={props.onChange}
        />
    ),
}));

/* ---------------------------------------------------
   MOCK: react-router-dom (ครบทุก function)
--------------------------------------------------- */
const mockNavigate = vi.fn();
const mockSetParams = vi.fn();

vi.mock("react-router-dom", () => ({
    useParams: () => ({ eventId: "1" }),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), mockSetParams],
}));

/* ---------------------------------------------------
   MOCK: localStorage
--------------------------------------------------- */
const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => (store[k] = v),
    removeItem: (k: string) => delete store[k],
    clear: () => Object.keys(store).forEach((k) => delete store[k]),
});

/* ---------------------------------------------------
   MOCK: window object
--------------------------------------------------- */
vi.stubGlobal("window", {
    location: { pathname: "/", search: "" },
});

/* ---------------------------------------------------
   MOCK: fetch API (Success)
--------------------------------------------------- */
const mockData = {
    eventId: 1,
    eventName: "Music Festival",
    ticketTarget: 100,
    sold: 50,
    reserved: 30,
    available: 20,
    netPayout: 50000,
    ticketSoldNow: 50,
    rows: [
        {
            id: 1,
            reserved_code: "ABC123",
            status: "PAID",
            total: 1200,
            user: "John Doe",
            seat_label: "A1",
        },
        {
            id: 2,
            reserved_code: "XYZ789",
            status: "UNPAID",
            total: 1000,
            user: "Jane Doe",
            seat_label: "B1",
        },
    ],
};

vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
    })
));

/* ---------------------------------------------------
   TEST SUITE
--------------------------------------------------- */
describe("EventDashboard Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* -------------------------
       CASE 1 — Success
    ------------------------- */
    it("renders UI correctly when API success", async () => {
        render(<EventDashboard />);

        expect(fetch).toHaveBeenCalledTimes(1);

        // รอ data โหลดก่อน แล้วตรวจ title
        expect(
            await screen.findByText(/Music Festival/i)
        ).toBeInTheDocument();


        // Sidebar
        expect(screen.getByTestId("sidebar")).toBeInTheDocument();

        // Search Input
        expect(screen.getByTestId("search-input")).toBeInTheDocument();

        // Stat Cards
        expect(screen.getByText(/Net Payout/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Ticket Sold/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Summary/i)).toBeInTheDocument();

        // Badges (Available / Reserved / Sold)
        expect(screen.getByText(/Available Seat/i)).toHaveTextContent("20");
        expect(screen.getByText(/Reserved Seat/i)).toHaveTextContent("30");
        expect(screen.getByText(/Sold Seat/i)).toHaveTextContent("50");

        // Table rows
        // Table rows
        expect((await screen.findAllByText("ABC123")).length).toBeGreaterThan(0);
        expect((await screen.findAllByText("A1")).length).toBeGreaterThan(0);
        expect((await screen.findAllByText("John Doe")).length).toBeGreaterThan(0);

        expect((await screen.findAllByText("XYZ789")).length).toBeGreaterThan(0);
        expect((await screen.findAllByText("Jane Doe")).length).toBeGreaterThan(0);
        expect((await screen.findAllByText("B1")).length).toBeGreaterThan(0);

        // Donut Chart
        const percents = await screen.findAllByText(/%/);
        expect(percents.length).toBeGreaterThan(0);

        // Attendance Section
        expect(screen.getByText(/Attendance/i)).toBeInTheDocument();

    });

    /* -------------------------
       CASE 2 — Failure
    ------------------------- */
    it("handles API failure gracefully", async () => {
        (fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            text: () => Promise.resolve("Server Error"),
        });

        render(<EventDashboard />);

        // ใช้ findByText แทน waitFor
        expect(
            await screen.findByText(/โหลดข้อมูลไม่สำเร็จ/i)
        ).toBeInTheDocument();
    });
});
