import { FormEvent, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";

export default function Login() {
  const { loginViaBackend } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginViaBackend(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold">Log in</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm font-medium">Username</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            placeholder="USER / ADMIN / ORGANIZER"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            placeholder="anything"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Tip: พิมพ์ USER / ADMIN / ORGANIZER เพื่อจำลอง role (backend mock)
        </p>
      </form>
    </div>
  );
}