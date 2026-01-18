'use client';

import React from 'react';
import { format, isSameDay } from 'date-fns';

interface CalendarHeaderProps {
  displayedDays: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarHeader = React.memo(function CalendarHeader({
  displayedDays,
  selectedDate,
  onSelectDate
}: CalendarHeaderProps) {
  return (
    <div className="flex border-b border-[#E9E9E7] bg-white z-20 mr-[8px] mt-2">
      <div className="w-12 flex-shrink-0 bg-white border-r border-[#E9E9E7]"></div>
      {displayedDays.map((date) => {
        const isToday = isSameDay(date, new Date());
        const isSelected = isSameDay(date, selectedDate);

        return (
          <div
            key={date.toISOString()}
            className={`flex-1 py-2 text-center border-r border-[#E9E9E7] last:border-r-0 cursor-pointer transition-colors group relative ${isSelected ? 'bg-orange-50/30' : 'hover:bg-[#F7F7F5]'}`}
            onClick={() => onSelectDate(date)}
          >
            <div className={`text-[11px] uppercase font-semibold ${isToday ? 'text-red-500' : 'text-[#9B9A97]'}`}>
              {format(date, 'EEE')}
            </div>
            <div className={`text-xl font-normal mt-0.5 flex items-center justify-center mx-auto transition-all ${
              isToday
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
  );
});
