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

if (config.research_modules.reddit) {
    researchModules.reddit = require('./RedditResearch');
}

if (config.research_modules.apollo) {
    researchModules.apollo = require('./ApolloResearch');
}

// GPT-4 API details
const OPENAI_API_URL = "https://88f.openai.azure.com/openai/deployments/88FGPT4o/chat/completions?api-version=2024-02-15-preview";
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

// Industry-specific sales strategies
const INDUSTRY_SALES_STRATEGIES = {
    "financial services": {
        topics: [
            "Regulatory compliance automation",
            "Risk management solutions",
            "Cost reduction through automation",
            "Fraud detection capabilities",
            "Integration with existing financial systems",
            "Data security and customer privacy"
        ],
        objections: [
            "Regulatory compliance concerns",
            "Security and data privacy",
            "Integration with legacy systems",
            "Return on investment timeline",
            "Impact on current operations",
            "Employee adoption and training"
        ]
    },
    "healthcare": {
        topics: [
            "Patient data management",
            "HIPAA compliance features",
            "Integration with EHR systems",
            "Improved patient outcomes",
            "Clinical workflow optimization",
            "Healthcare regulation compliance"
        ],
        objections: [
            "Patient data security concerns",
            "Healthcare regulation compliance",
            "Integration with existing clinical systems",
            "Training required for medical staff",
            "Implementation timeline concerns",
            "Evidence of clinical benefits"
        ]
    },
    "technology": {
        topics: [
            "Technical integration capabilities",
            "Scalability and performance",
            "Development resources required",
            "Open API and extensibility",
            "Developer experience and onboarding",
            "Technology stack compatibility"
        ],
        objections: [
            "Technical complexity concerns",
            "Integration with existing tech stack",
            "Build vs buy considerations",
            "Scaling concerns for larger operations",
            "Developer resource requirements",
            "Long-term maintenance and support"
        ]
    },
    "retail": {
        topics: [
            "Customer experience improvements",
            "Inventory management integration",
            "Omnichannel capabilities",
            "Sales analytics and reporting",
            "Supply chain optimization",
            "POS system integration"
        ],
        objections: [
            "Impact on current customer experience",
            "Integration with existing retail systems",
            "Staff training requirements",
            "Implementation timeline during peak seasons",
            "ROI and revenue impact evidence",
            "Customer data management"
        ]
    },
    "default": {
        topics: [
            "Cost savings and ROI",
            "Implementation timeline and process",
            "Integration capabilities",
            "Training and change management",
            "Ongoing support and maintenance",
            "Customization options"
        ],
        objections: [
            "Budget constraints",
            "Implementation timeline concerns",
            "Team adoption and training",
            "Integration with existing systems",
            "ROI and business case validation",
            "Ongoing support concerns"
        ]
    }
};

// ✅ Prevent duplicate research runs
const runningResearch = new Set();

/**
 * Filter and prioritize research data to focus on most relevant information
 * @param {Object} researchData - Combined research data from all sources
 * @param {Object} clientDetails - Client information from CRM
 * @returns {Object} - Filtered and prioritized research data
 */
