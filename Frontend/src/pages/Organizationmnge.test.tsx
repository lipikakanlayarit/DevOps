import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Organizationmnge from "./Organizationmnge";
import { api } from "@/lib/api";

// ✅ mock API
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

// ✅ mock components ที่ไม่เกี่ยวกับ logic หลัก
vi.mock("@/components/SearchBar", () => ({
    default: ({ value, onChange }: any) => (
        <input
            data-testid="search-bar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

vi.mock("@/components/OrderToggle", () => ({
    default: ({ value, onChange }: any) => (
        <select
            data-testid="order-toggle"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
        </select>
    ),
}));

vi.mock("@/components/CategoryRadio", () => ({
    default: ({ value, onChange }: any) => (
        <select
            data-testid="category-radio"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="all">All</option>
            <option value="concert">Concert</option>
            <option value="seminar">Seminar</option>
            <option value="exhibition">Exhibition</option>
        </select>
    ),
}));

vi.mock("@/components/PrimaryButton", () => ({
    default: ({ children }: any) => <button>{children}</button>,
}));

// === ตัวอย่างข้อมูล mock ===
const mockEvents = [
    {
        id: 1,
        eventName: "Jazz Night",
        category: "concert",
        status: "APPROVED",
        updatedAt: "2025-10-10T00:00:00Z",
    },
    {
        id: 2,
        eventName: "Tech Seminar",
        category: "seminar",
        status: "PENDING",
        updatedAt: "2025-10-05T00:00:00Z",
    },
];

describe("Organizationmnge Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render loading state first", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockEvents });

        render(
            <MemoryRouter>
                <Organizationmnge />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading events.../i)).toBeInTheDocument();
        await waitFor(() => screen.getByText("Jazz Night"));
    });

    it("should display events from API", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockEvents });

        render(
            <MemoryRouter>
                <Organizationmnge />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Jazz Night")).toBeInTheDocument();
            expect(screen.getByText("Tech Seminar")).toBeInTheDocument();
        });
    });
    it("should filter by category", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockEvents });

        render(
            <MemoryRouter>
                <Organizationmnge />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText("Jazz Night"));
        const categorySelect = screen.getByTestId("category-radio");
        fireEvent.change(categorySelect, { target: { value: "concert" } });

        expect(screen.getByText("Jazz Night")).toBeInTheDocument();
        expect(screen.queryByText("Tech Seminar")).not.toBeInTheDocument();
    });

    it("should filter by search query", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockEvents });

        render(
            <MemoryRouter>
                <Organizationmnge />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText("Jazz Night"));

        const searchBar = screen.getByTestId("search-bar");
        fireEvent.change(searchBar, { target: { value: "Tech" } });

        expect(screen.getByText("Tech Seminar")).toBeInTheDocument();
        expect(screen.queryByText("Jazz Night")).not.toBeInTheDocument();
    });

    it("should toggle order newest → oldest", async () => {
        (api.get as any).mockResolvedValueOnce({ data: mockEvents });

        render(
            <MemoryRouter>
                <Organizationmnge />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText("Jazz Night"));
        const orderToggle = screen.getByTestId("order-toggle");
        fireEvent.change(orderToggle, { target: { value: "oldest" } });

        expect(orderToggle).toHaveValue("oldest");
    });
});
