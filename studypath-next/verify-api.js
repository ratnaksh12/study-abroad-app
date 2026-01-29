async function verify() {
    const baseUrl = 'http://localhost:3000';

    console.log('--- STARTING VERIFICATION ---');

    // Helper for fetch
    const post = async (endpoint, body) => {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error(`Error calling ${endpoint}:`, e.message);
            return null;
        }
    };

    // 1. Test Onboarding Chat
    console.log('\n1. Testing Onboarding AI Chat...');
    const onboardingRes = await post('/api/onboarding/chat', {
        message: "I want to study Computer Science in the USA",
        history: [],
        profileState: {}
    });
    if (onboardingRes) {
        console.log('Response:', onboardingRes.reply ? 'Received Reply' : 'No Reply');
        console.log('Progress:', onboardingRes.progress);
    }

    // 2. Test User Action (Lock)
    console.log('\n2. Testing University Lock Action...');
    const lockRes = await post('/api/user/universities', {
        action: 'LOCK',
        universityId: 'test_1',
        universityName: 'Test Uni',
        universityCountry: 'Test Country',
        email: 'test@example.com'
    });
    if (lockRes) {
        console.log('Lock Status:', lockRes.success ? 'Success' : 'Failed');
    }

    // 3. Test Counsellor Action Parsing
    console.log('\n3. Testing Counsellor AI Action Parsing...');
    const counsellorRes = await post('/api/counsellor/chat', {
        message: "Please lock Stanford University for me",
        history: []
    });
    if (counsellorRes) {
        console.log('Reply:', counsellorRes.reply);
        console.log('Action Detected:', counsellorRes.action ? JSON.stringify(counsellorRes.action) : 'None');
    }
}

// Check native fetch
if (typeof fetch === 'undefined') {
    console.error('This script requires Node 18+ for native fetch.');
} else {
    // Wait for server to boot
    console.log('Waiting for server...');
    setTimeout(verify, 3000);
}
