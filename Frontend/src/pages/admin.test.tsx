import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import EventPermissionPage from "./admin-permission";

// 🧠 Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 🧩 Mock Sidebar
vi.mock("@/components/sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));

// 🧩 Mock EventToolbar
vi.mock("@/components/EventToolbar", () => ({
    default: ({
                  categories,
                  category,
                  onCategoryChange,
                  order,
                  onOrderChange,
                  search,
                  onSearchChange,
              }: any) => (
        <div data-testid="event-toolbar">
            <select
                data-testid="category-select"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
            >
                {categories.map((cat: any) => (
                    <option key={cat.value} value={cat.value}>
                        {cat.label}
                    </option>
                ))}
            </select>
            <select
                data-testid="order-select"
                value={order}
                onChange={(e) => onOrderChange(e.target.value)}
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
            </select>
            <input
                data-testid="search-input"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
            />
        </div>
    ),
}));

// 🧩 Mock Badge
vi.mock("@/components/badge", () => ({
    Badge: ({ children, className }: any) => (
        <span data-testid="badge" className={className}>
      {children}
    </span>
    ),
}));

// 🧱 Wrapper
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe("EventPermissionPage", () => {
    const TIMEOUT = 15000;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    // ---------- Rendering ----------
    describe("Rendering", () => {
        beforeEach(() => {
            // ✅ fetch mock แบบไม่หน่วง ใช้กับ rendering ปกติ
            vi.stubGlobal(
                "fetch",
                vi.fn(() =>
                    Promise.resolve({
                        json: () =>
                            Promise.resolve([
                                {
                                    id: "evt_1",
                                    title: "ROBERT BALTAZAR TRIO",
                                    status: "ON SALE",
                                },
                            ]),
                    })
                )
            );
        });

        it(
            "renders page title correctly",
            async () => {
                render(<EventPermissionPage />, { wrapper: Wrapper });
                expect(await screen.findByText(/Event\s*Permission/i)).toBeDefined();
            },
            TIMEOUT
        );

        it(
            "renders sidebar",
            async () => {
                render(<EventPermissionPage />, { wrapper: Wrapper });
                expect(await screen.findByTestId("sidebar")).toBeDefined();
            },
            TIMEOUT
        );
    });
});
