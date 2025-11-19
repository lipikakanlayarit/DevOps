import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TicketDetail from "./Ticketdetail";
import { MemoryRouter } from "react-router-dom";

// 🧱 mock API
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

// 🧱 mock react-router (แก้ syntax ให้ถูกต้อง + เพิ่ม useParams)
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useParams: () => ({ eventId: "1" }), // ✅ mock eventId ให้ TicketDetail ทำงานได้
        Link: ({ to, children }: any) => <a href={to}>{children}</a>,
    };
});

// 🧱 mock localStorage
vi.stubGlobal("localStorage", {
    getItem: vi.fn(() =>
        JSON.stringify({
            eventName: "Jazz Fest",
            venueName: "Arena",
            startDateTime: "2025-01-01",
            endDateTime: "2025-01-02",
        })
    ),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
});

// 🧱 mock alert
const mockAlert = vi.fn();
vi.stubGlobal("alert", mockAlert);

const { api } = await import("@/lib/api");

describe("TicketDetail Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("adds and removes a zone successfully", async () => {
        (api.get as any).mockResolvedValueOnce({ data: null });

        render(
            <MemoryRouter>
                <TicketDetail />
            </MemoryRouter>
        );

        const addBtn = await screen.findByRole("button", { name: /Add Zone/i });
        fireEvent.click(addBtn);
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(screen.getAllByPlaceholderText("เช่น VIP / A / HB").length).toBe(3);
        });

        const removeBtns = screen.getAllByRole("button", { name: /Remove zone/i });
        fireEvent.click(removeBtns[0]);
        await waitFor(() => {
            expect(screen.getAllByPlaceholderText("เช่น VIP / A / HB").length).toBe(2);
        });
    });

    it("handles save success with POST when no existing data", async () => {
        (api.get as any).mockRejectedValueOnce({});
        (api.post as any).mockResolvedValueOnce({});

        render(
            <MemoryRouter>
                <TicketDetail />
            </MemoryRouter>
        );

        // ใส่ค่าที่จำเป็น
        const rowInput = await screen.findAllByPlaceholderText("เช่น 20");
        fireEvent.change(rowInput[0], { target: { value: "5" } });
        fireEvent.change(rowInput[1], { target: { value: "5" } });

        const zoneInput = await screen.findByPlaceholderText("เช่น VIP / A / HB");
        fireEvent.change(zoneInput, { target: { value: "A" } });

        const priceInput = await screen.findByPlaceholderText("0");
        fireEvent.change(priceInput, { target: { value: "500" } });

        const saveBtn = await screen.findByRole("button", { name: /Save/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        });
    });

    it("handles save success with PUT when existing data", async () => {
        (api.get as any).mockResolvedValueOnce({
            data: {
                seatRows: 10,
                seatColumns: 10,
                zones: [{ code: "A", name: "A", price: 100 }],
                minPerOrder: 1,
                maxPerOrder: 5,
                active: true,
            },
        });
        (api.put as any).mockResolvedValueOnce({});

        render(
            <MemoryRouter>
                <TicketDetail />
            </MemoryRouter>
        );

        const updateBtn = await screen.findByRole("button", { name: /Update/i });
        fireEvent.click(updateBtn);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalled();
        });
    });

    it("validates wrong seat input", async () => {
        (api.get as any).mockRejectedValueOnce({});
        render(
            <MemoryRouter>
                <TicketDetail />
            </MemoryRouter>
        );

        const saveBtn = await screen.findByRole("button", { name: /Save/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalled();
        });
    });

    it("validates min > max", async () => {
        (api.get as any).mockRejectedValueOnce({});
        render(
            <MemoryRouter>
                <TicketDetail />
            </MemoryRouter>
        );

        const rowInput = await screen.findAllByPlaceholderText("เช่น 20");
        fireEvent.change(rowInput[0], { target: { value: "5" } });
        fireEvent.change(rowInput[1], { target: { value: "5" } });

        const zoneInput = await screen.findByPlaceholderText("เช่น VIP / A / HB");
        fireEvent.change(zoneInput, { target: { value: "A" } });

        // ✅ ใช้ getAllByPlaceholderText เพื่อแยก min/max
        const numInputs = await screen.findAllByPlaceholderText("1");
        const minInput = numInputs[0]; // Minimum ticket
        const maxInput = numInputs[1]; // Maximum ticket

        fireEvent.change(minInput, { target: { value: "10" } });
        fireEvent.change(maxInput, { target: { value: "2" } });

        const saveBtn = await screen.findByRole("button", { name: /Save/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalledWith(
                expect.stringMatching(/Minimum ต้องไม่มากกว่า Maximum/)
            );
        });
    });
});
