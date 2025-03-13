const { Research, Client } = require('../database/db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Load config.json dynamically
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Dynamically load research modules based on config.json
const researchModules = {};

if (config.research_modules.google) {
    researchModules.google = require('./GoogleResearch');
}

if (config.research_modules.apollo) {
    researchModules.apollo = require('./ApolloResearch');
}

if (config.research_modules.reddit) {
    researchModules.reddit = require('./RedditResearch');
}

// Add PDL research module if enabled in config
if (config.research_modules.pdl) {
    researchModules.pdl = require('./PDLResearch').runPDLResearch;
}

// GPT-4 API details
const OPENAI_API_URL = "https://88f.openai.azure.com/openai/deployments/88FGPT4o/chat/completions?api-version=2024-02-15-preview";
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

// Prevent duplicate research runs
const runningResearch = new Set();
/**
 * Extract technical terms and key stakeholders from client notes and research data
 * @param {Object} clientDetails - Client information
 * @param {Object} researchData - Aggregated research data
 * @return {Object} - Extracted information
 */
function extractIntelligenceInfo(clientDetails, researchData) {
    const result = {
        technicalTerms: [],
        systemNames: [],
        metrics: [],
        keyPeople: [],
        companyDetails: {},
        dealInfo: {}
    };
    
    // Extract system names (CamelCase or ALL_CAPS words) from notes
    if (clientDetails.notes) {
        const systemPattern = /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+|\b[A-Z]{2,})\b/g;
        const matches = [...clientDetails.notes.matchAll(systemPattern)];
        
        result.systemNames = matches
            .map(match => match[1])
            .filter(name => 
                !['JavaScript', 'TypeScript', 'MongoDB', 'Monday', 'Tuesday', 'Wednesday', 
                'Thursday', 'Friday', 'January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'].includes(name)
            );
        
        // Extract metrics (numbers with units or percentages)
        const metricPatterns = [
            /\b\d+%\b/g,                     // Percentages
            /\$\s*[\d,]+(?:\.\d+)?/g,        // Dollar amounts
            /\b\d+\s*(?:K|M|B|k|m|bn)\b/g,   // Numbers with K, M, B suffixes
            /\b\d+\s*(?:hour|day|week|month|year)s?\b/gi  // Time periods
        ];
        
        result.metrics = metricPatterns
            .flatMap(pattern => [...(clientDetails.notes.match(pattern) || [])])
            .map(match => match.trim());
        
        // Extract potential stakeholders (capitalized names)
        const namePattern = /\b([A-Z][A-Z]+(?:\s+[A-Z][A-Za-z]+)?)\b/g;
        const nameMatches = [...clientDetails.notes.matchAll(namePattern)];
        result.keyPeople = nameMatches
            .map(match => match[1])
            .filter(name => 
                name !== clientDetails.company && 
                !['SOW', 'QE', 'POD', 'API', 'SDK', 'THE', 'OUR', 'THEIR', 'YOUR'].includes(name)
            );
    }
    
    // Add the client's name if available
    if (clientDetails.name) {
        result.keyPeople.push(clientDetails.name);
    }
    
    // Company details
    result.companyDetails = {
        name: clientDetails.company || "Unknown",
        industry: clientDetails.industry || "unknown"
    };
    
    // Add PDL company details if available
    if (researchData && researchData.pdl && researchData.pdl.companyData) {
        result.companyDetails.size = researchData.pdl.companyData.size || result.companyDetails.size;
        result.companyDetails.industry = researchData.pdl.companyData.industry || result.companyDetails.industry;
        result.companyDetails.founded = researchData.pdl.companyData.founded_year;
        result.companyDetails.location = researchData.pdl.companyData.location;
    }
    
    // Deal information
    if (clientDetails.deals && clientDetails.deals.length > 0) {
        const primaryDeal = clientDetails.deals[0];
        result.dealInfo = {
            title: primaryDeal.title,
            value: primaryDeal.value,
            status: primaryDeal.status,
            expectedCloseDate: primaryDeal.expectedCloseDate
        };
    }
    
    return result;
}

/**
 * Determine the client's industry based on available information
 * @param {Object} clientDetails - Client information
 * @param {Object} researchData - Research data
 * @return {string} - Identified industry
 */
