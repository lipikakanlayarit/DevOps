"use client"

import { useState, useEffect } from "react"

type CountdownTimerProps = {
  targetDate: Date
  className?: string
}

export default function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className={`bg-[#FA3A2B] text-white py-4 ${className}`}>
      <div className="text-center">
        <div className="text-xl font-bold tracking-wider">
          {timeLeft.days} DAY {timeLeft.hours} HOUR {timeLeft.minutes} MIN {timeLeft.seconds} SEC
        </div>
      </div>
    </div>
  )
}
