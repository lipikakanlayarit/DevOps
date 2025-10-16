import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Login from "./Login";

/* ==========================================================
   MOCK DEPENDENCIES
========================================================== */
const mockNavigate = vi.fn();
const mockLoginViaBackend = vi.fn();
const mockUseAuth = vi.fn();

let mockReturnTo: string | null = null;

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams(mockReturnTo ? `returnTo=${mockReturnTo}` : "")],
    };
});

vi.mock("@/features/auth/AuthContext", () => ({
    useAuth: () => ({
        state: mockUseAuth(),
        loginViaBackend: mockLoginViaBackend,
    }),
}));

const renderLogin = () =>
    render(
        <BrowserRouter>
            <Login />
        </BrowserRouter>
    );

/* ==========================================================
   TEST SUITE
========================================================== */
describe("Login Page Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReturnTo = null;
    });

    /* ---------- RENDER ---------- */
    test("renders login form correctly", () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        renderLogin();

        expect(screen.getByText(/log in/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/username or email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    /* ---------- VALIDATION ---------- */
    test("shows error when username or password missing", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        renderLogin();

        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText(/กรุณากรอกข้อมูลให้ครบ/i)).toBeInTheDocument();
        });
    });

    /* ---------- LOGIN SUCCESS ---------- */
    test("redirects to profile for USER", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockResolvedValueOnce({ role: "USER" });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "user1" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "password" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockLoginViaBackend).toHaveBeenCalledWith("user1", "password");
            expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true });
        });
    });

    test("redirects to /admin for ADMIN", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockResolvedValueOnce({ role: "ADMIN" });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "admin" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "password" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
        });
    });

    test("redirects to /organizationmnge for ORGANIZER", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockResolvedValueOnce({ role: "ORGANIZER" });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "org" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "password" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/organizationmnge", { replace: true });
        });
    });

    /* ---------- RETURN TO PARAM ---------- */
    test("redirects to custom returnTo path if provided", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockResolvedValueOnce({ role: "USER" });
        mockReturnTo = "/dashboard";

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "user" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "pass" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
        });
    });

    /* ---------- AUTO REDIRECT ---------- */
    test("auto redirects when already authenticated", async () => {
        mockUseAuth.mockReturnValue({ status: "authenticated" });
        renderLogin();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
        });
    });

    /* ---------- ERROR HANDLING ---------- */
    test("shows error when backend throws with message", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockRejectedValueOnce(new Error("Invalid credentials"));

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "x" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "y" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
    });

    test("shows default error when thrown object has no message", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockRejectedValueOnce({});

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "x" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "y" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText(/login failed/i)).toBeInTheDocument();
        });
    });

    /* ---------- LOADING STATE ---------- */
    test("disables submit button while loading", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockResolvedValueOnce({ role: "USER" });

        renderLogin();
        const btn = screen.getByRole("button", { name: /log in/i });
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "u" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "p" } });

        fireEvent.click(btn);
        expect(btn).toBeDisabled();

        await waitFor(() => expect(btn).not.toBeDisabled());
    });

    /* ---------- MULTI SUBMIT ---------- */
    test("prevents multiple submissions while loading", async () => {
        mockUseAuth.mockReturnValue({ status: "unauthenticated" });
        mockLoginViaBackend.mockResolvedValueOnce({ role: "USER" });

        renderLogin();
        const btn = screen.getByRole("button", { name: /log in/i });
        fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: "u" } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: "p" } });

        fireEvent.click(btn);
        fireEvent.click(btn);
        fireEvent.click(btn);

        await waitFor(() => {
            expect(mockLoginViaBackend).toHaveBeenCalledTimes(1);
        });
    });
});