function determineIndustry(clientDetails, researchData) {
    // Common industries to check for
    const industries = [
        'finance', 'fintech', 'banking', 'insurance', 'healthcare', 
        'technology', 'saas', 'software', 'manufacturing', 'retail', 
        'education', 'government', 'nonprofit', 'media', 'telecommunications',
        'real estate', 'construction', 'automotive', 'energy', 'hospitality'
    ];
    
    // First check for PDL industry data, which is most reliable
    if (researchData?.pdl?.companyData?.industry) {
        return researchData.pdl.companyData.industry.toLowerCase();
    }
    
    let foundIndustry = '';
    
    // Check company name and notes
    const textToSearch = `${clientDetails.company || ''} ${clientDetails.notes || ''}`.toLowerCase();
    
    for (const industry of industries) {
        if (textToSearch.includes(industry)) {
            foundIndustry = industry;
            break;
        }
    }
    
    // If no industry found, check research data
    if (!foundIndustry && researchData) {
        // Check in Google news titles and snippets
        if (researchData.google && Array.isArray(researchData.google)) {
            const googleText = researchData.google
                .map(item => `${item.title || ''} ${item.snippet || ''}`)
                .join(' ')
                .toLowerCase();
                
            for (const industry of industries) {
                if (googleText.includes(industry)) {
                    foundIndustry = industry;
                    break;
                }
            }
        }
        
        // If still not found, check Reddit posts
        if (!foundIndustry && researchData.reddit && Array.isArray(researchData.reddit)) {
            const redditText = researchData.reddit
                .map(post => post.title || '')
                .join(' ')
                .toLowerCase();
                
            for (const industry of industries) {
                if (redditText.includes(industry)) {
                    foundIndustry = industry;
                    break;
                }
            }
        }
    }
    
    return foundIndustry || 'unknown';
}

/**
 * Process and structure research data for better usage
 * @param {Object} data - Raw research data
 * @return {Object} - Processed research data
 */
function processResearchData(data) {
    const result = {
        companyInsights: [],
        recentNews: [],
        socialMentions: [],
        technicalDetails: []
    };
    
    // Process Google news data
    if (data.google && Array.isArray(data.google)) {
        result.recentNews = data.google.map(item => ({
            title: item.title,
            source: item.source,
            date: item.publishedDate,
            summary: item.snippet,
            url: item.url
        })).filter(item => item.title && item.summary);
    }
    
    // Process Reddit data
    if (data.reddit && Array.isArray(data.reddit)) {
        result.socialMentions = data.reddit.map(post => ({
            title: post.title,
            source: `r/${post.subreddit}`,
            engagement: `${post.upvotes || 0} upvotes, ${post.comments || 0} comments`,
            sentiment: post.sentiment || 'neutral',
            url: post.url
        })).filter(post => post.title);
    }
    
    // Process PDL data if available
    if (data.pdl) {
        // Add company data
        if (data.pdl.companyData) {
            result.companyInsights.push({
                type: 'pdl',
                name: data.pdl.companyData.name,
                industry: data.pdl.companyData.industry,
                size: data.pdl.companyData.size,
                location: data.pdl.companyData.location_name,
                founded: data.pdl.companyData.founded_year
            });
        }
        
        // Add key people data
        if (data.pdl.personData) {
            const person = data.pdl.personData;
            if (person.skills && Array.isArray(person.skills)) {
                person.skills.forEach(skill => {
                    if (!result.technicalDetails.includes(skill)) {
                        result.technicalDetails.push(skill);
                    }
                });
            }
        }
    }
    
    // Extract technical details across all sources
    const technicalTerms = new Set();
    
    // From news
    result.recentNews.forEach(news => {
        const techPattern = /\b(?:API|SDK|platform|system|software|framework|database|cloud|integration|microservices|architecture)\b/gi;
        let match;
        
        const text = `${news.title} ${news.summary}`;
        while ((match = techPattern.exec(text)) !== null) {
            technicalTerms.add(match[0]);
        }
    });
    
    // From social
    result.socialMentions.forEach(post => {
        const techPattern = /\b(?:API|SDK|platform|system|software|framework|database|cloud|integration|microservices|architecture)\b/gi;
        let match;
        
        while ((match = techPattern.exec(post.title)) !== null) {
            technicalTerms.add(match[0]);
        }
    });
    
    // Add extracted technical terms
    result.technicalDetails = [...result.technicalDetails, ...Array.from(technicalTerms)];
    
    return result;
}
/**
 * Create a highly structured and targeted LLM prompt based on client data and research
 * @param {Object} clientDetails - Client information
 * @param {Object} researchData - Research data from various sources
 * @param {Object} intelligenceInfo - Extracted intelligence information
 * @return {string} - Structured prompt for LLM
 */
