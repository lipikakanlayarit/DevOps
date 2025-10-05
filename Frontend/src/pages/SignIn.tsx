import { useState } from "react";

type SignUpValues = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    idCard: string;
    username: string;
};

type Errors = Partial<Record<keyof SignUpValues, string>>;

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";

export default function SignUp() {
    const [form, setForm] = useState<SignUpValues>({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        idCard: "",
        username: "",
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [serverError, setServerError] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setServerError("");
    };

    const validate = (v: SignUpValues): Errors => {
        const errs: Errors = {};

        if (!v.email.trim()) errs.email = "กรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
            errs.email = "รูปแบบอีเมลไม่ถูกต้อง";

        if (!v.password) errs.password = "กรอกรหัสผ่าน";
        else if (v.password.length < 8)
            errs.password = "อย่างน้อย 8 ตัวอักษร";
        else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password))
            errs.password = "ต้องมีทั้งตัวอักษรและตัวเลข";

        if (!v.firstName.trim()) errs.firstName = "กรอกชื่อจริง";
        if (!v.lastName.trim()) errs.lastName = "กรอกนามสกุล";

        if (!v.username.trim()) errs.username = "กรอกชื่อผู้ใช้";
        else if (!/^[a-zA-Z0-9_]{4,20}$/.test(v.username))
            errs.username = "4–20 ตัวอักษร (a–z, 0–9, _)";

        if (!v.phoneNumber.trim()) errs.phoneNumber = "กรอกเบอร์โทร";
        else if (!/^\d{9,15}$/.test(v.phoneNumber))
            errs.phoneNumber = "กรอกเป็นตัวเลข 9–15 หลัก";

        if (!v.idCard.trim()) errs.idCard = "กรอกเลขบัตรประชาชน";
        else if (!/^\d{13}$/.test(v.idCard))
            errs.idCard = "เลขบัตรต้องมี 13 หลัก";

        return errs;
    };

    async function postJSON(url: string, data: any) {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(data),
        });
        const text = await res.text();
        let json: any = undefined;
        try {
            json = text ? JSON.parse(text) : undefined;
        } catch {
            /* keep text */
        }

        if (!res.ok) {
            const msg = json?.error || json?.message || text || `HTTP ${res.status}`;
            throw new Error(msg);
        }
        return json;
    }

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        const errs = validate(form);
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        setIsLoading(true);
        setServerError("");
        try {
            const payload = {
                email: form.email.trim(),
                username: form.username.trim(),
                password: form.password,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phoneNumber: form.phoneNumber.trim(),
                idCard: form.idCard.trim(),
            };

            await postJSON(`${API_BASE}/api/auth/signup`, payload);

            alert("สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ");
            window.location.href = "/login";
        } catch (err: any) {
            setServerError(err?.message || "สมัครไม่สำเร็จ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100svh-60px)] flex items-center justify-center bg-gradient-to-br from-[#1D1D1D] via-[#2a1a1a] to-[#FA3A2B] px-4 py-4 relative overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#DBDBDB]/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-[#FA3A2B]/20 rounded-full blur-xl animate-bounce" />
            <div className="absolute top-1/3 right-10 w-16 h-16 bg-[#DBDBDB]/8 rounded-full blur-xl animate-ping" />
            <div className="absolute bottom-1/3 left-20 w-20 h-20 bg-[#FA3A2B]/15 rounded-full blur-xl animate-pulse delay-1000" />

            <div className="w-full max-w-md bg-[#DBDBDB]/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/30">
                <div className="relative bg-gradient-to-r from-[#FA3A2B]/5 to-[#FA3A2B]/10 text-[#FA3A2B] py-4 px-6 text-center border-b border-[#1D1D1D]/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <h1 className="relative text-2xl font-black tracking-wider drop-shadow-sm">
                        SIGN UP
                    </h1>
                    <p className="relative text-xs text-[#1D1D1D]/60 mt-1 font-medium">
                        สร้างบัญชีใหม่ของคุณ
                    </p>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-[#FA3A2B] to-transparent" />
                </div>

                <div className="px-6 py-5">
                    {serverError && (
                        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3" noValidate>
                        <div className="group">
                            <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
                  ${errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                                    : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
                  focus:outline-none focus:ring-2`}
                                required
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPwd ? "text" : "password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="อย่างน้อย 8 ตัวอักษร"
                                    className={`w-full px-3 py-2.5 pr-10 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
                    ${errors.password ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                                        : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
                    focus:outline-none focus:ring-2`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((s) => !s)}
                                    className="absolute inset-y-0 right-3 flex items-center text-[#1D1D1D]/70 hover:text-[#FA3A2B] transition-colors duration-200"
                                >
                                    {showPwd ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="group">
                                <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                    First Name
                                </label>
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] transition-all duration-200 text-sm
                    ${errors.firstName ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                                        : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
                    focus:outline-none focus:ring-2`}
                                    required
                                />
                                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                    Last Name
                                </label>
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] transition-all duration-200 text-sm
                    ${errors.lastName ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                                        : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
                    focus:outline-none focus:ring-2`}
                                    required
                                />
                                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                Username
                            </label>
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="a–z, 0–9, _ (4–20 ตัว)"
                                className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
                  ${errors.username ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                                    : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
                  focus:outline-none focus:ring-2`}
                                required
                            />
                            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="group">
                                <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                    Phone
                                </label>
                                <input
                                    name="phoneNumber"
                                    inputMode="numeric"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="0812345678"
                                    className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
                    ${errors.phoneNumber ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                                        : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
                    focus:outline-none focus:ring-2`}
                                    required
                                />
                                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                    ID Card
                                </label>
                                <input
                                    name="idCard"
                                    inputMode="numeric"
                                    value={form.idCard}
                                    onChange={handleChange}
                                    placeholder="13 หลัก"
                                    className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
                    ${errors.idCard ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                                        : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
                    focus:outline-none focus:ring-2`}
                                    required
                                />
                                {errors.idCard && <p className="mt-1 text-xs text-red-600">{errors.idCard}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-3 relative w-full bg-gradient-to-r from-[#FA3A2B] to-[#e13427] text-white font-black py-3 rounded-lg hover:from-[#e13427] hover:to-[#FA3A2B] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#FA3A2B]/20 overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            <div className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span className="text-sm">Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm tracking-wide">Create Account</span>
                                    </>
                                )}
                            </div>
                        </button>

                        <div className="text-center mt-3 p-3 rounded-lg bg-gradient-to-r from-[#1D1D1D]/5 to-[#FA3A2B]/5">
                            <p className="text-xs text-[#1D1D1D]/80">
                                มีบัญชีแล้ว?{" "}
                                <a href="/login" className="font-bold text-[#FA3A2B] hover:text-[#e13427] hover:underline transition-colors duration-200">
                                    Log in →
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}