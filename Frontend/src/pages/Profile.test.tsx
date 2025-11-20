// src/pages/Profile.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import Profile from "./Profile";
import { useAuth } from "@/features/auth/AuthContext";
import { api, profileApi } from "@/lib/api";

// ================= Mock modules =================
vi.mock("@/features/auth/AuthContext", () => ({
    useAuth: vi.fn(),
}));

vi.mock("@/components/TicketCard", () => ({
    default: (props: any) => (
        <div data-testid="ticket-card">
            <span>{props.title}</span>
            <span>{props.venue}</span>
            <span>{props.showDate}</span>
            <span>{props.zone}</span>
            <span>{props.row}</span>
            <span>{props.column}</span>
            <span>{props.total}</span>
        </div>
    ),
}));

vi.mock("@/components/EventCard", () => ({
    default: (props: any) => (
        <div
            data-testid="event-card"
            data-effective-status={props.effectiveStatus}
            onClick={props.onClickGetTicket}
        >
            {props.title}
        </div>
    ),
}));

vi.mock("@/components/EventToolbar", () => ({
    default: (props: any) => (
        <div data-testid="event-toolbar">
            <input
                data-testid="search-input"
                value={props.search}
                onChange={(e) => props.onSearchChange(e.target.value)}
            />
            <select
                data-testid="category-select"
                value={props.category}
                onChange={(e) => props.onCategoryChange(e.target.value)}
            >
                {props.categories.map((cat: any) => (
                    <option key={cat.value} value={cat.value}>
                        {cat.label}
                    </option>
                ))}
            </select>
            <select
                data-testid="order-select"
                value={props.order}
                onChange={(e) => props.onOrderChange(e.target.value)}
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
            </select>
        </div>
    ),
}));

// ทำให้ TypeScript ไม่บ่นเรื่อง type ของ mock
const mockUseAuth = useAuth as unknown as any;
const spyGetProfile = vi.spyOn(profileApi, "getProfile");
const spyUpdateUser = vi.spyOn(profileApi, "updateUser");
const spyUpdateOrganizer = vi.spyOn(profileApi, "updateOrganizer");
const spyApiGet = vi.spyOn(api, "get");

// ================= Mock Data =================
const mockProfile = {
    id: "1",
    username: "testuser",
    email: "test@example.com",
    role: "USER",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "1234567890",
    idCard: "1234567890123",
};

const mockOrganizerProfile = {
    id: "2",
    username: "organizer",
    email: "org@example.com",
    role: "ORGANIZER",
    firstName: "Jane",
    lastName: "Smith",
    phoneNumber: "0987654321",
    companyName: "Event Co",
    taxId: "TAX123",
    address: "123 Street",
    verificationStatus: "VERIFIED",
};

// ================= Global beforeEach =================
beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: "" };
    window.alert = vi.fn();
    console.log = vi.fn();
    console.error = vi.fn();
});

// =====================================================
//  Authentication Flow
// =====================================================
describe("Profile Component - Authentication Flow", () => {
    it("shows loading state when authentication is loading", () => {
        mockUseAuth.mockReturnValue({
            state: { status: "loading", user: null },
        } as any);

        render(<Profile />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("redirects to login when unauthenticated", () => {
        mockUseAuth.mockReturnValue({
            state: { status: "unauthenticated", user: null },
        } as any);

        render(<Profile />);
        expect(window.location.href).toBe("/login");
    });

    it("fetches profile and tickets when authenticated", async () => {
        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "1" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: mockProfile } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);

        render(<Profile />);

        await waitFor(() => {
            expect(spyGetProfile).toHaveBeenCalledTimes(1);
            expect(spyApiGet).toHaveBeenCalledWith("/profile/my-tickets");
        });
    });
});

// =====================================================
//  ProfileCard
// =====================================================
describe("ProfileCard / Profile display", () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "1" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: mockProfile } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);
    });

    it("displays user profile information", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("test@example.com")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("testuser")).toBeInTheDocument();
            expect(screen.getByText("1234567890")).toBeInTheDocument();
            expect(screen.getByText("1234567890123")).toBeInTheDocument();
        });
    });

    it("displays organizer profile information", async () => {
        spyGetProfile.mockResolvedValueOnce({ data: mockOrganizerProfile } as any);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("org@example.com")).toBeInTheDocument();
            expect(screen.getByText("Jane Smith")).toBeInTheDocument();
            expect(screen.getByText("Event Co")).toBeInTheDocument();
            expect(screen.getByText("VERIFIED")).toBeInTheDocument();
        });
    });

    it("shows initials in avatar", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("JD")).toBeInTheDocument();
        });
    });

    it("opens edit popup when edit button is clicked", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("testuser")).toBeInTheDocument();
        });

        const editButton = screen.getByTitle("Edit Profile");
        fireEvent.click(editButton);

        expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });
});

