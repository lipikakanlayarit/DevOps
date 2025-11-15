// src/pages/admin-usermnge.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import AdminUserManagement from "./admin-usermange";
import React from "react";

// ✅ Mock Components ที่ไม่สำคัญ
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));
vi.mock("@/components/TicketCard", () => ({
    default: (props: any) => (
        <div data-testid="ticket-card">
            Ticket: {props.title} ({props.zone})
        </div>
    ),
}));

// ✅ Mock poster asset
vi.mock("@/assets/poster.png", () => ({ default: "poster.png" }));

// ✅ Mock API
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

const { api } = await import("@/lib/api");

describe("AdminUserManagement Page", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    /* ------------------------------- render base ------------------------------- */
    it("renders layout correctly", async () => {
        (api.get as any).mockResolvedValueOnce({ data: [] });
        render(<AdminUserManagement />);

        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        expect(screen.getByText("User Management")).toBeInTheDocument();

        await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/users"));
    });

    /* ------------------------------- attendee list ------------------------------- */
    it("loads and displays attendee users", async () => {
        (api.get as any).mockResolvedValueOnce({
            data: [
                {
                    id: 1,
                    username: "john",
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    role: "USER",
                },
            ],
        });
        render(<AdminUserManagement />);

        await waitFor(() => screen.getByText("john"));
        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Doe")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    /* ------------------------------- switch to organizer ------------------------------- */
    it("switches tab to organizer and fetches data", async () => {
        (api.get as any)
            .mockResolvedValueOnce({ data: [] }) // for attendee
            .mockResolvedValueOnce({
                data: [
                    {
                        id: 10,
                        username: "org",
                        firstName: "Org",
                        lastName: "Ganizer",
                        email: "org@example.com",
                        address: "Bangkok",
                    },
                ],
            });

        render(<AdminUserManagement />);
        const organizerBtn = screen.getByText("Organizer");
        fireEvent.click(organizerBtn);

        await waitFor(() => screen.getByText("org"));
        expect(api.get).toHaveBeenCalledWith("/admin/organizers");
        expect(screen.getByText("Bangkok")).toBeInTheDocument();
    });

    /* ------------------------------- search filter ------------------------------- */
    it("filters by search query", async () => {
        (api.get as any).mockResolvedValueOnce({
            data: [
                { id: 1, username: "alice", firstName: "Alice", lastName: "Smith", email: "a@a.com", role: "USER" },
                { id: 2, username: "bob", firstName: "Bob", lastName: "Lee", email: "b@b.com", role: "USER" },
            ],
        });
        render(<AdminUserManagement />);
        await screen.findByText("alice");

        const input = screen.getByPlaceholderText("Search attendees...");
        fireEvent.change(input, { target: { value: "bob" } });

        await waitFor(() => expect(screen.queryByText("alice")).not.toBeInTheDocument());
        expect(screen.getByText("bob")).toBeInTheDocument();
    });

    /* ------------------------------- view detail (attendee tickets) ------------------------------- */
    it("opens detail modal and loads attendee tickets", async () => {
        (api.get as any)
            .mockResolvedValueOnce({
                data: [
                    {
                        id: 1,
                        username: "user1",
                        firstName: "U",
                        lastName: "One",
                        email: "u1@test.com",
                        role: "USER",
                    },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        reserveId: "R001",
                        title: "Rock Show",
                        venue: "Stadium",
                        zone: "VIP",
                        row: 1,
                        column: 2,
                        total: 1000,
                    },
                ],
            });

        render(<AdminUserManagement />);
        await screen.findByText("user1");

        fireEvent.click(screen.getByText("View detail"));
        await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/users/1/tickets"));
        expect(await screen.findByText(/Ticket: Rock Show/)).toBeInTheDocument();

        // ปิด modal
        fireEvent.click(screen.getByRole("button", { name: "" })); // X button
    });

    /* ------------------------------- error handling ------------------------------- */
    it("handles error while loading users gracefully", async () => {
        (api.get as any).mockRejectedValueOnce(new Error("Network Error"));
        render(<AdminUserManagement />);
        await waitFor(() => expect(api.get).toHaveBeenCalled());
    });
});
