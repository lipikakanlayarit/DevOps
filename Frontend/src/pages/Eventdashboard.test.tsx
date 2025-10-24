import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EventDashboard from "../pages/Eventdashboard";

// mock ส่วนประกอบภายนอก (Sidebar และ Input)
vi.mock("@/components/sidebarorg", () => ({
    Sidebar: () => <div data-testid="sidebar">SidebarMock</div>,
}));

vi.mock("@/components/inputtxt", () => ({
    Input: ({ value, onChange, placeholder }: any) => (
        <input
            data-testid="search-input"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    ),
}));

describe("EventDashboard Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ฟังก์ชันช่วย render หน้า EventDashboard พร้อม Router จำลอง
    const renderWithRouter = (initialPath = "/event/123") =>
        render(
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    {/* เส้นทางหลักของหน้า Dashboard */}
                    <Route path="/event/:eventId" element={<EventDashboard />} />
                    {/* เส้นทางของหน้า organization (ใช้ใน navigate test ภายหลังได้) */}
                    <Route path="/organizationmnge" element={<div>Org Page</div>} />
                </Routes>
            </MemoryRouter>
        );

    //  1️⃣ ทดสอบว่าหน้า Dashboard แสดงองค์ประกอบหลักครบ
    it("renders all KPI cards and sidebar", () => {
        renderWithRouter();

        // ✅ ตรวจว่ามี Sidebar และหัวข้อหลักทั้งหมด
        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        expect(screen.getByText("Event Dashboard")).toBeInTheDocument();
        expect(screen.getByText(/Event ID:/)).toBeInTheDocument();

        // ✅ ตรวจว่ามีการ์ด KPI ทั้ง 3 ประเภท
        expect(screen.getByText("Net Payout (THB)")).toBeInTheDocument();
        expect(screen.getByText("Total Ticket Sold")).toBeInTheDocument();
        expect(screen.getByText("Total Summary")).toBeInTheDocument();
    });

    // 🧩 2️⃣ ทดสอบว่าบัตรสรุปจำนวนที่นั่ง (Available / Reserved / Sold) แสดงค่าถูกต้อง
    it("displays correct badges for seat summary", () => {
        renderWithRouter();

        expect(screen.getByText(/Available Seat : 40/)).toBeInTheDocument();
        expect(screen.getByText(/Reserved Seat : 12/)).toBeInTheDocument();
        expect(screen.getByText(/Sold Seat : 8/)).toBeInTheDocument();
    });

    // 🧩 3️⃣ ทดสอบว่าตารางแสดงข้อมูล mock seats ทั้งหมดได้ครบ (ก่อนกรอง)
    it("shows all mock rows initially", () => {
        renderWithRouter();

        // ✅ ตรวจว่า seat ทั้งสามตัวใน MOCK_SEATS ปรากฏครบ
        expect(screen.getByText("B12")).toBeInTheDocument();
        expect(screen.getByText("C20")).toBeInTheDocument();
        expect(screen.getByText("A01")).toBeInTheDocument();
    });

    // 🧩 4️⃣ ทดสอบฟังก์ชันค้นหา (filter) ว่าทำงานถูกต้อง
    it("filters rows based on search query", async () => {
        renderWithRouter();

        // ✅ พิมพ์คำค้น "ZOMBIE" ลงในช่อง search
        const input = screen.getByTestId("search-input");
        fireEvent.change(input, { target: { value: "ZOMBIE" } });

        // ✅ รอให้กรองเสร็จและตรวจว่ามีแค่ ZOMBIE
        await waitFor(() => {
            expect(screen.getByText("ZOMBIE")).toBeInTheDocument();
        });

        // ✅ และไม่มีชื่อ NANA (ถูกกรองออก)
        expect(screen.queryByText("NANA")).not.toBeInTheDocument();
    });

    // 🧩 5️⃣ ทดสอบว่าป้ายสถานะ (StatusBadge) COMPLETE / UNPAID แสดงผลถูกต้อง
    it("renders status badges correctly", () => {
        renderWithRouter();

        expect(screen.getAllByText("COMPLETE")[0]).toBeInTheDocument();
        expect(screen.getAllByText("UNPAID")[0]).toBeInTheDocument();
    });

    // 🧩 6️⃣ ทดสอบส่วนวงกลมสรุป (Donut chart) และ legend ว่าแสดงค่าถูกต้อง
    it("renders donut and legend with correct values", () => {
        renderWithRouter();

        // ✅ donut ค่า 0%
        expect(screen.getByText("0%")).toBeInTheDocument();

        // ✅ legend มี Paid / Pending
        expect(screen.getByText(/Paid/)).toBeInTheDocument();
        expect(screen.getByText(/Pending/)).toBeInTheDocument();
    });
});
