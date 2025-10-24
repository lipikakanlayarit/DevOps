import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminEventPermission from "./admin-permission";
import { BrowserRouter } from "react-router-dom";

// 🧱 Mock child components ที่ไม่ต้องทดสอบจริง
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));
vi.mock("@/components/SearchBar", () => ({
    default: ({ value, onChange }: any) => (
        <input
            data-testid="searchbar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search events..."
        />
    ),
}));
vi.mock("@/components/CategoryRadio", () => ({
    default: ({ options, value, onChange }: any) => (
        <div data-testid="category-radio">
            {options.map((o: any) => (
                <label key={o.value}>
                    <input
                        type="radio"
                        checked={value === o.value}
                        onChange={() => onChange(o.value)}
                    />
                    {o.label}
                </label>
            ))}
        </div>
    ),
}));
vi.mock("@/components/AuthImage", () => ({
    default: ({ alt }: any) => <img data-testid="auth-image" alt={alt} />,
}));

// 🧩 Mock API
vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));
import { api } from "@/lib/api";

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe("AdminEventPermission", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ============  Render basic structure ============
    it("renders header, sidebar, and table structure", async () => {
        (api.get as any).mockResolvedValue({ data: [] });
        render(<AdminEventPermission />, { wrapper: Wrapper });

        expect(await screen.findByTestId("sidebar")).toBeInTheDocument();
        expect(await screen.findByText(/Event Permission/i)).toBeInTheDocument();
        expect(await screen.findByTestId("searchbar")).toBeInTheDocument();
    });

    // ============ Filter by status ============
    it("changes status filter using CategoryRadio", async () => {
        (api.get as any).mockResolvedValue({ data: [] });
        render(<AdminEventPermission />, { wrapper: Wrapper });

        const radios = await screen.findAllByRole("radio");
        fireEvent.click(radios[1]); // "Pending"
        expect(radios[1]).toBeChecked();
    });

    // ============  Search bar filter ============
    it("filters events with search input", async () => {
        (api.get as any).mockResolvedValue({
            data: [
                { id: 1, eventName: "Jazz Fest", categoryId: 1, status: "PENDING" },
                { id: 2, eventName: "Art Expo", categoryId: 3, status: "APPROVED" },
            ],
        });
        render(<AdminEventPermission />, { wrapper: Wrapper });

        const input = await screen.findByTestId("searchbar");
        fireEvent.change(input, { target: { value: "Jazz" } });

        await waitFor(() => {
            expect(screen.getByText(/Jazz Fest/i)).toBeInTheDocument();
        });
    });

    // ============ Open detail modal ============
    it("opens and closes Event Detail modal", async () => {
        (api.get as any).mockResolvedValue({
            data: [
                {
                    id: 1,
                    eventName: "Tech Conference",
                    categoryId: 2,
                    organizer: "Tech Org",
                    status: "APPROVED",
                },
            ],
        });
        render(<AdminEventPermission />, { wrapper: Wrapper });

        const row = await screen.findByText(/Tech Conference/i);
        fireEvent.click(row);

        expect(await screen.findByText(/Event Description/i)).toBeInTheDocument();

        const closeBtn = screen.getAllByText(/Close/i)[0];
        fireEvent.click(closeBtn);

        await waitFor(() =>
            expect(screen.queryByText(/Event Description/i)).not.toBeInTheDocument()
        );
    });
});
