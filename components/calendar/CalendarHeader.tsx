'use client';

import React from 'react';
import { format, isSameDay } from 'date-fns';
import { useLanguage, dateLocales } from '@/lib/i18n';

interface CalendarHeaderProps {
  displayedDays: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  dayColumnWidth: number;
}

export const CalendarHeader = React.memo(function CalendarHeader({
  displayedDays,
  selectedDate,
  onSelectDate,
  dayColumnWidth,
}: CalendarHeaderProps) {
  const { language } = useLanguage();

  return (
    // sticky top-0 — sticks vertically as the user scrolls down.
    // The header scrolls horizontally in sync with the body because both are
    // inside the same scroll container (no JS sync needed).
    <div className="sticky top-0 z-20 flex border-b border-[#E9E9E7] bg-white">
      {/* Corner spacer — sticky left-0 so it stays anchored while day columns scroll */}
      <div className="sticky left-0 z-30 w-12 flex-shrink-0 bg-white border-r border-[#E9E9E7]" />

      <div
        className="flex"
        style={{ width: `${displayedDays.length * dayColumnWidth}px` }}
      >
        {displayedDays.map((date) => {
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={date.toISOString()}
              className={`flex-1 py-2 text-center border-r border-[#E9E9E7] last:border-r-0 cursor-pointer transition-colors group relative ${isSelected ? 'bg-orange-50/30' : isWeekend ? 'bg-[#FAFAFA]' : 'hover:bg-[#F7F7F5]'}`}
              onClick={() => onSelectDate(date)}
            >
              <div className={`text-[11px] uppercase font-semibold ${isToday ? 'text-red-500' : 'text-[#9B9A97]'}`}>
                {format(date, 'EEE', { locale: dateLocales[language] })}
              </div>
              <div className={`text-xl font-normal mt-0.5 flex items-center justify-center mx-auto transition-all ${isToday
                ? 'bg-red-500 text-white w-7 h-7 rounded-full'
                : isSelected ? 'text-accent' : 'text-[#37352F]'
                }`}>
                {format(date, 'd')}
              </div>
              {isSelected && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
});
