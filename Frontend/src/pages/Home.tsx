// src/pages/Home.tsx
import PrimaryButton from "@/components/PrimaryButton";

export default function Home() {
    return (
        <main className="space-y-6 p-6">
            <div className="flex flex-wrap gap-3">
                {/* ไปหน้าแอดมินเดิม */}
                <PrimaryButton to="/events">Admin</PrimaryButton>

                {/* ไปหน้า component playground */}
                <PrimaryButton to="/component">Component</PrimaryButton>

                {/* ✅ ไปหน้า "Landing" ที่ดึงรายการอีเวนต์จาก API จริง */}
                <PrimaryButton to="/landing">Landing</PrimaryButton>

                {/* ❌ อย่าพาไป /eventselect ตรง ๆ โดยไม่มี id */}
                {/* <PrimaryButton to="/eventselect">eventselect</PrimaryButton> */}

                {/* ตัวอย่าง (ถ้าอยากทดสอบหน้า Eventselect โดยตรง ให้ใส่ id ที่มีจริง) */}
                {/* <PrimaryButton to="/eventselect/1">Eventselect (id=1)</PrimaryButton> */}

                <PrimaryButton to="/profile">Profile</PrimaryButton>
                <PrimaryButton to="/organization">Organization</PrimaryButton>
                <PrimaryButton to="/eventdetail">Event Detail</PrimaryButton>
            </div>
        </main>
    );
}