function createSalesIntelligencePrompt(researchData, clientDetails, intelligenceInfo) {
    // Extract key information
    const clientName = clientDetails.name || "Unknown";
    const position = clientDetails.position || "Unknown";
    const company = clientDetails.company || "Unknown";
    const notes = clientDetails.notes || "";
    
    // Extract system names for prompt
    const systemNames = intelligenceInfo.systemNames.length > 0 
        ? `- **Key Systems:** ${intelligenceInfo.systemNames.join(', ')}`
        : '';
    
    // Format metrics for prompt
    const metrics = intelligenceInfo.metrics.length > 0
        ? `- **Key Metrics:** ${intelligenceInfo.metrics.join(', ')}`
        : '';
    
    // Deal information
    let dealInfo = "- No active deals";
    if (intelligenceInfo.dealInfo && Object.keys(intelligenceInfo.dealInfo).length > 0) {
        const deal = intelligenceInfo.dealInfo;
        dealInfo = `
- **Deal Title:** ${deal.title || 'Unnamed Opportunity'}
- **Value:** $${(deal.value || 0).toLocaleString()}
- **Stage:** ${deal.status || 'Unknown'}
- **Expected Close:** ${deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'Not specified'}`;
    }
    
    // Key people
    const peopleList = intelligenceInfo.keyPeople.length > 0
        ? intelligenceInfo.keyPeople.map(person => `- ${person}`).join('\n')
        : "- No key people identified";
    
    // Research information
    let researchInfo = "";
    if (researchData.google && Array.isArray(researchData.google) && researchData.google.length > 0) {
        researchInfo += "\n### Recent News\n";
        researchData.google.slice(0, 3).forEach(item => {
            if (item.title && item.snippet) {
                researchInfo += `- **${item.title}**: ${item.snippet.substring(0, 100)}...\n`;
            }
        });
    }
    
    if (researchData.reddit && Array.isArray(researchData.reddit) && researchData.reddit.length > 0) {
        researchInfo += "\n### Social Media Mentions\n";
        researchData.reddit.slice(0, 3).forEach(post => {
            if (post.title) {
                researchInfo += `- **r/${post.subreddit || 'unknown'}**: "${post.title}"\n`;
            }
        });
    }
    
    if (researchData.apollo?.company) {
        const company = researchData.apollo.company;
        researchInfo += "\n### Company Information\n";
        researchInfo += `- **Industry:** ${company.industry || 'Unknown'}\n`;
        researchInfo += `- **Size:** ${company.size || 'Unknown'}\n`;
        researchInfo += `- **Revenue:** ${company.revenue || 'Unknown'}\n`;
        
        if (researchData.apollo.insights?.growthIndicators?.length > 0) {
            researchInfo += "- **Growth Indicators:** " + 
                researchData.apollo.insights.growthIndicators.join(', ') + "\n";
        }
        
        if (researchData.apollo.insights?.buyingSignals?.length > 0) {
            researchInfo += "- **Buying Signals:** " + 
                researchData.apollo.insights.buyingSignals.join(', ') + "\n";
        }
    }
    
    // Add PDL data if available
    if (researchData.pdl) {
        // Add company data
        if (researchData.pdl.companyData) {
            const companyData = researchData.pdl.companyData;
            researchInfo += "\n### Company Intelligence (PDL)\n";
            
            if (companyData.industry) {
                researchInfo += `- **Industry:** ${companyData.industry}\n`;
            }
            
            if (companyData.size) {
                researchInfo += `- **Size:** ${companyData.size} employees\n`;
            }
            
            if (companyData.founded_year) {
                researchInfo += `- **Founded:** ${companyData.founded_year}\n`;
            }
            
            if (companyData.location_name) {
                researchInfo += `- **Headquarters:** ${companyData.location_name}\n`;
            }
        }
        
        // Add person data
        if (researchData.pdl.personData) {
            const personData = researchData.pdl.personData;
            researchInfo += "\n### Contact Intelligence (PDL)\n";
            
            if (personData.experience && Array.isArray(personData.experience) && personData.experience.length > 0) {
                const currentRole = personData.experience[0];
                researchInfo += `- **Current Role:** ${currentRole.title || 'Unknown'} (since ${currentRole.start_date || 'Unknown'})\n`;
                
                if (personData.experience.length > 1) {
                    researchInfo += `- **Previous:** ${personData.experience[1].title || 'Unknown'} at ${personData.experience[1].company || 'Unknown'}\n`;
                }
            }
            
            if (personData.skills && Array.isArray(personData.skills) && personData.skills.length > 0) {
                researchInfo += `- **Skills:** ${personData.skills.slice(0, 5).join(', ')}\n`;
            }
            
            if (personData.education && Array.isArray(personData.education) && personData.education.length > 0) {
                const education = personData.education[0];
                researchInfo += `- **Education:** ${education.school} (${education.degree || 'Degree unknown'})\n`;
            }
        }
    }
    
    // Build the complete prompt
    return `
# SALES INTELLIGENCE BRIEF

You are a strategic B2B sales advisor specializing in technical sales. Your task is to generate highly specific, actionable sales intelligence for the sales executive working with this client.

## CLIENT INFORMATION
- **Name:** ${clientName}
- **Position:** ${position}
- **Company:** ${company}
${systemNames}
${metrics}
${dealInfo}

## KEY STAKEHOLDERS
${peopleList}

## CLIENT NOTES
${notes}

## RESEARCH INSIGHTS
${researchInfo}

Based on this information, provide THREE highly specific, actionable sales insights in the following format:

## 1️⃣ TAILORED ENGAGEMENT STRATEGY
* Clear bullet point 1 - Focusing on specific client needs
* Clear bullet point 2 - Addressing client pain points
* Brief explanation of why this approach will resonate with the client

## 2️⃣ STRATEGIC OBJECTION HANDLING
* Clear bullet point 1 - Anticipating likely pushback in current deal stage
* Clear bullet point 2 - Providing evidence-based counterpoints
* Brief explanation of psychological/business reasons behind objections

## 3️⃣ COMPETITIVE POSITIONING
* Clear bullet point 1 - Highlighting direct advantage over competitors
* Clear bullet point 2 - Demonstrating unique value proposition
* Brief explanation of how to frame these advantages in client's terms

FORMAT REQUIREMENTS:
1. KEEP ALL BULLET POINTS UNDER 20 WORDS FOR READABILITY
2. USE THE CLIENT'S EXACT TERMINOLOGY AND SYSTEMS WHERE POSSIBLE
3. INCLUDE AT LEAST ONE SPECIFIC METRIC OR QUANTIFIABLE BENEFIT IN EACH SECTION
4. REFERENCE KEY STAKEHOLDERS BY NAME WHEN RELEVANT`;
}

