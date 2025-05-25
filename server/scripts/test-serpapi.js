// test-serpapi.js - Robust SerpAPI testing script
const path = require('path');
const fs = require('fs');

// Try to load .env from multiple locations
const possibleEnvPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../.env'),
    path.join(process.cwd(), '.env')
];

console.log('🔍 SerpAPI Test Script Starting...');
console.log('📁 Current directory:', process.cwd());
console.log('📁 Script location:', __dirname);

// Find and load .env file
let envLoaded = false;
console.log('\n🔍 Searching for .env file:');

for (const envPath of possibleEnvPaths) {
    const exists = fs.existsSync(envPath);
    console.log(`   ${envPath} - ${exists ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (exists && !envLoaded) {
        console.log(`\n✅ Loading .env from: ${envPath}`);
        require("dotenv").config({ path: envPath });
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.log('\n⚠️  No .env file found, trying default dotenv loading...');
    require("dotenv").config();
}

// Check environment variables
console.log('\n🔍 Environment Variables:');
const serpApiKey = process.env.SERPAPI_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;

console.log('   SERPAPI_KEY exists:', !!serpApiKey);
console.log('   GOOGLE_API_KEY exists:', !!googleApiKey);

if (serpApiKey) {
    console.log('   SERPAPI_KEY (first 10):', serpApiKey.substring(0, 10) + '...');
    console.log('   SERPAPI_KEY length:', serpApiKey.length);
}

if (googleApiKey) {
    console.log('   GOOGLE_API_KEY (first 10):', googleApiKey.substring(0, 10) + '...');
    console.log('   GOOGLE_API_KEY length:', googleApiKey.length);
}

const apiKey = googleApiKey || serpApiKey;

if (!apiKey) {
    console.log('\n❌ No API key found in environment variables');
    console.log('🎯 Make sure your .env file contains:');
    console.log('   SERPAPI_KEY=your_api_key_here');
    console.log('   OR');
    console.log('   GOOGLE_API_KEY=your_api_key_here');
    process.exit(1);
}

// Test the API
async function testSerpAPI() {
    console.log('\n🔄 Testing SerpAPI...');
    console.log('Using API key:', apiKey.substring(0, 10) + '...');
    
    // Import axios
    let axios;
    try {
        axios = require('axios');
    } catch (error) {
        console.error('❌ axios not found. Install with: npm install axios');
        process.exit(1);
    }
    
    try {
        // Test 1: Basic account info
        console.log('\n🧪 Test 1: Account Information');
        const accountUrl = 'https://serpapi.com/account';
        const accountParams = { api_key: apiKey };
        
        const accountResponse = await axios.get(accountUrl, { 
            params: accountParams,
            timeout: 10000 
        });
        
        console.log('✅ Account API Response:');
        console.log('   Status:', accountResponse.status);
        
        if (accountResponse.data.error) {
            console.log('❌ Account Error:', accountResponse.data.error);
            return false;
        } else {
            console.log('   Account ID:', accountResponse.data.account_id || 'N/A');
            console.log('   Credits Left:', accountResponse.data.total_credits_left || 'N/A');
            console.log('   Plan:', accountResponse.data.plan || 'N/A');
        }
        
    } catch (error) {
        console.log('⚠️  Account check failed:', error.message);
    }
    
    try {
        // Test 2: Simple Google search
        console.log('\n🧪 Test 2: Simple Google Search');
        const searchUrl = 'https://serpapi.com/search.json';
        const searchParams = {
            engine: 'google',
            q: 'test search',
            api_key: apiKey,
            num: 1
        };
        
        console.log('Request URL:', searchUrl);
        console.log('Request params:', { ...searchParams, api_key: apiKey.substring(0, 10) + '...' });
        
        const searchResponse = await axios.get(searchUrl, {
            params: searchParams,
            timeout: 15000
        });
        
        console.log('✅ Search API Response:');
        console.log('   Status:', searchResponse.status);
        
        if (searchResponse.data.error) {
            console.log('❌ Search Error:', searchResponse.data.error);
            return false;
        } else {
            console.log('   Has organic results:', !!searchResponse.data.organic_results);
            console.log('   Results count:', searchResponse.data.organic_results?.length || 0);
        }
        
    } catch (error) {
        console.error('❌ Search test failed:');
        console.error('   Message:', error.message);
        console.error('   Status:', error.response?.status);
        console.error('   Response:', error.response?.data);
        return false;
    }
    
    try {
        // Test 3: Google News search (what your app uses)
        console.log('\n🧪 Test 3: Google News Search');
        const newsUrl = 'https://serpapi.com/search.json';
        const newsParams = {
            engine: 'google_news',
            q: 'CHASE business news',
            api_key: apiKey,
            tbm: 'nws',
            tbs: 'qdr:m',
            num: 3
        };
        
        console.log('Request URL:', newsUrl);
        console.log('Request params:', { ...newsParams, api_key: apiKey.substring(0, 10) + '...' });
        
        const newsResponse = await axios.get(newsUrl, {
            params: newsParams,
            timeout: 15000
        });
        
        console.log('✅ News API Response:');
        console.log('   Status:', newsResponse.status);
        
        if (newsResponse.data.error) {
            console.log('❌ News Error:', newsResponse.data.error);
            console.log('🔍 Full error response:', JSON.stringify(newsResponse.data, null, 2));
            return false;
        } else {
            console.log('   Has news results:', !!newsResponse.data.news_results);
            console.log('   News count:', newsResponse.data.news_results?.length || 0);
            
            if (newsResponse.data.news_results?.length > 0) {
                console.log('   Sample news:', newsResponse.data.news_results[0].title);
            }
        }
        
        console.log('\n✅ All SerpAPI tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ News test failed:');
        console.error('   Message:', error.message);
        console.error('   Status:', error.response?.status);
        console.error('   Response:', error.response?.data);
        return false;
    }
}

// Run the test
testSerpAPI()
    .then(success => {
        if (success) {
            console.log('\n🎉 SerpAPI is working correctly!');
            console.log('🎯 Your API key should work in the main application');
        } else {
            console.log('\n❌ SerpAPI test failed');
            console.log('🎯 Check your API key at: https://serpapi.com/manage-api-key');
        }
    })
    .catch(error => {
        console.error('\n💥 Test script crashed:', error.message);
        console.error(error);
    })
    .finally(() => {
        console.log('\n🏁 Test completed');
    });

// Also add a simple sync test to ensure the script runs
console.log('📋 Script loaded successfully, starting async tests...');