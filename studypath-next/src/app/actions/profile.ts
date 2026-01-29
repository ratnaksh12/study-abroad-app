'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateProfile(email: string, data: any) {
    try {
        console.log('Updating profile for', email, data);
        const updatedUser = db.updateProfile(email, data);
        if (!updatedUser) {
            return { success: false, error: 'User not found' };
        }
        revalidatePath('/dashboard');
        revalidatePath('/profile');
        return { success: true, user: updatedUser };
    } catch (error) {
        console.error('Failed to update profile:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

export async function getProfile(email: string) {
    try {
        const user = db.getUser(email);
        if (!user) return { success: false, error: 'User not found' };
        return { success: true, profile: user.profile };
    } catch (error) {
        return { success: false, error: 'Failed to fetch profile' };
    }
}