// =====================================================
//  EditProfilePopup
// =====================================================
describe("EditProfilePopup behaviour", () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "1" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: mockProfile } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);
    });

    const openPopup = async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("testuser")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle("Edit Profile"));
    };

    it("displays edit form with current values", async () => {
        await openPopup();

        expect(screen.getByDisplayValue("John")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
        expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
        expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument();
        expect(screen.getByDisplayValue("1234567890123")).toBeInTheDocument();
    });

    it("updates form values when inputs change", async () => {
        await openPopup();

        const firstNameInput = screen.getByDisplayValue("John");
        fireEvent.change(firstNameInput, { target: { value: "Jane" } });

        expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
    });

    it("successfully updates user profile", async () => {
        spyUpdateUser.mockResolvedValue({ data: { success: true } } as any);

        await openPopup();

        const firstNameInput = screen.getByDisplayValue("John");
        fireEvent.change(firstNameInput, { target: { value: "Jane" } });

        const saveButton = screen.getByText("Save");
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(spyUpdateUser).toHaveBeenCalledWith({
                email: "test@example.com",
                firstName: "Jane",
                lastName: "Doe",
                phoneNumber: "1234567890",
                idCard: "1234567890123",
            });
            expect(window.alert).toHaveBeenCalledWith("Profile updated successfully!");
        });
    });

    it("successfully updates organizer profile", async () => {
        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "2" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: mockOrganizerProfile } as any);
        spyUpdateOrganizer.mockResolvedValue({ data: { success: true } } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("organizer")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle("Edit Profile"));

        const companyInput = screen.getByDisplayValue("Event Co");
        fireEvent.change(companyInput, { target: { value: "New Event Co" } });

        const saveButton = screen.getByText("Save");
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(spyUpdateOrganizer).toHaveBeenCalledWith({
                email: "org@example.com",
                firstName: "Jane",
                lastName: "Smith",
                phoneNumber: "0987654321",
                companyName: "New Event Co",
                taxId: "TAX123",
                address: "123 Street",
            });
            expect(window.alert).toHaveBeenCalledWith("Profile updated successfully!");
        });
    });

    it("shows error message when update fails with API error", async () => {
        spyUpdateUser.mockRejectedValue({
            response: { data: { error: "Update failed" } },
        });

        await openPopup();

        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
            expect(screen.getByText("Update failed")).toBeInTheDocument();
        });
    });

    it("handles generic error when no error message provided", async () => {
        spyUpdateUser.mockRejectedValue(new Error("Network error"));

        await openPopup();

        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
            expect(screen.getByText("Network error")).toBeInTheDocument();
        });
    });

    it("closes popup when cancel button is clicked", async () => {
        await openPopup();

        expect(screen.getByText("Edit Profile")).toBeInTheDocument();

        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
        });
    });

    it("clears error when input changes", async () => {
        spyUpdateUser.mockRejectedValue({
            response: { data: { error: "Update failed" } },
        });

        await openPopup();
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
            expect(screen.getByText("Update failed")).toBeInTheDocument();
        });

        const firstNameInput = screen.getByDisplayValue("John");
        fireEvent.change(firstNameInput, { target: { value: "Jane" } });

        expect(screen.queryByText("Update failed")).not.toBeInTheDocument();
    });

    it("disables buttons while saving", async () => {
        spyUpdateUser.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 1000))
        );

        await openPopup();

        const saveButton = screen.getByText("Save");
        const cancelButton = screen.getByText("Cancel");

        fireEvent.click(saveButton);

        expect(screen.getByText("Saving...")).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
    });
});

// =====================================================
//  Ticket filtering & toolbar
// =====================================================
describe("Ticket filtering and EventToolbar", () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "1" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: mockProfile } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);
    });

    it("filters tickets by search query (state update)", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByTestId("search-input")).toBeInTheDocument();
        });

        const searchInput = screen.getByTestId("search-input") as HTMLInputElement;
        fireEvent.change(searchInput, { target: { value: "ROBERT" } });

        expect(searchInput.value).toBe("ROBERT");
    });

    it("filters tickets by category (state update)", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByTestId("category-select")).toBeInTheDocument();
        });

        const categorySelect = screen.getByTestId(
            "category-select"
        ) as HTMLSelectElement;
        fireEvent.change(categorySelect, { target: { value: "concert" } });

        expect(categorySelect.value).toBe("concert");
    });

    it("changes sort order", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByTestId("order-select")).toBeInTheDocument();
        });

        const orderSelect = screen.getByTestId(
            "order-select"
        ) as HTMLSelectElement;
        fireEvent.change(orderSelect, { target: { value: "oldest" } });

        expect(orderSelect.value).toBe("oldest");
    });
});

// =====================================================
//  Error handling
// =====================================================
describe("Error handling", () => {
    it("handles update error without response data", async () => {
        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "1" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: mockProfile } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);
        spyUpdateUser.mockRejectedValue({});

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("testuser")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle("Edit Profile"));
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
            expect(
                screen.getByText("Failed to update profile")
            ).toBeInTheDocument();
        });
    });
});

// =====================================================
//  Edge cases
// =====================================================
describe("Edge cases (missing optional fields)", () => {
    it("handles organizer with missing optional fields", async () => {
        const incompleteOrganizer = {
            ...mockOrganizerProfile,
            companyName: undefined,
            verificationStatus: undefined,
        };

        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "2" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: incompleteOrganizer } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);

        render(<Profile />);

        await waitFor(() => {
            // มีอย่างน้อย 1 ตำแหน่งที่แสดง "-"
            expect(screen.getAllByText("-").length).toBeGreaterThan(0);
        });
    });

    it("handles user with missing ID card", async () => {
        const userWithoutIdCard = {
            ...mockProfile,
            idCard: undefined,
        };

        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "1" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: userWithoutIdCard } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("-")).toBeInTheDocument();
        });
    });

    it("refetches profile after successful save", async () => {
        mockUseAuth.mockReturnValue({
            state: { status: "authenticated", user: { id: "1" } },
        } as any);
        spyGetProfile.mockResolvedValue({ data: mockProfile } as any);
        spyApiGet.mockResolvedValue({ data: [] } as any);
        spyUpdateUser.mockResolvedValue({ data: { success: true } } as any);

        render(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("testuser")).toBeInTheDocument();
        });

        // First fetch on mount
        expect(spyGetProfile).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTitle("Edit Profile"));
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => {
            // Second fetch after save (onSave = fetchProfile)
            expect(spyGetProfile).toHaveBeenCalledTimes(2);
        });
    });
});
