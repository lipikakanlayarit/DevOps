"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import PosterCard from "@/components/PosterCard"
import CategoryRadio from "@/components/CategoryRadio"
import PrimaryButton from "@/components/PrimaryButton"
import OutlineButton from "@/components/OutlineButton"
import EventCard from "@/components/EventCard"
import SearchBar from "@/components/SearchBar"
import Footer from "@/components/Footer"
import CountdownTimer from "@/components/CountdownTimer"

// ตัวอย่างในไฟล์ที่ประกาศ data
import poster1 from "@/assets/poster.png";
import poster2 from "@/assets/poster2.png";
import poster3 from "@/assets/poster3.png";
import poster4 from "@/assets/poster4.png";
import poster5 from "@/assets/poster5.png";
import poster6 from "@/assets/poster6.png";
import poster7 from "@/assets/poster7.png";
import poster8 from "@/assets/poster8.png";


// ถ้าต้องการพิมพ์ชนิด
type Poster = { dateLabel: string; title: string; imageUrl: string };
type EventItem = { cover: string; dateRange: string; title: string; venue: string };

const posters = [poster1, poster2, poster3, poster4, poster5, poster6, poster7, poster8];

export const posterData: Poster[] = [
  { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[0] },
  { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[1] },
  { dateLabel: "[2025.07.27]", title: "THE RIVER BROS", imageUrl: posters[2] },
  { dateLabel: "[2025.07.27]", title: "CREATIVE POSTER EXHIBITION", imageUrl: posters[3] },
  { dateLabel: "[2025.07.27]", title: "ROBERT BALTAZAR TRIO", imageUrl: posters[4] },
  { dateLabel: "[2025.07.27]", title: "VICTIM by ...", imageUrl: posters[5] },
  { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[6] },
  { dateLabel: "[2025.07.27]", title: "IN RIVER DANCE", imageUrl: posters[7] },
];

export const eventData: EventItem[] = [
  { cover: posters[1], dateRange: "22 Mar - 30 Mar", title: "ROBERT BALTAZAR TRIO THE CONCERT", venue: "Paragon hall" },
  { cover: posters[0], dateRange: "22 Mar - 30 Mar", title: "ROBERT BALTAZAR TRIO THE CONCERT", venue: "Paragon hall" },
  { cover: posters[2], dateRange: "22 Mar - 30 Mar", title: "THE RIVER BROS", venue: "Paragon hall" },
  { cover: posters[4], dateRange: "22 Mar - 30 Mar", title: "ROBERT BALTAZAR TRIO THE CONCERT", venue: "Paragon hall" },
  { cover: posters[5], dateRange: "22 Mar - 30 Mar", title: "MIDNIGHT RAVE PARTY", venue: "Paragon hall" },
  { cover: posters[6], dateRange: "22 Mar - 30 Mar", title: "THE SHAPE OF THINGS", venue: "Paragon hall" },
  { cover: posters[3], dateRange: "26.10.24", title: "THE ART HOUSE 4", venue: "Paragon hall" },
  { cover: posters[7], dateRange: "22 Mar - 30 Mar", title: "IN RIVER DANCE", venue: "Paragon hall" },
];

export default function HomePage() {
  const [heroFilter, setHeroFilter] = useState("ALL EVENT")
  const [searchQuery, setSearchQuery] = useState("")
  const [eventFilter, setEventFilter] = useState("All")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })
  const [isAnimationPaused, setIsAnimationPaused] = useState(false)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate();

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

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    
    setIsDragging(true)
    setIsAnimationPaused(true)
    setDragStart({
      x: e.pageX,
      scrollLeft: scrollContainerRef.current.scrollLeft
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    
    e.preventDefault()
    const x = e.pageX
    const walk = (x - dragStart.x) * 2 // Multiply by 2 for faster scrolling
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    // Resume animation after a short delay
    setTimeout(() => setIsAnimationPaused(false), 1000)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setTimeout(() => setIsAnimationPaused(false), 1000)
  }

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return
    
    setIsDragging(true)
    setIsAnimationPaused(true)
    setDragStart({
      x: e.touches[0].clientX,
      scrollLeft: scrollContainerRef.current.scrollLeft
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    
    const x = e.touches[0].clientX
    const walk = (x - dragStart.x) * 2
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setTimeout(() => setIsAnimationPaused(false), 1000)
  }

  // Handle infinite scroll reset
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return
      
      const container = scrollContainerRef.current
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      const scrollLeft = container.scrollLeft
      
      // Reset to beginning if scrolled too far right
      if (scrollLeft >= scrollWidth / 2) {
        container.scrollLeft = 0
      }
      
      // Reset to end if scrolled too far left
      if (scrollLeft <= 0) {
        container.scrollLeft = scrollWidth / 2
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      // Set initial scroll position to middle
      container.scrollLeft = container.scrollWidth / 4
      
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

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

        .animate-scroll-infinite.paused {
          animation-play-state: paused;
        }

        .poster-container {
          padding: 15px 10px;
          user-select: none;
        }

        .draggable-container {
          cursor: grab;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .draggable-container::-webkit-scrollbar {
          display: none;
        }

        .draggable-container.dragging {
          cursor: grabbing;
        }

        .draggable-container.dragging * {
          pointer-events: none;
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
            <div 
              ref={scrollContainerRef}
              className={`draggable-container ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ margin: '20px 0' }}
            >
              <div className={`flex gap-4 ${isAnimationPaused ? 'animate-scroll-infinite paused' : 'animate-scroll-infinite'}`}>
                {/* First set of posters */}
                {posterData.map((poster, index) => (
                  <div key={`first-${index}`} className="flex-shrink-0 poster-container">
                    <div className="transition-transform duration-300 hover:scale-115">
                      <PosterCard
                        dateLabel={poster.dateLabel}
                        title={poster.title}
                        imageUrl={poster.imageUrl}
                        onClick={() => !isDragging && navigate("/eventselect")}
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
                        onClick={() => !isDragging && console.log(`Clicked poster: ${poster.title}`)}
                      />
                    </div>
                  </div>
                ))}
                {/* Third set for smoother infinite scroll */}
                {posterData.map((poster, index) => (
                  <div key={`third-${index}`} className="flex-shrink-0 poster-container">
                    <div className="transition-transform duration-300 hover:scale-115">
                      <PosterCard
                        dateLabel={poster.dateLabel}
                        title={poster.title}
                        imageUrl={poster.imageUrl}
                        onClick={() => !isDragging && console.log(`Clicked poster: ${poster.title}`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                  src={poster1}
                  alt="Robert Baltazar Trio"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </div>
              <div>
                <div className="text-[clamp(16px,3vw,20px)] font-bold text-white mb-2">
                  2024.03.22
                </div>
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
                <PrimaryButton to="/eventselect" className="px-8 py-3">VIEW
                </PrimaryButton>
              </div>
            </div>
          </div>
        </section>

        {/* Events Grid Section */}
        <section id="events-section" className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-[clamp(28px,6vw,80px)] font-extrabold text-black pb-8 pt-20 leading-tight">
              <span className="text-[#FA3A2B]">ALL</span> VIBE LONG <span className="text-[#FA3A2B]">STAGE</span> ON FIRE
            </h2>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-30">
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
                  onClick={() => navigate("/eventselect")}
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