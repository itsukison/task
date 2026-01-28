'use client';

import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface PendingRequestCardProps {
    orgName: string;
    onCancel?: () => void; // Optional cancel action
}

export function PendingRequestCard({ orgName }: PendingRequestCardProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-[#E9E9E7] shadow-sm max-w-md w-full mx-auto text-center animate-in fade-in transition-all">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <Clock className="text-accent w-6 h-6" />
            </div>

            <h2 className="text-xl font-semibold text-[#37352F] mb-3">
                Request Sent to {orgName}
            </h2>

            <p className="text-[#787774] mb-8 leading-relaxed">
                Please wait for an administrator to approve your request. <br />
                You will be notified when you are accepted.
            </p>

            <div className="text-xs text-[#9B9A97] bg-[#F7F6F3] py-2 px-4 rounded-full">
                Status: Pending Approval
            </div>

            {/* 
                We can add a cancel button here later if we implement the cancel API.
                For now, just showing the status is sufficient.
            */}
        </div>
    );
}
