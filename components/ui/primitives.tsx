import React, { InputHTMLAttributes, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Notion-like Input component
export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                className={`flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

// Notion-like Select component
interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    className?: string;
    renderOption?: (option: string) => React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    className = '',
    renderOption
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={ref} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-8 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-2 py-1 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className="truncate flex-1 text-left">
                    {renderOption ? renderOption(value) : value}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
            </button>
            {isOpen && (
                <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md animate-in fade-in-80 mt-1 left-0 w-full">
                    <div className="p-1 max-h-60 overflow-auto">
                        {options.map((option) => (
                            <div
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 ${value === option ? 'bg-gray-50' : ''
                                    }`}
                            >
                                <span className="truncate flex-1">
                                    {renderOption ? renderOption(option) : option}
                                </span>
                                {value === option && (
                                    <span className="flex h-3.5 w-3.5 items-center justify-center">
                                        <Check className="h-3 w-3" />
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
