"use client"

import { useState } from "react"
import PosterCard from "@/components/PosterCard"
import CategoryRadio from "@/components/CategoryRadio"
import PrimaryButton from "@/components/PrimaryButton"
import OutlineButton from "@/components/OutlineButton"
import EventCard from "@/components/EventCard"
import SearchBar from "@/components/SearchBar"
import Footer from "@/components/Footer"
import CountdownTimer from "@/components/CountdownTimer"

// Sample data for posters
const posterData = [
  {
    dateLabel: "[2025.07.27]",
    title: "VICTIM by INTROVE...",
    imageUrl: "/dark-artistic-poster-with-geometric-shapes.jpg",
  },
  {
    dateLabel: "[2025.07.27]",
    title: "VICTIM by INTROVE...",
    imageUrl: "/black-and-white-portrait-poster.jpg",
  },
  {
    dateLabel: "[2025.07.27]",
    title: "THE RIVER BROS",
    imageUrl: "/yellow-and-black-concert-poster.jpg",
  },
  {
    dateLabel: "[2025.07.27]",
    title: "CREATIVE POSTER EXHIBITION",
    imageUrl: "/creative-exhibition-poster-with-typography.jpg",
  },
  {
    dateLabel: "[2025.07.27]",
    title: "ROBERT BALTAZAR TRIO",
    imageUrl: "/jazz-concert-poster-with-instruments.jpg",
  },
  {
    dateLabel: "[2025.07.27]",
    title: "VICTIM by INTROVE...",
    imageUrl: "/blue-geometric-abstract-poster.jpg",
  },
  {
    dateLabel: "[2025.07.27]",
    title: "VICTIM by INTROVE...",
    imageUrl: "/dark-minimalist-poster-design.jpg",
  },
]

// Sample data for events
const eventData = [
  {
    cover: "/blue-geometric-concert-poster.jpg",
    dateRange: "22 Mar - 30 Mar",
    title: "ROBERT BALTAZAR TRIO THE CONCERT",
    venue: "Paragon hall",
  },
  {
    cover: "/dark-artistic-portrait-poster.jpg",
    dateRange: "22 Mar - 30 Mar",
    title: "ROBERT BALTAZAR TRIO THE CONCERT",
    venue: "Paragon hall",
  },
  {
    cover: "/yellow-and-black-music-poster.jpg",
    dateRange: "22 Mar - 30 Mar",
    title: "THE RIVER BROS",
    venue: "Paragon hall",
  },
  {
    cover: "/jazz-concert-poster-with-golden-theme.jpg",
    dateRange: "22 Mar - 30 Mar",
    title: "ROBERT BALTAZAR TRIO THE CONCERT",
    venue: "Paragon hall",
  },
  {
    cover: "/red-and-black-rave-party-poster.jpg",
    dateRange: "22 Mar - 30 Mar",
    title: "MIDNIGHT RAVE PARTY",
    venue: "Paragon hall",
  },
  {
    cover: "/green-minimalist-design-poster.jpg",
    dateRange: "22 Mar - 30 Mar",
    title: "THE SHAPE OF THINGS",
    venue: "Paragon hall",
  },
  {
    cover: "/dark-concert-poster-with-date.jpg",
    dateRange: "26.10.24",
    title: "THE ART HOUSE 4",
    venue: "Paragon hall",
  },
  {
    cover: "/pink-and-red-gradient-poster.jpg",
    dateRange: "22 Mar - 30 Mar",
    title: "IN RIVER DANCE",
    venue: "Paragon hall",
  },
]

