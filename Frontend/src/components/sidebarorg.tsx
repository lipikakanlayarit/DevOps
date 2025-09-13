"use client"
import { Link, useLocation } from "react-router-dom"
import { BarChart3, FileText, Ticket } from "lucide-react"

interface SidebarProps {
  className?: string
}

const menuItems = [
  {
    title: "Event Dashboard",
    href: "/eventdashboard",
    icon: BarChart3,
  },
  {
    title: "Event Details",
    href: "/eventdetail",
    icon: FileText,
  },
  {
    title: "Ticket Details",
    href: "/ticketdetail",
    icon: Ticket,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()

  return (
    <div className={`w-64 bg-[#1D1D1D] text-white min-h-screen ${className || ""}`}>
      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === item.href
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}