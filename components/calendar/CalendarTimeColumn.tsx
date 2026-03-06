'use client';

import React from 'react';

interface CalendarTimeColumnProps {
  hours: number[];
  hourHeight?: number;
  snapInterval?: number;
}

export const CalendarTimeColumn = React.memo(function CalendarTimeColumn({
  hours,
  hourHeight = 64,
  snapInterval = 15,
}: CalendarTimeColumnProps) {
  // Show 30-min label always; show finer labels at 5-min snap (>= 80px/hr)
  const subLabels = hourHeight >= 80
    ? Array.from({ length: Math.floor(60 / snapInterval) - 1 }, (_, i) => (i + 1) * snapInterval).filter(m => m % 15 === 0)
    : [];

  return (
    <div className="w-12 border-r border-[#E9E9E7] flex-shrink-0 bg-white flex flex-col text-[10px] text-[#9B9A97] font-sans text-right pr-2 select-none">
      {hours.map(hour => (
        <div key={hour} className="relative" style={{ height: `${hourHeight}px` }}>
          <span className="-top-2 relative text-[#9B9A97]/60">
            {hour === 0 ? '' : `${hour}:00`}
          </span>
          {subLabels.map(min => (
            <span
              key={min}
              className="absolute right-2 text-[#9B9A97]/40 text-[9px]"
              style={{ top: `${(min / 60) * 100}% `, transform: 'translateY(-50%)' }}
            >
              {`${hour}:${min.toString().padStart(2, '0')}`}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
});