/**
 * Build the client section of the prompt
 * @param {Object} clientDetails - Client information
 * @param {Object} intelligenceInfo - Extracted intelligence
 * @return {string} - Formatted client section
 */
function buildClientSection(clientDetails, intelligenceInfo) {
    // Extract client information
    const clientName = clientDetails.name || 'Unknown';
    const position = clientDetails.position || 'Unknown';
    const company = clientDetails.company || intelligenceInfo.companyDetails.name || 'Unknown';
    const industry = intelligenceInfo.companyDetails.industry || 'Unknown';
    
    // Format system names for inclusion
    const systemNames = intelligenceInfo.systemNames.length > 0 
        ? `- **Systems Mentioned:** ${intelligenceInfo.systemNames.join(', ')}`
        : '';
    
    // Format metrics for inclusion
    const metrics = intelligenceInfo.metrics.length > 0
        ? `- **Key Metrics Mentioned:** ${intelligenceInfo.metrics.join(', ')}`
        : '';
    
    // Format notes if available
    const notesSection = clientDetails.notes
        ? `\n\n**Client Notes:**\n${clientDetails.notes}`
        : '';
    
    // Return the formatted client section
    return `## CLIENT INFORMATION
- **Name:** ${clientName}
- **Position:** ${position}
- **Company:** ${company}
- **Industry:** ${industry}
${systemNames}
${metrics}${notesSection}`;
}

/**
 * Build the deal section of the prompt
 * @param {Object} clientDetails - Client information
 * @param {Object} intelligenceInfo - Extracted intelligence
 * @return {string} - Formatted deal section
 */
function buildDealSection(clientDetails, intelligenceInfo) {
    // If no deal information, return empty
    if (!clientDetails.deals || clientDetails.deals.length === 0) {
        return `## DEAL STATUS
- No active deals found`;
    }
    
    // Get primary deal
    const deal = clientDetails.deals[0];
    
    // Format deal stage with context
    let stageContext = '';
    switch (deal.status) {
        case 'prospecting':
            stageContext = 'Initial interest, value proposition focus';
            break;
        case 'qualified':
            stageContext = 'Needs confirmed, solution-fit validation';
            break;
        case 'proposal':
            stageContext = 'Decision criteria, competing solutions considered';
            break;
        case 'negotiation':
            stageContext = 'Value discussion, decision timeline critical';
            break;
        case 'closed_won':
            stageContext = 'Implementation planning, expansion opportunities';
            break;
        case 'closed_lost':
            stageContext = 'Re-engagement strategy needed';
            break;
        default:
            stageContext = 'Status unknown';
    }
    
    // Format expected close date
    const closeDateInfo = deal.expectedCloseDate
        ? `- **Expected Close:** ${new Date(deal.expectedCloseDate).toLocaleDateString()}`
        : '';
    
    // Return the formatted deal section
    return `## DEAL STATUS
- **Deal Title:** ${deal.title || 'Unnamed Opportunity'}
- **Value:** $${(deal.value || 0).toLocaleString()}
- **Stage:** ${deal.status} (${stageContext})
${closeDateInfo}`;
}

