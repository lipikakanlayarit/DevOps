// src/pages/Eventdashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EventDashboard from "../pages/Eventdashboard";

// =======================
//  Mock external components
// =======================
vi.mock("@/components/sidebarorg", () => ({
    Sidebar: () => <div data-testid="sidebar">SidebarMock</div>,
}));

vi.mock("@/components/inputtxt", () => ({
    Input: ({ value, onChange, placeholder, className }: any) => (
        <input
            data-testid="search-input"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={className}
        />
    ),
}));

// =======================
//  Mock data & helpers
// =======================
const mockDashboard: any = {
    eventId: 123,
    eventName: "BUTCON DEV DAY",
    ticketTarget: 60,
    ticketSoldNow: 20,
    netPayout: 12345.5,
    sold: 8,
    reserved: 12,
    available: 40,
    rows: [
        {
            id: 1,
            reserved_code: "R-001",
            status: "PAID",
            total: 100,
            user: "NANA",
            seat_label: "A01",
        },
        {
            id: 2,
            reserved_code: "R-002",
            status: "UNPAID",
            total: 200,
            user: "ZOMBIE",
            seat_label: "B12",
        },
        {
            id: 3,
            reserved_code: "R-003",
            status: "UNPAID",
            total: 300,
            user: "JOHN",
            seat_label: "C20",
        },
    ],
};

// =======================
//  Global setup
// =======================
const renderWithRouter = async (initialPath = "/event/123") => {
    const ui = render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/event/:eventId" element={<EventDashboard />} />
                <Route path="/organizationmnge" element={<div>Org Page</div>} />
            </Routes>
        </MemoryRouter>,
    );

    // รอให้ useEffect(fetch) ทำงานและ state update เสร็จ
    await screen.findByText("Event Dashboard");
    return ui;
};

describe("EventDashboard Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();

        // mock fetch สำหรับ dashboard API
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => mockDashboard,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // 2️⃣ สรุปจำนวนที่นั่ง Available / Reserved / Sold
    it("displays correct badges for seat summary", async () => {
        await renderWithRouter();

        expect(
            await screen.findByText(/Available Seat : 40/i),
        ).toBeInTheDocument();
        expect(
            await screen.findByText(/Reserved Seat : 12/i),
        ).toBeInTheDocument();
        expect(await screen.findByText(/Sold Seat : 8/i)).toBeInTheDocument();
    });

    // 3️⃣ ตารางแสดงข้อมูล rows ครบ (หลังโหลดเสร็จ)
    it("shows all mock rows initially", async () => {
        await renderWithRouter();

        // ชื่อตาม mockDashboard.rows
        expect(await screen.findByText("A01")).toBeInTheDocument();
        expect(await screen.findByText("B12")).toBeInTheDocument();
        expect(await screen.findByText("C20")).toBeInTheDocument();
    });


    // 5️⃣ StatusBadge แสดง COMPLETE / UNPAID ถูกต้อง
    it("renders status badges correctly", async () => {
        await renderWithRouter();

        // Row ที่ status = PAID -> COMPLETE
        const completeBadge = await screen.findByText("COMPLETE");
        expect(completeBadge).toBeInTheDocument();

        // Row ที่ status = UNPAID -> UNPAID (มีอย่างน้อย 1 อัน)
        const unpaidBadges = await screen.findAllByText("UNPAID");
        expect(unpaidBadges.length).toBeGreaterThan(0);
    });

    // 6️⃣ Donut chart + Legend Paid / Pending แสดงค่าถูกต้องตาม mock
    it("renders status badges correctly", async () => {
        await renderWithRouter();

        // ใช้ custom matcher ตรวจข้อความภายใน Span
        const completeBadge = await screen.findByText((text) =>
            text.includes("COMPLETE")
        );
        expect(completeBadge).toBeInTheDocument();

        const unpaidBadges = await screen.findAllByText((text) =>
            text.includes("UNPAID")
        );
        expect(unpaidBadges.length).toBeGreaterThan(0);
    });

});
