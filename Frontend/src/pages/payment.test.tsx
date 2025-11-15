// src/pages/payment.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, useParams, useNavigate } from "react-router-dom";
import PaymentPage from "./payment";

// --------------------------------------------------
// MOCK ROUTER
// --------------------------------------------------
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useParams: () => ({ reservedId: "1" }),
        useNavigate: () => vi.fn(),
    };
});

// --------------------------------------------------
// MOCK API
// --------------------------------------------------
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/lib/api", () => ({
    api: {
        get: (...args: any[]) => mockGet(...args),
        post: (...args: any[]) => mockPost(...args),
    },
}));

// --------------------------------------------------
// TEST SUITE
// --------------------------------------------------
describe("Payment Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ---------- 1. โหลด reservation ----------
    it("loads and displays reservation summary", async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                reservedId: 1,
                eventId: 99,
                ticketTypeId: 5,
                quantity: 2,
                totalAmount: 1200,
                paymentStatus: "UNPAID",
                registrationDatetime: "2025-01-01T10:00:00Z",
                paymentDatetime: null,
            },
        });

        render(
            <MemoryRouter>
                <PaymentPage />
            </MemoryRouter>
        );

        expect(await screen.findByText("Loading…")).toBeInTheDocument();

        expect(await screen.findByText("RESERVATION")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument(); // reservedId
        expect(screen.getByText("99")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("฿1,200")).toBeInTheDocument();

        expect(screen.getByText("UNPAID")).toBeInTheDocument();
    });

    // ---------- 2. แสดง error ----------
    it("shows error when API fails", async () => {
        mockGet.mockRejectedValueOnce({
            response: { data: { error: "Reservation missing" } },
        });

        render(
            <MemoryRouter>
                <PaymentPage />
            </MemoryRouter>
        );

        expect(await screen.findByText("Reservation missing")).toBeInTheDocument();
    });

    // ---------- 3. จ่ายเงินสำเร็จ ----------
    it("pays and updates status to PAID", async () => {
        // initial load
        mockGet.mockResolvedValueOnce({
            data: {
                reservedId: 1,
                totalAmount: 500,
                paymentStatus: "UNPAID",
            },
        });

        // pay
        mockPost.mockResolvedValueOnce({
            data: {
                reservedId: 1,
                totalAmount: 500,
                paymentStatus: "PAID",
                confirmationCode: "ABC123",
            },
        });

        render(
            <MemoryRouter>
                <PaymentPage />
            </MemoryRouter>
        );

        // รอโหลดเสร็จ
        await screen.findByText("Pay ฿500");

        fireEvent.click(screen.getByText(/Pay ฿500/i));

        expect(mockPost).toHaveBeenCalled();

        expect(await screen.findByText("PAID")).toBeInTheDocument();
        expect(screen.getByText(/ABC123/i)).toBeInTheDocument();
    });

    // ---------- 4. เปลี่ยน method ----------
    it("switches payment method radio", async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                reservedId: 1,
                totalAmount: 500,
                paymentStatus: "UNPAID",
                paymentMethod: "Credit Card",
            },
        });

        render(
            <MemoryRouter>
                <PaymentPage />
            </MemoryRouter>
        );

        await screen.findByText("Pay ฿500");

        const bankRadio = screen.getByDisplayValue("Bank Transfer");
        fireEvent.click(bankRadio);

        expect(bankRadio).toBeChecked();
    });
});
