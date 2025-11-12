// src/components/Sidebar.tsx
import { Calendar, Users, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isActive?: boolean;
}

function NavItem({ to, icon, children, isActive }: NavItemProps) {
    const baseClasses =
        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200";
    const activeClasses = isActive
        ? "text-white bg-red-500/10 border-l-2 border-red-500"
        : "text-gray-400 hover:text-white hover:bg-gray-700/50";

    return (
        <Link to={to} className={`${baseClasses} ${activeClasses}`}>
            <span className={isActive ? "text-red-500" : ""}>{icon}</span>
            <span className="font-medium">{children}</span>
        </Link>
    );
}

interface SidebarSectionProps {
    title: string;
    children: React.ReactNode;
}

function SidebarSection({ title, children }: SidebarSectionProps) {
    return (
        <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4 text-red-500">
                {title}
            </h2>
            <nav className="space-y-2">{children}</nav>
        </div>
    );
}

export default function Sidebar() {
    const location = useLocation();
    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <aside className="fixed left-0 top-[60px] h-[calc(100vh-60px)] w-64 bg-[#1D1D1D] z-40 overflow-y-auto">
            <div className="p-6 space-y-8">

                <SidebarSection title="Event Management">
                    <NavItem
                        to="/admin"
                        icon={<Calendar className="w-5 h-5" />}
                        isActive={isActive("/admin") && location.pathname === "/admin"}
                    >
                        Event Manager
                    </NavItem>

                    <NavItem
                        to="/admin/permissions"
                        icon={<Shield className="w-5 h-5" />}
                        isActive={isActive("/admin/permissions")}
                    >
                        Event Permission
                    </NavItem>
                </SidebarSection>

                <SidebarSection title="User Management">
                    <NavItem
                        to="/admin/usermnge"
                        icon={<Users className="w-5 h-5" />}
                        isActive={isActive("/admin/usermnge")}
                    >
                        User Management
                    </NavItem>
                </SidebarSection>

            </div>
        </aside>
    );
}
