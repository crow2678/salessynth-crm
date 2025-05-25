// diagnostic.js - Run this script to diagnose API issues
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

class APIDiagnostic {
  constructor() {
    this.results = {
      environment: {},
      apis: {},
      recommendations: []
    };
  }

  // Check environment variables
  checkEnvironment() {
    console.log('🔍 Checking environment variables...\n');
    
    const requiredVars = [
      'GOOGLE_API_KEY',
      'PDL_API_KEY', 
      'OPENAI_API_KEY',
      'MONGODB_URI',
      'JWT_SECRET'
    ];

    const optionalVars = [
      'SERPAPI_KEY',
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET'
    ];

    // Check required variables
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✅' : '❌';
      const masked = value ? `${value.substring(0, 8)}...` : 'NOT SET';
      
      console.log(`${status} ${varName}: ${masked}`);
      this.results.environment[varName] = {
        present: !!value,
        value: masked
      };

      if (!value) {
        this.results.recommendations.push(`Add ${varName} to your .env file`);
      }
    });

    console.log('\n📋 Optional variables:');
    optionalVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✅' : '⚪';
      const masked = value ? `${value.substring(0, 8)}...` : 'NOT SET';
      
      console.log(`${status} ${varName}: ${masked}`);
      this.results.environment[varName] = {
        present: !!value,
        value: masked
      };
    });
  }

  // Test SerpAPI
  async testSerpAPI() {
    console.log('\n🔍 Testing SerpAPI (Google News)...');
    
    const apiKey = process.env.GOOGLE_API_KEY || process.env.SERPAPI_KEY;
    
    if (!apiKey) {
      console.log('❌ No SerpAPI key found');
      this.results.apis.serpapi = { status: 'failed', error: 'No API key' };
      this.results.recommendations.push('Get SerpAPI key from https://serpapi.com/manage-api-key');
      return;
    }

    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_news',
          q: 'test search',
          api_key: apiKey,
          num: 1
        },
        timeout: 5000
      });

      if (response.data.error) {
        console.log('❌ SerpAPI Error:', response.data.error);
        this.results.apis.serpapi = { status: 'failed', error: response.data.error };
        
        if (response.data.error.includes('Invalid API key')) {
          this.results.recommendations.push('Check your SerpAPI key at https://serpapi.com/manage-api-key');
        }
      } else {
        console.log('✅ SerpAPI working correctly');
        this.results.apis.serpapi = { status: 'success' };
      }
    } catch (error) {
      console.log('❌ SerpAPI Request Failed:', error.message);
      this.results.apis.serpapi = { status: 'failed', error: error.message };
      
      if (error.response?.status === 401) {
        this.results.recommendations.push('Your SerpAPI key is invalid. Check https://serpapi.com/manage-api-key');
      }
    }
  }

  // Test PDL API
  async testPDL() {
    console.log('\n🔍 Testing People Data Labs API...');
    
    const apiKey = process.env.PDL_API_KEY;
    
    if (!apiKey) {
      console.log('❌ No PDL API key found');
      this.results.apis.pdl = { status: 'failed', error: 'No API key' };
      this.results.recommendations.push('Get PDL API key from https://www.peopledatalabs.com/');
      return;
    }

    try {
      const response = await axios.get('https://api.peopledatalabs.com/v5/company/search', {
        params: {
          query: 'test',
          size: 1
        },
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log('✅ PDL API working correctly');
      this.results.apis.pdl = { status: 'success' };
    } catch (error) {
      console.log('❌ PDL API Failed:', error.message);
      this.results.apis.pdl = { status: 'failed', error: error.message };
      
      if (error.response?.status === 401) {
        this.results.recommendations.push('Your PDL API key is invalid. Check https://www.peopledatalabs.com/');
      }
    }
  }

  // Test OpenAI API
  async testOpenAI() {
    console.log('\n🔍 Testing OpenAI API...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    
    if (!apiKey) {
      console.log('❌ No OpenAI API key found');
      this.results.apis.openai = { status: 'failed', error: 'No API key' };
      this.results.recommendations.push('Get OpenAI API key from https://platform.openai.com/api-keys');
      return;
    }

    try {
      const response = await axios.post(
        apiUrl,
        {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ OpenAI API working correctly');
      this.results.apis.openai = { status: 'success' };
    } catch (error) {
      console.log('❌ OpenAI API Failed:', error.message);
      this.results.apis.openai = { status: 'failed', error: error.message };
      
      if (error.response?.status === 401) {
        this.results.recommendations.push('Your OpenAI API key is invalid. Check https://platform.openai.com/api-keys');
      }
    }
  }

  // Generate .env file template
  generateEnvFile() {
    const envPath = path.join(process.cwd(), '.env.example');
    const envContent = `# SalesSynth API Configuration
# Copy this file to .env and fill in your actual API keys

# =================
# Required APIs
# =================

# SerpAPI for Google News (Get from: https://serpapi.com/manage-api-key)
GOOGLE_API_KEY=your_serpapi_key_here

# People Data Labs for company data (Get from: https://www.peopledatalabs.com/)
PDL_API_KEY=your_pdl_api_key_here

# OpenAI for AI summaries (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB/Cosmos DB connection string
MONGODB_URI=your_mongodb_connection_string_here

# JWT Secret for authentication (generate a random string)
JWT_SECRET=your_secure_jwt_secret_here

# =================
# Optional APIs
# =================

# LinkedIn API (Optional - for LinkedIn research)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# =================
# API URLs (Optional - defaults provided)
# =================
SERPAPI_URL=https://serpapi.com/search.json
PDL_API_URL=https://api.peopledatalabs.com/v5
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
`;

    try {
      fs.writeFileSync(envPath, envContent);
      console.log(`\n✅ Created .env.example file at: ${envPath}`);
      console.log('📝 Copy this file to .env and fill in your API keys');
    } catch (error) {
      console.log('❌ Failed to create .env.example:', error.message);
    }
  }

  // Print recommendations
  printRecommendations() {
    console.log('\n🎯 Recommendations:');
    
    if (this.results.recommendations.length === 0) {
      console.log('✅ All APIs are configured correctly!');
      return;
    }

    this.results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n📚 API Documentation:');
    console.log('• SerpAPI: https://serpapi.com/google-news-api');
    console.log('• People Data Labs: https://docs.peopledatalabs.com/');
    console.log('• OpenAI: https://platform.openai.com/docs/');
  }

  // Run full diagnostic
  async runDiagnostic() {
    console.log('🚀 SalesSynth API Diagnostic Starting...\n');
    console.log('=' .repeat(50));
    
    this.checkEnvironment();
    
    await this.testSerpAPI();
    await this.testPDL();
    await this.testOpenAI();
    
    console.log('\n' + '='.repeat(50));
    this.printRecommendations();
    
    this.generateEnvFile();
    
    console.log('\n🏁 Diagnostic Complete!');
    
    // Save results to file
    const resultsPath = path.join(process.cwd(), 'api-diagnostic-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Results saved to: ${resultsPath}`);
  }
}

// Quick fix function for immediate issues
async function quickFix() {
  console.log('🔧 Quick Fix Mode - Checking most common issues...\n');
  
  // Check if .env file exists
  const envExists = fs.existsSync('.env');
  console.log(`📁 .env file exists: ${envExists ? '✅' : '❌'}`);
  
  if (!envExists) {
    console.log('❌ No .env file found! This is likely your main issue.');
    console.log('📝 Creating .env template...');
    
    const diagnostic = new APIDiagnostic();
    diagnostic.generateEnvFile();
    
    console.log('\n🎯 Next steps:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Fill in your actual API keys');
    console.log('3. Restart your application');
    return;
  }
  
  // Quick API key check
  const requiredKeys = ['GOOGLE_API_KEY', 'PDL_API_KEY', 'OPENAI_API_KEY'];
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    console.log('❌ Missing API keys:', missingKeys.join(', '));
    console.log('\n🎯 Add these keys to your .env file:');
    missingKeys.forEach(key => {
      console.log(`${key}=your_${key.toLowerCase()}_here`);
    });
  } else {
    console.log('✅ All required API keys are present');
    console.log('🔄 Running full diagnostic...');
    
    const diagnostic = new APIDiagnostic();
    await diagnostic.runDiagnostic();
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    quickFix();
  } else {
    const diagnostic = new APIDiagnostic();
    diagnostic.runDiagnostic();
  }
}

module.exports = { APIDiagnostic, quickFix };