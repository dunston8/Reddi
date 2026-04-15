"use client";

import { Lesson } from "@/types/lesson";
import { useState } from "react";


interface Props {
  lessons: Lesson[];
  onBack: () => void;
  onOpenLesson: (lesson: Lesson) => void;
}

export function CalendarView({ lessons, onBack, onOpenLesson }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const generateCalendarDays = (currentDate: Date) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstOfMonth = new Date(year, month, 1)

    const startOffset = getMondayIndex(firstOfMonth)

    const startDate = new Date(firstOfMonth)
    startDate.setDate(firstOfMonth.getDate() - startOffset)

    const days: Date[] = []

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }

    return days
  }


  //Convert Monday to index 0, and Sunday to index 6
  const getMondayIndex = (date: Date) => {
    const day = date.getDay()
    return day === 0 ? 6 : day - 1
  }

  const days = generateCalendarDays(currentDate)

  const nextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const prevMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }
  
  return (
    <div className="calendar">

      {/* Header */}
      <div className="calendar-header">

        <div className="calendar-nav">
          <button className="nav-btn" onClick={prevMonth}>‹</button>
          <button className="nav-btn" onClick={nextMonth}>›</button>
        </div>

        <h2 className="calendar-title">
          {currentDate.toLocaleString("nb-NO", {
            month: "long",
            year: "numeric"
          })}
        </h2>

        <button className="today-btn" onClick={() => setCurrentDate(new Date())}>
          I dag
        </button>

      </div>


      {/* Weekdays */}
      <div className="calendar-weekdays">
        {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="calendar-grid">
        {days.map((day) => {

          const dayLessons = lessons.filter((lesson) => {
            if (!lesson.date) return false

            const lessonDate = new Date(lesson.date)
            return lessonDate.toDateString() === day.toDateString()
          })

          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          
          const today = new Date()
          const isToday = day.toDateString() === today.toDateString()


          return (
            <div
              key={day.toISOString()}
              className={`calendar-day 
              ${!isCurrentMonth ? "other-month" : ""}
              ${isToday ? "today" : ""}`}
            >
              <div className="day-number">{day.getDate()}</div>

              {dayLessons.map(l => (
                <div key={l.id} className="lesson">
                  {l.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default CalendarView;

