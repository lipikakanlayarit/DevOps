"use client"

import { useState } from "react"
import { Search } from "lucide-react"

interface User {
    id: string
    username: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    lastLogin: string
}

const mockUsers: User[] = [
    {
        id: "1",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
    {
        id: "2",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
    {
        id: "3",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
    {
        id: "4",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
    {
        id: "5",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
    {
        id: "6",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
    {
        id: "7",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
    {
        id: "8",
        username: "@Dnaya",
        firstName: "Kenya",
        lastName: "Paul",
        email: "Lisa6663@gmail.com",
        phoneNumber: "0741852963",
        lastLogin: "12 jun 2025",
    },
]

export default function UserTable() {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"attendee" | "organizer">("attendee")
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

    const filteredUsers = mockUsers.filter(
        (user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const toggleRow = (id: string) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedRows(newSelected)
    }

    const toggleAllRows = () => {
        if (selectedRows.size === filteredUsers.length) {
            setSelectedRows(new Set())
        } else {
            setSelectedRows(new Set(filteredUsers.map((u) => u.id)))
        }
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("attendee")}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === "attendee" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Attendee
                </button>
                <button
                    onClick={() => setActiveTab("organizer")}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === "organizer" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Organizer
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            <input
                                type="checkbox"
                                checked={selectedRows.size === filteredUsers.length && filteredUsers.length > 0}
                                onChange={toggleAllRows}
                                className="w-4 h-4 cursor-pointer"
                            />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">USERNAME</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">FIRST_NAME</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LAST_NAME</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">EMAIL</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PHONE_NUMBER</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LAST_LOGIN</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ACTION</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.has(user.id)}
                                    onChange={() => toggleRow(user.id)}
                                    className="w-4 h-4 cursor-pointer"
                                />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.firstName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.lastName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.phoneNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.lastLogin}</td>
                            <td className="px-4 py-3 text-sm">
                                <button className="px-4 py-1 border-2 border-red-500 text-red-500 rounded-full hover:bg-red-50 transition-colors font-medium">
                                    View detail
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">No users found matching your search.</div>
            )}
        </div>
    )
}
