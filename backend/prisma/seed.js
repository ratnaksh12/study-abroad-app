const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Read universities.json
    const dataPath = path.join(__dirname, '..', 'data', 'universities.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const universities = data.universities;

    console.log(`📊 Found ${universities.length} universities in JSON.`);

    for (const uni of universities) {
        await prisma.university.upsert({
            where: { id: uni.id },
            update: {
                name: uni.name,
                country: uni.country,
                location: uni.location,
                rankingQS: uni.ranking.qs || null,
                rankingTHE: uni.ranking.the || null,
                programs: uni.programs,
                acceptanceRate: uni.stats.acceptanceRate,
                tuitionUSD: uni.stats.tuitionUSD,
                internationalStudents: uni.stats.internationalStudents,
                website: uni.website
            },
            create: {
                id: uni.id,
                name: uni.name,
                country: uni.country,
                location: uni.location,
                rankingQS: uni.ranking.qs || null,
                rankingTHE: uni.ranking.the || null,
                programs: uni.programs,
                acceptanceRate: uni.stats.acceptanceRate,
                tuitionUSD: uni.stats.tuitionUSD,
                internationalStudents: uni.stats.internationalStudents,
                website: uni.website
            },
        });
    }

    console.log('✅ University data migrated successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
