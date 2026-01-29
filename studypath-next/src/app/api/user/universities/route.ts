import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { action, universityId, universityName, universityCountry, email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Ensure University exists (simplified for hackathon)
        await prisma.university.upsert({
            where: { id: universityId },
            update: {},
            create: {
                id: universityId,
                name: universityName || 'Unknown University',
                country: universityCountry || 'Unknown',
                location: 'TBD',
                acceptanceRate: 'TBD',
                tuitionUSD: 0,
                internationalStudents: 'TBD',
                website: ''
            }
        });

        if (action === 'LOCK') {
            await prisma.userUniversity.upsert({
                where: {
                    userId_universityId: {
                        userId: user.id,
                        universityId: universityId
                    }
                },
                update: { isLocked: true },
                create: {
                    userId: user.id,
                    universityId: universityId,
                    isLocked: true
                }
            });

            return NextResponse.json({ success: true, message: 'University Locked' });
        }

        if (action === 'UNLOCK') {
            await prisma.userUniversity.update({
                where: {
                    userId_universityId: {
                        userId: user.id,
                        universityId: universityId
                    }
                },
                data: { isLocked: false }
            });

            return NextResponse.json({ success: true, message: 'University Unlocked' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('University sync error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
