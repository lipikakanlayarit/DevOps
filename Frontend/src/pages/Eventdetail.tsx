"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebarorg"
import { Input } from "@/components/inputtxt"
import { Plus, Calendar, Clock as ClockIcon, X, MapPin, Clock } from "lucide-react"
import { Link } from "react-router-dom"

type DateTimeEntry = {
  id: number
  startDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  endDate: string   // YYYY-MM-DD
  endTime: string   // HH:MM
}

export default function EventDetails() {
  const [eventData, setEventData] = useState({
    eventName: "",
    category: "",
    locationType: "venue", // "venue" | "announced"
    locationName: "",
    description: "",
  })

  const [dateTimeEntries, setDateTimeEntries] = useState<DateTimeEntry[]>([
    { id: 1, startDate: "2025-10-21", startTime: "19:00", endDate: "2025-10-21", endTime: "22:00" },
  ])

  const handleFileUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) console.log("File selected:", file.name)
    }
    input.click()
  }

  const addDateTimeEntry = () => {
    setDateTimeEntries((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      },
    ])
  }

  const removeDateTimeEntry = (id: number) => {
    setDateTimeEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
          </div>

          <div className="space-y-6">
            {/* Event Details Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Details</h2>
                <p className="text-sm text-gray-600">Add all of your event details.</p>
              </div>

              <div className="space-y-6">
                {/* Event Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Event Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    placeholder="Name of your project"
                    value={eventData.eventName}
                    onChange={(e) => setEventData({ ...eventData, eventName: e.target.value })}
                  />
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Categories <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={eventData.category}
                      onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none pr-10"
                    >
                      <option value="">Select</option>
                      <option value="concert">Concert</option>
                      <option value="seminar">Seminar</option>
                      <option value="exhibition">Exhibition</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Upload Picture */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Upload Picture <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-2">
                      <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <button
                        onClick={handleFileUpload}
                        className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Upload file
                      </button>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Show Date and Time Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Show Date and Time</h2>
                <p className="text-sm text-gray-600">
                  Let attendee know your event&apos;s start and end time for a smooth experience
                </p>
              </div>

              <div className="space-y-6">
                {dateTimeEntries.map((entry, index) => (
                  <div key={entry.id} className="relative space-y-4 p-4 border border-gray-200 rounded-lg">
                    {/* Remove entry button */}
                    <button
                      type="button"
                      onClick={() => removeDateTimeEntry(entry.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      aria-label="Remove date-time block"
                      title="Remove"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Start Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Start Date */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="date"
                            value={entry.startDate}
                            onChange={(e) => {
                              const updated = [...dateTimeEntries]
                              updated[index].startDate = e.target.value
                              setDateTimeEntries(updated)
                            }}
                            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {entry.startDate && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...dateTimeEntries]
                                updated[index].startDate = ""
                                setDateTimeEntries(updated)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              aria-label="Clear start date"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Start Time */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Time</label>
                        <div className="relative">
                          <ClockIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="time"
                            value={entry.startTime}
                            onChange={(e) => {
                              const updated = [...dateTimeEntries]
                              updated[index].startTime = e.target.value
                              setDateTimeEntries(updated)
                            }}
                            step={300} // ทุก 5 นาที
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* End Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* End Date */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="date"
                            value={entry.endDate}
                            onChange={(e) => {
                              const updated = [...dateTimeEntries]
                              updated[index].endDate = e.target.value
                              setDateTimeEntries(updated)
                            }}
                            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {entry.endDate && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...dateTimeEntries]
                                updated[index].endDate = ""
                                setDateTimeEntries(updated)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              aria-label="Clear end date"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* End Time */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Time</label>
                        <div className="relative">
                          <ClockIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="time"
                            value={entry.endTime}
                            onChange={(e) => {
                              const updated = [...dateTimeEntries]
                              updated[index].endTime = e.target.value
                              setDateTimeEntries(updated)
                            }}
                            step={300}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addDateTimeEntry}
                  className="flex items-center gap-2 text-[#09090B] border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Date and Time
                </button>
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Location</h2>
                <p className="text-sm text-gray-600">
                  Inform attendees where your event is being held and help attendees easily to find activities.
                </p>
              </div>

              <div className="space-y-4">
                {/* Toggle buttons */}
                <div className="flex gap-4">
                  {/* Venue */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="locationType"
                      value="venue"
                      checked={eventData.locationType === "venue"}
                      onChange={(e) => setEventData({ ...eventData, locationType: e.target.value })}
                      className="hidden"
                    />
                    <span
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                        eventData.locationType === "venue"
                          ? "border-blue-600 text-blue-600 bg-blue-50"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Venue
                    </span>
                  </label>

                  {/* To be announced */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="locationType"
                      value="announced"
                      checked={eventData.locationType === "announced"}
                      onChange={(e) => setEventData({ ...eventData, locationType: e.target.value })}
                      className="hidden"
                    />
                    <span
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                        eventData.locationType === "announced"
                          ? "border-blue-600 text-blue-600 bg-blue-50"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      To be announced
                    </span>
                  </label>
                </div>

                {/* Location name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Location name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    placeholder="Search for location"
                    value={eventData.locationName}
                    onChange={(e) => setEventData({ ...eventData, locationName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-600">
                  Adding a short description helps attendees understand what your event is about.
                </p>
              </div>

              <textarea
                placeholder="Add more details about your event and include what people can expect if they attend."
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Link
                to="/organization"
                className="rounded-full bg-[#FA3A2B] px-5 py-3 text-white font-medium shadow-sm hover:bg-[#e23325] transition-colors"
              >
                Cancel
              </Link>

              <Link
                to="/ticketdetail"
                className="rounded-full border border-gray-300 px-6 py-3 text-gray-900 font-medium hover:bg-gray-50 transition-colors"
              >
                Save &amp; Continue
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
