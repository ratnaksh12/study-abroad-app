require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
// Explicitly pass the connection string to ensure it's picked up from process.env (loaded by dotenv)
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
const PORT = process.env.PORT || 3001;

console.log('🚀 Server starting...');
console.log('DATABASE_URL present in process.env:', !!process.env.DATABASE_URL);
// Log only the hostname to be safe
try {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        console.log('Database Host:', url.hostname);
    }
} catch (e) {
    console.log('Could not parse DATABASE_URL for logging');
}

// Test database connection on startup
prisma.$connect()
    .then(() => console.log('✅ Prisma connected to PostgreSQL successfully'))
    .catch(err => {
        console.error('❌ Prisma Connection ERROR during startup:', err);
    });

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to normalize strings for comparison
function normalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().trim();
}

// Country name aliases
const countryAliases = {
    'usa': 'united states',
    'us': 'united states',
    'america': 'united states',
    'uk': 'united kingdom',
    'britain': 'united kingdom',
    'uae': 'united arab emirates',
    'emirates': 'united arab emirates'
};

// Helper to normalize country names
function normalizeCountry(country) {
    const normalized = normalize(country);
    return countryAliases[normalized] || normalized;
}

// API Routes

// Get all universities with filtering
app.get('/api/universities', async (req, res) => {
    try {
        let { country, field, limit } = req.query;

        // Build Prisma query filters
        const where = {};

        if (country) {
            const countries = Array.isArray(country) ? country : [country];
            const targetCountries = countries.map(c => normalizeCountry(c));

            where.OR = targetCountries.map(c => ({
                country: { contains: c, mode: 'insensitive' }
            }));
        }

        if (field) {
            const fields = Array.isArray(field) ? field : [field];
            where.programs = { hasSome: fields };
        }

        console.log('[API] University search filters:', JSON.stringify(where));

        const universities = await prisma.university.findMany({
            where,
            take: limit ? parseInt(limit) : undefined,
            orderBy: { rankingQS: 'asc' }
        });

        res.json({
            success: true,
            count: universities.length,
            universities
        });
    } catch (error) {
        console.error('❌ Error fetching universities:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get university by ID
app.get('/api/universities/:id', async (req, res) => {
    try {
        const university = await prisma.university.findUnique({
            where: { id: req.params.id }
        });

        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'University not found'
            });
        }

        res.json({ success: true, university });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Search universities (flexible POST)
app.post('/api/universities/search', async (req, res) => {
    try {
        const { countries, fields, minRanking, maxTuition } = req.body;

        const where = {};

        if (countries && countries.length > 0) {
            const targetCountries = countries.map(c => normalizeCountry(c));
            where.OR = targetCountries.map(c => ({
                country: { contains: c, mode: 'insensitive' }
            }));
        }

        if (fields && fields.length > 0) {
            where.programs = { hasSome: fields };
        }

        if (minRanking) {
            where.rankingQS = { lte: minRanking };
        }

        if (maxTuition) {
            where.tuitionUSD = { lte: maxTuition };
        }

        const universities = await prisma.university.findMany({
            where,
            orderBy: { rankingQS: 'asc' }
        });

        res.json({
            success: true,
            count: universities.length,
            universities
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// --- User Management Routes ---

// Sync user on login (Create if not exists)
app.post('/api/user/sync', async (req, res) => {
    try {
        const { uid, email, name } = req.body;
        if (!uid || !email) return res.status(400).json({ success: false, message: 'UID and email required' });

        const user = await prisma.user.upsert({
            where: { id: uid },
            update: { name, email },
            create: {
                id: uid,
                email,
                name,
                profile: { create: {} } // Create empty profile for new user
            },
            include: {
                profile: true,
                shortlistedUnis: { include: { university: true } },
                tasks: true
            }
        });

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get full user state
app.get('/api/user/:uid', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.uid },
            include: {
                profile: true,
                shortlistedUnis: { include: { university: true } },
                tasks: true
            }
        });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Transform shortlistedUnis to flat array for frontend compatibility
        const transformedUser = {
            ...user,
            shortlistedUniversities: user.shortlistedUnis.filter(u => !u.isLocked).map(u => u.universityId),
            lockedUniversities: user.shortlistedUnis.filter(u => u.isLocked).map(u => u.universityId),
            shortlistedDetails: user.shortlistedUnis.map(u => u.university)
        };

        res.json({ success: true, user: transformedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update Profile
app.post('/api/user/:uid/profile', async (req, res) => {
    try {
        const { uid } = req.params;
        const profileData = req.body;

        const updatedProfile = await prisma.profile.update({
            where: { userId: uid },
            data: {
                educationLevel: profileData.educationLevel,
                degreeMajor: profileData.degreeMajor,
                graduationYear: profileData.graduationYear,
                gpa: profileData.gpa,
                intendedDegree: profileData.intendedDegree,
                fieldOfStudy: profileData.fieldOfStudy,
                intakeYear: profileData.intakeYear,
                intakeSeason: profileData.intakeSeason,
                preferredCountries: profileData.preferredCountries,
                budgetRange: profileData.budgetRange,
                fundingPlan: profileData.fundingPlan,
                englishTest: profileData.englishTest,
                englishScore: profileData.englishScore,
                standardizedTest: profileData.standardizedTest,
                standardizedScore: profileData.standardizedScore,
                sopStatus: profileData.sopStatus
            }
        });

        // Update user profileComplete status
        await prisma.user.update({
            where: { id: uid },
            data: { profileComplete: true }
        });

        res.json({ success: true, profile: updatedProfile });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Toggle Shortlist/Lock
app.post('/api/user/:uid/universities', async (req, res) => {
    try {
        const { uid } = req.params;
        const { universityId, action, isLocked } = req.body;

        if (action === 'add') {
            await prisma.userUniversity.upsert({
                where: { userId_universityId: { userId: uid, universityId } },
                update: { isLocked: isLocked || false },
                create: { userId: uid, universityId, isLocked: isLocked || false }
            });
        } else if (action === 'remove') {
            await prisma.userUniversity.delete({
                where: { userId_universityId: { userId: uid, universityId } }
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Sync Tasks
app.post('/api/user/:uid/tasks', async (req, res) => {
    try {
        const { uid } = req.params;
        const { tasks } = req.body; // Array of tasks

        for (const task of tasks) {
            await prisma.task.upsert({
                where: { id: task.id },
                update: {
                    completed: task.completed,
                    title: task.title,
                    description: task.description,
                    priority: task.priority
                },
                create: {
                    id: task.id,
                    userId: uid,
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    completed: task.completed
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Health check
app.get('/health', async (req, res) => {
    try {
        const uniCount = await prisma.university.count();
        res.json({
            status: 'ok',
            message: 'University API with PostgreSQL is running',
            totalUniversities: uniCount,
            env: process.env.NODE_ENV
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed - Prisma/DB issue',
            error: error.message
        });
    }
});

// Simple ping test (no DB)
app.get('/ping', (req, res) => {
    res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// Environmental Diagnostic
app.get('/env-check', (req, res) => {
    res.json({
        database_url_set: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        all_keys: Object.keys(process.env).filter(key => !key.toLowerCase().includes('password') && !key.toLowerCase().includes('secret') && !key.toLowerCase().includes('key'))
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('💥 GLOBAL UNHANDLED ERROR:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Application Error',
        error: err.message,
        path: req.path
    });
});

// Start server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`🎓 University API running on http://${HOST}:${PORT}`);
});