/**
 * Build the key people section of the prompt
 * @param {Object} intelligenceInfo - Extracted intelligence
 * @return {string} - Formatted key people section
 */
function buildPeopleSection(intelligenceInfo) {
    // If no key people found, return minimal section
    if (intelligenceInfo.keyPeople.length === 0) {
        return `## KEY STAKEHOLDERS
- No specific stakeholders identified yet`;
    }
    
    // Format key people list
    const peopleList = intelligenceInfo.keyPeople
        .map(person => `- **${person}**`)
        .join('\n');
    
    // Return the formatted people section with tailoring instructions
    return `## KEY STAKEHOLDERS
${peopleList}

These key stakeholders should be referenced by name in your response when relevant. Personalizing the approach to specific decision-makers significantly increases deal success probability.`;
}

/**
 * Build the research section of the prompt
 * @param {Object} processedResearch - Processed research data
 * @return {string} - Formatted research section
 */
function buildResearchSection(processedResearch) {
    let researchOutput = `## RESEARCH INSIGHTS\n`;
    
    // Add company insights if available
    if (processedResearch.companyInsights.length > 0) {
        researchOutput += `\n### Company Information\n`;
        processedResearch.companyInsights.forEach(insight => {
            researchOutput += `- **${insight.name || 'Company'}**: `;
            if (insight.industry) researchOutput += `Industry: ${insight.industry}, `;
            if (insight.size) researchOutput += `Size: ${insight.size}, `;
            if (insight.founded) researchOutput += `Founded: ${insight.founded}, `;
            if (insight.location) researchOutput += `Location: ${insight.location}`;
            researchOutput += `\n`;
        });
    }
    
    // Add recent news if available
    if (processedResearch.recentNews.length > 0) {
        researchOutput += `\n### Recent Company News\n`;
        processedResearch.recentNews.slice(0, 3).forEach(news => {
            researchOutput += `- **${news.title}** (${news.source}): ${news.summary.substring(0, 100)}...\n`;
        });
    }
    
    // Add social mentions if available
    if (processedResearch.socialMentions.length > 0) {
        researchOutput += `\n### Social Media Activity\n`;
        processedResearch.socialMentions.slice(0, 3).forEach(post => {
            researchOutput += `- **${post.source}**: "${post.title}" (${post.sentiment} sentiment, ${post.engagement})\n`;
        });
    }
    
    // Add technical details if available
    if (processedResearch.technicalDetails.length > 0) {
        researchOutput += `\n### Technical Keywords\n- ${processedResearch.technicalDetails.join(', ')}\n`;
    }
    
    return researchOutput;
}
/**
 * Build the instructions section of the prompt
 * @param {Object} clientDetails - Client information
 * @param {Object} intelligenceInfo - Extracted intelligence information
 * @return {string} - Formatted instructions section
 */
