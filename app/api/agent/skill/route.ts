import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Read the SKILL.md file directly from the filesystem
        const filePath = path.join(process.cwd(), '.agent', 'skills', 'webmcp-integration', 'SKILL.md');
        const fileBuffer = readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'text/markdown',
                'Content-Disposition': 'attachment; filename="SKILL.md"',
            },
        });
    } catch (error) {
        console.error('Error serving SKILL.md:', error);
        return new NextResponse('Error serving skill file', { status: 500 });
    }
}
