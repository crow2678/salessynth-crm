const { INDUSTRY_SALES_STRATEGIES, DEAL_STAGES, NOTE_PATTERNS } = require('./researchConstants');

function preprocessResearchData(researchData, clientDetails) {
    if (!researchData) return {};
    
    const processedData = {};
    const industry = researchData.apollo?.company?.industry || "default";
    
    if (researchData.apollo?.company) {
        processedData.company = {
            name: researchData.apollo.company.name,
            industry: researchData.apollo.company.industry || "Unknown",
            description: researchData.apollo.company.description,
            size: researchData.apollo.company.size,
            revenue: researchData.apollo.company.revenue,
            location: researchData.apollo.company.location,
            website: researchData.apollo.company.website
        };
        
        if (researchData.apollo.keyPeople?.length > 0) {
            processedData.keyPeople = researchData.apollo.keyPeople;
        }
        
        if (researchData.apollo.funding) {
            processedData.funding = researchData.apollo.funding;
        }
        
        if (researchData.apollo.technologies) {
            processedData.technologies = researchData.apollo.technologies;
        }
        
        if (researchData.apollo.insights) {
            processedData.insights = researchData.apollo.insights;
        }
    }
    
    if (researchData.google?.length > 0) {
        processedData.recentNews = researchData.google
            .filter(item => item.snippet && item.snippet !== "No snippet available")
            .map(item => ({
                title: item.title,
                snippet: item.snippet,
                publishedDate: item.publishedDate,
                source: item.source
            }))
            .slice(0, 3);
    }
    
    if (researchData.reddit?.length > 0) {
        processedData.communityDiscussions = researchData.reddit
            .map(post => ({
                title: post.title,
                subreddit: post.subreddit,
                sentiment: post.sentiment,
                upvotes: post.upvotes,
                snippet: post.snippet
            }))
            .slice(0, 2);
    }
    
    return processedData;
}

function extractQuestionsAndRequirements(notes) {
    if (!notes) return { hasQuestions: false, questions: [], requirements: [] };
    
    const paragraphs = notes.split(/\n\n+/);
    const lines = [];
    
    paragraphs.forEach(paragraph => {
        const paragraphLines = paragraph.split(/\r?\n/).filter(line => line.trim().length > 0);
        
        if (paragraphLines.some(line => line.trim().startsWith('•'))) {
            paragraphLines.forEach(line => {
                if (line.trim().startsWith('•')) {
                    lines.push(line.trim().substring(1).trim());
                }
            });
        } else {
            lines.push(...paragraphLines);
        }
    });
    
    const questions = lines.filter(line => 
        NOTE_PATTERNS.questions.some(pattern => pattern.test(line))
    );
    
    const requirements = lines.filter(line =>
        NOTE_PATTERNS.requirements.some(pattern => pattern.test(line)) &&
        !NOTE_PATTERNS.questions.some(pattern => pattern.test(line))
    );
    
    return {
        hasQuestions: questions.length > 0,
        questions,
        requirements
    };
}

function extractDecisionPoints(notes) {
    if (!notes) return [];
    const lines = notes.split(/\r?\n/).filter(line => line.trim().length > 0);
    return lines.filter(line => 
        NOTE_PATTERNS.decisionIndicators.some(pattern => pattern.test(line))
    );
}

function extractUpcomingEvents(notes) {
    if (!notes) return [];
    const lines = notes.split(/\r?\n/).filter(line => line.trim().length > 0);
    const datePattern = /\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}/;
    
    return lines.filter(line => 
        (datePattern.test(line) && NOTE_PATTERNS.events.some(pattern => pattern.test(line))) ||
        (NOTE_PATTERNS.events.some(pattern => pattern.test(line)) && 
         NOTE_PATTERNS.timeIndicators.some(pattern => pattern.test(line)))
    );
}

