const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load university data
const universitiesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'universities.json'), 'utf8')
);

// Helper function to normalize strings for comparison
function normalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().trim();
}

// Helper function to check if a university offers a program
function offersProgram(university, fieldOfStudy) {
    if (!fieldOfStudy) return true;

    const normalizedField = normalize(fieldOfStudy);

    // Map common field variations to database program names
    const fieldMappings = {
        'artificial intelligence': ['computer science', 'engineering'],
        'ai': ['computer science', 'engineering'],
        'machine learning': ['computer science', 'engineering'],
        'ml': ['computer science', 'engineering'],
        'data science': ['computer science', 'sciences'],
        'software engineering': ['computer science', 'engineering'],
        'computer engineering': ['computer science', 'engineering'],
        'information technology': ['computer science', 'engineering'],
        'it': ['computer science', 'engineering'],
        'mba': ['business'],
        'management': ['business'],
        'finance': ['business'],
        'accounting': ['business'],
        'pre-med': ['medicine'],
        'medical': ['medicine'],
        'health': ['medicine'],
        'legal studies': ['law'],
        'humanities': ['arts'],
        'liberal arts': ['arts'],
        'natural sciences': ['sciences'],
        'physics': ['sciences'],
        'chemistry': ['sciences'],
        'biology': ['sciences'],
        'mathematics': ['sciences'],
        'math': ['sciences']
    };

    // Get mapped programs or use original field
    const searchTerms = fieldMappings[normalizedField] || [normalizedField];

    // Check if university offers any of the search terms
    return university.programs.some(program => {
        const normalizedProgram = normalize(program);
        return searchTerms.some(term =>
            normalizedProgram.includes(term) || term.includes(normalizedProgram)
        );
    });
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

// Get all universities
app.get('/api/universities', (req, res) => {
    let { country, field, limit } = req.query;

    let filtered = universitiesData.universities;

    // Handle country parameter (can be string or array)
    if (country) {
        // Convert to array if single country
        const countries = Array.isArray(country) ? country : [country];
        const targetCountries = countries.map(c => normalizeCountry(c));

        filtered = filtered.filter(uni => {
            const uniCountry = normalize(uni.country);
            return targetCountries.some(targetCountry =>
                uniCountry === targetCountry ||
                uniCountry.includes(targetCountry) ||
                targetCountry.includes(uniCountry)
            );
        });
    }

    // Filter by field of study
    if (field) {
        filtered = filtered.filter(uni => offersProgram(uni, field));
    }

    // Apply limit
    if (limit) {
        filtered = filtered.slice(0, parseInt(limit));
    }

    res.json({
        success: true,
        count: filtered.length,
        universities: filtered
    });
});

// Get university by ID
app.get('/api/universities/:id', (req, res) => {
    const university = universitiesData.universities.find(
        uni => uni.id === req.params.id
    );

    if (!university) {
        return res.status(404).json({
            success: false,
            message: 'University not found'
        });
    }

    res.json({
        success: true,
        university
    });
});

// Get list of supported countries
app.get('/api/countries', (req, res) => {
    const countries = [...new Set(
        universitiesData.universities.map(uni => uni.country)
    )].sort();

    res.json({
        success: true,
        count: countries.length,
        countries
    });
});

// Get list of all programs
app.get('/api/programs', (req, res) => {
    const programs = [...new Set(
        universitiesData.universities.flatMap(uni => uni.programs)
    )].sort();

    res.json({
        success: true,
        count: programs.length,
        programs
    });
});

// Search universities (more flexible)
app.post('/api/universities/search', (req, res) => {
    const { countries, fields, minRanking, maxTuition } = req.body;

    let filtered = universitiesData.universities;

    // Filter by countries (array)
    if (countries && countries.length > 0) {
        const normalizedCountries = countries.map(c => normalizeCountry(c));
        filtered = filtered.filter(uni => {
            const uniCountry = normalize(uni.country);
            return normalizedCountries.some(targetCountry =>
                uniCountry === targetCountry ||
                uniCountry.includes(targetCountry) ||
                targetCountry.includes(uniCountry)
            );
        });
    }

    // Filter by fields (array)
    if (fields && fields.length > 0) {
        filtered = filtered.filter(uni =>
            fields.some(field => offersProgram(uni, field))
        );
    }

    // Filter by QS ranking
    if (minRanking) {
        filtered = filtered.filter(uni =>
            uni.ranking.qs && uni.ranking.qs <= minRanking
        );
    }

    // Filter by tuition
    if (maxTuition) {
        filtered = filtered.filter(uni =>
            uni.stats.tuitionUSD <= maxTuition
        );
    }

    res.json({
        success: true,
        count: filtered.length,
        universities: filtered
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'University API is running',
        totalUniversities: universitiesData.universities.length
    });
});

// Start server
const HOST = '0.0.0.0'; // Important for cloud deployments
app.listen(PORT, HOST, () => {
    console.log(`🎓 University API running on http://${HOST}:${PORT}`);
    console.log(`📊 Loaded ${universitiesData.universities.length} universities`);
    console.log(`🌍 Covering ${[...new Set(universitiesData.universities.map(u => u.country))].length} countries`);
});

