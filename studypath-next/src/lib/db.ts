import fs from 'fs';
import path from 'path';

// Types reflecting the Schema
export interface User {
    id: string;
    email: string;
    password?: string;
    name: string | null;
    profile?: Profile;
    universities?: UserUniversity[];
    tasks?: Task[];
}

export interface Profile {
    educationLevel?: string;
    major?: string;
    universities?: string; // JSON
    gpa?: string;
    gpaScale?: string;
    targetDegree?: string;
    fieldOfStudy?: string;
    intakeYear?: string;
    preferredCountries?: string[]; // Array of strings
    budget?: string;
    currency?: string;
    examScores?: string; // JSON
    englishTest?: string;
    englishScore?: string;
    isComplete: boolean;
}

export interface UserUniversity {
    id: string;
    universityId: string;
    name: string;
    country: string;
    status: 'SHORTLISTED' | 'LOCKED';
    rank?: 'DREAM' | 'TARGET' | 'SAFE';
    acceptanceChance?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    type: string;
}

const DB_PATH = path.join(process.cwd(), 'data.json');

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
}

class Database {
    private read(): { users: User[] } {
        try {
            if (!fs.existsSync(DB_PATH)) {
                fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
            }
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('DB Read Error', error);
            return { users: [] };
        }
    }

    private write(data: { users: User[] }) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }

    getUser(email: string): User | undefined {
        const data = this.read();
        return data.users.find(u => u.email === email);
    }

    createUser(user: User): User {
        const data = this.read();
        data.users.push(user);
        this.write(data);
        return user;
    }

    updateUser(email: string, updates: Partial<User>): User | null {
        const data = this.read();
        const index = data.users.findIndex(u => u.email === email);
        if (index === -1) return null;

        data.users[index] = { ...data.users[index], ...updates };
        this.write(data);
        return data.users[index];
    }

    updateProfile(email: string, profileUpdates: Partial<Profile>): User | null {
        const user = this.getUser(email);
        if (!user) return null;

        const updatedProfile = { ...(user.profile || { isComplete: false }), ...profileUpdates };
        if (!updatedProfile.educationLevel) updatedProfile.isComplete = false;
        // Simple logic: if basic fields present, set complete. 
        // Real logic can be more complex.

        return this.updateUser(email, { profile: updatedProfile });
    }
}

export const db = new Database();
