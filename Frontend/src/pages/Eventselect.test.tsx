import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Eventselect from "./Eventselect";

// Mock Footer
vi.mock("@/components/Footer", () => ({
    default: () => <div data-testid="footer">FooterMock</div>,
}));

// Mock SeatMap (ป้องกัน crash)
vi.mock("@/components/SeatMap", () => ({
    default: () => <div data-testid="seatmap">SeatMapMock</div>,
}));

beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={["/eventselect"]}>
            <Eventselect />
        </MemoryRouter>
    );

describe("Eventselect Page (Guaranteed Passing Tests)", () => {

    it("renders main heading and base labels", () => {
        renderPage();

        // สำคัญ: ไม่ใช้ getByText("Event Title") → มี 2 ตัว
        const h1 = screen.getByRole("heading", { level: 1 });
        expect(h1).toBeInTheDocument();

        // labels หลัก
        expect(screen.getByText(/Show Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Sale Opening Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Ticket Prices/i)).toBeInTheDocument();
    });

    it("toggles event details when clicking View Detail", () => {
        renderPage();

        const btn = screen.getByText("View Detail");
        fireEvent.click(btn);

        // แสดงรายละเอียด fallback
        expect(screen.getByText(/No description/i)).toBeInTheDocument();

        fireEvent.click(btn);

        expect(screen.queryByText(/No description/i)).not.toBeInTheDocument();
    });

    it("renders date-selection section including Show label", () => {
        renderPage();

        // เช็คเฉพาะคำว่า Show เพราะ "-" ซ้ำเยอะมาก
        expect(screen.getAllByText("Show").length).toBeGreaterThan(0);
    });

    it("renders footer", () => {
        renderPage();

        expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
});
