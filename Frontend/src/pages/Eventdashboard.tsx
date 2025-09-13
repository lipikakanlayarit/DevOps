"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Sidebar } from "@/components/sidebarorg"
import { Input } from "@/components/inputtxt"
import { Search, CircleDollarSign, Ticket } from "lucide-react"

type SeatRow = {
  id: string
  seatId: string
  total: number
  user: string
  status: "COMPLETE" | "UNPAID"
}

const MOCK_SEATS: SeatRow[] = [
  { id: "81010012592500", seatId: "B12", total: 5000, user: "ZOMBIE", status: "COMPLETE" },
  { id: "81010012592500", seatId: "B12", total: 5000, user: "ZOMBIE", status: "UNPAID" },
  { id: "81010012592500", seatId: "B12", total: 5000, user: "ZOMBIE", status: "COMPLETE" },
]

export default function EventDashboard() {
  const [available] = useState(40)
  const [reserved] = useState(12)
  const [sold] = useState(8)

  const [netPayout] = useState(0)
  const [ticketSoldNow] = useState(0)
  const [ticketTarget] = useState(20)

  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? MOCK_SEATS.filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            r.seatId.toLowerCase().includes(q) ||
            r.user.toLowerCase().includes(q) ||
            r.status.toLowerCase().includes(q),
        )
      : MOCK_SEATS
  }, [query])

  const paidPct = 0
  const pendingPct = 0

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 md:gap-6">
            {/* KPI cards */}
            <div className="space-y-4">
              <StatCard title="Net Payout (THB)" icon={<CircleDollarSign className="w-6 h-6 text-emerald-600" />}>
                <div className="mt-2 text-2xl md:text-3xl font-bold text-slate-800">
                  {netPayout.toFixed(2)}
                </div>
              </StatCard>

              <StatCard title="Total Ticket Sold" icon={<Ticket className="w-6 h-6 text-blue-600" />}>
                <div className="mt-2 text-2xl md:text-3xl font-bold text-slate-800">
                  {ticketSoldNow}{" "}
                  <span className="text-lg md:text-xl font-semibold text-slate-500">/ {ticketTarget}</span>
                </div>
              </StatCard>

              
              <StatCard title="Total Summary" customClass="w-full xl:max-w-[360px]">
                <div className="mt-2 flex flex-col items-center gap-4">
                  <Donut value={paidPct} size={90} />
                  <div className="w-full flex flex-col gap-2 text-sm">
                    <Legend colorClass="bg-emerald-500" label="Paid" value={`0(${paidPct}%)`} />
                    <Legend colorClass="bg-amber-400" label="Pending" value={`0(${pendingPct}%)`} />
                  </div>
                </div>
              </StatCard>
            </div>

            {/* Table */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <Badge label={`Available Seat : ${available}`} variant="available" wide />
                <Badge label={`Reserved Seat : ${reserved}`} variant="reserved" wide />
                <Badge label={`Sold Seat : ${sold}`} variant="sold" wide />

                <div className="ml-auto w-full sm:w-auto sm:max-w-md relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search reservations..."
                    className="pl-10 h-11 sm:h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 w-full"
                  />
                </div>
              </div>

              {/* Table content */}
              <div className="overflow-x-auto">
                {/* Head */}
                <div className="min-w-[700px] grid grid-cols-[0.7fr_0.7fr_0.7fr_0.7fr_0.7fr] px-4 md:px-6 py-3 text-[11px] md:text-xs font-bold tracking-wide uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                  <div className="text-left">Reserve ID</div>
                  <div className="text-center">Seat ID</div>
                  <div className="text-center">Total</div>
                  <div className="text-center">User</div>
                  <div className="text-center">Status</div>
                </div>

                {/* Rows */}
                <div className="min-w-[700px] divide-y divide-slate-100">
                  {filtered.map((r, idx) => (
                    <div
                      key={`${r.id}-${idx}`}
                      className="grid grid-cols-[0.7fr_0.7fr_0.7fr_0.7fr_0.7fr] px-4 md:px-6 py-3 md:py-4 text-sm items-center hover:bg-slate-50 transition-colors"
                    >
                      <div className="truncate text-slate-700 font-mono text-medium text-left">{r.id}</div>
                      <div className="text-slate-800 font-semibold text-center">{r.seatId}</div>
                      <div className="text-slate-700 font-medium text-center">{r.total.toLocaleString()}</div>
                      <div className="text-slate-600 font-medium text-center">{r.user}</div>
                      <div className="text-center">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  title,
  children,
  icon,
  customClass,
}: {
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
  customClass?: string
}) {
  return (
    <section className={`bg-white rounded-2xl p-5 shadow-md border border-slate-200/50 ${customClass ?? ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {icon && (
          <span className="inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-slate-100">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function Badge({
  label,
  variant = "default",
  wide = false,
}: {
  label: string
  variant?: "available" | "reserved" | "sold" | "default"
  wide?: boolean
}) {
  const variants = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-200",
    reserved: "bg-blue-50 text-blue-700 border-blue-200",
    sold: "bg-rose-50 text-rose-700 border-rose-200",
    default: "bg-slate-50 text-slate-700 border-slate-200",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border ${
        wide ? "px-6" : "px-3 md:px-4"
      } py-1.5 md:py-2 text-xs md:text-sm font-medium ${variants[variant]}`}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: "COMPLETE" | "UNPAID" }) {
  if (status === "COMPLETE") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        COMPLETE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
      UNPAID
    </span>
  )
}

function Legend({ colorClass, label, value }: { colorClass: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${colorClass}`} />
      <span className="text-slate-700 font-medium text-xs md:text-sm">{label}</span>
      <span className="text-slate-500 font-mono text-xs md:text-sm">{value}</span>
    </div>
  )
}

function Donut({ value, size = 100 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, value))
  const angle = (v / 100) * 360
  const bg = `conic-gradient(rgb(244 114 182 / 0.35) 0deg ${angle}deg, rgb(252 231 243 / 0.6) ${angle}deg 360deg)`
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="rounded-full" style={{ width: size, height: size, background: bg }} />
      <div className="absolute bg-white rounded-full" style={{ width: size * 0.64, height: size * 0.64 }} />
      <div className="absolute text-xl font-bold text-slate-800">{v}%</div>
    </div>
  )
}
