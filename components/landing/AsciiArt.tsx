import React from 'react';
import { AsciiArtProps } from './types';

export const AsciiArt: React.FC<AsciiArtProps> = ({ art, className = '', label }) => {
    return (
        <div className={`relative flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg overflow-hidden ${className}`}>
            {label && (
                <span className="absolute top-2 left-2 text-xs font-mono text-gray-400 border border-gray-300 px-1 rounded">
                    {label}
                </span>
            )}
            <pre className="font-mono text-[10px] leading-[10px] text-gray-800 whitespace-pre select-none pointer-events-none opacity-60">
                {art}
            </pre>
        </div>
    );
};