function preprocessResearchData(researchData, clientDetails) {
    if (!researchData) return {};
    
    const processedData = {};
    
    // Get industry context if available for better prioritization
    const industry = researchData.apollo?.companyInfo?.industry || "default";
    
    // Process Apollo company data (always include if available)
    if (researchData.apollo) {
        // Keep key company info but simplify to reduce tokens
        processedData.company = {
            name: researchData.apollo.companyInfo.name,
            industry: researchData.apollo.companyInfo.industry || "Unknown",
            description: researchData.apollo.companyInfo.description,
            size: researchData.apollo.companyInfo.estimatedEmployees,
            revenue: researchData.apollo.companyInfo.annualRevenue,
            location: researchData.apollo.companyInfo.headquarters,
            publiclyTraded: researchData.apollo.companyInfo.publiclyTraded || false,
            website: researchData.apollo.companyInfo.website
        };
        
        // Include key executives if available
        if (researchData.apollo.keyPeople && researchData.apollo.keyPeople.length > 0) {
            processedData.keyPeople = researchData.apollo.keyPeople;
        }
        
        // Include funding info for startups/growth companies
        if (researchData.apollo.funding && 
            (researchData.apollo.funding.totalRaised !== "Unknown" || 
             researchData.apollo.funding.ventureFunded)) {
            processedData.funding = researchData.apollo.funding;
        }
    }
    
    // Process Google News data
    if (researchData.google && Array.isArray(researchData.google)) {
        // Filter out entries with low relevance and no snippets
        let newsItems = researchData.google
            .filter(item => item.snippet && item.snippet !== "No snippet available")
            .map(item => ({
                title: item.title,
                snippet: item.snippet,
                publishedDate: item.publishedDate,
                source: item.source
            }));
        
        // If we still have too many, prioritize the most recent
        if (newsItems.length > 3) {
            newsItems = newsItems.slice(0, 3);
        }
        
        if (newsItems.length > 0) {
            processedData.recentNews = newsItems;
        }
    }
    
    // Process Reddit data
    if (researchData.reddit && Array.isArray(researchData.reddit)) {
        // Filter for highly relevant, recent discussions
        let relevantPosts = researchData.reddit
            .filter(post => post.relevance !== "low")
            .map(post => ({
                title: post.title,
                subreddit: post.subreddit,
                sentiment: post.sentiment,
                upvotes: post.upvotes,
                snippet: post.snippet
            }));
        
        // If we have too many, prioritize by engagement/sentiment
        if (relevantPosts.length > 2) {
            // Sort by combination of relevance and engagement
            relevantPosts = relevantPosts
                .sort((a, b) => {
                    // Prioritize posts with sentiment aligned to our deal
                    const dealStage = clientDetails.deals?.[0]?.status || "";
                    
                    // For early deals, positive sentiment is more helpful
                    const earlyStages = ["prospecting", "qualified"];
                    // For late deals, negative sentiment helps address objections
                    const lateStages = ["proposal", "negotiation"];
                    
                    let aScore = a.upvotes || 0;
                    let bScore = b.upvotes || 0;
                    
                    // Adjust score based on deal stage and sentiment
                    if (earlyStages.includes(dealStage) && a.sentiment === "positive") {
                        aScore += 1000;
                    }
                    if (earlyStages.includes(dealStage) && b.sentiment === "positive") {
                        bScore += 1000;
                    }
                    if (lateStages.includes(dealStage) && a.sentiment === "negative") {
                        aScore += 800;
                    }
                    if (lateStages.includes(dealStage) && b.sentiment === "negative") {
                        bScore += 800;
                    }
                    
                    return bScore - aScore;
                })
                .slice(0, 2);
        }
        
        if (relevantPosts.length > 0) {
            processedData.communityDiscussions = relevantPosts;
        }
    }
    
    return processedData;
}

/**
 * Analyze client notes to extract key points for the GPT prompt
 * @param {string} notes - Raw client notes
 * @returns {Object} - Structured key points
 */
