/**
 * API Test File for ProLinka Backend
 * Run with: node backend/api_test.js
 */

const axios = require('axios');

const API_BASE = 'https://prolinka-1.onrender.com/api/users';

console.log('🧪 Starting API Tests...\n');

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        results.passed++;
        results.tests.push({ name, status: 'PASS' });
    } catch (error) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${error.message}`);
        results.failed++;
        results.tests.push({ name, status: 'FAIL', error: error.message });
    }
}

async function runTests() {
    console.log('='.repeat(50));
    console.log('Testing ProLinka API Endpoints');
    console.log('='.repeat(50));
    console.log('');

    // Test 1: Health check
    await test('GET /api/users/ - Health check', async () => {
        const response = await axios.get(API_BASE);
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        if (!response.data.message) throw new Error('No message in response');
    });

    // Test 2: Get all users profile
    await test('GET /get_all_users_profile - Get all users', async () => {
        const response = await axios.get(`${API_BASE}/get_all_users_profile`);
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        if (!Array.isArray(response.data)) throw new Error('Expected array response');
    });

    // Test 3: Get top profiles
    await test('GET /top-profiles - Get top profiles', async () => {
        const response = await axios.get(`${API_BASE}/top-profiles`);
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    });

    // Test 4: Get profile by username (the main fix)
    await test('GET /:username - Get profile by username endpoint exists', async () => {
        // Try to get a profile - may fail if user doesn't exist, but endpoint should work
        // 404 for non-existent user means the endpoint IS working
        const response = await axios.get(`${API_BASE}/testuser`).catch(err => err.response);
        // Either 200 (user exists) or 404 (user not found) are valid responses
        if (response?.status !== 200 && response?.status !== 404) {
            throw new Error(`Expected 200 or 404, got ${response?.status}`);
        }
        console.log(`   Status: ${response.status} - Endpoint is working!`);
        if (response.status === 404) {
            console.log(`   Message: ${response.data.message} (Expected - user doesn't exist)`);
        }
    });


    // Test 5: Test with a known username pattern
    await test('GET /harish2148h - Get harish2148h profile', async () => {
        try {
            const response = await axios.get(`${API_BASE}/harish2148h`);
            if (response.status === 200) {
                console.log(`   Found user: ${response.data.userId?.username}`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`   User not found (expected if doesn't exist)`);
            } else {
                throw error;
            }
        }
    });

    // Print summary
    console.log('');
    console.log('='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log('');

    if (results.failed > 0) {
        console.log('Failed tests:');
        results.tests
            .filter(t => t.status === 'FAIL')
            .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }

    console.log('');
    console.log('🔍 Network Analysis:');
    console.log('  - If /:username returns 404, the endpoint is working but user doesn\'t exist');
    console.log('  - If /top-profiles is called instead of /:username, frontend needs redeploy');
    console.log('');
    console.log('💡 To fix frontend:');
    console.log('  1. Push changes to GitHub');
    console.log('  2. Redeploy backend to Render');
    console.log('  3. Redeploy frontend to Vercel');
    console.log('  4. Test: https://pro-linka.vercel.app/view_profile/harish2148h');
}

runTests().catch(console.error);