export default function HomePage() {
  const [heroFilter, setHeroFilter] = useState("ALL EVENT")
  const [searchQuery, setSearchQuery] = useState("")
  const [eventFilter, setEventFilter] = useState("All")

  // Target date for countdown (10 days from now)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 10)
  targetDate.setHours(12, 56, 25, 0)

  const scrollToEventsSection = () => {
    const eventsSection = document.getElementById("events-section")
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const navigateToLogin = () => {
    window.location.href = "/login"
  }

  const heroFilterOptions = [
    { label: "ALL EVENT", value: "ALL EVENT" },
    { label: "ORGANIZER", value: "ORGANIZER" },
  ]

  const eventFilterOptions = [
    { label: "All", value: "All" },
    { label: "Concert", value: "Concert" },
    { label: "Seminar", value: "Seminar" },
    { label: "Exhibition", value: "Exhibition" },
  ]

  return (
    <>
      {/* Add the CSS styles for infinite scroll animation */}
      <style>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite 30s linear infinite;
        }

        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }

        .poster-container {
          padding: 15px 10px;
        }
      `}</style>

      <div className="min-h-screen bg-[#DBDBDB]">
        {/* Hero Section */}
        <section className="px-6 py-16">
          <div className="text-center mb-5">
            <h1 className="text-[min(9vw,200px)] font-extrabold leading-tight">
              LIVE THE VIBE ON
            </h1>

            <div className="flex justify-center gap-4 mb-12 pt-8">
              <PrimaryButton onClick={scrollToEventsSection} className="px-8 py-3">
                ALL EVENT
              </PrimaryButton>
              <OutlineButton onClick={navigateToLogin} className="px-8 py-3">
                ORGANIZER
              </OutlineButton> 
            </div>
          </div>

          <div className="relative overflow-hidden py-5">
            <div className="flex gap-4 animate-scroll-infinite" style={{margin: '20px 0'}}>
              {/* First set of posters */}
              {posterData.map((poster, index) => (
                <div key={`first-${index}`} className="flex-shrink-0 poster-container">
                  <div className="transition-transform duration-300 hover:scale-115">
                    <PosterCard
                      dateLabel={poster.dateLabel}
                      title={poster.title}
                      imageUrl={poster.imageUrl}
                      onClick={() => console.log(`Clicked poster: ${poster.title}`)}
                    />
                  </div>
                </div>
              ))}
              {/* Duplicate set for infinite scroll */}
              {posterData.map((poster, index) => (
                <div key={`second-${index}`} className="flex-shrink-0 poster-container">
                  <div className="transition-transform duration-300 hover:scale-115">
                    <PosterCard
                      dateLabel={poster.dateLabel}
                      title={poster.title}
                      imageUrl={poster.imageUrl}
                      onClick={() => console.log(`Clicked poster: ${poster.title}`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Countdown Timer */}
        <CountdownTimer targetDate={targetDate} />

        {/* Featured Event Section */}
        <section className="bg-[#1D1D1D] text-white py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <img
                  src="https://picsum.photos/400/500?random=20"
                  alt="Robert Baltazar Trio"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">2024.03.22</div>
                <h2 className="text-[clamp(28px,6vw,48px)] font-extrabold text-[#FA3A2B] mb-4">
                  ROBERT
                  <br />
                  BALTAZAR TRIO
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
                  industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
                  scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap
                  into electronic typesetting, remaining essentially unchanged.
                </p>
                <PrimaryButton className="px-8 py-3">VIEW</PrimaryButton>
              </div>
            </div>
          </div>
        </section>

        {/* Events Grid Section */}
        <section id="events-section" className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-[clamp(28px,6vw,54px)] font-extrabold text-black mb-8 leading-tight">
              <span className="text-[#FA3A2B]">ALL</span> VIBE LONG <span className="text-[#FA3A2B]">STAGE</span> ON FIRE
            </h2>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search events..."
                width="w-full md:w-[400px]"
              />
              <CategoryRadio options={eventFilterOptions} value={eventFilter} onChange={setEventFilter} />
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
              {eventData.map((event, index) => (
                <EventCard
                  key={index}
                  cover={event.cover}
                  dateRange={event.dateRange}
                  title={event.title}
                  venue={event.venue}
                  onClick={() => console.log(`Clicked event: ${event.title}`)}
                />
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <button className="text-black text-2xl hover:text-[#FA3A2B] transition-colors">⌄</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}