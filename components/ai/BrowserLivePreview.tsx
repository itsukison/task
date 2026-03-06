'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, X, Loader2, ExternalLink } from 'lucide-react';

interface BrowserLivePreviewProps {
    connectUrl: string;       // debuggerFullscreenUrl — for inline view-only iframe
    interactiveUrl?: string;  // debuggerUrl — for interactive modal / open-in-tab
    sessionId: string;
}

export function BrowserLivePreview({ connectUrl, interactiveUrl, sessionId }: BrowserLivePreviewProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const openUrl = interactiveUrl || connectUrl;

    return (
        <>
            {/* Inline collapsible preview */}
            <div className="border border-[#E9E9E7] rounded-xl overflow-hidden bg-white max-w-2xl">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-3 py-2 bg-[#F7F7F5] border-b border-[#E9E9E7] cursor-pointer select-none"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🖥</span>
                        <span className="text-sm font-medium text-[#37352F]">Live Browser</span>
                        {!isLoaded && !isCollapsed && !isError && (
                            <Loader2 className="h-3 w-3 animate-spin text-[#787774]" />
                        )}
                    </div>
                    {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-[#787774]" />
                    ) : (
                        <ChevronUp className="h-4 w-4 text-[#787774]" />
                    )}
                </div>

                {/* Content */}
                {!isCollapsed && (
                    <div
                        className="relative cursor-pointer group"
                        onClick={() => setIsModalOpen(true)}
                    >
                        {isError ? (
                            <div className="flex items-center justify-center h-[200px] text-sm text-[#787774] gap-2">
                                <span>Browser session unavailable —</span>
                                <a
                                    href={openUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline flex items-center gap-1"
                                    onClick={e => e.stopPropagation()}
                                >
                                    open directly →
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        ) : (
                            <>
                                <iframe
                                    src={connectUrl}
                                    className={`w-full border-none transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    style={{ height: '200px', pointerEvents: 'none' }}
                                    onLoad={() => setIsLoaded(true)}
                                    onError={() => setIsError(true)}
                                    title="Live browser session"
                                />
                                {!isLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#F7F7F5]" style={{ height: '200px' }}>
                                        <Loader2 className="h-6 w-6 animate-spin text-[#d76c33]" />
                                    </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                                    <span className="text-xs text-white bg-black/60 px-3 py-1 rounded-full">
                                        Click to open interactive browser →
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Full-screen interactive modal — uses debuggerUrl for interaction */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-white border border-[#E9E9E7] rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7] bg-[#F7F7F5]">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">🖥</span>
                                <div>
                                    <h3 className="font-semibold text-[#37352F] tracking-tight">Live Browser</h3>
                                    <p className="text-xs text-[#787774]">Interactive session — changes here are reflected in the automation</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={openUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-[#EFEFED] rounded-full text-[#9B9A97] transition-colors"
                                    title="Open in new tab"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 hover:bg-[#EFEFED] rounded-full text-[#9B9A97] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative bg-white">
                            <iframe
                                src={openUrl}
                                className="w-full h-full border-none"
                                allow="clipboard-read; clipboard-write;"
                                title="Interactive browser session"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
