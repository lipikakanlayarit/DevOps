// src/tests/Eventselect.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Eventselect from "@/pages/Eventselect";
import { MemoryRouter } from "react-router-dom";

/* =====================================================
   MOCKS
===================================================== */

// mock react-router-dom
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useParams: () => ({ eventId: "1" }),
        useNavigate: () => vi.fn(),
    };
});

// mock Footer
vi.mock("@/components/Footer", () => ({
    default: () => <div data-testid="footer">FOOTER</div>,
}));

// mock SeatMap (สร้างปุ่ม PICK SEAT แทน Canvas จริง)
vi.mock("@/components/SeatMap", () => ({
    __esModule: true,
    default: ({ zones, onPick }) => (
        <div data-testid="seatmap">
            <button
                data-testid="fake-seat"
                onClick={() => onPick(zones[0].id, 0, 0)}
            >
                PICK SEAT
            </button>
        </div>
    ),
}));

// mock api instance
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        defaults: { baseURL: "/api" },
    },
}));

import { api } from "@/lib/api";

/* =====================================================
   MOCK DATA
===================================================== */

const mockEvent = {
    id: 1,
    eventName: "Music Night",
    startDatetime: "2025-01-02T01:00:00Z",
    endDatetime: "2025-01-02T03:00:00Z",
    venueName: "Arena",
    venueAddress: "Bangkok",
};

const mockSetup = {
    salesStartDatetime: "2025-01-01T07:00:00Z",
    salesEndDatetime: "2025-02-01T00:00:00Z",
    seatRows: 3,
    seatColumns: 3,
    zones: [
        {
            id: 101,
            name: "VIP",
            price: 1500,
            rows: 3,
            cols: 3,
            occupiedSeats: [],
        },
    ],
    occupiedSeatMap: [],
};

/* =====================================================
   TEST SUITE
===================================================== */

describe("Eventselect Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // mock API RESPONSE SEQUENCE
        (api.get as any)
            .mockResolvedValueOnce({data: mockEvent}) // 1st: load event
            .mockResolvedValueOnce({data: mockSetup}) // 2nd: load setup
            .mockResolvedValue({data: mockSetup});    // refetch setup if any
    });

    /* ----------------------------------
       TEST 1: Loaded page + show <h1>
    ---------------------------------- */
    it("โหลดหน้าและแสดงชื่ออีเวนท์ใน <h1>", async () => {
        render(
            <MemoryRouter>
                <Eventselect/>
            </MemoryRouter>
        );

        // *** ใช้ heading level 1 ป้องกัน duplicate ***
        const title = await screen.findByRole("heading", {
            level: 1,
            name: "Music Night",
        });

        expect(title).toBeInTheDocument();
    });

});