'use client';

import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-[#37352F]">Verification Failed</h1>
                    <p className="text-[#787774]">
                        For security reasons, the verification link must be opened in the
                        <span className="font-semibold text-[#37352F]"> same browser </span>
                        where you started the sign-up process.
                    </p>
                </div>

                <div className="bg-[#F7F6F3] p-4 rounded-lg text-left text-sm text-[#787774] space-y-2">
                    <p className="font-medium text-[#37352F]">Try this:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>Copy the link from your email</li>
                        <li>Paste it into this browser window</li>
                        <li>Press Enter</li>
                    </ol>
                </div>

                <div className="pt-4">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-[#f35513] hover:text-[#e04e11] transition-colors"
                    >
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
