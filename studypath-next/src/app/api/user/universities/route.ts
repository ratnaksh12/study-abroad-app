import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { action, universityId, universityName, universityCountry, email } = await req.json();

        // In real app, get email from session
        const userEmail = email || 'test@example.com';
        const user = db.getUser(userEmail);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'LOCK') {
            const existingLocked = user.universities?.find(u => u.status === 'LOCKED');
            // Hackathon requirement: "Allow unlocking later with a clear warning"
            // But for locking, we just add it or generic update

            // Add or update
            const universities = user.universities || [];
            const existingIndex = universities.findIndex(u => u.universityId === universityId);

            const newUni = {
                id: Date.now().toString(),
                universityId,
                name: universityName,
                country: universityCountry,
                status: 'LOCKED' as const,
                acceptanceChance: 'Medium' // Mock
            };

            if (existingIndex > -1) {
                universities[existingIndex] = newUni;
            } else {
                universities.push(newUni);
            }

            db.updateUser(userEmail, { universities });

            return NextResponse.json({ success: true, message: 'University Locked' });
        }

        if (action === 'UNLOCK') {
            const universities = user.universities?.map(u =>
                u.universityId === universityId ? { ...u, status: 'SHORTLISTED' as const } : u
            ) || [];

            db.updateUser(userEmail, { universities });
            return NextResponse.json({ success: true, message: 'University Unlocked' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
