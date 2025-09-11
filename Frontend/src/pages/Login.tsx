import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log("Login attempt:", { email, password });
    }, 1200);
  };

  return (
    <div className="h-[calc(100svh-60px)] min-h-[calc(100svh-60px)] flex items-center justify-center bg-gradient-to-br from-[#1D1D1D] via-[#2a1a1a] to-[#FA3A2B] px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#DBDBDB]/8 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-[#FA3A2B]/15 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute top-1/3 right-10 w-20 h-20 bg-white/8 rounded-full blur-lg animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/3 left-5 w-12 h-12 bg-[#DBDBDB]/15 rounded-full blur-md animate-bounce delay-500"></div>

      <div className="w-full max-w-sm bg-[#DBDBDB]/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden transition-all duration-300 border border-white/20">
        {/* Header */}
        <div className="relative text-[#FA3A2B] py-6 px-6 text-center border-b border-[#1D1D1D]/20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FA3A2B]/5 to-transparent"></div>
          <div className="relative">
            <div className="inline-block p-3 rounded-full bg-[#FA3A2B]/10 mb-3 transition-transform duration-300">
              <svg
                className="w-6 h-6 text-[#FA3A2B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-wider">LOG IN</h1>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-[#FA3A2B] to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-bold text-[#1D1D1D] mb-2 transition-colors duration-300 group-focus-within:text-[#FA3A2B] flex items-center">
                <svg
                  className="w-4 h-4 mr-2 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-[#1D1D1D]/20 rounded-lg focus:outline-none focus:border-[#FA3A2B] focus:ring-2 focus:ring-[#FA3A2B]/20 bg-white/90 text-[#1D1D1D] placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-sm font-bold text-[#1D1D1D] mb-2 transition-colors duration-300 group-focus-within:text-[#FA3A2B] flex items-center">
                <svg
                  className="w-4 h-4 mr-2 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-[#1D1D1D]/20 rounded-lg focus:outline-none focus:border-[#FA3A2B] focus:ring-2 focus:ring-[#FA3A2B]/20 bg-white/90 text-[#1D1D1D] placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full bg-gradient-to-r from-[#FA3A2B] to-[#e13427] text-white font-bold py-3 rounded-lg hover:from-[#e13427] hover:to-[#FA3A2B] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="animate-pulse">Signing in...</span>
                  </>
                ) : (
                  <>
                    Log In
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-[#DBDBDB]/80 to-[#DBDBDB] px-5 py-3 text-center border-t border-[#1D1D1D]/10 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-3">
            <div className="flex-1 border-t border-[#1D1D1D]/20"></div>
            <span className="px-3 text-xs font-medium text-[#1D1D1D]/60 uppercase tracking-wide">
              New Here?
            </span>
            <div className="flex-1 border-t border-[#1D1D1D]/20"></div>
          </div>

          <p className="text-sm text-[#1D1D1D]/80">
            Don't have an account?{" "}
            <a
              href="/signin"
              className="font-bold text-[#FA3A2B] hover:text-[#e13427] hover:underline transition-all duration-200 relative inline-block group"
            >
              Sign up
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FA3A2B] group-hover:w-full transition-all duration-300"></span>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
