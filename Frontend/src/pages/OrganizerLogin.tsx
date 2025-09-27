import { useState } from "react";

type OrganizerSignUpValues = {
    email: string;
    username: string;
    password: string;          // backend จะ hash เป็น password_hash
    first_name: string;
    last_name: string;
    phone_number: string;
    address: string;
    company_name: string;
    tax_id: string;            // เลขผู้เสียภาษี (ไทยมัก 13 หลัก)
    verification_status: "PENDING" | "APPROVED" | "REJECTED";
};

type Errors = Partial<Record<keyof OrganizerSignUpValues, string>>;

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";

export default function OrganizerLogin() {
    const [form, setForm] = useState<OrganizerSignUpValues>({
        email: "",
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        address: "",
        company_name: "",
        tax_id: "",
        verification_status: "PENDING",
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [serverError, setServerError] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setServerError("");
    };

    const validate = (v: OrganizerSignUpValues): Errors => {
        const errs: Errors = {};

        // email
        if (!v.email.trim()) errs.email = "กรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
            errs.email = "รูปแบบอีเมลไม่ถูกต้อง";

        // username
        if (!v.username.trim()) errs.username = "กรอกชื่อผู้ใช้";
        else if (!/^[a-zA-Z0-9_]{4,20}$/.test(v.username))
            errs.username = "4–20 ตัว (a–z, 0–9, _)";

        // password
        if (!v.password) errs.password = "กรอกรหัสผ่าน";
        else if (v.password.length < 8) errs.password = "อย่างน้อย 8 ตัวอักษร";
        else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password))
            errs.password = "ต้องมีทั้งตัวอักษรและตัวเลข";

        // first/last name
        if (!v.first_name.trim()) errs.first_name = "กรอกชื่อจริง";
        if (!v.last_name.trim()) errs.last_name = "กรอกนามสกุล";

        // phone
        if (!v.phone_number.trim()) errs.phone_number = "กรอกเบอร์โทร";
        else if (!/^\d{9,15}$/.test(v.phone_number))
            errs.phone_number = "กรอกเป็นตัวเลข 9–15 หลัก";

        // address
        if (!v.address.trim()) errs.address = "กรอกที่อยู่ (สั้นเกินไป)";
        else if (v.address.trim().length < 8) errs.address = "ที่อยู่อย่างน้อย 8 ตัวอักษร";

        // company name
        if (!v.company_name.trim()) errs.company_name = "กรอกชื่อบริษัท/องค์กร";

        // tax_id (ไทยนิยม 13 หลัก)
        if (!v.tax_id.trim()) errs.tax_id = "กรอกเลขผู้เสียภาษี";
        else if (!/^\d{13}$/.test(v.tax_id))
            errs.tax_id = "เลขผู้เสียภาษีต้องมี 13 หลัก";

        // verification_status - ให้ default เป็น PENDING (ไม่ให้ผู้ใช้แก้)
        if (!v.verification_status) errs.verification_status = "สถานะเริ่มต้นต้องเป็น PENDING";

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
        try { json = text ? JSON.parse(text) : undefined; } catch { /* keep text */ }

        if (!res.ok) {
            const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
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
            // mapping: ส่ง password ไปให้ backend แฮชเป็น password_hash
            const payload = {
                email: form.email.trim(),
                username: form.username.trim(),
                password: form.password, // backend จะ hash
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone_number: form.phone_number.trim(),
                address: form.address.trim(),
                company_name: form.company_name.trim(),
                tax_id: form.tax_id.trim(),
                verification_status: form.verification_status, // ส่ง PENDING
            };

            // เปลี่ยน endpoint ให้ตรงกับแบ็กเอนด์ของคุณ
            // ตัวอย่าง: POST /api/organizers/signup
            const data = await postJSON(`${API_BASE}/api/organizers/signup`, payload);

            // สำเร็จ: พาไปหน้า login ของ organizer หรือหน้า /login
            alert("สมัคร Organizer สำเร็จ! โปรดเข้าสู่ระบบ");
            window.location.href = "/login"; // ปรับเป็น /organizer/login ถ้าคุณทำ route แยก
        } catch (err: any) {
            setServerError(err?.message || "สมัครไม่สำเร็จ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100svh-60px)] flex items-center justify-center bg-gradient-to-br from-[#1D1D1D] via-[#2a1a1a] to-[#FA3A2B] px-4 py-4 relative overflow-hidden">
            {/* background decorations */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#DBDBDB]/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-[#FA3A2B]/20 rounded-full blur-xl animate-bounce" />
            <div className="absolute top-1/3 right-10 w-16 h-16 bg-[#DBDBDB]/8 rounded-full blur-xl animate-ping" />
            <div className="absolute bottom-1/3 left-20 w-20 h-20 bg-[#FA3A2B]/15 rounded-full blur-xl animate-pulse delay-1000" />

            <div className="w-full max-w-xl bg-[#DBDBDB]/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/30">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#FA3A2B]/5 to-[#FA3A2B]/10 text-[#FA3A2B] py-4 px-6 text-center border-b border-[#1D1D1D]/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <h1 className="relative text-2xl font-black tracking-wider drop-shadow-sm">
                        ORGANIZER SIGN UP
                    </h1>
                    <p className="relative text-xs text-[#1D1D1D]/60 mt-1 font-medium">
                        สร้างบัญชีผู้จัดงานของคุณ (Organizer)
                    </p>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-[#FA3A2B] to-transparent" />
                </div>

                {/* Form */}
                <div className="px-6 py-5">
                    {serverError && (
                        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3" noValidate>
                        {/* email */}
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            error={errors.email}
                            placeholder="you@company.com"
                        />

                        {/* username & password */}
                        <div className="grid grid-cols-2 gap-3">
                            <TextField
                                label="Username"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                error={errors.username}
                                placeholder="a–z, 0–9, _ (4–20 ตัว)"
                            />
                            <PasswordField
                                label="Password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                error={errors.password}
                                showPwd={showPwd}
                                setShowPwd={setShowPwd}
                                placeholder="อย่างน้อย 8 ตัว มีตัวอักษร+ตัวเลข"
                            />
                        </div>

                        {/* name */}
                        <div className="grid grid-cols-2 gap-3">
                            <TextField
                                label="First Name"
                                name="first_name"
                                value={form.first_name}
                                onChange={handleChange}
                                error={errors.first_name}
                            />
                            <TextField
                                label="Last Name"
                                name="last_name"
                                value={form.last_name}
                                onChange={handleChange}
                                error={errors.last_name}
                            />
                        </div>

                        {/* phone & tax_id */}
                        <div className="grid grid-cols-2 gap-3">
                            <TextField
                                label="Phone"
                                name="phone_number"
                                inputMode="numeric"
                                value={form.phone_number}
                                onChange={handleChange}
                                error={errors.phone_number}
                                placeholder="0812345678"
                            />
                            <TextField
                                label="Tax ID"
                                name="tax_id"
                                inputMode="numeric"
                                value={form.tax_id}
                                onChange={handleChange}
                                error={errors.tax_id}
                                placeholder="13 หลัก"
                            />
                        </div>

                        {/* company & address */}
                        <TextField
                            label="Company / Organization"
                            name="company_name"
                            value={form.company_name}
                            onChange={handleChange}
                            error={errors.company_name}
                            placeholder="ชื่อบริษัท/หน่วยงาน"
                        />

                        <TextAreaField
                            label="Address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            error={errors.address}
                            placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                        />

                        {/* verification_status (lock เป็น PENDING) */}
                        <div className="group">
                            <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                                Verification Status
                            </label>
                            <input
                                name="verification_status"
                                value={form.verification_status}
                                readOnly
                                className="w-full px-3 py-2.5 rounded-lg border-2 bg-gray-100 text-[#1D1D1D]/70 border-[#1D1D1D]/20 cursor-not-allowed text-sm"
                            />
                            {errors.verification_status && (
                                <p className="mt-1 text-xs text-red-600">{errors.verification_status}</p>
                            )}
                            <p className="mt-1 text-[11px] text-[#1D1D1D]/60">
                                สถานะเริ่มต้นคือ <b>PENDING</b> รอแอดมินอนุมัติ
                            </p>
                        </div>

                        {/* submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 relative w-full bg-gradient-to-r from-[#FA3A2B] to-[#e13427] text-white font-black py-3 rounded-lg hover:from-[#e13427] hover:to-[#FA3A2B] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#FA3A2B]/20 overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            <div className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span className="text-sm">Creating organizer...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm tracking-wide">Create Organizer Account</span>
                                        <span>✨</span>
                                    </>
                                )}
                            </div>
                        </button>

                        {/* link to login */}
                        <div className="text-center mt-3 p-3 rounded-lg bg-gradient-to-r from-[#1D1D1D]/5 to-[#FA3A2B]/5">
                            <p className="text-xs text-[#1D1D1D]/80">
                                มีบัญชีแล้ว?{" "}
                                <a
                                    href="/login" /* หรือ /organizer/login ถ้าคุณทำ route แยก */
                                    className="font-bold text-[#FA3A2B] hover:text-[#e13427] hover:underline transition-colors duration-200"
                                >
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

/* ───────────────────── Reusable Field Components ───────────────────── */

type BaseProps = {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    error?: string;
    placeholder?: string;
    type?: string;
    inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
};

function TextField(props: BaseProps) {
    const { label, name, value, onChange, error, placeholder, type = "text", inputMode } = props;
    return (
        <div className="group">
            <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                {label}
            </label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type={type}
                inputMode={inputMode}
                className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
        ${error ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                    : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
        focus:outline-none focus:ring-2`}
                required
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function PasswordField({
                           label, name, value, onChange, error, placeholder, showPwd, setShowPwd,
                       }: BaseProps & { showPwd: boolean; setShowPwd: React.Dispatch<React.SetStateAction<boolean>>; }) {
    return (
        <div className="group">
            <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                {label}
            </label>
            <div className="relative">
                <input
                    name={name}
                    type={showPwd ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2.5 pr-10 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
            ${error ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                        : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
            focus:outline-none focus:ring-2`}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#1D1D1D]/70 hover:text-[#FA3A2B] transition-colors duration-200"
                    aria-label={showPwd ? "Hide password" : "Show password"}
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
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function TextAreaField(props: BaseProps) {
    const { label, name, value, onChange, error, placeholder } = props;
    return (
        <div className="group">
            <label className="block text-xs font-bold text-[#1D1D1D] mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#FA3A2B] rounded-full"></span>
                {label}
            </label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={3}
                className={`w-full px-3 py-2.5 rounded-lg border-2 bg-white/95 text-[#1D1D1D] placeholder-gray-400 transition-all duration-200 text-sm
        ${error ? "border-red-400 focus:border-red-500 focus:ring-red-200 shadow-md shadow-red-100"
                    : "border-[#1D1D1D]/20 focus:border-[#FA3A2B] focus:ring-[#FA3A2B]/20 shadow-sm"} 
        focus:outline-none focus:ring-2`}
                required
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
