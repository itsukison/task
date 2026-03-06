'use client';

import { useState } from 'react';

interface AuthRequiredCardProps {
    service: string;
    connectUrl: string;
    executionId: string;
    expiresAt: string;
}

export function AuthRequiredCard({ service, connectUrl, executionId, expiresAt }: AuthRequiredCardProps) {
    const [resumeState, setResumeState] = useState<'idle' | 'loading' | 'done' | 'error' | 'expired'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const isExpired = new Date(expiresAt) < new Date();

    const handleLoggedIn = async () => {
        if (resumeState === 'loading' || resumeState === 'done') return;

        setResumeState('loading');
        try {
            const res = await fetch('/api/workflows/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ executionId }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'EXPIRED') {
                    setResumeState('expired');
                } else {
                    setResumeState('error');
                    setErrorMsg(data.error || 'Failed to resume');
                }
                return;
            }

            setResumeState('done');
        } catch (err: any) {
            setResumeState('error');
            setErrorMsg(err.message || 'Network error');
        }
    };

    return (
        <div style={{
            border: '1px solid rgba(251, 146, 60, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            background: 'rgba(251, 146, 60, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '420px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔐</span>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Login required</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>{service}</div>
                </div>
            </div>

            <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5', opacity: 0.85 }}>
                The workflow hit a login page on <strong>{service}</strong>. Open the browser below to log in — your session will be saved for future runs.
            </p>

            {isExpired || resumeState === 'expired' ? (
                <div style={{ fontSize: '13px', color: '#f87171' }}>
                    ⏰ This login window has expired. Please run the workflow again.
                </div>
            ) : resumeState === 'done' ? (
                <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: 500 }}>
                    ✅ Resuming workflow…
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                        href={connectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'rgba(251, 146, 60, 0.2)',
                            border: '1px solid rgba(251, 146, 60, 0.5)',
                            color: '#fb923c',
                            fontSize: '13px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        🌐 Open Browser
                    </a>

                    <button
                        onClick={handleLoggedIn}
                        disabled={resumeState === 'loading'}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: resumeState === 'loading' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(251, 146, 60, 0.9)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: resumeState === 'loading' ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {resumeState === 'loading' ? '⏳ Resuming…' : "✓ I'm logged in"}
                    </button>
                </div>
            )}

            {resumeState === 'error' && (
                <div style={{ fontSize: '12px', color: '#f87171' }}>
                    ⚠️ {errorMsg}
                </div>
            )}
        </div>
    );
}
