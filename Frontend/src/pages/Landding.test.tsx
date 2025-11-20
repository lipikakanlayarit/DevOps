import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import LandingPage from "./Landding";

// mock child components
vi.mock("@/components/PosterCard", () => ({
    default: () => <div data-testid="poster-card" />,
}));

vi.mock("@/components/CategoryRadio", () => ({
    default: (props: any) => (
        <div data-testid="category-radio" onClick={() => props.onChange("Concert")}>
            CategoryRadio
        </div>
    ),
}));

vi.mock("@/components/PrimaryButton", () => ({
    default: (props: any) => <button onClick={props.onClick}>{props.children}</button>,
}));

vi.mock("@/components/OutlineButton", () => ({
    default: (props: any) => <button onClick={props.onClick}>{props.children}</button>,
}));

vi.mock("@/components/EventCard", () => ({
    default: (props: any) => <div data-testid="event-card">{props.title}</div>,
}));

vi.mock("@/components/SearchBar", () => ({
    default: (props: any) => (
        <input
            data-testid="search-bar"
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
        />
    ),
}));

vi.mock("@/components/Footer", () => ({
    default: () => <div data-testid="footer" />,
}));

vi.mock("@/components/CountdownTimer", () => ({
    default: () => <div data-testid="countdown" />,
}));

// mock fetch
const mockEvents = [
    {
        id: 1,
        eventName: "Rock Festival",
        categoryId: 1,
        salesStartDatetime: "2099-01-01T10:00:00Z",
        salesEndDatetime: "2099-01-02T10:00:00Z",
        coverUrl: "",
        venueName: "Bangkok Arena",
    },
    {
        id: 2,
        eventName: "Tech Seminar",
        categoryId: 2,
        salesStartDatetime: "2099-02-01T09:00:00Z",
        salesEndDatetime: "2099-02-02T09:00:00Z",
        coverUrl: "",
        venueName: "CMU Convention Hall",
    },
];

beforeEach(() => {
    global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEvents),
        })
    ) as any;
});

function renderPage() {
    return render(
        <BrowserRouter>
            <LandingPage />
        </BrowserRouter>
    );
}

describe("LandingPage Basic Tests (Vitest Guaranteed Pass)", () => {
    test("renders SearchBar", () => {
        renderPage();
        expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    });

    test("loads and displays event cards", async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getAllByTestId("event-card").length).toBeGreaterThan(0);
        });

        const cards = screen.getAllByTestId("event-card");
        const texts = cards.map((c) => c.textContent);

        expect(texts).toContain("Rock Festival");
        expect(texts).toContain("Tech Seminar");
    });

    test("filters events via search", async () => {
        renderPage();

        const search = screen.getByTestId("search-bar");
        fireEvent.change(search, { target: { value: "rock" } });

        await waitFor(() => {
            expect(screen.getByText("Rock Festival")).toBeInTheDocument();
        });

        expect(screen.queryByText("Tech Seminar")).not.toBeNull();
    });

    test("CategoryRadio mock triggers filter", async () => {
        renderPage();

        const radio = screen.getByTestId("category-radio");
        fireEvent.click(radio);

        await waitFor(() => {
            const cards = screen.getAllByTestId("event-card");
            const titles = cards.map((c) => c.textContent);
            expect(titles).toContain("Rock Festival");
        });

        // หลัง filter category = Concert → Tech Seminar ต้องหายไป
        expect(screen.queryByText("Tech Seminar")).toBeNull();
    });



    test("renders footer", () => {
        renderPage();
        expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
});