function calculateDealHealth(clientDetails, questionsData) {
    let score = 50;
    let momentum = "Steady";
    let riskFactors = [];
    let strengths = [];
    
    const dealStage = clientDetails.deals?.[0]?.status || "";
    
    if (dealStage === "qualified") score += 5;
    if (dealStage === "proposal") score += 10;
    if (dealStage === "negotiation") score += 15;
    
    const questionCount = questionsData.questions.length;
    
    if (questionCount > 10) {
        score += 15;
        strengths.push("High level of detailed questions indicates strong engagement");
    } else if (questionCount > 5) {
        score += 10;
        strengths.push("Multiple detailed questions show good engagement");
    } else if (questionCount > 0) {
        score += 5;
    } else {
        score -= 10;
        riskFactors.push("No specific questions may indicate low engagement");
    }
    
    const technicalQuestions = questionsData.questions.filter(q => 
        q.toLowerCase().includes("integration") ||
        q.toLowerCase().includes("api") ||
        q.toLowerCase().includes("data") ||
        q.toLowerCase().includes("technical") ||
        q.toLowerCase().includes("system")
    );
    
    if (technicalQuestions.length > 3) {
        score += 15;
        strengths.push("Multiple technical questions indicate serious evaluation");
    } else if (technicalQuestions.length > 0) {
        score += 10;
        strengths.push("Technical questions show solution evaluation in progress");
    }
    
    const pricingQuestions = questionsData.questions.filter(q => 
        q.toLowerCase().includes("price") ||
        q.toLowerCase().includes("cost") ||
        q.toLowerCase().includes("budget") ||
        q.toLowerCase().includes("expense") ||
        q.toLowerCase().includes("investment")
    );
    
    if (pricingQuestions.length > 0) {
        score += 10;
        strengths.push("Budget/pricing questions indicate financial evaluation");
    }
    
    const notes = clientDetails.notes || "";
    
    const blockers = NOTE_PATTERNS.concerns.filter(pattern => pattern.test(notes));
    
    if (blockers.length > 3) {
        score -= 15;
        riskFactors.push("Multiple concerns/issues mentioned");
    } else if (blockers.length > 0) {
        score -= 7;
        riskFactors.push("Some concerns mentioned that need addressing");
    }
    
    const delaySignals = NOTE_PATTERNS.negativeIndicators.filter(pattern => pattern.test(notes));
    
    if (delaySignals.length > 2) {
        score -= 10;
        momentum = "Stalling";
        riskFactors.push("Delays or rescheduling may indicate hesitation");
    }
    
    const positiveSignals = NOTE_PATTERNS.positiveIndicators.filter(pattern => pattern.test(notes));
    
    if (positiveSignals.length > 2) {
        score += 10;
        momentum = "Accelerating";
        strengths.push("Clear forward progress indicators");
    }
    
    score = Math.max(0, Math.min(100, score));
    
    let probability;
    if (score >= 80) probability = "High";
    else if (score >= 60) probability = "Medium";
    else if (score >= 40) probability = "Moderate";
    else probability = "Low";
    
    return {
        score,
        probability,
        momentum,
        riskFactors: riskFactors.slice(0, 3),
        strengths: strengths.slice(0, 3)
    };
}

function generateIndustryGuidance(industry, dealStage) {
    const normalizedIndustry = industry?.toLowerCase() || "default";
    let strategyGuide = INDUSTRY_SALES_STRATEGIES.default;
    
    if (INDUSTRY_SALES_STRATEGIES[normalizedIndustry]) {
        strategyGuide = INDUSTRY_SALES_STRATEGIES[normalizedIndustry];
    } else {
        for (const [key, value] of Object.entries(INDUSTRY_SALES_STRATEGIES)) {
            if (normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) {
                strategyGuide = value;
                break;
            }
        }
    }
    
    let focusedTopics = [];
    let likelyObjections = [];
    
    if (dealStage === "prospecting" || dealStage === "qualified") {
        focusedTopics = strategyGuide.topics.filter(t => 
            t.toLowerCase().includes("roi") || t.toLowerCase().includes("value") || t.toLowerCase().includes("benefit")
        );
        likelyObjections = strategyGuide.objections.filter(o => 
            o.toLowerCase().includes("budget") || o.toLowerCase().includes("cost") || o.toLowerCase().includes("roi")
        );
    } else if (dealStage === "proposal") {
        focusedTopics = strategyGuide.topics.filter(t => 
            t.toLowerCase().includes("implementation") || t.toLowerCase().includes("integration") || t.toLowerCase().includes("technical")
        );
        likelyObjections = strategyGuide.objections.filter(o => 
            o.toLowerCase().includes("technical") || o.toLowerCase().includes("implementation") || o.toLowerCase().includes("integration")
        );
    } else if (dealStage === "negotiation") {
        focusedTopics = strategyGuide.topics.filter(t => 
            t.toLowerCase().includes("risk") || t.toLowerCase().includes("support") || t.toLowerCase().includes("service")
        );
        likelyObjections = strategyGuide.objections.filter(o => 
            o.toLowerCase().includes("risk") || o.toLowerCase().includes("support") || o.toLowerCase().includes("maintenance")
        );
    }
    
    if (focusedTopics.length < 2) focusedTopics = [...focusedTopics, ...strategyGuide.topics].slice(0, 3);
    if (likelyObjections.length < 2) likelyObjections = [...likelyObjections, ...strategyGuide.objections].slice(0, 3);
    
    return `
**Industry-Specific Considerations**
- Focus on these high-impact topics for ${normalizedIndustry}:
  * ${focusedTopics.join('\n  * ')}
- Anticipate these common objections:
  * ${likelyObjections.join('\n  * ')}
- Key technical terms to incorporate:
  * ${(strategyGuide.technicalTerms || []).slice(0, 5).join('\n  * ')}
`;
}

function generateSalesStageGuidance(dealStage) {
    if (!dealStage || !DEAL_STAGES[dealStage]) {
        return "**Strategy:** Focus on understanding the client's needs and establishing value. Emphasize discovery questions.";
    }
    
    const stageInfo = DEAL_STAGES[dealStage];
    
    return `
**${dealStage.charAt(0).toUpperCase() + dealStage.slice(1)} Stage Strategy**
- Focus on: ${stageInfo.focusAreas.join(', ')}
- Key success indicators: ${stageInfo.successIndicators.join(', ')}
- Risk factors to monitor: ${stageInfo.riskIndicators.join(', ')}
- Recommended next steps: ${stageInfo.nextSteps.join(', ')}
`;
}

module.exports = {
    preprocessResearchData,
    extractQuestionsAndRequirements,
    extractDecisionPoints,
    extractUpcomingEvents,
    calculateDealHealth,
    generateIndustryGuidance,
    generateSalesStageGuidance
};