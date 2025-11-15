// src/pages/Profile.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Profile from "./Profile";
import { MemoryRouter } from "react-router-dom";

/* -------------------------------------------------
   MOCK useAuth()
------------------------------------------------- */
const mockAuth = {
    state: { status: "authenticated", user: { id: 1, role: "USER" } },
};
vi.mock("@/features/auth/AuthContext", () => ({
    useAuth: () => mockAuth,
}));

/* -------------------------------------------------
   MOCK API (profile + tickets)
------------------------------------------------- */
const mockGetProfile = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetTickets = vi.fn();

vi.mock("@/lib/api", () => ({
    api: {
        get: (url: string) => {
            if (url === "/profile/my-tickets") return mockGetTickets();
            return Promise.resolve({ data: [] });
        },
    },
    profileApi: {
        getProfile: () => mockGetProfile(),
        updateUser: (...args: any[]) => mockUpdateUser(...args),
        updateOrganizer: vi.fn(),
    },
}));

/* -------------------------------------------------
   MOCK Component Children (ตัดปัญหา layout)
------------------------------------------------- */
vi.mock("@/components/TicketCard", () => ({
    default: ({ title }: any) => <div data-testid="ticket-card">{title}</div>,
}));

vi.mock("@/components/EventCard", () => ({
    default: ({ title, onClickGetTicket }: any) => (
        <div
            data-testid="event-card"
            onClick={onClickGetTicket}
        >
            {title}
        </div>
    ),
}));

vi.mock("@/components/EventToolbar", () => ({
    default: ({ category, onCategoryChange, search, onSearchChange }: any) => (
        <div data-testid="toolbar">
            <button onClick={() => onCategoryChange("concert")}>Concert</button>
            <input
                data-testid="search-input"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    ),
}));

/* -------------------------------------------------
   MOCK QRCode
------------------------------------------------- */
vi.mock("qrcode", () => ({
    toCanvas: vi.fn().mockResolvedValue(true),
}));

/* -------------------------------------------------
   TEST SUITE
------------------------------------------------- */
describe("Profile Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ---------- 1) โหลดโปรไฟล์ + ตั๋ว ----------
    it("loads profile and tickets", async () => {
        mockGetProfile.mockResolvedValueOnce({
            data: {
                id: "1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                username: "johndoe",
                phoneNumber: "0123456789",
                role: "USER",
            },
        });

        mockGetTickets.mockResolvedValueOnce({
            data: [
                {
                    reserveId: "R1",
                    eventId: 15,
                    title: "Rock Night",
                    venue: "Impact Hall",
                    showDatetime: "2025-02-02T20:00:00",
                    row: "A",
                    col: "5",
                    zone: "VIP",
                    unitPrice: 500,
                },
            ],
        });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        // Profile Loaded
        expect(await screen.findByText("john@example.com")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();

        // Ticket Loaded
        expect(await screen.findByText("Rock Night")).toBeInTheDocument();
    });

    // ---------- 2) กดปุ่ม Edit เปิด Popup ----------
    it("opens EditProfile popup", async () => {
        mockGetProfile.mockResolvedValueOnce({
            data: {
                id: "1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                username: "johndoe",
                phoneNumber: "0123456789",
                role: "USER",
            },
        });

        mockGetTickets.mockResolvedValueOnce({ data: [] });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        const editButton = await screen.findByTitle("Edit Profile");
        fireEvent.click(editButton);

        expect(await screen.findByText("Edit Profile")).toBeInTheDocument();
    });

    // ---------- 5) Search toolbar ----------
    it("filters ticket by search", async () => {
        mockGetProfile.mockResolvedValue({
            data: {
                id: "1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                username: "johndoe",
                phoneNumber: "0123456789",
                role: "USER",
            },
        });

        mockGetTickets.mockResolvedValue({
            data: [
                { reserveId: "1", title: "Metal Show", venue: "Arena", showDatetime: "2025-01-10" },
                { reserveId: "2", title: "Classic Concert", venue: "Hall", showDatetime: "2025-03-15" },
            ],
        });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        await screen.findByText("Metal Show");

        fireEvent.change(screen.getByTestId("search-input"), { target: { value: "classic" } });

        expect(screen.queryByText("Metal Show")).not.toBeInTheDocument();
        expect(screen.getByText("Classic Concert")).toBeInTheDocument();
    });
});