function buildPromptInstructions(clientDetails, intelligenceInfo) {
    // Determine the sales approach based on industry and deal stage
    const industry = intelligenceInfo.companyDetails.industry || 'unknown';
    const dealStage = clientDetails.deals?.length > 0 ? clientDetails.deals[0].status : 'prospecting';
    
    // Customize instructions based on industry
    let industryGuidance = '';
    switch (industry) {
        case 'finance':
        case 'fintech':
        case 'banking':
        case 'insurance':
            industryGuidance = 'Focus on compliance, security, and ROI. Use precise financial terminology.';
            break;
        case 'healthcare':
            industryGuidance = 'Emphasize HIPAA compliance, patient outcomes, and operational efficiency.';
            break;
        case 'technology':
        case 'saas':
        case 'software':
            industryGuidance = 'Highlight technical integration capabilities, scalability, and innovation advantages.';
            break;
        case 'manufacturing':
            industryGuidance = 'Focus on operational efficiency, supply chain optimization, and cost reduction.';
            break;
        case 'retail':
            industryGuidance = 'Emphasize customer experience, inventory management, and competitive differentiation.';
            break;
        default:
            industryGuidance = 'Balance business value with technical capabilities in your recommendations.';
    }
    
    // Customize instructions based on deal stage
    let stageGuidance = '';
    switch (dealStage) {
        case 'prospecting':
            stageGuidance = 'Focus on problem identification and initial value proposition.';
            break;
        case 'qualified':
            stageGuidance = 'Emphasize solution fit and validation with specific use cases.';
            break;
        case 'proposal':
            stageGuidance = 'Address competitive differentiation and decision criteria.';
            break;
        case 'negotiation':
            stageGuidance = 'Focus on value justification and implementation planning.';
            break;
        case 'closed_won':
            stageGuidance = 'Emphasize successful implementation and expansion opportunities.';
            break;
        case 'closed_lost':
            stageGuidance = 'Focus on reengagement strategy and addressing previous concerns.';
            break;
        default:
            stageGuidance = 'Provide a balanced approach covering value proposition and technical capabilities.';
    }
    
    // Return the formatted instructions
    return `# SALES INTELLIGENCE BRIEF

You are a strategic B2B sales advisor specializing in technical sales. Your task is to generate highly specific, actionable sales intelligence that will help close this deal.

## GUIDANCE
- ${industryGuidance}
- ${stageGuidance}
- Be extremely specific and avoid generic sales advice.
- Use the client's exact terminology for systems and metrics.
- When mentioning stakeholders, use their actual names for personalization.
- Focus on tangible business outcomes rather than technical features.`;
}

/**
 * Generate an AI-powered sales intelligence summary using the structured prompt
 * @param {Object} researchData - Research data from various sources
 * @param {Object} clientDetails - Client information
 * @return {string} - AI-generated sales intelligence
 */
async function generateSalesIntelligenceSummary(researchData, clientDetails) {
    try {
        console.log("🧠 Generating sales intelligence brief...");
        
        // Extract intelligence directly (fallback if utility isn't available)
        const intelligenceInfo = extractIntelligenceInfo(clientDetails, researchData);
        console.log("📊 Extracted intelligence information:", JSON.stringify(intelligenceInfo, null, 2));
        
        // Create a focused prompt for the LLM
        const prompt = createSalesIntelligencePrompt(researchData, clientDetails, intelligenceInfo);
        
        // Call GPT-4 API with the enhanced prompt
        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 800,
            temperature: 0.7
        }, {
            headers: {
                "Content-Type": "application/json",
                "api-key": OPENAI_API_KEY
            }
        });

        // Get the summary from the API response
        const summary = response.data.choices[0].message.content;
        console.log("✅ Generated sales intelligence summary");
        
        return summary;
    } catch (error) {
        console.error("❌ Error generating sales intelligence:", error.response?.data || error.message);
        return "Unable to generate sales intelligence at this time. Please try again later.";
    }
}

/**
 * Post-process the LLM-generated summary to enhance readability and impact
 * @param {string} summary - Raw summary from LLM
 * @param {Object} intelligenceInfo - Extracted client intelligence
 * @return {string} - Enhanced summary
 */
