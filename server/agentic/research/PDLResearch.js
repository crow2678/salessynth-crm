// PDLResearch.js
// People Data Labs (PDL) integration for SalesSynth

require('dotenv').config();
const axios = require('axios');
const { Client, Research } = require('../database/db');

// PDL API configuration
const PDL_API_KEY = process.env.PDL_API_KEY;
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';

// Track running operations to prevent duplicates
const pendingOperations = new Set();

/**
 * Main function to fetch PDL research data for a company
 * Returns data in a format consistent with other research modules
 * @param {string} companyName - The company name to research
 * @param {string} clientId - The MongoDB ID of the client
 * @param {string} userId - The user ID who initiated the research
 * @returns {Promise<Object>} Research results
 */
async function runPDLResearch(companyName, clientId, userId) {
  try {
    const operationKey = `pdl-${clientId}-${userId}`;
    
    // Prevent duplicate research operations
    if (pendingOperations.has(operationKey)) {
      console.log(`PDL research already in progress for client ${clientId}`);
      return null;
    }
    
    pendingOperations.add(operationKey);
    
    console.log(`🔍 Starting PDL research for client ${clientId} (company: ${companyName})`);
    
    // Get client data to determine what to enrich
    const client = await Client.findById(clientId);
    if (!client) {
      console.error(`Client not found: ${clientId}`);
      pendingOperations.delete(operationKey);
      return null;
    }
    
    // Run both person and company research in parallel
    const [personData, companyData] = await Promise.all([
      getPersonData(client),
      getCompanyData(companyName)
    ]);
    
    // Create a research result object (directly in the format needed for storage)
    const pdlResearch = {
      personData: personData.success ? personData.data : null,
      companyData: companyData.success ? companyData.data : null,
      timestamp: new Date(),
      company: companyName,
      clientId: clientId,
      userId: userId
    };
    
    // Update the lastUpdated field in the research collection
    await updateResearchTimestamp(clientId, userId);
    
    pendingOperations.delete(operationKey);
    
    // Return the data directly (not wrapped in a success object)
    // This makes it consistent with other research modules
    return pdlResearch;
  } catch (error) {
    console.error(`PDL research error for client ${clientId}:`, error);
    pendingOperations.delete(`pdl-${clientId}-${userId}`);
    return null;
  }
}

/**
 * Get person data from PDL API
 * @param {Object} client - Client data from SalesSynth
 * @returns {Promise<Object>} Person data
 */
async function getPersonData(client) {
  try {
    console.log(`Getting PDL person data for: ${client.name}`);
    
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
    
    // Check for quality of match
    if (data.likelihood < 0.7) {
      console.log(`Low confidence match (${data.likelihood}) for ${client.name}`);
      return {
        success: false,
        message: 'Low confidence match',
        likelihood: data.likelihood
      };
    }
    
    console.log(`✅ Person data retrieved for ${client.name} (likelihood: ${data.likelihood})`);
    
    return {
      success: true,
      data,
      likelihood: data.likelihood
    };
  } catch (error) {
    console.error('Person data retrieval error:', error.response?.data || error.message);
    return { success: false, message: 'Error retrieving person data' };
  }
}

/**
 * Get company data from PDL API
 * @param {string} companyName - Company name to look up
 * @returns {Promise<Object>} Company data
 */
async function getCompanyData(companyName) {
  if (!companyName) {
    return { success: false, message: 'Company name is required' };
  }
  
  try {
    console.log(`Getting PDL company data for: ${companyName}`);
    
    const response = await axios.get(`${PDL_BASE_URL}/company/enrich`, {
      params: { name: companyName },
      headers: {
        'X-API-Key': PDL_API_KEY
      }
    });
    
    const data = response.data;
    
    console.log(`✅ Company data retrieved for ${companyName}`);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Company data retrieval error:', error.response?.data || error.message);
    return { success: false, message: 'Error retrieving company data' };
  }
}

