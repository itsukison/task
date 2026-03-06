'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, ShieldCheck } from 'lucide-react';

interface BrowserbaseConnectModalProps {
    isOpen: boolean;
    serviceName: string; // e.g., 'zoom.us', 'github.com'
    onClose: () => void;
    onSuccess?: () => void;
}

export default function BrowserbaseConnectModal({
    isOpen,
    serviceName,
    onClose,
    onSuccess
}: BrowserbaseConnectModalProps) {
    const [connectUrl, setConnectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setConnectUrl(null);
            return;
        }

        let isMounted = true;

        async function fetchSession() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch('/api/auth/connect-service', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service: serviceName }),
                });

                if (!res.ok) {
                    throw new Error('Failed to initialize secure session');
                }

                const data = await res.json();
                if (isMounted) {
                    setConnectUrl(data.connectUrl);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchSession();

        return () => { isMounted = false; };
    }, [isOpen, serviceName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl h-[80vh] flex flex-col bg-white border border-[#E9E9E7] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7] bg-[#F7F7F5]">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#d76c33]" />
                        <div>
                            <h3 className="font-semibold text-[#37352F] tracking-tight">Connect {serviceName}</h3>
                            <p className="text-xs text-[#787774]">Log in once to securely authorize Chrono to execute workflows.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                onSuccess?.();
                                onClose();
                            }}
                            className="px-4 py-1.5 text-xs font-medium bg-[#EFEFED] hover:bg-[#E3E2E0] text-[#37352F] rounded-full transition-colors"
                        >
                            Done
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-[#EFEFED] rounded-full text-[#9B9A97] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body (iframe) */}
                <div className="flex-1 relative bg-white">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-[#787774]">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#d76c33]" />
                            <p className="text-sm">Initializing secure session environment...</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-red-500 p-6 text-center">
                            <p className="font-medium mb-2">Connection Error</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                    )}

                    {connectUrl && !error && (
                        <iframe
                            src={connectUrl}
                            className={`w-full h-full border-none transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setLoading(false)}
                            allow="clipboard-read; clipboard-write;"
                            title={`Connect ${serviceName}`}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