function extractKeyPointsFromNotes(notes) {
    if (!notes) return { hasPoints: false };
    
    // Split notes into separate points/lines
    const lines = notes.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    // Extract key concerns (lines with keywords)
    const concernKeywords = ["concern", "issue", "problem", "challenge", "worried", "risk"];
    const concerns = lines.filter(line => 
        concernKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    // Extract requirements (lines with requirements patterns)
    const requirementPatterns = [/need(s|ed)?/i, /require(s|d)?/i, /must\s+have/i, /should\s+have/i, /important/i];
    const requirements = lines.filter(line =>
        requirementPatterns.some(pattern => pattern.test(line))
    );
    
    // Extract any meeting or demo mentions
    const meetingPatterns = [/demo/i, /meeting/i, /call/i, /presentation/i, /discuss/i];
    const meetingMentions = lines.filter(line =>
        meetingPatterns.some(pattern => pattern.test(line))
    );
    
    return {
        hasPoints: concerns.length > 0 || requirements.length > 0 || meetingMentions.length > 0,
        concerns: concerns.slice(0, 3), // Limit to top 3
        requirements: requirements.slice(0, 3),
        meetings: meetingMentions.slice(0, 2)
    };
}

/**
 * Generate industry-specific strategic guidance for the GPT prompt
 * @param {string} industry - Client's industry
 * @param {string} dealStage - Current deal stage
 * @returns {string} - Industry-specific guidance 
 */
function generateIndustryGuidance(industry, dealStage) {
    // Get the appropriate industry strategy or fall back to default
    const normalizedIndustry = industry?.toLowerCase() || "default";
    let strategyGuide = INDUSTRY_SALES_STRATEGIES.default;
    
    // Try to find exact match first
    if (INDUSTRY_SALES_STRATEGIES[normalizedIndustry]) {
        strategyGuide = INDUSTRY_SALES_STRATEGIES[normalizedIndustry];
    } 
    // Try partial match for industries like "banking" matching "financial services"
    else {
        for (const [key, value] of Object.entries(INDUSTRY_SALES_STRATEGIES)) {
            if (normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) {
                strategyGuide = value;
                break;
            }
        }
    }
    
    // Adjust focus based on deal stage
    let focusedTopics = [];
    let likelyObjections = [];
    
    if (dealStage === "prospecting" || dealStage === "qualified") {
        // Early stage: focus on value proposition and business case
        focusedTopics = strategyGuide.topics.filter(t => 
            t.toLowerCase().includes("roi") || 
            t.toLowerCase().includes("value") || 
            t.toLowerCase().includes("benefit")
        );
        
        likelyObjections = strategyGuide.objections.filter(o => 
            o.toLowerCase().includes("budget") || 
            o.toLowerCase().includes("cost") || 
            o.toLowerCase().includes("roi")
        );
    } 
    else if (dealStage === "proposal") {
        // Proposal stage: focus on technical and implementation concerns
        focusedTopics = strategyGuide.topics.filter(t => 
            t.toLowerCase().includes("implementation") || 
            t.toLowerCase().includes("integration") || 
            t.toLowerCase().includes("technical")
        );
        
        likelyObjections = strategyGuide.objections.filter(o => 
            o.toLowerCase().includes("technical") || 
            o.toLowerCase().includes("implementation") || 
            o.toLowerCase().includes("integration")
        );
    }
    else if (dealStage === "negotiation") {
        // Negotiation stage: focus on risk mitigation and financial terms
        focusedTopics = strategyGuide.topics.filter(t => 
            t.toLowerCase().includes("risk") || 
            t.toLowerCase().includes("support") || 
            t.toLowerCase().includes("service")
        );
        
        likelyObjections = strategyGuide.objections.filter(o => 
            o.toLowerCase().includes("risk") || 
            o.toLowerCase().includes("support") || 
            o.toLowerCase().includes("maintenance")
        );
    }
    
    // If filtered lists are too short, add top items from full lists
    if (focusedTopics.length < 2) {
        focusedTopics = [...focusedTopics, ...strategyGuide.topics].slice(0, 3);
    }
    
    if (likelyObjections.length < 2) {
        likelyObjections = [...likelyObjections, ...strategyGuide.objections].slice(0, 3);
    }
    
    // Format the guidance text
    const guidanceText = `
**Industry-Specific Considerations**
- Focus on these high-impact topics for ${normalizedIndustry}:
  * ${focusedTopics.join('\n  * ')}
- Anticipate these common objections:
  * ${likelyObjections.join('\n  * ')}
`;
    
    return guidanceText;
}

/**
 * Generate a deal-specific sales strategy section for the GPT prompt
 * @param {string} dealStage - Current deal stage
 * @returns {string} - Sales strategy guidance
 */
function generateSalesStageGuidance(dealStage) {
    let guidance = "";
    
    if (!dealStage) {
        return "**Strategy:** Focus on understanding the client's needs and establishing value. Emphasize discovery questions.";
    }
    
    switch(dealStage) {
        case "prospecting":
            guidance = `
**Prospecting Stage Strategy**
- Focus on: Building rapport and understanding pain points
- Key actions: Ask discovery questions, identify business challenges
- Goal: Qualify the opportunity and establish initial value proposition
`;
            break;
        case "qualified":
            guidance = `
**Qualified Stage Strategy**
- Focus on: Connecting solutions to specific needs
- Key actions: Present initial solutions, gather technical requirements
- Goal: Secure interest in formal proposal and technical evaluation
`;
            break;
        case "proposal":
            guidance = `
**Proposal Stage Strategy**
- Focus on: Demonstrating ROI and implementation plan
- Key actions: Address technical concerns, provide social proof, establish timeline
- Goal: Move to contract negotiations with key decision makers
`;
            break;
        case "negotiation":
            guidance = `
**Negotiation Stage Strategy**
- Focus on: Maintaining value perception while addressing specific concerns
- Key actions: Highlight unique value, address contractual concerns, reiterate business impact
- Goal: Close the deal with favorable terms for both parties
`;
            break;
        default:
            guidance = `
**Sales Strategy**
- Focus on: Understanding current deal stage and next steps
- Key actions: Identify decision makers, establish value proposition, address concerns
- Goal: Move the deal forward with clear action items
`;
    }
    
    return guidance;
}

/**
 * Function to call GPT-4 and generate a structured sales summary
 * @param {Object} researchData - Research data from all sources
 * @param {Object} clientDetails - Client information from CRM
 * @returns {Promise<string>} - Generated sales intelligence summary
 */
async function generateSummary(researchData, clientDetails) { 
    try {
        console.log("🧠 Sending research data to GPT-4 for sales-focused summarization...");

        // Ensure research data is valid before sending
        if (!researchData || Object.keys(researchData).length === 0) {
            console.log("⚠️ No new research data available. Skipping GPT-4 call.");
            return "No new insights available at this time.";
        }
        
        // Preprocess research data to focus on most relevant information
        const processedData = preprocessResearchData(researchData, clientDetails);
        
        // Extract key points from client notes
        const notesAnalysis = extractKeyPointsFromNotes(clientDetails.notes);
        
        // Get industry from processed data or fall back to client data
        const industry = processedData?.company?.industry || 
                         researchData?.apollo?.companyInfo?.industry || 
                         "Unknown";
                         
        // Get deal stage for stage-specific guidance
        const dealStage = clientDetails.deals?.[0]?.status || "prospecting";
        
        // Generate industry-specific guidance
        const industryGuidance = generateIndustryGuidance(industry, dealStage);
        
        // Generate sales stage guidance
        const stageGuidance = generateSalesStageGuidance(dealStage);

        // Build structured prompt with research insights & client-specific context
        const prompt = `
You are a **senior sales intelligence analyst** helping a sales representative close a deal with **${clientDetails.company}**.

**🔹 Customer Context**
- **Contact:** ${clientDetails.name}, ${clientDetails.position || "Unknown Position"}
- **Company:** ${processedData?.company?.name || clientDetails.company}
- **Industry:** ${industry}
- **Deal Status:** ${dealStage} (Value: $${clientDetails.deals?.[0]?.value || "Unknown"})

${notesAnalysis.hasPoints ? `**🔍 Key Points from Recent Notes**
${notesAnalysis.concerns.length > 0 ? `- **Concerns Raised:**\n  * ${notesAnalysis.concerns.join('\n  * ')}` : ''}
${notesAnalysis.requirements.length > 0 ? `- **Requirements Mentioned:**\n  * ${notesAnalysis.requirements.join('\n  * ')}` : ''}
${notesAnalysis.meetings.length > 0 ? `- **Recent Interactions:**\n  * ${notesAnalysis.meetings.join('\n  * ')}` : ''}
` : `**🔍 Recent Notes**
${clientDetails.notes || "No recent updates"}`}

**📊 Company Intelligence**
${JSON.stringify(processedData, null, 2)}

${stageGuidance}

${industryGuidance}

---
Based on the information above, please provide:

**1️⃣ Situation Analysis (2-3 sentences)**
- Synthesize the current situation based on recent news, company context, and deal stage

**2️⃣ Recommended Engagement Approach**
- Provide specific talking points and questions for the next conversation
- Reference specific company insights where relevant

**3️⃣ Anticipated Objections & Responses**
- Identify 2-3 likely objections based on industry, news, and deal stage
- Provide concise, persuasive responses to each objection

**4️⃣ Competitive Advantage**
- Highlight 1-2 specific competitive advantages in this situation
- Explain how these advantages address the client's specific needs/context

Format your response in clean markdown with clear sections and bullet points for readability.
`;

        // Calculate approximate token count (rough estimate: ~4 chars = 1 token)
        const estimatedPromptTokens = Math.ceil(prompt.length / 4);
        
        // Log the input payload
        console.log("\n🔍 GPT INPUT PAYLOAD 🔍");
        console.log("=====================");
        console.log(`Estimated tokens: ~${estimatedPromptTokens}`);
        console.log("=====================");
        console.log(prompt);
        console.log("=====================\n");

        const requestPayload = {
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 800,
            temperature: 0.7,
        };

        const response = await axios.post(OPENAI_API_URL, requestPayload, {
            headers: {
                "Content-Type": "application/json",
                "api-key": OPENAI_API_KEY
            }
        });

        const summary = response.data.choices[0].message.content;
        
        // Calculate approximate response token count
        const estimatedResponseTokens = Math.ceil(summary.length / 4);
        
        // Log the output payload
        console.log("\n🔍 GPT OUTPUT PAYLOAD 🔍");
        console.log("=====================");
        console.log(`Estimated tokens: ~${estimatedResponseTokens}`);
        console.log(`Total completion tokens from API: ${response.data.usage?.completion_tokens || 'N/A'}`);
        console.log(`Total prompt tokens from API: ${response.data.usage?.prompt_tokens || 'N/A'}`);
        console.log(`Total tokens from API: ${response.data.usage?.total_tokens || 'N/A'}`);
        console.log("=====================");
        console.log(summary);
        console.log("=====================\n");

        console.log("✅ GPT-4 Sales Intelligence Summary Generated with enhanced data");

        return summary;
    } catch (error) {
        console.error("❌ Error generating GPT-4 summary:", error.response?.data || error.message);
        
        // Try to return a basic summary if possible
        if (clientDetails) {
            return `
# Sales Intelligence Summary

**Unable to generate a complete analysis at this time.**

## Basic Information
- Client: ${clientDetails.name}
- Company: ${clientDetails.company}
- Deal: ${clientDetails.deals?.[0]?.title || "Unknown"}

## Next Steps
- Review client notes for context
- Prepare for next interaction based on current deal stage
- Contact technical team for support if needed
`;
        }
        return "Summary generation failed. Please try again later.";
    }
}

/**
 * Run research for a specific client and generate a summary
 * @param {string} clientId - Client ID
 * @param {string} userId - User ID (optional, will be fetched from client data if missing)
 * @returns {Promise<void>}
 */
async function runResearchForClient(clientId, userId) {
    try {
        // ✅ Fetch `userId` and `companyName` upfront
        const clientData = await Client.findOne({ _id: clientId });
        if (!clientData) {
            console.log(`❌ No client data found for Client ID: ${clientId}. Skipping research.`);
            return;
        }

        if (!userId) {
            userId = clientData.userId;  // Use clientData.userId if userId not provided
        }
        
        const companyName = clientData.company;

        if (!userId || !clientId) {
            console.log(`❌ Missing userId or clientId. Skipping research for ${companyName}.`);
            return;
        }

        console.log(`🔍 Running research for: ${companyName} (Client ID: ${clientId}, User ID: ${userId})`);

        // ✅ Check if research is already in progress for this client
        if (runningResearch.has(clientId)) {
            console.log(`⚠️ Research already running for ${companyName}. Skipping duplicate run.`);
            return;
        }

        runningResearch.add(clientId);

        // Find existing research document
        const existingResearch = await Research.findOne({ clientId, userId });
        
        // Run enabled research modules in parallel
        const moduleResults = [];
        try {
            await Promise.all(
                Object.keys(researchModules).map(async (module) => {
                    console.log(`🔍 Executing ${module} research for ${companyName}...`);
                    try {
                        await researchModules[module](companyName, clientId, userId);
                        moduleResults.push(module);
                    } catch (err) {
                        console.error(`❌ Error in ${module} research:`, err.message);
                        // Continue with other modules despite errors
                    }
                })
            );
        } catch (err) {
            console.error("❌ Error running research modules:", err.message);
            // Continue anyway to use whatever data was collected
        }

        console.log("✅ API Research Data Collected:\n", moduleResults.join(", "));

        // Fetch the updated research document after all modules have finished
        const updatedResearch = await Research.findOne({ clientId, userId });
        
        if (!updatedResearch) {
            console.log(`⚠️ Research document not found after updates for ${companyName}.`);
            runningResearch.delete(clientId);
            return;
        }

        console.log(`✅ Research completed for ${companyName}. Generating GPT-4 summary...`);

        // Generate AI-powered summary based on updated data
        const summary = await generateSummary(updatedResearch.data, clientData);

        // Update just the summary field without touching the data fields
        await Research.updateOne(
            { clientId, userId },
            { 
                $set: { 
                    summary: summary,
                    timestamp: new Date()
                }
            }
        );

        console.log(`✅ Research and summary stored for ${companyName} in database.`);
        runningResearch.delete(clientId);
    } catch (error) {
        console.error("❌ Error in runResearchForClient:", error.message);
        runningResearch.delete(clientId);
    }
}

module.exports = { runResearchForClient };