// test-pdl.js
// Test script for PDL integration with SalesSynth

require('dotenv').config();
const axios = require('axios');

// PDL API configuration - read directly from env
const PDL_API_KEY = process.env.PDL_API_KEY;
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';

// Check if PDL_API_KEY is set
if (!PDL_API_KEY) {
  console.error('Error: PDL_API_KEY is not set in your .env file');
  console.error('Please add your People Data Labs API key to continue');
  process.exit(1);
}

// Test client data for PDL research
const TEST_CLIENTS = [
  {
    _id: '1',
    name: 'Paul Gorske',
    email: 'paul.gorske@swbc.com',
    company: 'SWBC Bank',
    position: 'CIO'
  }
];

// Use test client only, no database access
async function getTestClient() {
  console.log(`Using test client: ${TEST_CLIENTS[0].name} (${TEST_CLIENTS[0].email}) at ${TEST_CLIENTS[0].company}`);
  return TEST_CLIENTS[0];
}

// Test PDL person enrichment
async function testPersonEnrichment(client) {
  console.log('\n=== Testing PDL Person Enrichment ===');
  
  try {
    console.log(`Getting PDL person data for: ${client.name} (${client.email})`);
    
    // Determine which params to use for lookup
    const params = {};
    
    if (client.email) {
      console.log(`Using email: ${client.email}`);
      params.email = client.email;
    } else if (client.name && client.company) {
      console.log(`Using name: ${client.name} and company: ${client.company}`);
      params.name = client.name;
      params.company = client.company;
    } else {
      console.log('Insufficient data for person enrichment');
      return { success: false, message: 'Insufficient data for enrichment' };
    }
    
    // Call PDL API
    const response = await axios.get(`${PDL_BASE_URL}/person/enrich`, {
      params,
      headers: {
        'X-API-Key': PDL_API_KEY
      }
    });
    
    const data = response.data;
    
    // Log complete raw response for debugging
    console.log('\nComplete API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Log person data
    console.log('\nPerson Data Results:');
    console.log(`Match likelihood: ${data.likelihood}`);
    console.log(`Full name: ${data.full_name || 'N/A'}`);
    console.log(`Job title: ${data.job_title || 'N/A'}`);
    console.log(`Company: ${data.job_company_name || 'N/A'}`);
    console.log(`LinkedIn: ${data.linkedin_url || 'N/A'}`);
    console.log(`Location: ${data.location_name || 'N/A'}`);
    
    // Log skills if available
    if (data.skills && data.skills.length > 0) {
      console.log(`Skills: ${data.skills.slice(0, 5).join(', ')}`);
    }
    
    // Log experience if available
    if (data.experience && data.experience.length > 0) {
      console.log('\nExperience:');
      data.experience.slice(0, 3).forEach((exp, i) => {
        console.log(`  ${i+1}. ${exp.title} at ${exp.company} (${exp.start_date || 'Unknown'} to ${exp.end_date || 'Present'})`);
      });
    }
    
    console.log('\nPerson enrichment successful!');
    return { success: true, data };
    
  } catch (error) {
    console.error('Person enrichment error:', error.response?.data || error.message);
    return { success: false, message: 'Error retrieving person data' };
  }
}

// Test PDL company enrichment
async function testCompanyEnrichment(client) {
  console.log('\n=== Testing PDL Company Enrichment ===');
  
  if (!client.company) {
    console.log('Company name is required');
    return { success: false, message: 'Company name is required' };
  }
  
  try {
    console.log(`Getting PDL company data for: ${client.company}`);
    
    const response = await axios.get(`${PDL_BASE_URL}/company/enrich`, {
      params: { name: client.company },
      headers: {
        'X-API-Key': PDL_API_KEY
      }
    });
    
    const data = response.data;
    
    // Log company data
    console.log('\nCompany Data Results:');
    console.log(`Name: ${data.name}`);
    console.log(`Website: ${data.website || 'N/A'}`);
    console.log(`Domain: ${data.domain || 'N/A'}`);
    console.log(`Industry: ${data.industry || 'N/A'}`);
    console.log(`Size: ${data.size || 'Unknown'}`);
    console.log(`Founded: ${data.founded || 'Unknown'}`);
    console.log(`Location: ${data.location?.name || 'Unknown'}`);
    console.log(`LinkedIn: ${data.linkedin_url || 'N/A'}`);
    
    // Log funding if available
    if (data.total_funding_amount) {
      console.log(`Total Funding: $${data.total_funding_amount.toLocaleString()}`);
    }
    
    console.log('\nCompany enrichment successful!');
    return { success: true, data };
    
  } catch (error) {
    console.error('Company enrichment error:', error.response?.data || error.message);
    return { success: false, message: 'Error retrieving company data' };
  }
}

// Test finding similar profiles using PDL Bulk Enrichment API
async function testBulkSearch(client) {
  console.log('\n=== Testing PDL Bulk Search for Similar Profiles ===');
  
  if (!client.company) {
    console.log('Company name is required');
    return { success: false, message: 'Company name is required' };
  }
  
  try {
    console.log(`Finding profiles at company: ${client.company}`);
    
    // We'll create 5 "fake" profiles all from the same company
    // PDL will try to match and enrich these
    const profiles = [
      { company: client.company, title: "CTO" },
      { company: client.company, title: "CEO" },
      { company: client.company, title: "CFO" },
      { company: client.company, title: "COO" },
      { company: client.company, title: "CIO" }
    ];
    
    console.log(`Searching for ${profiles.length} executive profiles at ${client.company}`);
    
    const response = await axios.post(`${PDL_BASE_URL}/person/bulk_enrich`, 
      { 
        requests: profiles.map(p => ({ 
          params: { company: p.company, title: p.title },
          metadata: { title: p.title }
        }))
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': PDL_API_KEY
        }
      }
    );
    
    const data = response.data;
    console.log(`\nReceived ${data.length} results from bulk enrichment`);
    
    // Process results (only successful ones)
    const successfulMatches = data.filter(result => 
      result.status === 200 && result.person && result.person.full_name
    );
    
    if (successfulMatches.length > 0) {
      console.log(`\nFound ${successfulMatches.length} executives at ${client.company}:`);
      
      successfulMatches.forEach((match, i) => {
        const person = match.person;
        const requestedTitle = match.metadata?.title || 'Unknown';
        
        console.log(`\nProfile ${i+1} (requested title: ${requestedTitle}):`);
        console.log(`Name: ${person.full_name}`);
        console.log(`Title: ${person.job_title || 'N/A'}`);
        console.log(`LinkedIn: ${person.linkedin_url || 'N/A'}`);
        console.log(`Location: ${person.location_name || 'N/A'}`);
      });
      
      console.log('\nBulk search successful!');
      return { success: true, profiles: successfulMatches.map(m => m.person) };
    } else {
      console.log(`No matching profiles found at ${client.company}`);
      return { success: true, profiles: [] };
    }
    
  } catch (error) {
    console.error('Bulk search error:', error.response?.data || error.message);
    return { success: false, message: 'Error finding similar profiles' };
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting PDL integration tests...');
  console.log('Using People Data Labs API Key:', PDL_API_KEY.substring(0, 4) + '********************');
  
  try {
    // Get test client
    const client = await getTestClient();
    
    // Test person enrichment
    const personResult = await testPersonEnrichment(client);
    
    // Test company enrichment
    const companyResult = await testCompanyEnrichment(client);
    
    // Test bulk search for similar profiles
    await testBulkSearch(client);
    
    console.log('\n=== PDL Integration Tests Completed ===');
    
    return {
      personSuccess: personResult.success,
      companySuccess: companyResult.success,
      overallSuccess: personResult.success && companyResult.success
    };
  } catch (error) {
    console.error('Test execution failed:', error);
    return {
      personSuccess: false,
      companySuccess: false,
      overallSuccess: false,
      error: error.message
    };
  }
}

// Run the tests
runAllTests();