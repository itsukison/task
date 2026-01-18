'use client';

import React from 'react';

interface CalendarTimeColumnProps {
  hours: number[];
}

export const CalendarTimeColumn = React.memo(function CalendarTimeColumn({
  hours
}: CalendarTimeColumnProps) {
  return (
    <div className="w-12 border-r border-[#E9E9E7] flex-shrink-0 bg-white flex flex-col text-[10px] text-[#9B9A97] font-sans text-right pr-2 select-none">
      {hours.map(hour => (
        <div key={hour} className="h-16 relative">
          <span className="-top-2 relative text-[#9B9A97]/60">
            {hour === 0 ? '' : `${hour}:00`}
          </span>
        </div>
      ))}
    </div>
  );
});
