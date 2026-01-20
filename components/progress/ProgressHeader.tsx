'use client';

import React from 'react';
import { format } from 'date-fns';

import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ProgressHeaderProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export function ProgressHeader({
    selectedDate,
    onDateChange,
}: ProgressHeaderProps) {
    return (
        <div className="pt-12 px-8 pb-4 flex-shrink-0 ml-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#37352F] mb-1 tracking-tight">Team Progress</h1>
                    <p className="text-[#787774] text-sm">
                        Viewing <span className="font-semibold text-accent">{format(selectedDate, 'MMMM d, yyyy')}</span>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Date Picker */}
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="progress-date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal border-none shadow-none hover:bg-transparent px-0 hover:text-accent transition-colors",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && onDateChange(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    );
}
