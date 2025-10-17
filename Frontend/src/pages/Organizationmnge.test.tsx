import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Organizationmnge from "./Organizationmnge";
import { MemoryRouter } from "react-router-dom";

// 🧩 Mock dependencies ที่ใช้ใน component
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
    },
}));
import { api } from "@/lib/api";

vi.mock("@/components/SearchBar", () => ({
    default: ({ placeholder }: { placeholder: string }) => (
        <input data-testid="SearchBar" placeholder={placeholder} />
    ),
}));
vi.mock("@/components/OrderToggle", () => ({
    default: ({ value }: { value: string }) => (
        <div data-testid="OrderToggle">Order: {value}</div>
    ),
}));
vi.mock("@/components/CategoryRadio", () => ({
    default: ({ value }: { value: string }) => (
        <div data-testid="CategoryRadio">Category: {value}</div>
    ),
}));
vi.mock("@/components/PrimaryButton", () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <button data-testid="PrimaryButton">{children}</button>
    ),
}));
vi.mock("lucide-react", () => ({
    Plus: () => <span data-testid="PlusIcon">+</span>,
}));

// 🧩 Mock useLocation
vi.mock("react-router-dom", async (orig) => {
    const actual = await orig();
    return {
        ...actual,
        useLocation: () => ({ state: { flash: "Success message" }, pathname: "/org" }),
    };
});

// reset mock ก่อนทุก test
beforeEach(() => {
    vi.clearAllMocks();
});

// Helper function render ภายใน MemoryRouter (เพราะใช้ react-router)
const renderPage = () =>
    render(
        <MemoryRouter>
            <Organizationmnge />
        </MemoryRouter>
    );

describe("🏢 Organizationmnge Page", () => {
    it("renders loading state correctly", async () => {
        (api.get as any).mockResolvedValueOnce({ data: [] });

        renderPage();

        // ใช้ getByText แทน findByText เพราะข้อความอยู่ทันทีใน DOM ตอนแรก
        expect(screen.getByText("Loading events...")).toBeInTheDocument();

        // รอให้ state เปลี่ยน (setLoading(false))
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith("/events/mine");
        });
    });

    it("renders empty state with flash message and create button", async () => {
        (api.get as any).mockResolvedValueOnce({ data: [] });
        renderPage();

        await waitFor(() => {
            expect(screen.getByText("Success message")).toBeInTheDocument();
        });

        expect(screen.getByTestId("CategoryRadio")).toHaveTextContent("Category: all");
        expect(screen.getByTestId("OrderToggle")).toHaveTextContent("Order: newest");
        expect(screen.getByTestId("SearchBar")).toBeInTheDocument();
        expect(screen.getByTestId("PrimaryButton")).toHaveTextContent("Create Event");
    });

    it("renders event table when data exists", async () => {
        (api.get as any).mockResolvedValueOnce({
            data: [
                {
                    id: 1,
                    name: "My Concert",
                    categoryId: "concert",
                    status: "APPROVED",
                    updatedAt: "2025-10-10T00:00:00Z",
                },
                {
                    id: 2,
                    name: "Rejected Seminar",
                    categoryId: "seminar",
                    status: "REJECTED",
                    updatedAt: "2025-09-09T00:00:00Z",
                },
            ],
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText("All Event")).toBeInTheDocument();
        });

        expect(screen.getByText("My Concert")).toBeInTheDocument();
        expect(screen.getByText("Rejected Seminar")).toBeInTheDocument();

        // ตรวจ badge
        expect(screen.getByText("Approved")).toBeInTheDocument();
        expect(screen.getByText("Rejected")).toBeInTheDocument();

        // ตรวจ UI element หลัก
        expect(screen.getByTestId("CategoryRadio")).toHaveTextContent("Category: all");
        expect(screen.getByTestId("OrderToggle")).toHaveTextContent("Order: newest");
        expect(screen.getAllByTestId("SearchBar")).toHaveLength(1);
        expect(screen.getAllByTestId("PrimaryButton")[0]).toHaveTextContent("Create Event");
    });

    it("handles API error gracefully and shows empty state", async () => {
        (api.get as any).mockRejectedValueOnce(new Error("Network error"));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText("Create Event")).toBeInTheDocument();
        });
    });
});
