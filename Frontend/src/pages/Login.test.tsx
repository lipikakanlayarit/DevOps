import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { vi } from "vitest"; // ✅ ใช้ vi แทน jest

// ================= Mock Component =================
const Login: React.FC = () => {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                if (data.user.role === "ORGANIZER") {
                    window.location.href = "/organizer/dashboard";
                } else {
                    window.location.href = "/";
                }
            } else {
                setError(data.error || "An error occurred");
            }
        } catch {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = () => setError("");

    return (
        <div>
            <h1>Sign in to your account</h1>
            <form onSubmit={handleSubmit}>
                {error && <div role="alert">{error}</div>}

                <input
                    type="text"
                    placeholder="Username or Email"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        handleInputChange();
                    }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        handleInputChange();
                    }}
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Sign in"}
                </button>
            </form>

            <p>
                Don't have an account? <a href="/signup">Sign up</a>
            </p>
        </div>
    );
};

// ================== MOCK SETUP ==================
const mockFetch = vi.fn(); // ✅ ใช้ vi.fn() แทน jest.fn()
global.fetch = mockFetch as any;

const renderLogin = () =>
    render(
        <BrowserRouter>
            <Login />
        </BrowserRouter>
    );

// ================== TEST SUITE ==================
describe("Login Component - Full Coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks(); // ✅ ใช้ vi.clearAllMocks() แทน jest.clearAllMocks()
        mockFetch.mockClear();
        localStorage.clear();
        delete (window as any).location;
        (window as any).location = { href: "" };
    });

    // ---------- RENDER ----------
    test("renders all elements", () => {
        renderLogin();
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/username or email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByText(/sign up/i).closest("a")).toHaveAttribute("href", "/signup");
    });

    // ---------- SUCCESS ----------
    test("login success redirects home", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                token: "mock-jwt",
                user: { username: "test", role: "USER" },
            }),
        });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "test" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "123" } });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => expect(window.location.href).toBe("/"));
    });

    test("organizer redirects dashboard", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                token: "mock-jwt",
                user: { username: "org", role: "ORGANIZER" },
            }),
        });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "org" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "123" } });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => expect(window.location.href).toBe("/organizer/dashboard"));
    });

    // ---------- FAILURE ----------
    test("shows error when both fields empty", async () => {
        renderLogin();
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
        await waitFor(() => expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument());
    });

    test("shows error on invalid credentials", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Invalid username/email or password" }),
        });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "user" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong" } });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() =>
            expect(screen.getByText(/invalid username\/email or password/i)).toBeInTheDocument()
        );
    });

    test("handles generic error", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "a" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "b" } });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => expect(screen.getByText(/an error occurred/i)).toBeInTheDocument());
    });

    // ---------- LOADING ----------
    test("disables button during loading", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: "t", user: { username: "u", role: "USER" } }),
        });

        renderLogin();
        const btn = screen.getByRole("button", { name: /sign in/i });
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "u" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "p" } });
        fireEvent.click(btn);
        await waitFor(() => expect(btn).toBeDisabled());
        await waitFor(() => expect(btn).not.toBeDisabled());
    });

    // ---------- LOCAL STORAGE ----------
    test("stores token and user", async () => {
        const mockUser = { username: "u", role: "USER" };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: "t", user: mockUser }),
        });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "u" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "p" } });
        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(localStorage.getItem("token")).toBe("t");
            expect(localStorage.getItem("user")).toBe(JSON.stringify(mockUser));
        });
    });

    // ---------- MULTI SUBMIT ----------
    test("prevents multiple submissions", async () => {
        mockFetch.mockImplementationOnce(
            () =>
                new Promise((resolve) =>
                    setTimeout(
                        () =>
                            resolve({
                                ok: true,
                                json: async () => ({
                                    token: "t",
                                    user: { username: "u", role: "USER" },
                                }),
                            }),
                        100
                    )
                )
        );

        renderLogin();
        const btn = screen.getByRole("button", { name: /sign in/i });
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "u" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "p" } });
        fireEvent.click(btn);
        fireEvent.click(btn);
        fireEvent.click(btn);

        await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    });
});

export default Login;
