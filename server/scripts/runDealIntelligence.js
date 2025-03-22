// runDealIntelligence.js
require('dotenv').config();
const { generateDealIntelligence, processAllClientDeals } = require('../agentic/research/DealSummary');

// Function to process a specific client
async function runForClient(clientId, userId) {
  console.log(`Starting deal intelligence generation for client: ${clientId}`);
  try {
    const result = await generateDealIntelligence(clientId, userId);
    console.log(`Deal intelligence generation ${result ? 'successful' : 'failed'}`);
  } catch (error) {
    console.error('Error generating deal intelligence:', error);
  }
  process.exit();
}

// Function to process all clients
async function runForAllClients() {
  console.log('Starting batch deal intelligence generation for all clients');
  try {
    await processAllClientDeals();
    console.log('Batch deal intelligence generation completed');
  } catch (error) {
    console.error('Error in batch processing:', error);
  }
  process.exit();
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage:');
  console.log('  node runDealIntelligence.js all                   - Process all clients');
  console.log('  node runDealIntelligence.js client [clientId] [userId] - Process specific client');
  process.exit(1);
}

const command = args[0];
if (command === 'all') {
  runForAllClients();
} else if (command === 'client' && args.length === 3) {
  const clientId = args[1];
  const userId = args[2];
  runForClient(clientId, userId);
} else {
  console.log('Invalid command or missing arguments');
  process.exit(1);
}