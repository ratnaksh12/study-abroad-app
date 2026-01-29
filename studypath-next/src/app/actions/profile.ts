'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProfile(email: string, data: any) {
    try {
        console.log('Updating profile for', email, data);

        // Find user first
        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Upsert profile
        const updatedProfile = await prisma.profile.upsert({
            where: { userId: user.id },
            update: {
                educationLevel: data.educationLevel,
                degreeMajor: data.major || data.degreeMajor,
                graduationYear: data.graduationYear,
                gpa: data.gpa,
                intendedDegree: data.targetDegree || data.intendedDegree,
                fieldOfStudy: data.fieldOfStudy,
                intakeYear: data.intakeYear,
                intakeSeason: data.intakeSeason,
                preferredCountries: data.preferredCountries || [],
                budgetRange: data.budget || data.budgetRange,
                fundingPlan: data.fundingPlan || [],
                englishTest: data.englishTest,
                englishScore: data.englishScore,
                standardizedTest: data.standardizedTest,
                standardizedScore: data.standardizedScore,
                sopStatus: data.sopStatus
            },
            create: {
                userId: user.id,
                educationLevel: data.educationLevel,
                degreeMajor: data.major || data.degreeMajor,
                graduationYear: data.graduationYear,
                gpa: data.gpa,
                intendedDegree: data.targetDegree || data.intendedDegree,
                fieldOfStudy: data.fieldOfStudy,
                intakeYear: data.intakeYear,
                intakeSeason: data.intakeSeason,
                preferredCountries: data.preferredCountries || [],
                budgetRange: data.budget || data.budgetRange,
                fundingPlan: data.fundingPlan || [],
                englishTest: data.englishTest,
                englishScore: data.englishScore,
                standardizedTest: data.standardizedTest,
                standardizedScore: data.standardizedScore,
                sopStatus: data.sopStatus
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/profile');
        return { success: true, profile: updatedProfile };
    } catch (error) {
        console.error('Failed to update profile:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

export async function getProfile(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true }
        });

        if (!user) return { success: false, error: 'User not found' };
        return { success: true, profile: user.profile };
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        return { success: false, error: 'Failed to fetch profile' };
    }
}