/**
 * Update the lastUpdated timestamp in the research collection
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function updateResearchTimestamp(clientId, userId) {
  try {
    const now = new Date();
    
    // Check if research document exists
    const existingResearch = await Research.findOne({ clientId, userId });
    
    if (existingResearch) {
      // Update only the timestamp fields
      await Research.updateOne(
        { clientId, userId },
        {
          $set: {
            'lastUpdatedPDL': now,
            'lastUpdated.pdl': now
          }
        }
      );
    }
    
    console.log(`✅ PDL research timestamp updated for client ${clientId}`);
  } catch (error) {
    console.error('Error updating research timestamp:', error);
  }
}

/**
 * Find similar profiles to a given client
 * @param {string} clientId - Client ID to find similar profiles for
 * @param {number} limit - Maximum number of profiles to return
 * @returns {Promise<Object>} Similar profiles
 */
async function findSimilarProfiles(clientId, limit = 5) {
  try {
    const client = await Client.findById(clientId);
    
    if (!client || !client.company || !client.position) {
      return { success: false, message: 'Insufficient client data' };
    }
    
    // Extract position keyword (e.g., "Manager" from "Product Manager")
    const positionKeywords = client.position.split(' ');
    const positionKeyword = positionKeywords.length > 1 ? 
      positionKeywords[positionKeywords.length - 1] : 
      client.position;
    
    // Create SQL query
    const sqlQuery = `
      SELECT *
      FROM person
      WHERE company = '${client.company}'
      AND job_title LIKE '%${positionKeyword}%'
      LIMIT ${limit}
    `;
    
    const response = await axios.get(`${PDL_BASE_URL}/person/search`, {
      params: { sql: sqlQuery },
      headers: {
        'X-API-Key': PDL_API_KEY
      }
    });
    
    return {
      success: true,
      total: response.data.total,
      profiles: response.data.data
    };
  } catch (error) {
    console.error('Error finding similar profiles:', error);
    return { success: false, message: 'Error finding similar profiles' };
  }
}

/**
 * Update client record with PDL data
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} Update result
 */
async function updateClientWithPDLData(clientId) {
  try {
    // Get research data
    const research = await Research.findOne({ clientId });
    
    if (!research || !research.data || !research.data.pdl) {
      return { success: false, message: 'No PDL data found' };
    }
    
    const pdlData = research.data.pdl;
    
    // Fields to update
    const updateFields = {};
    
    // Update person fields
    if (pdlData.personData) {
      if (pdlData.personData.full_name) updateFields.name = pdlData.personData.full_name;
      if (pdlData.personData.job_title) updateFields.position = pdlData.personData.job_title;
      if (pdlData.personData.work_email) updateFields.email = pdlData.personData.work_email;
      if (pdlData.personData.work_phone) updateFields.phone = pdlData.personData.work_phone;
      if (pdlData.personData.location_name) updateFields.location = pdlData.personData.location_name;
      
      // Add LinkedIn URL if available
      if (pdlData.personData.linkedin_url) updateFields.linkedinUrl = pdlData.personData.linkedin_url;
      
      // Store PDL person ID for future reference
      if (pdlData.personData.id) updateFields.pdlPersonId = pdlData.personData.id;
    }
    
    // Update company fields
    if (pdlData.companyData) {
      if (pdlData.companyData.name) updateFields.company = pdlData.companyData.name;
      if (pdlData.companyData.website) updateFields.companyWebsite = pdlData.companyData.website;
      if (pdlData.companyData.industry) updateFields.industry = pdlData.companyData.industry;
      
      // Store company size if available
      if (pdlData.companyData.size) updateFields.companySize = pdlData.companyData.size;
      
      // Store PDL company ID for future reference
      if (pdlData.companyData.id) updateFields.pdlCompanyId = pdlData.companyData.id;
    }
    
    // Mark as enriched by PDL
    updateFields.pdlEnriched = true;
    updateFields.pdlEnrichmentDate = new Date();
    
    // Update client record
    await Client.findByIdAndUpdate(clientId, { $set: updateFields });
    
    return {
      success: true,
      updatedFields: Object.keys(updateFields)
    };
  } catch (error) {
    console.error('Error updating client with PDL data:', error);
    return { success: false, message: 'Error updating client' };
  }
}

module.exports = {
  runPDLResearch,
  findSimilarProfiles,
  updateClientWithPDLData
};