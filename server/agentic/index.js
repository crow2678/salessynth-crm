// Complete fixed index.js with flexible API key handling
const path = require('path');
const fs = require('fs');

// Debug current execution context
console.log('🔍 Execution Context:');
console.log('   Current working directory:', process.cwd());
console.log('   Script location (__dirname):', __dirname);

// Try to find .env file in multiple locations
const possibleEnvPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../.env'),
    path.join(process.cwd(), '.env')
];

console.log('\n📁 Searching for .env file:');
let envPath = null;
let envFound = false;

possibleEnvPaths.forEach((testPath, index) => {
    const exists = fs.existsSync(testPath);
    const status = exists ? '✅ FOUND' : '❌ NOT FOUND';
    console.log(`   ${index + 1}. ${testPath} - ${status}`);
    
    if (exists && !envFound) {
        envPath = testPath;
        envFound = true;
    }
});

// Load .env from the found location
if (envFound) {
    console.log(`\n✅ Loading .env from: ${envPath}`);
    require("dotenv").config({ path: envPath });
} else {
    console.log('\n❌ No .env file found!');
    require("dotenv").config(); // Fallback to default behavior
}

// Flexible API key resolution with fallbacks
const getAPIKey = (primary, ...fallbacks) => {
    return process.env[primary] || fallbacks.find(key => process.env[key]) || null;
};

// Debug loaded environment variables with fallbacks
console.log('\n🔍 Environment Variables Status:');

const resolvedKeys = {
    'GOOGLE_API_KEY': getAPIKey('GOOGLE_API_KEY', 'SERPAPI_KEY'),
    'PDL_API_KEY': getAPIKey('PDL_API_KEY'),
    'OPENAI_API_KEY': getAPIKey('OPENAI_API_KEY', 'AZURE_OPENAI_API_KEY'),
    'MONGODB_URI': getAPIKey('MONGODB_URI', 'COSMOS_ENDPOINT'),
    'JWT_SECRET': getAPIKey('JWT_SECRET')
};

// Show which keys were used
console.log('\n📋 API Key Resolution:');
if (resolvedKeys.GOOGLE_API_KEY) {
    const source = process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'SERPAPI_KEY';
    console.log(`   🔑 Google API: Using ${source} = ${resolvedKeys.GOOGLE_API_KEY.substring(0, 8)}...`);
}

if (resolvedKeys.OPENAI_API_KEY) {
    const source = process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : 'AZURE_OPENAI_API_KEY';
    console.log(`   🔑 OpenAI API: Using ${source} = ${resolvedKeys.OPENAI_API_KEY.substring(0, 8)}...`);
}

let loadedCount = 0;
Object.entries(resolvedKeys).forEach(([key, value]) => {
    if (value) {
        const maskedValue = value.length > 8 ? 
            value.substring(0, 8) + '...' + ` (${value.length} chars)` : 
            value;
        console.log(`   ✅ ${key}: ${maskedValue}`);
        loadedCount++;
    } else {
        console.log(`   ❌ ${key}: NOT SET`);
    }
});

console.log(`\n📊 Summary: ${loadedCount}/${Object.keys(resolvedKeys).length} API keys loaded`);

// Check critical keys with fallbacks
const criticalKeyConfigs = [
    { name: 'GOOGLE_API_KEY', alternatives: ['SERPAPI_KEY'], description: 'Google News API' },
    { name: 'PDL_API_KEY', alternatives: [], description: 'People Data Labs API' },
    { name: 'MONGODB_URI', alternatives: ['COSMOS_ENDPOINT'], description: 'Database connection' }
];

const missingCritical = criticalKeyConfigs.filter(keyConfig => {
    const resolved = getAPIKey(keyConfig.name, ...keyConfig.alternatives);
    return !resolved;
});

if (missingCritical.length > 0) {
    console.log('\n❌ CRITICAL ERROR: Missing required API keys:');
    missingCritical.forEach(keyConfig => {
        console.log(`   - ${keyConfig.name} (${keyConfig.description})`);
        if (keyConfig.alternatives.length > 0) {
            console.log(`     Alternatives: ${keyConfig.alternatives.join(', ')}`);
        }
    });
    console.log('\n🎯 Please add these keys to your .env file and restart');
    console.log('📚 Where to get API keys:');
    console.log('   - GOOGLE_API_KEY/SERPAPI_KEY: https://serpapi.com/manage-api-key');
    console.log('   - PDL_API_KEY: https://www.peopledatalabs.com/');
    
    process.exit(1);
}

// Continue with normal execution
console.log('\n✅ All critical API keys loaded, continuing...');

// Set resolved keys back to environment for other modules to use
if (resolvedKeys.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY) {
    process.env.GOOGLE_API_KEY = resolvedKeys.GOOGLE_API_KEY;
    console.log('🔄 Set GOOGLE_API_KEY from SERPAPI_KEY for compatibility');
}

if (resolvedKeys.OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = resolvedKeys.OPENAI_API_KEY;
    console.log('🔄 Set OPENAI_API_KEY from AZURE_OPENAI_API_KEY for compatibility');
}

const express = require("express");
const { orchestrateResearch } = require("./orchestration/TaskOrchestrator");
const researchRoutes = require("./routes/researchRoutes");
require("./database/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/research", researchRoutes);

// Enhanced health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: {
            hasGoogleKey: !!resolvedKeys.GOOGLE_API_KEY,
            hasPDLKey: !!resolvedKeys.PDL_API_KEY,
            hasOpenAIKey: !!resolvedKeys.OPENAI_API_KEY,
            hasMongoURI: !!resolvedKeys.MONGODB_URI,
            resolvedKeys: {
                googleSource: process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'SERPAPI_KEY',
                openaiSource: process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : 'AZURE_OPENAI_API_KEY'
            }
        }
    });
});

console.log("\n🔄 Starting orchestrateResearch()...");

// Run research with better error handling
orchestrateResearch()
    .then(() => {
        console.log("🎯 Research orchestration completed successfully!");
    })
    .catch(err => {
        console.error("❌ Error in orchestrateResearch:", err.message);
        console.error("📊 Full error:", err);
        
        // Don't exit on research errors, keep server running
        console.log("🔄 Server will continue running despite research error");
    });

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔬 Research API: http://localhost:${PORT}/api/research`);
    
    // Show resolved API key sources
    console.log('\n🔑 Using API keys:');
    console.log(`   Google/SerpAPI: ${resolvedKeys.GOOGLE_API_KEY ? '✅' : '❌'}`);
    console.log(`   PDL API: ${resolvedKeys.PDL_API_KEY ? '✅' : '❌'}`);
    console.log(`   OpenAI API: ${resolvedKeys.OPENAI_API_KEY ? '✅' : '❌'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Shutting down gracefully...');
    process.exit(0);
});