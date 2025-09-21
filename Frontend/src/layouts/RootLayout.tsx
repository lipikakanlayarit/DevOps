import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';

export default function RootLayout() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <Navbar />
      <main className="w-full pt-[60px]">
        <Outlet />
      </main>
    </div>
  );
}
