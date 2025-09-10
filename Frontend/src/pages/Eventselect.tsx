"use client"

import { Calendar, Clock, MapPin, Ticket } from "lucide-react"
import { useState, useEffect } from "react"
import Footer from "@/components/Footer"

export default function Eventselect() {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<{ row: string; seat: number; zone: string; price: number }[]>([])

  const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H"]
  const seatsPerRow = 20
  const seatZones = {
    vip: { rows: ["A", "B"], price: 5000 },
    standard: { rows: ["C", "D", "E", "F", "G", "H"], price: 1500 },
  }

  const occupiedSeats = new Set([
    // Row A - all occupied (like in reference image)
    "A-1",
    "A-2",
    "A-3",
    "A-4",
    "A-5",
    "A-6",
    "A-7",
    "A-8",
    "A-9",
    "A-10",
    "A-11",
    "A-12",
    "A-13",
    "A-14",
    "A-15",
    "A-16",
    "A-17",
    "A-18",
    "A-19",
    "A-20",
    // Row B - some occupied
    "B-4",
    "B-5",
    "B-6",
    "B-8",
    "B-9",
    "B-10",
    "B-12",
    "B-13",
    "B-14",
    "B-16",
    "B-17",
    "B-18",
    "B-19",
    "B-20",
    // Row C - scattered occupied
    "C-1",
    "C-3",
    "C-5",
    "C-6",
    "C-7",
    "C-9",
    "C-12",
    "C-15",
    "C-17",
    "C-18",
    "C-19",
    "C-20",
    // Row D - some occupied
    "D-4",
    "D-6",
    "D-7",
    "D-8",
    "D-10",
    "D-13",
    "D-15",
    "D-16",
    "D-17",
    "D-19",
    "D-20",
    // Row E - scattered occupied
    "E-2",
    "E-3",
    "E-4",
    "E-5",
    "E-6",
    "E-9",
    "E-12",
    "E-17",
    "E-19",
    "E-20",
    // Row F - some occupied (like reference)
    "F-7",
    "F-12",
    // Row G - scattered occupied
    "G-6",
    "G-7",
    "G-9",
    "G-12",
    "G-14",
    "G-15",
    "G-17",
    "G-18",
    // Row H - some occupied
    "H-2",
    "H-3",
    "H-4",
    "H-5",
    "H-6",
    "H-8",
    "H-12",
    "H-13",
    "H-14",
    "H-15",
    "H-17",
    "H-19",
  ])

  const getSeatZone = (row: string) => {
    if (seatZones.vip.rows.includes(row)) return { zone: "VIP", price: seatZones.vip.price }
    return { zone: "STANDARD", price: seatZones.standard.price }
  }

  const isSeatOccupied = (row: string, seat: number) => {
    return occupiedSeats.has(`${row}-${seat}`)
  }

  const scrollToDateSelection = () => {
    const element = document.getElementById("date-selection")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    if (selectedDate) {
      const element = document.getElementById("seat-map-section")
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }
  }, [selectedDate])

  const handleDateClick = (date: string) => {
    if (selectedDate === date) {
      // If clicking the same date, hide the seat map
      setSelectedDate(null)
    } else {
      // If clicking a different date, show that date's seat map
      setSelectedDate(date)
    }
    setSelectedSeats([]) // Reset seat selection when changing date
  }

  const handleSeatClick = (row: string, seat: number) => {
    if (isSeatOccupied(row, seat)) return

    const { zone, price } = getSeatZone(row)
    const seatInfo = { row, seat, zone, price }

    setSelectedSeats((prevSeats) => {
      const existingSeatIndex = prevSeats.findIndex((s) => s.row === row && s.seat === seat)

      if (existingSeatIndex >= 0) {
        return prevSeats.filter((_, index) => index !== existingSeatIndex)
      } else {
        return [...prevSeats, seatInfo]
      }
    })
  }

  const generateReserveId = () => {
    return Math.random().toString().slice(2, 17).padStart(15, "0")
  }

  const isSeatSelected = (row: string, seat: number) => {
    return selectedSeats.some((s) => s.row === row && s.seat === seat)
  }

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0)
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "var(--black, #000000)" }}>
      {/* Hero Section */}
      <section className="relative px-6 py-16" style={{ background: "var(--black, #000000)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Event Poster */}
            <div className="relative">
              <img
                src="/src/assets/poster.png"
                alt="Robert Baltazar Trio Concert Poster"
                className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
                onError={(e) => {
                  console.log("failed to load:", e.currentTarget.src)
                  e.currentTarget.style.display = "none"
                }}
                onLoad={() => console.log("Image loaded successfully")}
              />
            </div>

            {/* Event Details */}
            <div className="space-y-6">
              <div className="text-sm" style={{ color: "var(--gray-1, #C3C3C3)" }}>
                2024.03.22
              </div>

              <h1
                className="text-4xl lg:text-6xl font-bold leading-tight"
                style={{
                  color: "var(--red, #FA3A2B)",
                  fontFamily: '"Roboto Flex", sans-serif',
                  fontWeight: "800",
                }}
              >
                ROBERT
                <br />
                BALTAZAR TRIO
              </h1>

              <div className="grid gap-4">
                {/* Show Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Show Date
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>Saturday, March 22</div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>Sunday, March 23</div>
                  </div>
                </div>

                {/* Sale Opening Date */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Sale Opening Date
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>Saturday, August 16, 2025, 10:00 AM</div>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      MCC HALL, 3rd Floor,
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>The Mall Lifestore Bangkapi</div>
                  </div>
                </div>

                {/* Ticket Prices */}
                <div className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Ticket Prices
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                      ฿ 500 / ฿ 600 / ฿ 800 / ฿ 1,500 / ฿ 3,500
                      <br />/ ฿ 3,000 / ฿ 2,000 / ฿ 1,500
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={scrollToDateSelection}
                  className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "var(--red, #FA3A2B)",
                    color: "var(--white, #FFFFFF)",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Get Ticket
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "var(--near-black-2, #1A1919)",
                    color: "var(--white, #FFFFFF)",
                    border: `1px solid var(--gray-1, #C3C3C3)`,
                    borderRadius: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {showDetails ? "Hide Detail" : "View Detail"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Section */}
      {showDetails && (
        <section className="px-6 py-8" style={{ background: "#DBDBDB" }}>
          <div className="max-w-4xl mx-auto">
            <p
              className="text-center leading-relaxed"
              style={{
                color: "#000000",
                fontFamily: '"Roboto Flex", sans-serif',
                fontSize: "16px",
                lineHeight: "1.6",
                textAlign: "justify",
                marginBottom: "32px",
              }}
            >
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
              industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
              scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
              electronic typesetting, remaining essentially unchanged. Lorem Ipsum is simply dummy text of the printing
              and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
              when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has
              survived not only five centuries, but also the leap into electronic typesetting, remaining essentially
              unchanged.
            </p>
          </div>
        </section>
      )}

      {/* Event Cards Section */}
      <section id="date-selection" className="px-6 py-8" style={{ background: "#DBDBDB" }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* March 22 Event */}
          {(!selectedDate || selectedDate === "march22") && (
            <div
              className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: selectedDate === "march22" ? "var(--red, #FA3A2B)" : "var(--white, #FFFFFF)",
                borderRadius: "var(--card-radius, 8px)",
                boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
              }}
              onClick={() => handleDateClick("march22")}
            >
              <div className="flex">
                <div
                  className="p-6 flex flex-col items-center justify-center min-w-[120px]"
                  style={{
                    background: "var(--near-black-3, #1D1D1D)",
                    color: "var(--white, #FFFFFF)",
                  }}
                >
                  <div className="text-sm">Sat</div>
                  <div className="text-3xl font-bold">22</div>
                  <div className="text-sm">Mar</div>
                  <div
                    className="text-xs mt-2 px-2 py-1 rounded"
                    style={{
                      background: "var(--black, #000000)",
                    }}
                  >
                    6 P.M.
                  </div>
                </div>
                <div className="flex-1 p-6 flex items-center justify-between">
                  <div>
                    <h3
                      className="text-2xl font-bold mb-2"
                      style={{
                        color: selectedDate === "march22" ? "var(--white, #FFFFFF)" : "var(--red, #FA3A2B)",
                        fontFamily: '"Roboto Flex", sans-serif',
                        fontWeight: "800",
                      }}
                    >
                      ROBERT BALTAZAR TRIO
                    </h3>
                    <div
                      className="flex items-center gap-2"
                      style={{
                        color: selectedDate === "march22" ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)",
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>MCC HALL, 3rd Floor,</span>
                    </div>
                    <div
                      style={{
                        color: selectedDate === "march22" ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)",
                      }}
                    >
                      The Mall Lifestore Bangkapi
                    </div>
                  </div>
                  <div
                    className="w-24 h-24 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: "var(--gray-1, #C3C3C3)" }}
                  >
                    <img
                      src="/src/assets/poster.png"
                      alt="Robert Baltazar Trio Concert Poster"
                      className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
                      onError={(e) => {
                        console.log("failed to load:", e.currentTarget.src)
                        e.currentTarget.style.display = "none"
                      }}
                      onLoad={() => console.log("Image loaded successfully")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* March 23 Event */}
          {(!selectedDate || selectedDate === "march23") && (
            <div
              className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: selectedDate === "march23" ? "var(--red, #FA3A2B)" : "var(--white, #FFFFFF)",
                borderRadius: "var(--card-radius, 8px)",
                boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
              }}
              onClick={() => handleDateClick("march23")}
            >
              <div className="flex">
                <div
                  className="p-6 flex flex-col items-center justify-center min-w-[120px]"
                  style={{
                    background: "var(--near-black-3, #1D1D1D)",
                    color: "var(--white, #FFFFFF)",
                  }}
                >
                  <div className="text-sm">Sun</div>
                  <div className="text-3xl font-bold">23</div>
                  <div className="text-sm">Mar</div>
                  <div
                    className="text-xs mt-2 px-2 py-1 rounded"
                    style={{
                      background: "var(--black, #000000)",
                    }}
                  >
                    5 P.M.
                  </div>
                </div>
                <div className="flex-1 p-6 flex items-center justify-between">
                  <div>
                    <h3
                      className="text-2xl font-bold mb-2"
                      style={{
                        color: selectedDate === "march23" ? "var(--white, #FFFFFF)" : "var(--red, #FA3A2B)",
                        fontFamily: '"Roboto Flex", sans-serif',
                        fontWeight: "800",
                      }}
                    >
                      ROBERT BALTAZAR TRIO
                    </h3>
                    <div
                      className="flex items-center gap-2"
                      style={{
                        color: selectedDate === "march23" ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)",
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>MCC HALL, 3rd Floor,</span>
                    </div>
                    <div
                      style={{
                        color: selectedDate === "march23" ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)",
                      }}
                    >
                      The Mall Lifestore Bangkapi
                    </div>
                  </div>
                  <div
                    className="w-24 h-24 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: "var(--gray-1, #C3C3C3)" }}
                  >
                    <img
                      src="/src/assets/poster.png"
                      alt="Robert Baltazar Trio Concert Poster"
                      className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
                      onError={(e) => {
                        console.log("failed to load:", e.currentTarget.src)
                        e.currentTarget.style.display = "none"
                      }}
                      onLoad={() => console.log("Image loaded successfully")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedDate && (
            <div id="seat-map-section" className="mt-8 space-y-6">
              {/* Seat Map */}
              <div
                className="p-8"
                style={{
                  background: "var(--white, #FFFFFF)",
                  borderRadius: "var(--card-radius, 8px)",
                  boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                }}
              >
                <div className="space-y-4">
                  {/* Stage */}
                  <div
                    className="w-full h-12 flex items-center justify-center text-white font-bold text-lg mb-8 mx-auto max-w-2xl"
                    style={{ background: "var(--near-black-3, #1D1D1D)", borderRadius: "8px" }}
                  >
                    STAGE
                  </div>

                  {/* Seat Grid */}
                  <div className="space-y-1 max-w-4xl mx-auto">
                    {seatRows.map((rowLetter) => (
                      <div key={rowLetter} className="flex items-center justify-center gap-1">
                        {/* Left row label */}
                        <div className="w-8 text-center font-bold text-gray-700 text-sm">{rowLetter}</div>

                        {/* Seats */}
                        <div className="flex gap-1">
                          {Array.from({ length: seatsPerRow }, (_, seatIndex) => {
                            const seatNumber = seatIndex + 1
                            const { zone } = getSeatZone(rowLetter)
                            const isSelected = isSeatSelected(rowLetter, seatNumber)
                            const isOccupied = isSeatOccupied(rowLetter, seatNumber)

                            return (
                              <button
                                key={seatNumber}
                                onClick={() => handleSeatClick(rowLetter, seatNumber)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${!isOccupied ? "hover:scale-110" : ""}`}
                                style={{
                                  background: isSelected
                                    ? "var(--red, #FA3A2B)"
                                    : isOccupied
                                      ? "#2D2D2D" // Dark for occupied seats
                                      : zone === "VIP"
                                        ? "#f4f13fff" // Gold for VIP
                                        : "#f4f13fff", // Gold for Standard (like reference)
                                  color: isSelected ? "white" : isOccupied ? "#4CAF50" : "#2D2D2D",
                                  border: `2px solid ${isOccupied ? "#2D2D2D" : "#E0E0E0"}`,
                                  cursor: isOccupied ? "not-allowed" : "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                }}
                                disabled={isOccupied}
                                title={
                                  isOccupied
                                    ? `${rowLetter}${seatNumber} (Occupied)`
                                    : `${rowLetter}${seatNumber} (${zone})`
                                }
                              >
                                {isOccupied ? "✕" : seatNumber}
                              </button>
                            )
                          })}
                        </div>

                        {/* Right row label */}
                        <div className="w-8 text-center font-bold text-gray-700 text-sm">{rowLetter}</div>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-4 mt-6 pt-4 border-t flex-wrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "#F4D03F", color: "#2D2D2D", border: "2px solid #E0E0E0" }}
                      >
                        1
                      </div>
                      <span className="text-sm text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "#2D2D2D", color: "#4CAF50", border: "2px solid #2D2D2D" }}
                      >
                        ✕
                      </div>
                      <span className="text-sm text-gray-700">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "var(--red, #FA3A2B)", color: "white" }}
                      >
                        1
                      </div>
                      <span className="text-sm text-gray-700">Selected</span>
                    </div>
                  </div>

                  {/* Zone Pricing */}
                  <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
                    <span>VIP (A-B): ฿5,000</span>
                    <span>Standard (C-H): ฿1,500</span>
                  </div>

                  {/* Selected seats summary */}
                  {selectedSeats.length > 0 && (
                    <div className="flex justify-center mt-4">
                      <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <span className="text-sm text-gray-700">
                          Selected: {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} | Total: ฿
                          {getTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="flex justify-center">
                  <div
                    className="p-6 w-full max-w-4xl"
                    style={{
                      background: "var(--white, #FFFFFF)",
                      borderRadius: "var(--card-radius, 8px)",
                      boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                      border: "2px solid var(--red, #FA3A2B)",
                    }}
                  >
                    {selectedSeats.length === 1 ? (
                      // Single ticket display
                      <div className="flex items-start gap-4">
                        {/* Concert Image */}
                        <div className="w-20 h-20 flex-shrink-0">
                          <img
                            src="/src/assets/poster.png"
                            alt="Robert Baltazar Trio Concert Poster"
                            className="w-full h-full object-cover rounded-lg shadow"
                            onError={(e) => {
                              console.log("failed to load:", e.currentTarget.src)
                              e.currentTarget.style.display = "none"
                            }}
                            onLoad={() => console.log("Image loaded successfully")}
                          />
                        </div>
                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="text-sm font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                              Reserve ID
                            </div>
                            <div className="text-lg font-mono" style={{ color: "var(--near-black-1, #100F0F)" }}>
                              {generateReserveId()}
                            </div>
                          </div>

                          <div>
                            <div className="text-lg font-bold" style={{ color: "var(--near-black-1, #100F0F)" }}>
                              ROBERT BALTAZAR TRIO
                            </div>
                            <div className="flex items-center gap-1 text-sm" style={{ color: "var(--gray-1, #666)" }}>
                              <MapPin className="w-3 h-3" />
                              <span>MCC HALL, 3rd Floor</span>
                            </div>
                            <div className="text-sm" style={{ color: "var(--gray-1, #666)" }}>
                              The Mall Lifestore Bangkapi
                            </div>
                            <div
                              className="flex items-center gap-1 text-sm mt-1"
                              style={{ color: "var(--gray-1, #666)" }}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{selectedDate === "march22" ? "Saturday, March 22" : "Sunday, March 23"}</span>
                            </div>
                          </div>

                          {/* Seat Details Grid */}
                          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                ZONE
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--red, #FA3A2B)" }}>
                                {selectedSeats[0].zone}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                ROW
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                {selectedSeats[0].row}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                SEAT
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                {selectedSeats[0].seat}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                PRICE
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                ฿{selectedSeats[0].price.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Payment Button */}
                          <button
                            className="w-full mt-4 px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                            style={{
                              background: "var(--red, #FA3A2B)",
                              color: "var(--white, #FFFFFF)",
                              border: "none",
                              borderRadius: "25px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Go to Payment
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Multiple tickets display
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center border-b pb-4">
                          <div className="text-sm font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                            Multiple Tickets Reserved
                          </div>
                          <div className="text-2xl font-bold mt-2" style={{ color: "var(--near-black-1, #100F0F)" }}>
                            ROBERT BALTAZAR TRIO
                          </div>
                          <div
                            className="flex items-center justify-center gap-1 text-sm mt-1"
                            style={{ color: "var(--gray-1, #666)" }}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{selectedDate === "march22" ? "Saturday, March 22" : "Sunday, March 23"}</span>
                          </div>
                        </div>

                        {/* Tickets Grid */}
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                          {selectedSeats.map((seat, index) => (
                            <div
                              key={`${seat.row}-${seat.seat}`}
                              className="border rounded-lg p-4"
                              style={{ borderColor: "var(--red, #FA3A2B)" }}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 flex-shrink-0">
                                  <img
                                    src="/src/assets/poster.png"
                                    alt="Robert Baltazar Trio Concert Poster"
                                    className="w-full h-full object-cover rounded-lg shadow"
                                    onError={(e) => {
                                      console.log("failed to load:", e.currentTarget.src)
                                      e.currentTarget.style.display = "none"
                                    }}
                                    onLoad={() => console.log("Image loaded successfully")}
                                  />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                                    Ticket #{index + 1}
                                  </div>
                                  <div className="text-sm font-mono" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                    {generateReserveId()}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                    ZONE
                                  </div>
                                  <div className="font-bold text-sm" style={{ color: "var(--red, #FA3A2B)" }}>
                                    {seat.zone}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                    SEAT
                                  </div>
                                  <div className="font-bold text-sm" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                    {seat.row}
                                    {seat.seat}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                    PRICE
                                  </div>
                                  <div className="font-bold text-sm" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                    ฿{seat.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total and Payment */}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold" style={{ color: "var(--near-black-1, #100F0F)" }}>
                              Total ({selectedSeats.length} tickets):
                            </span>
                            <span className="text-2xl font-bold" style={{ color: "var(--red, #FA3A2B)" }}>
                              ฿{getTotalPrice().toLocaleString()}
                            </span>
                          </div>
                          <button
                            className="w-full px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                            style={{
                              background: "var(--red, #FA3A2B)",
                              color: "var(--white, #FFFFFF)",
                              border: "none",
                              borderRadius: "25px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Go to Payment - {selectedSeats.length} Tickets
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Footer Section */}
      <Footer />
    </div>
  )
}
