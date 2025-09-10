import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log("Login attempt:", { email, password });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1D1D1D] to-[#a20f04] from-[50%] to-[100%] px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-lg border border-[#1D1D1D]/20">
        {/* Header */}
        <div className="text-[#FA3A2B] py-6 px-8 text-center ">
          <h1 className="text-3xl font-extrabold tracking-wide">LOG IN</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-30 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#1D1D1D] mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-[#1D1D1D]/30 focus:outline-none focus:ring-2 focus:ring-[#FA3A2B] text-[#1D1D1D]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1D1D1D] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-[#1D1D1D]/30 focus:outline-none focus:ring-2 focus:ring-[#FA3A2B] text-[#1D1D1D]"
              required
            />
          </div>

          {/* Big Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1D1D1D] text-white py-4 text-lg font-medium hover:bg-[#FA3A2B] transition-colors"
          >
            {isLoading ? "Signing in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
