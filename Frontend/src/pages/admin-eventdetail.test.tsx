// ✅ src/pages/admin-eventdetail.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import AdminEventdetail from "./admin-eventdetail";

// 🧩 Mock Dependencies
vi.mock("react-router-dom", async () => ({
    ...(await vi.importActual("react-router-dom")),
    useLocation: () => ({ search: "?id=1" }),
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

vi.mock("@/components/sidebar", () => ({
    __esModule: true,
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("@/components/SearchBar", () => ({
    __esModule: true,
    default: ({ value, onChange }: any) => (
        <input
            data-testid="search-bar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

vi.mock("@/components/CategoryRadio", () => ({
    __esModule: true,
    default: ({ value, onChange }: any) => (
        <div data-testid="category-radio" onClick={() => onChange("sold")}>
            Radio-{value}
        </div>
    ),
}));

vi.mock("@/components/OutlineButton", () => ({
    __esModule: true,
    default: ({ children, ...props }: any) => (
        <button {...props}>{children}</button>
    ),
}));

vi.mock("@/components/AuthImage", () => ({
    __esModule: true,
    default: ({ alt }: any) => <img data-testid="auth-image" alt={alt} />,
}));

vi.mock("@/lib/api", () => ({
    api: {
        get: vi.fn((url: string) => {
            if (url.includes("/admin/events/1")) {
                return Promise.resolve({
                    data: {
                        id: 1,
                        eventName: "Test Event",
                        organizerName: "Mock Org",
                        categoryId: 1,
                        venueName: "Bangkok Hall",
                        startDateTime: "2025-01-01T12:00:00Z",
                        endDateTime: "2025-01-02T12:00:00Z",
                    },
                });
            }
            if (url.includes("/zones"))
                return Promise.resolve({
                    data: [{ zone: "A", row: 5, column: 10, sale: "10/50", price: "500" }],
                });
            if (url.includes("/seat-stats"))
                return Promise.resolve({
                    data: { total: 50, sold: 10, reserved: 5, available: 35 },
                });
            if (url.includes("/reservations"))
                return Promise.resolve({
                    data: [
                        {
                            id: "R001",
                            seat_label: "A1",
                            total: 500,
                            user: "John",
                            status: "PAID",
                            date: "2025-01-01T12:00:00Z",
                            payment_method: "Credit Card",
                        },
                    ],
                });
            return Promise.resolve({ data: [] });
        }),
    },
}));

// ===============================================================
// 🧪 TEST CASES
// ===============================================================
describe("AdminEventdetail Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders sidebar and header", async () => {
        render(<AdminEventdetail />);

        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        expect(await screen.findByText("Event Management")).toBeInTheDocument();
    });

    it("fetches and displays event data", async () => {
        render(<AdminEventdetail />);

        expect(await screen.findByText("Test Event")).toBeInTheDocument();
        expect(await screen.findByText("Mock Org")).toBeInTheDocument();
        expect(await screen.findByText("Bangkok Hall")).toBeInTheDocument();
    });



    it("filters reservations when category clicked", async () => {
        render(<AdminEventdetail />);
        const radio = await screen.findByTestId("category-radio");
        fireEvent.click(radio);
        expect(radio.textContent).toContain("sold");
    });

    it("opens and closes detail modal", async () => {
        render(<AdminEventdetail />);
        const detailBtn = await screen.findByText("Event detail");
        fireEvent.click(detailBtn);
        await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });
        const close = screen.getAllByText("Close")[0];
        fireEvent.click(close);
        await waitFor(() => {
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });
});