function postProcessSalesSummary(summary, intelligenceInfo) {
    // Skip processing if summary is empty
    if (!summary) return "No summary available.";
    
    // Step 1: Clean up and normalize formatting
    let enhancedSummary = summary;
    
    // Replace markdown headers with cleaner versions
    enhancedSummary = enhancedSummary.replace(/##\s+(.*?)$/gm, '$1');
    enhancedSummary = enhancedSummary.replace(/#\s+(.*?)$/gm, '$1');
    
    // Add spacing between sections for better readability
    enhancedSummary = enhancedSummary.replace(/(1️⃣|2️⃣|3️⃣)\s+([A-Z\s]+)/g, '\n\n$1 $2\n');
    
    // Step 2: Improve bullet point formatting for readability
    enhancedSummary = enhancedSummary.replace(/\*\s+/g, '• ');
    
    // Step 3: Highlight key terms for emphasis
    // Highlight system names
    intelligenceInfo.systemNames.forEach(system => {
        const regex = new RegExp(`\\b${system}\\b`, 'g');
        enhancedSummary = enhancedSummary.replace(regex, `**${system}**`);
    });
    
    // Highlight metrics
    intelligenceInfo.metrics.forEach(metric => {
        // Escape special regex characters in the metric
        const escapedMetric = metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedMetric}\\b`, 'g');
        enhancedSummary = enhancedSummary.replace(regex, `**${metric}**`);
    });
    
    // Highlight stakeholder names
    intelligenceInfo.keyPeople.forEach(person => {
        const regex = new RegExp(`\\b${person}\\b`, 'g');
        enhancedSummary = enhancedSummary.replace(regex, `**${person}**`);
    });
    
    // Step 4: Add action-oriented prefixes to bullet points
    // This regex finds bullet points and adds action verbs if they don't already start with one
    enhancedSummary = enhancedSummary.replace(/•\s+(?!(?:Use|Emphasize|Highlight|Focus|Address|Leverage|Demonstrate|Present|Show|Discuss|Identify|Prepare|Develop|Create|Offer|Provide))(.*?)(?=[.:\d]|$)/gm, (match, p1) => {
        // Choose an appropriate action verb based on context
        let actionVerb = 'Focus on';
        if (p1.toLowerCase().includes('objection') || p1.toLowerCase().includes('concern')) {
            actionVerb = 'Address';
        } else if (p1.toLowerCase().includes('value') || p1.toLowerCase().includes('benefit')) {
            actionVerb = 'Highlight';
        } else if (p1.toLowerCase().includes('competitor') || p1.toLowerCase().includes('vs.')) {
            actionVerb = 'Demonstrate';
        }
        return `• ${actionVerb} ${p1}`;
    });
    
    // Step 5: Add a clear boundary between sections
    enhancedSummary = enhancedSummary.replace(/(1️⃣|2️⃣|3️⃣)\s+([A-Z\s]+)/g, 
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n$1 $2\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Return the enhanced summary
    return enhancedSummary;
}

async function runResearchForClient(clientId, userId) {
    try {
        // Fetch client data
        const clientData = await Client.findOne({ _id: clientId });
        if (!clientData) {
            console.log(`❌ No client data found for Client ID: ${clientId}. Skipping research.`);
            return false;
        }

        const companyName = clientData.company;

        if (!userId || !clientId) {
            console.log(`❌ Missing userId or clientId. Skipping research for ${companyName}.`);
            return false;
        }

        console.log(`🔍 Running research for: ${companyName} (Client ID: ${clientId}, User ID: ${userId})`);

        // Prevent duplicate research runs
        if (runningResearch.has(clientId)) {
            console.log(`⚠️ Research already running for ${companyName}. Skipping duplicate run.`);
            return false;
        }

        runningResearch.add(clientId);

        try {
            // Find existing research document to properly merge data
            const existingResearch = await Research.findOne({ clientId, userId });
            const existingData = existingResearch?.data || {};

            // Run enabled research modules in parallel and pass clientId and userId
            const researchResults = {};
            await Promise.all(
                Object.keys(researchModules).map(async (module) => {
                    console.log(`🔍 Executing ${module} research for ${companyName}...`);
                    try {
                        const result = await researchModules[module](companyName, clientId, userId);
                        researchResults[module] = result;
                    } catch (error) {
                        console.error(`Error in ${module} research:`, error.message);
                        // Continue with other modules even if one fails
                        researchResults[module] = null;
                    }
                })
            );

            console.log("✅ Research data collection completed");
            
            // Log what keys are actually in researchResults
            console.log(`📋 Research result keys: ${Object.keys(researchResults)}`);
            console.log(`📊 Types of research results: ${Object.keys(researchResults).map(k => 
                `${k}: ${typeof researchResults[k]} (${researchResults[k] ? 'non-null' : 'null'})`).join(', ')}`);

            // Create a clean data object
            const dataToStore = { ...existingData }; // Start with existing data
            
            // Properly assign each module's data
            if (researchResults.google) {
                dataToStore.google = researchResults.google;
                console.log(`✅ Adding Google data: ${Array.isArray(researchResults.google) ? 
                    `Array with ${researchResults.google.length} items` : 
                    typeof researchResults.google}`);
            }
            
            if (researchResults.apollo) {
                dataToStore.apollo = researchResults.apollo;
                console.log(`✅ Adding Apollo data: ${typeof researchResults.apollo}`);
            }
            
            if (researchResults.reddit) {
                dataToStore.reddit = researchResults.reddit;
                console.log(`✅ Adding Reddit data: ${Array.isArray(researchResults.reddit) ? 
                    `Array with ${researchResults.reddit.length} items` : 
                    typeof researchResults.reddit}`);
            }
            
            // Add PDL data if available
            if (researchResults.pdl) {
                dataToStore.pdl = researchResults.pdl.data || researchResults.pdl;
                console.log(`✅ Adding PDL data: ${typeof researchResults.pdl}`);
            }
            
            // Log the final data structure
            console.log(`📦 Final data structure: ${JSON.stringify({
                keys: Object.keys(dataToStore),
                hasGoogle: !!dataToStore.google,
                hasApollo: !!dataToStore.apollo,
                hasReddit: !!dataToStore.reddit,
                hasPDL: !!dataToStore.pdl
            })}`);

            // Extract intelligence information using local function instead of utility
            const intelligenceInfo = extractIntelligenceInfo(clientData, dataToStore);
            console.log(`✅ Extracted intelligence information`);

            console.log(`✅ Research data merging completed. Generating sales intelligence...`);

            // Generate AI-powered sales intelligence based on merged data and intelligence info
            const summary = await generateSalesIntelligenceSummary(dataToStore, clientData);

            // Track when each data source was last updated
            const lastUpdated = existingResearch?.lastUpdated || {};
            Object.keys(researchResults).forEach(module => {
                if (researchResults[module]) {
                    lastUpdated[module] = new Date();
                }
            });

            // Update the research document with explicit data structure
            const updateResult = await Research.updateOne(
                { clientId, userId },
                { 
                    $set: { 
                        clientId: clientId,
                        userId: userId,
                        company: companyName,
                        data: dataToStore,  // Use the clean data object
                        summary: summary,
                        lastUpdated: lastUpdated,
                        timestamp: new Date()
                    }
                },
                { upsert: true }
            );
            
            console.log(`🔄 Database update result: ${JSON.stringify(updateResult)}`);
            console.log(`✅ Research and summary stored for ${companyName}`);
            return true;
        } catch (error) {
            console.error(`❌ Error in research process: ${error.message}`);
            return false;
        } finally {
            // Always remove from running set when complete
            runningResearch.delete(clientId);
        }
    } catch (error) {
        console.error("❌ Error in runResearchForClient:", error.message);
        // Ensure we clean up the running set even on unexpected errors
        if (clientId) runningResearch.delete(clientId);
        return false;
    }
}

/**
 * Orchestrate research for all active clients
 * @return {Promise<void>}
 */
async function orchestrateResearch() {
    try {
        console.log("🚀 Starting orchestrated research process for all active clients...");

        const clients = await Client.find({ isActive: true });

        if (clients.length === 0) {
            console.log("⚠️ No active clients found. Research skipped.");
            return;
        }

        console.log(`🔄 Found ${clients.length} active clients. Starting research...`);

        // Process clients in batches to avoid overloading the system
        const batchSize = 5;
        for (let i = 0; i < clients.length; i += batchSize) {
            const batch = clients.slice(i, i + batchSize);
            
            // Process each batch in parallel
            await Promise.all(
                batch.map(client => runResearchForClient(client._id.toString(), client.userId))
            );
            
            // Add a small delay between batches
            if (i + batchSize < clients.length) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        console.log("✅ Research orchestration completed successfully.");
    } catch (error) {
        console.error("❌ Error in orchestrateResearch:", error.message);
    }
}

/**
 * Get a client's research data without running new research
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @return {Promise<Object|null>} - Research data or null if not found
 */
async function getClientResearch(clientId, userId) {
    try {
        if (!clientId || !userId) {
            console.log("❌ Missing clientId or userId for research lookup");
            return null;
        }

        const research = await Research.findOne({ clientId, userId });
        if (!research) {
            console.log(`⚠️ No research found for Client ID: ${clientId}`);
            return null;
        }

        return {
            summary: research.summary,
            data: research.data,
            timestamp: research.timestamp,
            lastUpdated: research.lastUpdated
        };
    } catch (error) {
        console.error(`❌ Error retrieving research for client ${clientId}:`, error.message);
        return null;
    }
}

/**
 * Refresh research for a specific client on-demand
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID
 * @return {Promise<boolean>} - Success status
 */
async function refreshClientResearch(clientId, userId) {
    try {
        if (!clientId || !userId) {
            console.log("❌ Missing clientId or userId for research refresh");
            return false;
        }

        // Check if the client exists
        const client = await Client.findOne({ _id: clientId, userId });
        if (!client) {
            console.log(`❌ No client found for ID: ${clientId}`);
            return false;
        }

        // Run research for this client specifically
        await runResearchForClient(clientId, userId);
        return true;
    } catch (error) {
        console.error(`❌ Error refreshing research for client ${clientId}:`, error.message);
        return false;
    }
}

// Export all necessary functions
module.exports = { 
    runResearchForClient,
    orchestrateResearch,
    generateSalesIntelligenceSummary,
    postProcessSalesSummary,
    getClientResearch,
    refreshClientResearch
};