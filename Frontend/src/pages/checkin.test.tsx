import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CheckinConfirmPage from "@/pages/checkin";
import { MemoryRouter } from "react-router-dom";

/* ==========================================================
   MOCK ROUTER
========================================================== */
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ reservedId: "123" }),
        useSearchParams: () => [
            new URLSearchParams({ eventId: "1", seatId: "777" }),
        ],
    };
});

/* ==========================================================
   MOCK API
========================================================== */
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        defaults: { baseURL: "/api" },
    },
}));

import { api } from "@/lib/api";

const mockPaidResponse = {
    reservedId: 123,
    eventId: 1,
    seatId: 777,
    seatLabel: "VIP A1",
    paymentStatus: "PAID",
    userFullName: "John Doe",
    unitPrice: 1500,
};

const mockUnpaidResponse = {
    ...mockPaidResponse,
    paymentStatus: "UNPAID",
};

/* ==========================================================
   TEST SUITE
========================================================== */

describe("CheckinConfirmPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockReset();
    });

    /* -------------------------------------------
     * TEST 1: Loading state
     * -----------------------------------------*/
    it("แสดง Loading... ตอนกำลังโหลด", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockPaidResponse });

        render(
            <MemoryRouter>
                <CheckinConfirmPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading/i)).toBeInTheDocument();

        await screen.findByText(/VIP A1/);
    });

    /* -------------------------------------------
     * TEST 2: Error message
     * -----------------------------------------*/
    it("แสดง error หากโหลดข้อมูลล้มเหลว", async () => {
        (api.get as any).mockRejectedValueOnce({
            response: { data: { error: "Not found" } },
        });

        render(
            <MemoryRouter>
                <CheckinConfirmPage />
            </MemoryRouter>
        );

        const errorMsg = await screen.findByText(/Not found/i);
        expect(errorMsg).toBeInTheDocument();
    });

    /* -------------------------------------------
     * TEST 3: Show loaded data
     * -----------------------------------------*/
    it("แสดงข้อมูล reservation หลังโหลดเสร็จ", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockPaidResponse });

        render(
            <MemoryRouter>
                <CheckinConfirmPage />
            </MemoryRouter>
        );

        expect(await screen.findByText("VIP A1")).toBeInTheDocument();
        expect(screen.getByText("PAID")).toBeInTheDocument();
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    /* -------------------------------------------
     * TEST 4: Unpaid = button disabled
     * -----------------------------------------*/
    it("หากยังไม่ชำระเงิน ปุ่มเช็คอินจะ disabled", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockUnpaidResponse });

        render(
            <MemoryRouter>
                <CheckinConfirmPage />
            </MemoryRouter>
        );

        await screen.findByText("UNPAID");

        const btn = screen.getByRole("button", { name: /ยืนยันการเข้างาน/i });
        expect(btn).toBeDisabled();
    });

    /* -------------------------------------------
     * TEST 5: Paid = button works and navigate ถูกเรียก
     * -----------------------------------------*/
    it("หากชำระเงินแล้ว สามารถกดเช็คอินและ navigate ถูกต้อง", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockPaidResponse });

        render(
            <MemoryRouter>
                <CheckinConfirmPage />
            </MemoryRouter>
        );

        const btn = await screen.findByRole("button", { name: /ยืนยันการเข้างาน/i });

        expect(btn).not.toBeDisabled();

        fireEvent.click(btn);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/eventdashboard/1?checked=123&seatId=777",
                { replace: true }
            );
        });
    });

    /* -------------------------------------------
     * TEST 6: Fallback eventId จาก query
     * -----------------------------------------*/
    it("fallback eventId จาก query หาก API ไม่ส่ง eventId", async () => {
        const noEventIdResponse = {
            ...mockPaidResponse,
            eventId: null,
        };

        (api.get as any).mockResolvedValueOnce({ data: noEventIdResponse });

        render(
            <MemoryRouter>
                <CheckinConfirmPage />
            </MemoryRouter>
        );

        const btn = await screen.findByRole("button", { name: /ยืนยันการเข้างาน/i });
        fireEvent.click(btn);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/eventdashboard/1?checked=123&seatId=777",
                { replace: true }
            );
        });
    });
});
